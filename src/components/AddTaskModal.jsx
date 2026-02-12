import React, { useState, useEffect } from 'react';
import { MdClose, MdAdd, MdCalendarToday, MdAccessTime, MdFlag, MdRepeat, MdSpellcheck, MdEmail, MdCall, MdGroups, MdBarChart, MdSchedule, MdAssignment, MdEvent } from 'react-icons/md';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const TASK_TYPES = [
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'call', label: 'Call', icon: '📞' },
    { id: 'meeting', label: 'Meeting', icon: '👥' },
    { id: 'event', label: 'Events', icon: '📅' },
    { id: 'general', label: 'General', icon: '📋' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'followup', label: 'Follow-up', icon: '⏰' },
];

const PRIORITY_LEVELS = [
    { id: 'high', label: 'High', color: '#EF4444' },
    { id: 'medium', label: 'Medium', color: '#F59E0B' },
    { id: 'low', label: 'Low', color: '#10B981' },
];

const AddTaskModal = ({ visible, onClose, onAdd, onUpdate, initialDate, taskToEdit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('general');
    const [priority, setPriority] = useState('medium');
    const [isHabit, setIsHabit] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');

    useEffect(() => {
        if (visible) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setDescription(taskToEdit.description || '');
                setType(taskToEdit.type || taskToEdit.category || 'general');
                setPriority(taskToEdit.priority || 'medium');
                setIsHabit(taskToEdit.isHabit || false);
                setDueDate(taskToEdit.dueDate || '');
                setDueTime(taskToEdit.dueTime || '');
            } else {
                resetForm();
                if (initialDate) {
                    const date = new Date(initialDate);
                    setDueDate(date.toISOString().split('T')[0]);
                }
            }
        }
    }, [visible, taskToEdit]); // Removed initialDate to avoid resetting form while typing or clicking

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setType('general');
        setPriority('medium');
        setIsHabit(false);
        const today = new Date();
        setDueDate(today.toISOString().split('T')[0]);
        const currentHours = String(today.getHours()).padStart(2, '0');
        const currentMins = String(today.getMinutes()).padStart(2, '0');
        setDueTime(`${currentHours}:${currentMins}`);
    };

    const handleSave = () => {
        if (!title.trim()) {
            toast.error('Please enter a task title');
            return;
        }

        const taskData = {
            title: title.trim(),
            description: description.trim(),
            type,
            category: type,
            priority,
            isHabit,
            dueDate,
            dueTime,
        };

        if (taskToEdit) {
            onUpdate(taskToEdit.id, taskData);
            toast.success('Task updated!');
        } else {
            onAdd(taskData);
            toast.success('Task created!');
        }

        resetForm();
        onClose();
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                className="bg-slate-800 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full md:max-w-3xl max-h-[94vh] flex flex-col shadow-2xl relative"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <MdAdd size={24} className="text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {taskToEdit ? 'Edit Task' : 'New Task'}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toast('Grammar check coming soon!')}
                            className="p-2 hover:bg-slate-700 rounded-lg"
                        >
                            <MdSpellcheck size={22} className="text-blue-400" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
                            <MdClose size={24} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Task Type */}
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Task Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TASK_TYPES.map((taskType) => (
                                <button
                                    key={taskType.id}
                                    type="button"
                                    onClick={() => {
                                        setType(taskType.id);
                                        // Update title if it's empty OR if it currently matches another category's label
                                        const currentTitleTrimmed = title.trim();
                                        const isDefaultTitle = !currentTitleTrimmed || TASK_TYPES.some(t => t.label === currentTitleTrimmed);

                                        if (isDefaultTitle) {
                                            setTitle(taskType.label);
                                        }
                                    }}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all cursor-pointer ${type === taskType.id
                                        ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                                        : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10'
                                        }`}
                                >
                                    <span className="text-xl">
                                        {taskType.id === 'email' ? <MdEmail /> :
                                            taskType.id === 'call' ? <MdCall /> :
                                                taskType.id === 'meeting' ? <MdGroups /> :
                                                    taskType.id === 'event' ? <MdEvent /> :
                                                        taskType.id === 'reports' ? <MdBarChart /> :
                                                            taskType.id === 'followup' ? <MdSchedule /> : <MdAssignment />}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{taskType.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title"
                            className="w-full bg-slate-900 text-white text-base font-semibold rounded-lg p-3 border border-slate-700 focus:border-blue-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add description (optional) - URLs will be clickable!"
                            className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-700 focus:border-blue-500 outline-none resize-none"
                            rows={4}
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Date</label>
                            <div className="relative">
                                <MdCalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bg-slate-900 text-white rounded-lg p-2 pl-10 border border-slate-700 focus:border-blue-500 outline-none text-sm cursor-pointer"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Time</label>
                            <div className="relative">
                                <MdAccessTime className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full bg-slate-900 text-white rounded-lg p-2 pl-10 border border-slate-700 focus:border-blue-500 outline-none text-sm cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Priority</label>
                        <div className="flex gap-2">
                            {PRIORITY_LEVELS.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => setPriority(level.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all cursor-pointer ${priority === level.id
                                        ? 'text-white border-transparent'
                                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                                        }`}
                                    style={priority === level.id ? { backgroundColor: level.color } : {}}
                                >
                                    <MdFlag size={14} />
                                    <span className="text-xs font-semibold">{level.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Daily Habit Toggle */}
                    <button
                        onClick={() => setIsHabit(!isHabit)}
                        className="w-full flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-all mb-4 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isHabit ? 'bg-blue-500' : 'bg-blue-500/20'
                                }`}>
                                <MdRepeat size={18} className={isHabit ? 'text-white' : 'text-blue-400'} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-white">Daily Habit</p>
                                <p className="text-xs text-slate-400">Repeat this task every day</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all ${isHabit ? 'bg-blue-500' : 'bg-slate-600'
                            }`}>
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isHabit ? 'translate-x-6' : 'translate-x-1'
                                } mt-0.5`} />
                        </div>
                    </button>
                </div>

                {/* Footer - Guaranteed visible with safe area padding */}
                <div className="p-6 pb-10 border-t border-slate-700 bg-slate-800 rounded-b-[2.5rem]">
                    <div className="flex gap-3 max-w-lg mx-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-700 text-white rounded-3xl hover:bg-slate-600 transition-all font-black uppercase tracking-widest text-xs cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className={`flex-1 py-4 rounded-3xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${title.trim()
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                }`}
                        >
                            <MdAdd size={22} />
                            {taskToEdit ? 'Save Changes' : 'Add Task'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AddTaskModal;
