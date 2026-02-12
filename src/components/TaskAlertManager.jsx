import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { MdNotificationsActive, MdVolumeOff } from 'react-icons/md';

// Base64 Alarm Sound (Digital Watch Beep style)
const ALARM_SOUND = 'data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Shortened placeholder for brevity, usually this is longer.

// Let's use a real reliable URL for the "Alarm" effect if Base64 is too long for this interface, 
// but user wants it to "bujna" (ring). 
const ALARM_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const TaskAlertManager = () => {
    const { tasks } = useAppContext();
    const alertedTasksRef = useRef(new Set());
    const alarmTimeoutRef = useRef(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUnlocked, setAudioUnlocked] = useState(false);

    useEffect(() => {
        // Initialize Audio object
        audioRef.current = new Audio(ALARM_URL);
        audioRef.current.loop = true;

        // Try to unlock audio on first user interaction
        const unlockAudio = () => {
            if (audioRef.current && !audioUnlocked) {
                // Play a brief silent burst to unlock the audio context
                audioRef.current.play()
                    .then(() => {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        setAudioUnlocked(true);
                        console.log('🔊 Audio Context Unlocked');
                        window.removeEventListener('click', unlockAudio);
                        window.removeEventListener('touchstart', unlockAudio);
                    })
                    .catch(() => {
                        // Still blocked, wait for next interaction
                    });
            }
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (alarmTimeoutRef.current) {
                clearTimeout(alarmTimeoutRef.current);
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, [audioUnlocked]);

    useEffect(() => {
        // Diagnostic Check on Mount
        const checkEnvironment = async () => {
            // 1. Check for Secure Context (Required for Service Workers)
            if (!window.isSecureContext) {
                console.warn('⚠️ App is running in an Insecure Context. Service Worker and Background Alerts will NOT work.');
                toast.error('Background Alerts disabled: App must use HTTPS or localhost.', {
                    duration: 10000,
                    icon: '🔒',
                    id: 'insecure-origin-warning'
                });
            }

            // 2. Check Notification Permission
            if ('Notification' in window) {
                if (Notification.permission === 'denied') {
                    toast.error('Alerts Blocked: Please enable Notifications in browser settings.', {
                        duration: 10000,
                        icon: '🚫',
                        id: 'permission-denied-warning'
                    });
                }
            } else {
                toast.error('Notifications not supported by this browser.', { icon: '❌', id: 'not-supported-warning' });
            }
        };

        checkEnvironment();

        // Manual Trigger for Testing
        const handleTestTrigger = () => {
            triggerAlarm({
                id: 'test-' + Date.now(),
                title: '🔔 Manual Test Alert',
                dueTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        };
        window.addEventListener('TRIGGER_TEST_ALARM', handleTestTrigger);

        return () => {
            window.removeEventListener('TRIGGER_TEST_ALARM', handleTestTrigger);
        };
    }, []);
    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
        if (alarmTimeoutRef.current) {
            clearTimeout(alarmTimeoutRef.current);
            alarmTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        // Sync tasks to Service Worker for background alerts
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'UPDATE_TASKS',
                        tasks: tasks
                    });
                }
            });
        }
    }, [tasks]);

    useEffect(() => {
        const checkTasks = () => {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();

            tasks.forEach(task => {
                if (!task.dueDate || !task.dueTime || task.completed) return;

                const taskDate = new Date(task.dueDate);
                const today = new Date();

                // Compare just the date strings
                const isSameDay = taskDate.toDateString() === today.toDateString();

                if (isSameDay) {
                    const [taskHours, taskMinutes] = task.dueTime.split(':').map(Number);

                    // Check if time matches (ignoring seconds)
                    if (taskHours === currentHours && taskMinutes === currentMinutes) {
                        const alertKey = `${task.id}-${task.dueTime}-${today.toDateString()}`;

                        if (!alertedTasksRef.current.has(alertKey)) {
                            console.log(`🔔 Alarm triggering for: ${task.title}`);
                            triggerAlarm(task);
                            alertedTasksRef.current.add(alertKey);
                        }
                    }
                }
            });
        };

        const intervalId = setInterval(checkTasks, 5000); // Check every 5s
        return () => clearInterval(intervalId);
    }, [tasks]);

    const triggerAlarm = (task) => {
        // 1. Play Alarm
        if (audioRef.current) {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setAudioUnlocked(true);
                    // Auto-stop after 1 minute (60,000 ms)
                    if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
                    alarmTimeoutRef.current = setTimeout(() => {
                        stopAlarm();
                    }, 60000);
                })
                .catch(e => {
                    console.warn('Autoplay blocked.', e);
                    // Explicitly notify user to interact
                    toast.error('⏰ Alarm Triggered! Click anywhere to enable sound.', {
                        id: 'audio-blocked-warning',
                        duration: 10000,
                        position: 'top-center',
                        icon: '🔊'
                    });
                });
        }

        // 2. Show Persistent Toast
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex flex-col border border-red-500/50 ring-4 ring-red-500/20`}>
                <div className="flex-1 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center animate-bounce">
                                <MdNotificationsActive className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-lg font-black text-white uppercase tracking-tight">
                                ⏰ Task Alarm!
                            </p>
                            <p className="mt-1 text-base text-slate-200 font-medium">
                                {task.title}
                            </p>
                            <p className="mt-1 text-xs text-red-400 font-bold uppercase tracking-widest">
                                Due Now • {task.dueTime}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-t border-white/10">
                    <button
                        onClick={() => {
                            stopAlarm();
                            toast.dismiss(t.id);
                        }}
                        className="w-full rounded-b-2xl p-4 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                        <MdVolumeOff size={20} />
                        Stop Alarm
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity, // Won't close automatically
            position: 'top-center',
            id: `alarm-${task.id}` // Unique ID to prevent duplicates
        });

        // 3. System Notification
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('⏰ Task Alarm!', {
                    body: `It's time for: ${task.title}`,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: `task-${task.id}`,
                    renotify: true,
                    requireInteraction: true,
                    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500],
                    data: { taskId: task.id }
                });
            });
        }
    };

    return null;
};

export default TaskAlertManager;
