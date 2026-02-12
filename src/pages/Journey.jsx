import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdEmojiEvents, MdLightbulbOutline, MdClose,
    MdCheck, MdRefresh
} from 'react-icons/md';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const TaskNode = ({ task, index, isCurrent, isLocked, onClick }) => (
    <motion.button
        whileHover={!isLocked ? { scale: 1.15 } : {}}
        whileTap={!isLocked ? { scale: 0.9 } : {}}
        onClick={onClick}
        disabled={isLocked}
        className="relative group cursor-pointer"
    >
        <div className={`
            w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all border-4
            ${task.completed ? 'bg-indigo-600 border-emerald-400 shadow-indigo-900' :
                isCurrent ? 'bg-blue-500 border-white animate-pulse shadow-blue-900' :
                    'bg-slate-800/50 border-slate-700 opacity-50 grayscale shadow-none'}
        `}>
            {task.completed ? <MdCheck size={32} className="text-emerald-400" /> : <span className="font-black text-xl">{index + 1}</span>}
        </div>

        {/* Label */}
        {!isLocked && (
            <div className={`
                absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all
                ${index % 2 === 0 ? 'left-20 group-hover:left-24' : 'right-20 group-hover:right-24'}
                opacity-0 group-hover:opacity-100 pointer-events-none shadow-2xl
            `}>
                {task.title}
            </div>
        )}
    </motion.button>
);

const WindingPath = () => {
    const points = [];
    const height = 1200;
    const amplitude = 150; // Smaller amplitude for better centering within container
    const frequency = 0.008;

    for (let y = 0; y < height; y += 20) {
        const x = (amplitude * Math.sin(y * frequency)) + 300; // Center at 300 in 600 viewBox
        points.push(`${x},${y}`);
    }

    const pathD = points.length > 0
        ? `M 300,0 ${points.map(p => `L ${p}`).join(' ')}`
        : 'M 300,0';

    return (
        <svg
            className="absolute inset-x-0 h-full w-full pointer-events-none"
            viewBox="0 0 600 1200"
            preserveAspectRatio="none"
        >
            <path
                d={pathD}
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="15 15"
                className="opacity-10"
            />
        </svg>
    );
};

