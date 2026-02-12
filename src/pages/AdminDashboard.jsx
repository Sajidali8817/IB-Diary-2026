import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAccountCircle, MdChevronRight } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { useEffect } from 'react';

const AdminDashboard = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole && userRole !== 'ADMIN') {
            navigate('/dashboard');
        }
    }, [userRole]);

    const menuItems = [
        {
            title: 'HOD Management',
            subtitle: 'Add, Edit or Remove HODs',
            icon: <MdAccountCircle size={28} />,
            gradient: 'from-indigo-500 to-blue-600',
            path: '/admin/hods',
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5">
                <header className="p-6">
                    <h1 className="text-3xl font-black text-white font-outfit tracking-tight">Control Center</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Master Data Management</p>
                </header>
            </div>

            <div className="p-6">

                {/* Menu Cards */}
                <div className="space-y-4 max-w-2xl">
                    {menuItems.map((item, index) => (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(item.path)}
                            className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center gap-5 group hover:bg-slate-900/60 active:scale-[0.98] transition-all"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-xl shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                                {item.icon}
                            </div>

                            <div className="flex-1 text-left">
                                <h3 className="text-lg font-black text-white leading-tight">{item.title}</h3>
                                <p className="text-slate-500 text-sm font-semibold mt-1">{item.subtitle}</p>
                            </div>

                            <MdChevronRight size={24} className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </motion.button>
                    ))}
                </div>

                {/* Stats Overview (Optional extra for PWA) */}
                <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900/20 border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-white font-black text-lg">Quick Tip</h4>
                        <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">
                            Master data changes reflect immediately across the Scheduler and Task modules.
                            Ensure HOD contact details are accurate for successful automated messaging.
                        </p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
