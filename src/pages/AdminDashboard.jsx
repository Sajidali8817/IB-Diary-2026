import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAccountCircle, MdChevronRight } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';

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
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 pb-24 transition-colors duration-300">
            {/* Header */}
            <div className="dark:bg-slate-900/50 bg-white/50 backdrop-blur-xl sticky top-0 z-30 dark:border-white/5 border-slate-200 border-b">
                <header className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-black dark:text-white text-slate-900 font-outfit leading-none tracking-tight">Control Center</h1>
                        <p className="text-blue-500 font-bold text-[10px] mt-2 uppercase tracking-widest leading-none">Management & Intelligence</p>
                    </div>
                    <ThemeToggle />
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
                            className="w-full dark:bg-slate-900/40 bg-white backdrop-blur-xl dark:border-white/5 border-slate-200 border rounded-3xl p-6 flex items-center gap-5 group dark:hover:bg-slate-900/60 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-xl shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                                {item.icon}
                            </div>

                            <div className="flex-1 text-left">
                                <h3 className="text-lg font-black dark:text-white text-slate-900 leading-tight">{item.title}</h3>
                                <p className="text-slate-500 text-sm font-semibold mt-1">{item.subtitle}</p>
                            </div>

                            <MdChevronRight size={24} className="dark:text-slate-700 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </motion.button>
                    ))}
                </div>

                {/* Stats Overview (Optional extra for PWA) */}
                <div className="mt-12 p-8 rounded-[2.5rem] dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-blue-900/20 bg-gradient-to-br from-white via-white to-blue-50 dark:border-white/5 border-slate-200 border relative overflow-hidden transition-all duration-300">
                    <div className="relative z-10">
                        <h4 className="dark:text-white text-slate-900 font-black text-lg transition-colors">Quick Tip</h4>
                        <p className="dark:text-slate-400 text-slate-600 text-sm font-medium mt-2 leading-relaxed transition-colors">
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