const Journey = () => {
    const { tasks, toggleTaskCompletion } = useAppContext();
    const [selectedTask, setSelectedTask] = useState(null);

    const todayTasks = useMemo(() => {
        return tasks
            .filter(t => {
                if (!t.dueDate) return false;
                const taskDate = new Date(t.dueDate);
                const today = new Date();
                return (
                    taskDate.getDate() === today.getDate() &&
                    taskDate.getMonth() === today.getMonth() &&
                    taskDate.getFullYear() === today.getFullYear()
                );
            })
            .sort((a, b) => {
                const getTime = (t) => {
                    if (t.dueTime) {
                        const [h, m] = t.dueTime.split(':');
                        return parseInt(h) * 60 + parseInt(m);
                    }
                    return 0;
                };
                return getTime(a) - getTime(b);
            });
    }, [tasks]);

    const completedCount = todayTasks.filter(t => t.completed).length;
    const progress = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

    useEffect(() => {
        if (progress === 100 && todayTasks.length > 0) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3B82F6', '#818CF8', '#F59E0B']
            });
        }
    }, [progress, todayTasks.length]);

    const getMotivationalMessage = () => {
        if (todayTasks.length === 0) return "Add tasks for today";
        if (progress === 0) return "Let's get started! 💪";
        if (progress <= 50) return "You're making progress!";
        if (progress < 100) return "Almost there!";
        return "All done! Great job! 🎉";
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-32 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>

            {/* Header Area */}
            <div className="bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                    <div>
                        <h1 className="text-2xl font-black text-white font-outfit leading-none tracking-tight uppercase italic">Today's Journey</h1>
                        <p className="text-blue-500 font-bold text-[10px] mt-1 uppercase tracking-widest">{getMotivationalMessage()}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Progress</p>
                            <p className="text-xl font-black text-white font-outfit leading-none">{progress}%</p>
                        </div>
                        <div className="relative w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-white/5">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 p-1">
                                <circle
                                    cx="24" cy="24" r="20"
                                    fill="none" stroke="currentColor"
                                    strokeWidth="3" className="text-slate-800"
                                />
                                <motion.circle
                                    cx="24" cy="24" r="20"
                                    fill="none" stroke="currentColor"
                                    strokeWidth="3" strokeDasharray="125.6"
                                    initial={{ strokeDashoffset: 125.6 }}
                                    animate={{ strokeDashoffset: 125.6 - (125.6 * progress / 100) }}
                                    className="text-blue-500"
                                />
                            </svg>
                        </div>
                    </div>
                </header>
            </div>

            <div className="p-6">
                {/* Magical Path Area */}
                <div className="relative py-10 min-h-[800px] max-w-2xl mx-auto">
                    <WindingPath />
                    <div className="flex flex-col-reverse gap-32 relative z-10">
                        {/* Start Marker */}
                        <div className="self-center">
                            <div className="w-16 h-16 bg-slate-800 border-2 border-white/10 rounded-2xl flex flex-col items-center justify-center rotate-6 shadow-2xl">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">START</span>
                                <MdCheck className="text-emerald-500 mt-1" />
                            </div>
                        </div>

                        {todayTasks.map((task, index) => (
                            <div
                                key={task.id}
                                className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                            >
                                <TaskNode
                                    task={task}
                                    index={index}
                                    isCurrent={!task.completed && todayTasks.slice(0, index).every(t => t.completed)}
                                    isLocked={!task.completed && !todayTasks.slice(0, index).every(t => !t.completed && tasks.indexOf(t) < tasks.indexOf(task))}
                                    onClick={() => setSelectedTask(task)}
                                />
                            </div>
                        ))}

                        {/* Finish Trophy */}
                        <div className="self-center mb-10">
                            <motion.div
                                animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-3xl border-4 border-white/20"
                            >
                                <MdEmojiEvents className="text-white" size={48} />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {todayTasks.length === 0 && (
                    <div className="max-w-md mx-auto">
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <MdLightbulbOutline size={32} />
                            </div>
                            <div>
                                <p className="text-white font-black text-lg font-outfit">Your path is quiet today</p>
                                <p className="text-slate-500 font-bold text-sm mt-2">
                                    Add tasks for today in the Tasks module to start your journey.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Overlays */}
            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-md p-10 shadow-3xl"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                    Active Quest
                                </span>
                                <button onClick={() => setSelectedTask(null)} className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                                    <MdClose size={24} />
                                </button>
                            </div>

                            <h2 className="text-3xl font-black text-white font-outfit mb-4 uppercase tracking-tighter">{selectedTask.title}</h2>
                            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10">{selectedTask.description || 'No description provided for this quest.'}</p>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-slate-950 p-5 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</p>
                                    <p className={`text-sm font-black ${selectedTask.completed ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {selectedTask.completed ? 'COMPLETED' : 'PENDING'}
                                    </p>
                                </div>
                                <div className="bg-slate-950 p-5 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Due Time</p>
                                    <p className="text-sm font-black text-white">{selectedTask.dueTime || 'All Day'}</p>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    await toggleTaskCompletion(selectedTask.id);
                                    setSelectedTask(null);
                                    toast.success(selectedTask.completed ? 'Quest Reset' : 'Quest Finished! 🎉');
                                }}
                                className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 text-xs shadow-2xl ${selectedTask.completed
                                    ? 'bg-slate-800 text-slate-400'
                                    : 'bg-blue-600 text-white shadow-blue-500/40 active:scale-95'
                                    }`}
                            >
                                {selectedTask.completed ? <><MdRefresh size={20} /> Restart</> : <><MdCheck size={20} /> Complete</>}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Journey;
