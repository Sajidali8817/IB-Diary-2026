import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronLeft, MdChevronRight, MdAdd, MdCheck, MdEdit, MdDelete, MdRefresh, MdExpandMore, MdExpandLess, MdEmail, MdCall, MdGroups, MdBarChart, MdSchedule, MdAssignment, MdPushPin } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AddTaskModal from '../components/AddTaskModal';
import ConfirmModal from '../components/ConfirmModal';
import ThemeToggle from '../components/ThemeToggle';

const PRIORITY_COLORS = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
};

const CATEGORY_ICONS = {
    email: <MdEmail />,
    call: <MdCall />,
    meeting: <MdGroups />,
    general: <MdAssignment />,
    reports: <MdBarChart />,
    followup: <MdSchedule />,
};

const hexToRgba = (hex, alpha) => {
    if (!hex) return 'transparent';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isSameDay = (d1, d2) => {
    if (!d1 || !d2 || isNaN(d1) || isNaN(d2)) return false;
    return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
};

const Tasks = () => {
    const navigate = useNavigate();
    const { tasks, toggleTaskCompletion, addTask, updateTask, deleteTask, refreshTasks, toggleTaskPin } = useAppContext();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState(null);
    const [completionRemark, setCompletionRemark] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const activeDateRef = useRef(null);

    useEffect(() => {
        refreshTasks();
        const params = new URLSearchParams(window.location.search);
        if (params.get('add') === 'true') {
            setAddModalVisible(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    useEffect(() => {
        if (activeDateRef.current) {
            activeDateRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [selectedDate, calendarVisible]);

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => {
                // Date logic
                const taskDate = new Date(task.dueDate || task.due_date);
                if (isNaN(taskDate)) return false;
                const matchesDate = isSameDay(taskDate, selectedDate);

                // Category logic
                const matchesCategory = selectedCategory === 'All' ||
                    task.category?.toLowerCase() === selectedCategory.toLowerCase();

                return matchesDate && matchesCategory;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date || a.created_at || 0);
                const dateB = new Date(b.date || b.created_at || 0);
                return dateB - dateA; // Latest first
            });
    }, [tasks, selectedDate, selectedCategory]);

    const getDateStatus = (date) => {
        if (!date) return null;
        const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));
        if (dayTasks.length === 0) return null;
        const hasPending = dayTasks.some(t => !t.completed);
        const allCompleted = dayTasks.every(t => t.completed);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        if (checkDate > today) return 'yellow';
        return hasPending ? 'red' : 'green';
    };

    const getDotColor = (status) => {
        switch (status) {
            case 'yellow': return '#FFC107';
            case 'green': return '#10B981';
            case 'red': return '#EF4444';
            default: return 'transparent';
        }
    };

    const getDaysInMonth = (month) => {
        const date = new Date(month.getFullYear(), month.getMonth(), 1);
        const days = [];
        const firstDayIndex = date.getDay();
        for (let i = 0; i < firstDayIndex; i++) days.push(null);
        while (date.getMonth() === month.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const changeMonth = (increment) => {
        const newMonth = new Date(calendarMonth);
        newMonth.setMonth(newMonth.getMonth() + increment);
        setCalendarMonth(newMonth);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setCalendarVisible(false);
    };

    const handleCompletionPress = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (!task.completed) {
            setTaskToComplete(taskId);
            setRemarkModalVisible(true);
        } else {
            toggleTaskCompletion(taskId);
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

    function handleDelete(taskId) {
        setTaskToDelete(taskId);
        setShowDeleteConfirm(true);
    }

    function handleConfirmDelete() {
        if (taskToDelete) {
            deleteTask(taskToDelete);
            toast.success('Task deleted');
            setTaskToDelete(null);
        }
        setShowDeleteConfirm(false);
    }

    const stripDates = useMemo(() => {
        const dates = [];
        for (let i = -15; i <= 15; i++) {
            const date = new Date(selectedDate);
            date.setDate(selectedDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [selectedDate]);

    const renderCalendar = () => {
        if (!calendarVisible) return null;
        const days = getDaysInMonth(calendarMonth);
        const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        return (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                    if (info.offset.x > 100) changeMonth(-1);
                    else if (info.offset.x < -100) changeMonth(1);
                }}
                className="dark:bg-slate-900/50 bg-white backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.2rem] p-4 sm:p-6 border dark:border-white/5 border-slate-200 mb-8 shadow-2xl overflow-hidden transition-colors duration-300"
            >
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => changeMonth(-1)} className="p-3 dark:bg-slate-800 bg-slate-100 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors">
                        <MdChevronLeft size={24} className="text-blue-400" />
                    </button>
                    <h3 className="text-xl font-black dark:text-white text-slate-900 font-outfit uppercase tracking-tighter">
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="p-3 dark:bg-slate-800 bg-slate-100 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors">
                        <MdChevronRight size={24} className="text-blue-400" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-center text-slate-500 font-black text-[10px] uppercase tracking-widest">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} className="h-10" />;
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const status = getDateStatus(day);
                        const dotColor = getDotColor(status);

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => handleDateSelect(day)}
                                className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all ${isSelected
                                    ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-600/30'
                                    : isToday
                                        ? 'bg-blue-500/10 text-blue-400 font-black border border-blue-500/20'
                                        : 'dark:bg-slate-800/40 bg-slate-50 dark:text-slate-300 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 border dark:border-transparent border-slate-100'
                                    }`}
                            >
                                <span className="text-sm font-bold">{day.getDate()}</span>
                                {status && (
                                    <div
                                        className="w-1.5 h-1.5 rounded-full mt-1"
                                        style={{ backgroundColor: dotColor }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        );
    };

    const TaskItem = ({ task }) => {
        const isCompleted = task.completed;
        const [isExpanded, setIsExpanded] = useState(false);

        let isOverdue = false;
        if (!isCompleted && task.dueDate) {
            const due = new Date(task.dueDate);
            if (task.dueTime) {
                const [h, m] = task.dueTime.split(':');
                due.setHours(parseInt(h), parseInt(m));
            } else {
                due.setHours(23, 59, 59);
            }
            if (new Date() > due) isOverdue = true;
        }

        const borderColor = isCompleted ? '#10B981' : (isOverdue ? '#EF4444' : '#3B82F6');
        const priorityColor = PRIORITY_COLORS[task.priority] || '#3B82F6';

        let timeDisplay = "All Day";
        if (task.dueTime) {
            const [hours, mins] = task.dueTime.split(':');
            const d = new Date();
            d.setHours(parseInt(hours), parseInt(mins));
            timeDisplay = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }


        return (
            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 sm:gap-4 md:gap-6 mb-8 group">
                <div className="flex flex-col items-center min-w-[55px] sm:min-w-[70px] pt-1">
                    <span className={`text-[12px] sm:text-sm font-black tracking-tight ${isOverdue && !isCompleted ? 'text-red-500' : 'dark:text-slate-400 text-slate-500'}`}>
                        {timeDisplay.split(' ')[0]}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black dark:text-slate-600 text-slate-400 mt-0 sm:mt-1 uppercase tracking-widest">
                        {timeDisplay.split(' ')[1]}
                    </span>
                    <div className={`w-[2px] mt-4 rounded-full flex-1 min-h-[50px] ${isOverdue && !isCompleted ? 'bg-red-500/20' : 'dark:bg-slate-800/50 bg-slate-200'}`} />
                </div>

                <div className="flex-1 relative">
                    {/* Date Badge - Outside Card */}
                    {(task.date || task.created_at) && (
                        <div className="absolute -top-3 right-4 z-10 dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 dark:text-slate-500 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xl shadow-black/5 dark:shadow-black/20 border">
                            {new Date(task.date || task.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                    )}

                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full dark:bg-slate-900/40 bg-white/80 backdrop-blur-xl rounded-[1.8rem] sm:rounded-[2.5rem] border-2 p-3 sm:p-5 transition-all shadow-xl dark:shadow-2xl relative overflow-hidden`}
                        style={{ borderColor: hexToRgba(borderColor, 0.3) }}
                    >
                        <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                            <div className="flex items-center mb-4 pr-12 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl dark:bg-slate-950 bg-slate-100 flex items-center justify-center text-xl text-blue-500 shadow-inner shrink-0">
                                        {CATEGORY_ICONS[task.category?.toLowerCase()] || CATEGORY_ICONS.general}
                                    </div>
                                    <div>
                                        <h3 className={`text-base font-black leading-tight ${isCompleted ? 'line-through dark:text-slate-600 text-slate-400' : 'dark:text-white text-slate-900'}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            {task.priority && (
                                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: hexToRgba(priorityColor, 0.1), color: priorityColor, border: `1px solid ${hexToRgba(priorityColor, 0.2)}` }}>
                                                    {task.priority}
                                                </span>
                                            )}
                                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest dark:bg-slate-800 bg-slate-100 dark:text-slate-500 text-slate-500 dark:border-white/5 border-slate-200 border">
                                                {task.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expand Icon - Absolute Inside */}
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                className="absolute top-1/2 -translate-y-1/2 right-0 dark:text-slate-600 text-slate-400 group-hover:text-blue-500 transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                <MdExpandMore size={24} />
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    {task.description && (
                                        <p className="text-sm font-black dark:text-slate-500 text-slate-500 mt-2 mb-6 leading-relaxed">
                                            {task.description}
                                        </p>
                                    )}
                                    <div className="pt-6 dark:border-white/5 border-slate-200 border-t flex gap-3">
                                        <button onClick={() => handleCompletionPress(task.id)} className={`flex-1 py-3 px-2 rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 sm:gap-2 transition-all ${isCompleted ? 'dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-500' : 'bg-emerald-500 text-white'}`}>
                                            {isCompleted ? <MdRefresh size={14} className="sm:size-[16px]" /> : <MdCheck size={14} className="sm:size-[16px]" />}
                                            {isCompleted ? 'Redo' : 'Complete'}
                                        </button>
                                        <button onClick={() => handleEdit(task)} className="dark:bg-slate-800 bg-slate-100 text-blue-400 p-3 rounded-2xl dark:border-white/5 border-slate-200 border hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                            <MdEdit size={20} />
                                        </button>
                                        <button onClick={() => handleDelete(task.id)} className="dark:bg-slate-800 bg-slate-100 text-red-500 p-3 rounded-2xl dark:border-white/5 border-slate-200 border hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                            <MdDelete size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div >
                </div>
            </motion.div >
        );
    };

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 pb-24 relative transition-colors duration-300">
            {/* Header Section */}
            <div className="dark:bg-slate-900/80 bg-white/80 backdrop-blur-xl sticky top-0 z-30 dark:border-white/5 border-slate-200 border-b transition-colors duration-300">
                <header className="flex justify-between items-center p-6">
                    <button
                        onClick={() => setCalendarVisible(!calendarVisible)}
                        className="group text-left"
                    >
                        <h1 className="text-2xl font-black dark:text-white text-slate-900 font-outfit leading-none tracking-tight">
                            {isSameDay(selectedDate, new Date()) ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-black dark:text-slate-500 text-slate-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            {calendarVisible ? <MdExpandLess className="text-blue-500" /> : <MdExpandMore className="dark:text-slate-500 text-slate-400 group-hover:text-blue-500" />}
                        </div>
                    </button>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>

                </header>
            </div>

            <div className="px-4 sm:px-6 pt-6">
                {/* Category Filter */}
                <div className="mb-6 overflow-x-auto no-scrollbar -mx-4 px-4">
                    <div className="flex gap-2 min-w-max">
                        {['All', ...Object.keys(CATEGORY_ICONS)].map((cat) => {
                            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat === 'All' ? 'All' : cat)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'dark:bg-slate-900/60 bg-white dark:border-white/5 border-slate-200 dark:text-slate-500 text-slate-600 hover:text-blue-500'
                                        }`}
                                >
                                    <span className="text-sm">
                                        {cat === 'All' ? <MdAssignment /> : CATEGORY_ICONS[cat.toLowerCase()]}
                                    </span>
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* Calendar Dropdown */}
                <AnimatePresence>
                    {calendarVisible && renderCalendar()}
                </AnimatePresence>

                {/* Date Strip */}
                {!calendarVisible && (
                    <div className="mb-8 overflow-x-auto no-scrollbar -mx-4 px-4">
                        <div className="flex gap-3 min-w-max pb-2">
                            {stripDates.map((date, idx) => {
                                const isSelected = isSameDay(date, selectedDate);
                                const status = getDateStatus(date);
                                const dotColor = getDotColor(status);

                                return (
                                    <button
                                        key={idx}
                                        ref={isSelected ? activeDateRef : null}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex flex-col items-center justify-center min-w-[60px] h-18 sm:h-20 rounded-[1.5rem] sm:rounded-3xl transition-all border ${isSelected
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 font-black border-blue-600'
                                            : 'dark:bg-slate-900/40 bg-white dark:text-slate-500 text-slate-400 hover:text-blue-500 dark:border-white/5 border-slate-200'
                                            }`}
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest mb-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-lg sm:text-xl font-black font-outfit">{date.getDate()}</span>
                                        {status && (
                                            <div
                                                className="w-1.5 h-1.5 rounded-full mt-1"
                                                style={{ backgroundColor: dotColor }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Task List */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => <TaskItem key={task.id} task={task} />)
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className=" text-center">
                                <div className="w-24 h-24 dark:bg-slate-900 bg-white flex items-center justify-center rounded-[2.5rem] mx-auto mb-8 dark:border-white/5 border-slate-200 border shadow-2xl">
                                    <MdAssignment size={40} className="dark:text-slate-700 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black dark:text-white text-slate-900 font-outfit uppercase tracking-tighter">No tasks found</h3>
                                <p className="dark:text-slate-500 text-slate-400 font-bold mt-2">Ready to plan your day?</p>
                                <button
                                    onClick={() => setAddModalVisible(true)}
                                    className="mt-10 px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                                >
                                    Create New Task
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals */}
            <AddTaskModal
                visible={addModalVisible || editModalVisible}
                onClose={() => { setAddModalVisible(false); setEditModalVisible(false); setTaskToEdit(null); }}
                onAdd={async (taskData) => await addTask(taskData)}
                onUpdate={async (id, updates) => await updateTask(id, updates)}
                initialDate={selectedDate}
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
            {/* Floating Add Button */}
            {!addModalVisible && !editModalVisible && (
                <div className="fixed bottom-24 right-6 z-[100]">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAddModalVisible(true)}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 cursor-pointer"
                    >
                        <MdAdd size={36} />
                    </motion.button>
                </div>
            )}

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

export default Tasks;
