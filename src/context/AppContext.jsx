import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';
import storage, { loadTasks, saveTasks, loadNotes, saveNotes } from '../services/storage';
import {
    scheduleTaskNotification,
    scheduleTaskReminderBefore,
    cancelTaskNotifications,
    rescheduleAllPendingNotifications,
} from '../services/notificationService';
import eventEmitter from '../services/eventEmitter';
import toast from 'react-hot-toast';

const AppContext = createContext();

// Helper to normalize backend task data to frontend model
const normalizeTaskData = (tasks) => {
    if (!tasks) return [];
    return tasks.map(task => {
        let dueDate = null;
        let dueTime = null;
        if (task.due_date) {
            const date = new Date(task.due_date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dueDate = `${year}-${month}-${day}`;
            dueTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        return {
            id: task.id,
            title: task.title,
            description: task.description || '',
            priority: task.priority?.toLowerCase() || 'medium',
            completed: task.status === 'COMPLETED',
            dueDate: dueDate,
            dueTime: dueTime,
            category: task.category || 'General',
            date: task.created_at,
            due_date: task.due_date,
            status: task.status,
            local_id: task.local_id || null,
            isPinned: task.is_pinned !== undefined ? task.is_pinned : (task.isPinned !== undefined ? task.isPinned : (task.pinned !== undefined ? task.pinned : null))
        };
    });
};

// Helper to normalize backend note data to frontend model
const normalizeNoteData = (notes) => {
    if (!notes) return [];
    return notes.map(note => ({
        id: note.id,
        title: note.title || '',
        content: note.content || '',
        linkedTaskId: note.linked_task_id || note.linkedTaskId || null,
        // Backend returns 'image', we use 'images' (as array) on frontend for compatibility
        images: note.images || (note.image ? [note.image] : []),
        date: note.date || note.created_at || new Date().toISOString(),
        created_at: note.created_at,
        updated_at: note.updated_at,
        isPinned: note.is_pinned !== undefined ? note.is_pinned : (note.isPinned !== undefined ? note.isPinned : (note.pinned !== undefined ? note.pinned : null)),
    }));
};

export const AppProvider = ({ children }) => {
    // State
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [userProfile, setUserProfile] = useState({
        name: 'User',
        mobile: '',
        address: '',
        company: '',
        designation: '',
        profileImage: null,
        showHabits: true,
        showStreak: true,
        enableAI: true,
        enableVoice: true,
    });
    const [authToken, setAuthToken] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const STORAGE_PREFIX = userRole === 'GUEST' ? 'guest_' : '';

    // Helper to prepare due_date for API (combining YYYY-MM-DD and HH:mm)
    const formatDueDateForApi = (dueDate, dueTime) => {
        if (!dueDate) return null;
        if (!dueTime) return dueDate;
        return `${dueDate}T${dueTime}:00`;
    };

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('📂 Loading data from storage...');

                // Load basic data
                const loadedTasks = await loadTasks();
                const loadedNotes = await loadNotes();

                // Reschedule notifications
                const tasksWithNotifications = await rescheduleAllPendingNotifications(loadedTasks);
                setTasks(tasksWithNotifications);
                setNotes(loadedNotes);

                if (tasksWithNotifications.length > 0) {
                    await saveTasks(tasksWithNotifications);
                }

                // Load user profile
                const profileJson = await storage.getItem('userProfile');
                if (profileJson) {
                    setUserProfile(profileJson);
                }

                // Check for tokens
                const refreshToken = await tokenStorage.getRefreshToken();
                const accessToken = await tokenStorage.getAccessToken();

                if (refreshToken) {
                    try {
                        console.log('🔄 Validating refresh token...');
                        const data = await apiService.validateSession(refreshToken);

                        await tokenStorage.saveTokens(data.access_token, data.refresh_token, data.session_id);

                        const decoded = jwtDecode(data.access_token);
                        setAuthToken(data.access_token);
                        setUserRole(decoded.role || 'USER');

                        console.log('✅ Auto-login successful');

                        // Fetch cloud data
                        try {
                            const [cloudTasks, cloudNotes] = await Promise.all([
                                apiService.getTasks(),
                                apiService.getNotes()
                            ]);

                            if (cloudTasks) {
                                const normalized = normalizeTaskData(cloudTasks);
                                setTasks(await rescheduleAllPendingNotifications(normalized));
                            }
                            if (cloudNotes) {
                                const normalized = normalizeNoteData(cloudNotes);
                                setNotes(normalized);
                            }
                        } catch (e) {
                            console.error('Cloud sync failed:', e.message);
                        }
                    } catch (e) {
                        console.error('❌ Auto-login failed:', e);
                        await tokenStorage.clearTokens();
                        await storage.removeItem('userToken');
                        setAuthToken(null);
                        setUserRole(null);
                    }
                } else {
                    // Check for guest mode
                    const storedRole = await storage.getItem('userRole');
                    if (storedRole === 'GUEST') {
                        setUserRole('GUEST');
                        const guestTasks = await loadTasks('guest_');
                        const guestNotes = await loadNotes('guest_');
                        setTasks(await rescheduleAllPendingNotifications(guestTasks));
                        setNotes(guestNotes);
                    } else {
                        setAuthToken(null);
                        setUserRole(null);
                    }
                }

                // Streak logic
                const streakDataStr = await storage.getItem('streakData');
                let currentStreak = 0;
                let lastLoginDate = null;

                if (streakDataStr) {
                    currentStreak = streakDataStr.streak || 0;
                    lastLoginDate = streakDataStr.lastLoginDate;
                }

                const todayStr = new Date().toDateString();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();

                if (lastLoginDate !== todayStr) {
                    if (lastLoginDate === yesterdayStr) {
                        currentStreak += 1;
                    } else {
                        currentStreak = 1;
                    }

                    await storage.setItem('streakData', {
                        streak: currentStreak,
                        lastLoginDate: todayStr
                    });
                }

                setStreak(currentStreak);
                console.log('✅ Data loaded');
            } catch (error) {
                console.error('❌ Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Auto-save
    useEffect(() => {
        if (!isLoading) {
            saveTasks(tasks, STORAGE_PREFIX);
        }
    }, [tasks, isLoading, STORAGE_PREFIX]);

    useEffect(() => {
        if (!isLoading) {
            saveNotes(notes, STORAGE_PREFIX);
        }
    }, [notes, isLoading, STORAGE_PREFIX]);

    // Actions
    const addTask = async (task) => {
        let newTask = {
            ...task,
            id: Date.now().toString(),
            completed: false,
            date: new Date().toISOString(),
            notificationId: null,
            reminderNotificationId: null,
        };

        if (authToken) {
            try {
                const apiPayload = {
                    title: task.title,
                    description: task.description || '',
                    priority: (task.priority || 'MEDIUM').toUpperCase(),
                    status: 'PENDING',
                    category: task.category || task.type || 'General',
                    due_date: formatDueDateForApi(task.dueDate, task.dueTime),
                    is_pinned: task.isPinned || false,
                    isPinned: task.isPinned || false,
                };
                const cloudTask = await apiService.createTask(apiPayload);
                if (cloudTask) {
                    newTask = { ...newTask, ...cloudTask };
                }
            } catch (error) {
                console.error('❌ Cloud addTask failed:', error.message);
            }
        }

        setTasks(prevTasks => [...prevTasks, newTask]);
        setDashboardStats(null);

        try {
            const notificationId = await scheduleTaskNotification(newTask);
            const reminderNotificationId = await scheduleTaskReminderBefore(newTask, 15);

            if (notificationId || reminderNotificationId) {
                const updatedTask = { ...newTask, notificationId, reminderNotificationId };
                setTasks(prevTasks => prevTasks.map(t => t.id === newTask.id ? updatedTask : t));
            }
        } catch (error) {
            console.error('Error scheduling notifications:', error);
        }
    };

    const toggleTaskCompletion = async (id, completionNote = null) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newCompletedStatus = !task.completed;

        setDashboardStats(null);
        setTasks(prevTasks => prevTasks.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    completed: newCompletedStatus,
                    completionNote: newCompletedStatus ? completionNote : null,
                    notificationId: newCompletedStatus ? null : t.notificationId,
                    reminderNotificationId: newCompletedStatus ? null : t.reminderNotificationId,
                };
            }
            return t;
        }));

        if (newCompletedStatus) {
            cancelTaskNotifications(id).catch(err => console.error(err));
            eventEmitter.emit('taskCompleted');
        }

        if (authToken) {
            try {
                await apiService.updateTask(id, {
                    title: task.title,
                    description: task.description || '',
                    priority: (task.priority || 'MEDIUM').toUpperCase(),
                    status: newCompletedStatus ? 'COMPLETED' : 'PENDING',
                    category: task.category || 'General',
                    due_date: task.due_date || task.dueDate || null,
                    completion_note: completionNote,
                });
            } catch (error) {
                console.error('❌ Cloud toggleTaskCompletion failed:', error.message);
            }
        }
    };

    const updateTask = async (id, updates) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (authToken) {
            try {
                const mergedTask = { ...task, ...updates };
                const apiPayload = {
                    title: mergedTask.title,
                    description: mergedTask.description || '',
                    priority: (mergedTask.priority || 'MEDIUM').toUpperCase(),
                    status: mergedTask.completed ? 'COMPLETED' : 'PENDING',
                    category: mergedTask.category || mergedTask.type || 'General',
                    due_date: formatDueDateForApi(mergedTask.dueDate || mergedTask.due_date, mergedTask.dueTime),
                    is_pinned: mergedTask.isPinned || false,
                    isPinned: mergedTask.isPinned || false,
                };
                await apiService.updateTask(id, apiPayload);
            } catch (error) {
                console.error('❌ Cloud updateTask failed:', error.message);
            }
        }

        await cancelTaskNotifications(id);
        const updatedTask = { ...task, ...updates };

        if (!updatedTask.completed && updatedTask.dueDate && updatedTask.dueTime) {
            try {
                const notificationId = await scheduleTaskNotification(updatedTask);
                const reminderNotificationId = await scheduleTaskReminderBefore(updatedTask, 15);
                updatedTask.notificationId = notificationId;
                updatedTask.reminderNotificationId = reminderNotificationId;
            } catch (error) {
                console.error('❌ Error rescheduling notifications:', error);
            }
        }

        setTasks(tasks.map(t => t.id === id ? updatedTask : t));
        setDashboardStats(null);
    };

    const deleteTask = async (id) => {
        if (authToken) {
            try {
                await apiService.deleteTask(id);
            } catch (error) {
                console.error('❌ Cloud deleteTask failed:', error.message);
            }
        }

        await cancelTaskNotifications(id);
        setTasks(tasks.filter(t => t.id !== id));
        setDashboardStats(null);
    };

    const addNote = async (note) => {
        let id = Date.now().toString();
        let newNote = {
            ...note,
            id,
            date: new Date().toISOString()
        };

        if (authToken) {
            try {
                // Map frontend payload to API payload
                const apiPayload = {
                    title: note.title,
                    content: note.content || '',
                    linked_task_id: note.linkedTaskId || note.linked_task_id || null,
                    image: (note.images && note.images.length > 0) ? note.images[0] : (note.image || null),
                    is_pinned: note.isPinned || false,
                    isPinned: note.isPinned || false,
                };

                // Clean empty IDs to prevent DB foreign key constraint errors (500)
                if (apiPayload.linked_task_id === "") apiPayload.linked_task_id = null;

                const cloudNote = await apiService.createNote(apiPayload);
                if (cloudNote) {
                    newNote = normalizeNoteData([cloudNote])[0];
                    id = cloudNote.id;
                }
            } catch (error) {
                console.error('❌ Cloud addNote failed:', error.message);
            }
        }

        setNotes(prevNotes => [...prevNotes, newNote]);
        return id;
    };

    const updateNote = async (id, updates) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        if (authToken) {
            try {
                // Map merged updates to API payload
                const mergedNote = { ...note, ...updates };
                const apiPayload = {
                    title: mergedNote.title,
                    content: mergedNote.content,
                    linked_task_id: mergedNote.linkedTaskId || null,
                    is_pinned: mergedNote.isPinned || false,
                    isPinned: mergedNote.isPinned || false,
                };

                // Handle image (backend expects single image string, frontend uses array)
                if (mergedNote.images && mergedNote.images.length > 0) {
                    apiPayload.image = mergedNote.images[0];
                } else {
                    apiPayload.image = null;
                }

                // Clean empty IDs
                if (apiPayload.linked_task_id === "") apiPayload.linked_task_id = null;

                await apiService.updateNote(id, apiPayload);
            } catch (error) {
                console.error('❌ Cloud updateNote failed:', error.message);
            }
        }
        setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    const deleteNote = async (id) => {
        if (authToken) {
            try {
                await apiService.deleteNote(id);
            } catch (error) {
                console.error('❌ Cloud deleteNote failed:', error.message);
            }
        }
        setNotes(notes.filter(n => n.id !== id));
    };

    const updateProfile = async (updates) => {
        const newProfile = { ...userProfile, ...updates };
        setUserProfile(newProfile);
        try {
            await storage.setItem('userProfile', newProfile);
        } catch (e) {
            console.error("Failed to save profile", e);
        }
    };

    const login = async (response) => {
        try {
            const { access_token, refresh_token, session_id } = response;

            const decoded = jwtDecode(access_token);
            setAuthToken(access_token);
            setUserRole(decoded.role || 'USER');

            const extractNameFromEmail = (email) => {
                if (!email) return 'User';
                const beforeAt = email.split('@')[0];
                const firstName = beforeAt.split('.')[0];
                return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
            };

            const initialProfile = {
                name: extractNameFromEmail(decoded.sub),
                email: decoded.sub,
                role: decoded.role || 'USER',
                profileImage: null,
                showStreak: true
            };
            setUserProfile(initialProfile);
            await storage.setItem('userProfile', initialProfile);

            await tokenStorage.saveTokens(access_token, refresh_token, session_id);
            await storage.setItem('userToken', access_token);
            await storage.removeItem('userRole');

            // Migration
            await performMigration(access_token);

            // Fetch cloud data
            const [cloudTasks, cloudNotes, cloudStats] = await Promise.all([
                apiService.getTasks(),
                apiService.getNotes(),
                apiService.getDashboardStats()
            ]);

            if (cloudTasks) {
                const normalized = normalizeTaskData(cloudTasks);
                const tasksWithNotifications = await rescheduleAllPendingNotifications(normalized);
                setTasks(tasksWithNotifications);
            }
            if (cloudNotes) {
                const normalized = normalizeNoteData(cloudNotes);
                setNotes(normalized);
            }
            if (cloudStats) setDashboardStats(cloudStats);
        } catch (e) {
            console.error("Login failed:", e);
        }
    };

    const loginAsGuest = async () => {
        setUserRole('GUEST');
        setAuthToken(null);

        const guestProfile = {
            name: 'Guest',
            email: '',
            role: 'GUEST',
            profileImage: null,
            showStreak: false
        };
        setUserProfile(guestProfile);

        await storage.setItem('userRole', 'GUEST');
        await storage.removeItem('userToken');

        const guestTasks = await loadTasks('guest_');
        const guestNotes = await loadNotes('guest_');
        setTasks(guestTasks);
        setNotes(guestNotes);
    };

    const performMigration = async (token) => {
        const guestTasks = await loadTasks('guest_');
        const guestNotes = await loadNotes('guest_');

        if (guestTasks.length === 0 && guestNotes.length === 0) {
            return;
        }

        try {
            const payload = {
                tasks: guestTasks.map(t => ({
                    local_id: t.id,
                    title: t.title,
                    description: t.description || '',
                    priority: t.priority || 'MEDIUM',
                    status: t.completed ? 'COMPLETED' : 'PENDING',
                    due_date: formatDueDateForApi(t.dueDate, t.dueTime),
                    category: t.category || 'General'
                })),
                notes: guestNotes.map(n => ({
                    local_id: n.id,
                    title: n.title,
                    content: n.content,
                    linked_task_id: n.linkedTaskId || null
                })),
                local_task_ids: guestTasks.map(t => t.id),
                local_note_ids: guestNotes.map(n => n.id)
            };

            await apiService.batchSync(payload);
            await storage.removeItem('guest_@tasks');
            await storage.removeItem('guest_@notes');
            await storage.removeItem('userRole');
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
        }
    };

    const logout = async () => {
        try {
            await tokenStorage.clearTokens();
            localStorage.clear();

            setAuthToken(null);
            setUserRole(null);
            setTasks([]);
            setNotes([]);
            setUserProfile(null);
            setDashboardStats({
                stats: { today_count: 0, pending_count: 0, high_priority: 0, overdue_count: 0 },
                today_tasks: []
            });
        } catch (e) {
            console.error('❌ Logout failed:', e);
        }
    };

    const refreshTasks = async () => {
        if (!authToken) return;
        try {
            const cloudTasks = await apiService.getTasks();
            if (cloudTasks) {
                const normalizedTasks = normalizeTaskData(cloudTasks);
                // Merge with existing tasks to preserve fields not returned by API (like local isPinned if missing)
                const mergedTasks = normalizedTasks.map(ct => {
                    const existing = tasks.find(t => t.id === ct.id);
                    return {
                        ...ct,
                        isPinned: ct.isPinned !== null ? ct.isPinned : (existing ? existing.isPinned : false)
                    };
                });
                const tasksWithNotifications = await rescheduleAllPendingNotifications(mergedTasks);
                setTasks(tasksWithNotifications);
            }
        } catch (error) {
            console.error('❌ refreshTasks error:', error.message);
        }
    };

    const refreshNotes = async () => {
        if (!authToken) return;
        try {
            const cloudNotes = await apiService.getNotes();
            if (cloudNotes) {
                const normalizedNotes = normalizeNoteData(cloudNotes);
                // Merge with existing notes to preserve fields not returned by API
                const mergedNotes = normalizedNotes.map(cn => {
                    const existing = notes.find(n => n.id === cn.id);
                    return {
                        ...cn,
                        isPinned: cn.isPinned !== null ? cn.isPinned : (existing ? existing.isPinned : false)
                    };
                });
                setNotes(mergedNotes);
            }
        } catch (error) {
            console.error('❌ refreshNotes error:', error.message);
        }
    };

    const refreshDashboardStats = async () => {
        if (!authToken) {
            // Calculate locally for guest
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTasks = tasks.filter(t => {
                if (!t.dueDate) return false;
                const taskDate = new Date(t.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate.getTime() === today.getTime();
            });

            const now = new Date();
            const overdueTasks = tasks.filter(t => {
                if (!t.dueDate || t.completed) return false;
                const due = new Date(t.dueDate);
                if (t.dueTime) {
                    const [h, m] = t.dueTime.split(':');
                    due.setHours(h, m);
                }
                return due < now;
            });

            setDashboardStats({
                stats: {
                    today_count: todayTasks.length,
                    pending_count: tasks.filter(t => !t.completed).length,
                    high_priority: tasks.filter(t => t.priority === 'high' && !t.completed).length,
                    overdue_count: overdueTasks.length
                },
                today_tasks: todayTasks
            });
            return;
        }

        try {
            const stats = await apiService.getDashboardStats();
            if (stats) {
                if (stats.today_tasks) {
                    stats.today_tasks = stats.today_tasks.map(t => ({
                        ...t,
                        dueDate: t.due_date,
                        completed: t.status === 'COMPLETED',
                        priority: t.priority
                    }));
                }
                setDashboardStats(stats);
            }
        } catch (e) {
            console.error('❌ Error fetching dashboard stats:', e);
        }
    };

    const toggleTaskPin = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newPinStatus = !task.isPinned;
        await updateTask(taskId, { isPinned: newPinStatus });
        toast.success(newPinStatus ? 'Task Pinned' : 'Task Unpinned');
    };

    const toggleNotePin = async (noteId) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        const newPinStatus = !note.isPinned;
        await updateNote(noteId, { isPinned: newPinStatus });
        toast.success(newPinStatus ? 'Note Pinned' : 'Note Unpinned');
    };

    return (
        <AppContext.Provider value={{
            tasks,
            notes,
            streak,
            userProfile,
            authToken,
            userRole,
            addTask,
            toggleTaskCompletion,
            updateTask,
            deleteTask,
            addNote,
            updateNote,
            deleteNote,
            toggleTaskPin,
            toggleNotePin,
            updateProfile,
            login,
            loginAsGuest,
            logout,
            refreshTasks,
            refreshNotes,
            dashboardStats,
            refreshDashboardStats,
            isLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

export default AppContext;
