import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdAdd, MdEmail, MdWhatsapp, MdCalendarToday,
    MdCheckCircle, MdError, MdSchedule, MdRefresh,
    MdDelete, MdEdit, MdMoreVert, MdInfo, MdAccountCircle
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import ThemeToggle from '../components/ThemeToggle';

const Scheduler = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole && userRole !== 'ADMIN' && userRole !== 'EA') {
            navigate('/dashboard');
        }
    }, [userRole]);
    const [schedulers, setSchedulers] = useState([]);
    const [stats, setStats] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Always fetch ALL data to ensure accurate stats
            const allData = await apiService.getSchedules('ALL');

            const listData = Array.isArray(allData) ? allData : [];

            // Calculate stats from full list
            const calculatedStats = {
                total: listData.length,
                pending: listData.filter(i => i.status === 'PENDING').length,
                sent: listData.filter(i => i.status === 'SENT').length,
                failed: listData.filter(i => i.status === 'FAILED').length
            };
            setStats(calculatedStats);

            // Filter for display
            let filteredList = listData;
            if (filter !== 'ALL') {
                filteredList = listData.filter(item => item.status === filter);
            }

            // Sort by latest created first
            const sortedList = filteredList.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));

            setSchedulers(sortedList);
        } catch (error) {
            console.error('Failed to load scheduler data:', error);
            toast.error('Failed to load schedulers');
            setSchedulers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (item) => {
        setScheduleToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!scheduleToDelete) return;
        const { id, status } = scheduleToDelete;

        try {
            await apiService.deleteSchedule(id);
            setSchedulers(prev => prev.filter(s => s.id !== id));
            toast.success('Schedule deleted');
            // Refresh stats in background
            apiService.getSchedulerStats().then(setStats);
        } catch (error) {
            console.error('Delete failed:', error);
            // Show the exact backend error or a clear message as requested by user
            let msg = 'Failed to delete schedule';
            if (error.message?.includes('Only PENDING schedulers can be deleted')) {
                msg = 'Alert: Only PENDING schedulers can be deleted according to system rules.';
            } else if (error.message) {
                msg = error.message;
            }
            toast.error(msg);
        } finally {
            setShowDeleteConfirm(false);
            setScheduleToDelete(null);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'SENT': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'FAILED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 pb-24 transition-colors duration-300">
            {/* Header */}
            <div className="dark:bg-slate-900/50 bg-white/80 backdrop-blur-xl sticky top-0 z-30 dark:border-white/5 border-slate-200 border-b transition-colors duration-300">
                <header className="flex justify-between items-center p-6">
                    <div>
                        <h1 className="text-3xl font-black dark:text-white text-slate-900 font-outfit tracking-tight">Scheduler</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Automated Messaging</p>
                    </div>
                    <ThemeToggle />
                </header>
            </div>

            <div className="p-6">

                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <StatCard label="Total" count={stats.total || stats.TOTAL || 0} icon={<MdSchedule />} color="text-blue-400" bg="bg-blue-500/10" />
                        <StatCard label="Pending" count={stats.pending || stats.PENDING || 0} icon={<MdRefresh />} color="text-amber-400" bg="bg-amber-500/10" />
                        <StatCard label="Sent" count={stats.sent || stats.SENT || 0} icon={<MdCheckCircle />} color="text-emerald-400" bg="bg-emerald-500/10" />
                        <StatCard label="Failed" count={stats.failed || stats.FAILED || 0} icon={<MdError />} color="text-red-400" bg="bg-red-500/10" />
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
                    {['ALL', 'PENDING', 'SENT', 'FAILED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border cursor-pointer ${filter === f
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                : 'dark:bg-slate-900/40 bg-white dark:border-white/5 border-slate-200 text-slate-500 hover:text-slate-400'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
                        ) : (Array.isArray(schedulers) && schedulers.length > 0) ? (
                            schedulers.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="dark:bg-slate-900/40 bg-white backdrop-blur-xl dark:border-white/5 border-slate-200 border rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 group transition-all shadow-sm dark:shadow-none"
                                >
                                    <div className="flex justify-between items-start mb-1 sm:mb-4">
                                        <div className="flex-1 pr-2 sm:pr-4">
                                            <h3 className="text-sm sm:text-lg font-black dark:text-white text-slate-900 leading-tight mb-0.5">{item.subject || 'No Subject'}</h3>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 sm:gap-2">
                                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(item.status)}`}>
                                                {item.status}
                                            </span>
                                            {item.status === 'PENDING' && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => navigate(`/scheduler/edit/${item.id}`)}
                                                        className="p-1 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-blue-400 transition-all cursor-pointer"
                                                        title="Edit Schedule"
                                                    >
                                                        <MdEdit size={16} className="sm:w-5 sm:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="p-1 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                                                        title="Delete Schedule"
                                                    >
                                                        <MdDelete size={16} className="sm:w-5 sm:h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {item.status === 'FAILED' && (
                                        <div className="mt-2 sm:mt-4 p-2 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl flex flex-col gap-1 sm:gap-3">
                                            <div className="flex items-start gap-2 sm:gap-3">
                                                <MdError className="text-red-500 shrink-0 mt-0.5" size={14} />
                                                <div>
                                                    <p className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5 sm:mb-1">Failure Reason</p>
                                                    <p className="text-[10px] sm:text-sm font-medium text-red-800 dark:text-red-200/80 leading-relaxed">
                                                        {item.error_info || item.error || item.message || item.failure_reason || item.detail || 'Message delivery failed. Please check recipient details or try again.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 sm:gap-6 mt-2 sm:mt-6 pt-2 sm:pt-6 border-t dark:border-white/5 border-slate-100">
                                        <div className="space-y-1 sm:space-y-4">
                                            <InfoItem label="SEND TO" value={item.send_to} icon={<MdAccountCircle size={10} className="sm:w-3.5 sm:h-3.5" />} />
                                            <InfoItem
                                                label="VIA"
                                                value={item.send_via}
                                                icon={item.send_via === 'EMAIL' ? <MdEmail size={10} className="text-blue-400 sm:w-3.5 sm:h-3.5" /> : <MdWhatsapp size={10} className="text-emerald-400 sm:w-3.5 sm:h-3.5" />}
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end items-end text-right">
                                            <p className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 sm:mb-1 font-outfit">Scheduled For</p>
                                            <p className="text-[10px] sm:text-sm font-bold dark:text-slate-200 text-slate-900">{formatDateTime(item.send_at)}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 dark:bg-slate-900/50 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📡</div>
                                <h3 className="dark:text-white text-slate-900 font-black text-lg">No schedulers found</h3>
                                <p className="text-slate-500 font-semibold text-sm mt-1">Ready to automate your messages?</p>
                                <button
                                    onClick={() => navigate('/scheduler/add')}
                                    className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 cursor-pointer"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </AnimatePresence>
                </div >

                <ConfirmModal
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={confirmDelete}
                    title="Delete Schedule?"
                    message={`Are you sure you want to delete "${scheduleToDelete?.subject || 'this schedule'}"? This action cannot be undone.`}
                    confirmText="Delete Schedule"
                />

                {/* Floating Add Button */}
                <div className="fixed bottom-24 right-6 z-[100]">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/scheduler/add')}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 cursor-pointer"
                    >
                        <MdAdd size={36} />
                    </motion.button>
                </div>
            </div >
        </div >
    );
};

const StatCard = ({ label, count, icon, color, bg }) => (
    <div className="dark:bg-slate-900/40 bg-white backdrop-blur-xl dark:border-white/5 border-slate-200 border p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-4 transition-all hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm dark:shadow-none">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${bg} ${color} flex items-center justify-center text-lg sm:text-xl shrink-0`}>
            {icon}
        </div>
        <div className="flex flex-col sm:block">
            <p className="text-lg sm:text-2xl font-black dark:text-white text-slate-900 leading-none">{count}</p>
            <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 sm:mt-2">{label}</p>
        </div>
    </div>
);

const InfoItem = ({ label, value, icon }) => (
    <div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2 dark:text-slate-200 text-slate-700">
            <span className="text-slate-500">{icon}</span>
            <span className="text-xs font-black truncate max-w-[120px]">{value}</span>
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="dark:bg-slate-900/20 bg-slate-100 border dark:border-white/5 border-slate-200 rounded-[2rem] h-48 animate-pulse" />
);

export default Scheduler;
