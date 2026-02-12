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
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5">
                <header className="flex justify-between items-center p-6">
                    <div>
                        <h1 className="text-3xl font-black text-white font-outfit tracking-tight">Scheduler</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Automated Messaging</p>
                    </div>
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
                                : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300'
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
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 group transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 pr-4">
                                            <h3 className="text-lg font-black text-white leading-tight mb-1">{item.subject || 'No Subject'}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {item.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/scheduler/edit/${item.id}`)}
                                                        className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-blue-400 transition-all cursor-pointer"
                                                        title="Edit Schedule"
                                                    >
                                                        <MdEdit size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                                                        title="Delete Schedule"
                                                    >
                                                        <MdDelete size={20} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {item.status === 'FAILED' && (
                                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-3">
                                            <div className="flex items-start gap-3">
                                                <MdError className="text-red-500 shrink-0 mt-0.5" size={18} />
                                                <div>
                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Failure Reason</p>
                                                    <p className="text-sm font-medium text-red-200/80 leading-relaxed">
                                                        {item.error_info || item.error || item.message || item.failure_reason || item.detail || 'Message delivery failed. Please check recipient details or try again.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                    <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/5">
                                        <div className="space-y-4">
                                            <InfoItem label="SEND TO" value={item.send_to} icon={<MdAccountCircle size={14} />} />
                                            <InfoItem
                                                label="VIA"
                                                value={item.send_via}
                                                icon={item.send_via === 'EMAIL' ? <MdEmail size={14} className="text-blue-400" /> : <MdWhatsapp size={14} className="text-emerald-400" />}
                                            />
                                        </div>
                                        <div className="flex flex-col justify-end items-end text-right">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 font-outfit">Scheduled For</p>
                                            <p className="text-sm font-bold text-slate-200">{formatDateTime(item.send_at)}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📡</div>
                                <h3 className="text-white font-black text-lg">No schedulers found</h3>
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
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-[2rem] flex flex-col gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center text-xl`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-black text-white leading-none">{count}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{label}</p>
        </div>
    </div>
);

const InfoItem = ({ label, value, icon }) => (
    <div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2 text-slate-200">
            <span className="text-slate-500">{icon}</span>
            <span className="text-xs font-black truncate max-w-[120px]">{value}</span>
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="bg-slate-900/20 border border-white/5 rounded-[2rem] h-48 animate-pulse" />
);

export default Scheduler;
