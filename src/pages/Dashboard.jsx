import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdCalendarToday,
    MdAssignment,
    MdPriorityHigh,
    MdWarning,
    MdCheckCircle,
    MdKeyboardArrowRight,
    MdKeyboardArrowDown,
    MdMoreVert,
    MdLogout,
    MdEdit,
    MdDelete,
    MdRefresh,
    MdPushPin,
} from 'react-icons/md';
import { useAppContext } from '../context/AppContext';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';
import AddTaskModal from '../components/AddTaskModal';
import ThemeToggle from '../components/ThemeToggle';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('Daily');
    const [filterMode, setFilterMode] = useState('all');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState(null);
    const [completionRemark, setCompletionRemark] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const {
        userProfile,
        userRole,
        dashboardStats,
        refreshDashboardStats,
        logout,
        streak,
        tasks,
        toggleTaskCompletion,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskPin
    } = useAppContext();
    const navigate = useNavigate();
    const taskDetailsRef = useRef(null);

    const todayTasksCount = useMemo(() => {
        const today = new Date().toDateString();
        return tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today).length;
    }, [tasks]);

    const todayCompletedCount = useMemo(() => {
        const today = new Date().toDateString();
        return tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today && (t.completed || t.status === 'COMPLETED')).length;
    }, [tasks]);

    const localStats = useMemo(() => {
        const today = new Date().toDateString();
        const now = new Date();

        const allPending = tasks.filter(t => !t.completed && t.status !== 'COMPLETED');
        const todayPending = allPending.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today);
        const highPriorityPending = allPending.filter(t => t.priority === 'high');
        const overdueTasks = allPending.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            if (t.dueTime) {
                const [h, m] = t.dueTime.split(':');
                d.setHours(parseInt(h), parseInt(m));
            } else {
                d.setHours(23, 59, 59, 999);
            }
            return d < now;
        });

        return {
            today_count: todayPending.length,
            pending_count: allPending.length,
            high_priority: highPriorityPending.length,
            overdue_count: overdueTasks.length
        };
    }, [tasks]);

    const scrollToTaskDetails = (tab, filter = 'all') => {
        setActiveTab(tab);
        setFilterMode(filter);
        setTimeout(() => {
            taskDetailsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        refreshDashboardStats();
    }, []);

    // Dynamic Analytics Calculation (Parity with TaskAnalytics.js)
    const currentPeriodTasks = useMemo(() => {
        const today = new Date();
        const mode = activeTab.toLowerCase();
        let targetTasks = [];

        if (mode === 'daily') {
            const todayStr = today.toDateString();
            targetTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === todayStr);
        } else if (mode === 'week') {
            const dayOfWeek = today.getDay();
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(new Date().setDate(diff));
            monday.setHours(0, 0, 0, 0);

            const nextMonday = new Date(monday);
            nextMonday.setDate(monday.getDate() + 7);

            targetTasks = tasks.filter(t => {
                if (!t.dueDate) return false;
                const d = new Date(t.dueDate);
                return d >= monday && d < nextMonday;
            });
        } else {
            // Month View
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);

            targetTasks = tasks.filter(t => {
                if (!t.dueDate) return false;
                const d = new Date(t.dueDate);
                return d >= startOfMonth && d <= endOfMonth;
            });
        }
        return targetTasks;
    }, [tasks, activeTab]);

    const filteredTasks = useMemo(() => {
        let result = currentPeriodTasks;
        if (filterMode === 'high') result = result.filter(t => t.priority === 'high');
        else if (filterMode === 'overdue') {
            const now = new Date();
            result = result.filter(t => {
                if (t.completed || t.status === 'COMPLETED') return false;
                if (!t.dueDate) return false;
                const d = new Date(t.dueDate);
                if (t.dueTime) {
                    const [h, m] = t.dueTime.split(':');
                    d.setHours(parseInt(h), parseInt(m));
                }
                return d < now;
            });
        }
        else if (filterMode === 'pending') result = result.filter(t => !t.completed && t.status !== 'COMPLETED');

        return result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });
    }, [currentPeriodTasks, filterMode]);

    const filteredStats = useMemo(() => {
        const total = filteredTasks.length;
        const completed = filteredTasks.filter(t => t.completed || t.status === 'COMPLETED').length;
        const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, efficiency };
    }, [filteredTasks]);

    const formatTimeAMPM = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [hours, minutes] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }).toUpperCase();
        } catch (e) {
            return timeStr;
        }
    };

    const performLogoutAction = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully', { icon: '👋' });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleCompletionPress = (task) => {
        if (!task.completed && task.status !== 'COMPLETED') {
            setTaskToComplete(task.id);
            setRemarkModalVisible(true);
        } else {
            toggleTaskCompletion(task.id);
            toast.success('Task marked as pending');
        }
    };

    const confirmCompletion = () => {
        if (taskToComplete) {
            toggleTaskCompletion(taskToComplete, completionRemark);
            toast.success('Task completed!');
            setTaskToComplete(null);
            setCompletionRemark('');
        }
        setRemarkModalVisible(false);
    };

    const handleEdit = (task) => {
        setTaskToEdit(task);
        setEditModalVisible(true);
    };

    const handleDelete = (taskId) => {
        setTaskToDelete(taskId);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete);
            toast.success('Task deleted');
            setTaskToDelete(null);
        }
        setShowDeleteConfirm(false);
    };


    const analyticsTabs = ['Daily', 'Week', 'Month'];

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 pb-24 overflow-x-hidden transition-colors duration-300">
            {/* Header */}
            <header className="dark:bg-slate-900/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 dark:border-white/5 border-slate-200 border-b transition-colors duration-300">
                <div className="px-6 py-5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <motion.div
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/profile')}
                                className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-blue-900/30 border-2 border-blue-400/20 cursor-pointer shrink-0"
                            >
                                {userProfile.name?.[0] || 'G'}
                            </motion.div>
                            <div className="min-w-0 flex-1">
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider leading-none mb-1 whitespace-nowrap truncate">{getGreeting()}</p>
                                <h1 className="dark:text-white text-slate-900 text-base font-black font-outfit leading-tight truncate">{userProfile.name || 'Guest'}</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="dark:bg-[#1e293b]/80 bg-white/80 backdrop-blur-md dark:border-white/10 border-slate-200 border px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl">
                                <span className="text-base">🔥</span>
                                <span className="dark:text-white text-slate-900 font-black text-[9px] uppercase tracking-tighter whitespace-nowrap">{streak}-Day Streak</span>
                            </div>


                            <ThemeToggle />

                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-10 h-10 rounded-xl dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors shrink-0 shadow-lg dark:shadow-none"
                            >
                                <MdLogout size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-6 space-y-5 pt-6">
                {/* Daily Goal Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate('/journey')}
                    className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl px-4 py-2 shadow-2xl shadow-blue-900/40 cursor-pointer group"
                >
                    <div className="relative z-10">
                        <div className="flex justify-between items-center">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-black font-outfit text-white uppercase tracking-tight leading-none">Daily Goal</h2>
                                <p className="text-blue-100 text-[9px] italic leading-none mt-1 max-w-[90%] font-medium opacity-80 truncate">
                                    "Your only limit is your mind."
                                </p>
                            </div>
                            <MdKeyboardArrowRight className="text-white/80 shrink-0" size={20} />
                        </div>

                        <div className="mt-2.5 mb-1">
                            <div className="flex justify-between items-center text-[9px] mb-1">
                                <span className="text-blue-100 font-black uppercase tracking-wider opacity-70">Progress</span>
                                <span className="text-white font-black">0%</span>
                            </div>

                            {/* Rocket Progress Bar */}
                            <div className="relative h-4 flex items-center mb-1">
                                <div className="h-1 bg-blue-900/40 rounded-full w-full">
                                    <motion.div
                                        className="h-full bg-white/70 rounded-full"
                                        style={{ width: '0%' }}
                                        initial={{ width: 0 }}
                                        animate={{ width: '0%' }}
                                    />
                                </div>
                                <motion.div
                                    className="absolute left-0 -ml-2.5"
                                    animate={{
                                        y: [0, -1, 0],
                                        rotate: [0, -2, 0]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">🚀</span>
                                </motion.div>
                            </div>

                            <div className="flex items-center gap-1 text-blue-100/50 text-[8px] font-black uppercase tracking-widest leading-none">
                                <MdCalendarToday size={9} />
                                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Minimal Decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                </motion.div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Pending (Today)", value: localStats.today_count, icon: <MdCalendarToday />, color: "text-blue-500", bg: "bg-blue-50", iconBg: "bg-blue-500/10", tab: 'Daily', filter: 'pending' },
                        { label: "Pending", value: localStats.pending_count, icon: <MdAssignment />, color: "text-purple-500", bg: "bg-purple-50", iconBg: "bg-purple-500/10", tab: 'Month', filter: 'pending' },
                        { label: "High Priority", value: localStats.high_priority, icon: <MdPriorityHigh />, color: "text-red-500", bg: "bg-red-50", iconBg: "bg-red-500/10", tab: 'Month', filter: 'high' },
                        { label: "Over Due", value: localStats.overdue_count, icon: <MdWarning />, color: "text-amber-500", bg: "bg-amber-50", iconBg: "bg-amber-500/10", tab: 'Month', filter: 'overdue' }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => scrollToTaskDetails(item.tab, item.filter)}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md shadow-slate-200/50 dark:shadow-none flex items-center gap-3 cursor-pointer hover:shadow-lg transition-all border border-transparent dark:border-white/5"
                        >
                            <div className={`${item.iconBg} ${item.color} p-2.5 rounded-xl shrink-0`}>
                                {React.cloneElement(item.icon, { size: 20 })}
                            </div>
                            <div>
                                <h4 className="text-slate-900 dark:text-white text-xl font-black leading-none mb-1">{item.value}</h4>
                                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-tight leading-none">{item.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Secondary Action Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => scrollToTaskDetails('Daily')}
                        className="dark:bg-[#1E293B] bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 text-blue-400 p-2.5 rounded-full shrink-0">
                                <MdCalendarToday size={22} />
                            </div>
                            <div>
                                <h4 className="dark:text-white text-slate-900 text-xl font-black leading-none mb-1">{todayTasksCount}</h4>
                                <p className="text-slate-400 text-[9px] font-bold">Today's Tasks</p>
                            </div>
                        </div>
                        <MdKeyboardArrowDown className="text-blue-400" size={20} />
                    </motion.div>

                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => scrollToTaskDetails('Daily')}
                        className="dark:bg-[#1E293B] bg-white border dark:border-white/5 border-slate-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-full shrink-0">
                                <MdCheckCircle size={22} />
                            </div>
                            <div>
                                <h4 className="dark:text-white text-slate-900 text-xl font-black leading-none mb-1">{todayCompletedCount}</h4>
                                <p className="text-slate-400 text-[9px] font-bold">Today's Complete</p>
                            </div>
                        </div>
                        <MdCheckCircle className="text-emerald-400" size={20} />
                    </motion.div>
                </div>

                {/* Task Details Analytics */}
                <div ref={taskDetailsRef} className="dark:bg-[#1E293B] bg-white border dark:border-white/5 border-slate-200 rounded-[2rem] p-5 space-y-6 shadow-xl dark:shadow-none">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <h3 className="dark:text-white text-slate-900 text-xs font-black font-outfit uppercase tracking-tighter whitespace-nowrap shrink-0">Task Details</h3>
                        <div className="flex dark:bg-[#0f172a] bg-slate-100 p-1 rounded-xl gap-1 border dark:border-white/5 border-slate-200">
                            {analyticsTabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setFilterMode('all'); }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Task List for Selected Period */}
                    <div className="mt-4 space-y-3 pt-4 border-t dark:border-white/5 border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                {filterMode !== 'all' ? `${filterMode.charAt(0).toUpperCase() + filterMode.slice(1)} ` : ''}
                                Tasks for this {activeTab === 'Daily' ? 'Day' : activeTab === 'Week' ? 'Week' : 'Month'}
                            </span>
                            <span className="text-blue-400 text-[10px] font-black">{filteredTasks.length} total</span>
                        </div>

                        {filteredTasks.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                                {filteredTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="dark:bg-[#0b1222] bg-slate-50/50 border dark:border-white/5 border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 group transition-all relative overflow-hidden"
                                    >
                                        {task.isPinned && (
                                            <div className="absolute top-0 right-0 p-2 pointer-events-none">
                                                <div className="w-12 h-12 bg-amber-500/10 blur-xl rounded-full"></div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3 sm:gap-4 z-10">
                                            <button
                                                onClick={() => handleCompletionPress(task)}
                                                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${task.completed || task.status === 'COMPLETED'
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-slate-300 dark:border-slate-700 bg-transparent text-transparent'
                                                    }`}
                                            >
                                                <MdCheckCircle size={18} />
                                            </button>

                                            <div
                                                className="flex-1 min-w-0 cursor-pointer"
                                                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className={`text-sm font-bold break-words leading-tight ${(task.completed || task.status === 'COMPLETED') ? 'text-slate-500 line-through' : 'dark:text-white text-slate-900'
                                                        }`}>
                                                        {task.title}
                                                    </h4>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleTaskPin(task.id); }}
                                                        className={`p-1.5 rounded-full transition-all shrink-0 ${task.isPinned ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100'}`}
                                                    >
                                                        <MdPushPin size={16} className={task.isPinned ? 'rotate-45' : ''} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight shrink-0 ${task.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                                        task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                        {task.priority || 'medium'}
                                                    </span>
                                                    {task.dueTime && (
                                                        <span className="text-[10px] text-slate-500 font-black uppercase shrink-0">
                                                            {formatTimeAMPM(task.dueTime)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedTaskId === task.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="pt-2 border-t dark:border-white/5 border-slate-200 flex gap-2"
                                                >
                                                    <button
                                                        onClick={() => handleCompletionPress(task)}
                                                        className={`flex-1 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${task.completed || task.status === 'COMPLETED' ? 'dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-500' : 'bg-emerald-500 text-white'}`}
                                                    >
                                                        {(task.completed || task.status === 'COMPLETED') ? <MdRefresh size={14} /> : <MdCheckCircle size={14} />}
                                                        {(task.completed || task.status === 'COMPLETED') ? 'Redo' : 'Complete'}
                                                    </button>
                                                    <button onClick={() => handleEdit(task)} className="dark:bg-slate-800 bg-slate-100 text-blue-400 p-2 rounded-xl dark:border-white/5 border-slate-200 border hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center">
                                                        <MdEdit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(task.id)} className="dark:bg-slate-800 bg-slate-100 text-red-500 p-2 rounded-xl dark:border-white/5 border-slate-200 border hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center">
                                                        <MdDelete size={16} />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center dark:bg-[#0b1222] bg-slate-50/50 rounded-3xl border border-dashed dark:border-white/10 border-slate-300">
                                <p className="text-slate-500 text-xs font-bold italic">No tasks found for this period</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={performLogoutAction}
                title="Logout?"
                message="Are you sure you want to logout? You will need to sign in again to access your diary."
                confirmText="Logout"
            />

            {/* Task Modals */}
            <AddTaskModal
                visible={addModalVisible || editModalVisible}
                onClose={() => { setAddModalVisible(false); setEditModalVisible(false); setTaskToEdit(null); }}
                onAdd={async (taskData) => await addTask(taskData)}
                onUpdate={async (id, updates) => await updateTask(id, updates)}
                initialDate={new Date()}
                taskToEdit={taskToEdit}
            />

            <AnimatePresence>
                {remarkModalVisible && (
                    <div className="fixed inset-0 dark:bg-slate-950/80 bg-slate-900/20 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-100 border rounded-[2.5rem] w-full max-w-md p-8 shadow-3xl">
                            <h2 className="text-2xl font-black dark:text-white text-slate-900 font-outfit mb-2">Complete Task</h2>
                            <p className="dark:text-slate-500 text-slate-400 font-bold text-sm mb-8 uppercase tracking-widest">Add a completion note</p>
                            <textarea
                                value={completionRemark}
                                onChange={(e) => setCompletionRemark(e.target.value)}
                                placeholder="What did you accomplish?"
                                className="w-full dark:bg-slate-950 bg-slate-50 dark:text-white text-slate-900 rounded-[1.5rem] p-5 mb-8 dark:border-white/5 border-slate-200 border focus:border-blue-500 outline-none resize-none font-bold"
                                rows={4}
                            />
                            <div className="flex gap-4">
                                <button onClick={() => { setRemarkModalVisible(false); setTaskToComplete(null); setCompletionRemark(''); }} className="flex-1 py-5 dark:bg-slate-800 bg-slate-100 dark:text-white text-slate-600 rounded-3xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                                <button onClick={confirmCompletion} className="flex-1 py-5 bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20">Complete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Task?"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete Task"
            />
        </div>
    );
};

export default Dashboard;