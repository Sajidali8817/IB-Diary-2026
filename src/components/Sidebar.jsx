import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdHome, MdAssignment, MdNote, MdPerson, MdAdd, MdSchedule, MdSettings } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

const Sidebar = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'home', icon: <MdHome size={24} />, label: 'Home', path: '/dashboard' },
        { id: 'tasks', icon: <MdAssignment size={24} />, label: 'Tasks', path: '/tasks' },
        { id: 'notes', icon: <MdNote size={24} />, label: 'Notes', path: '/notes' },
        { id: 'scheduler', icon: <MdSchedule size={24} />, label: 'Scheduler', path: '/scheduler', roles: ['ADMIN', 'EA'] },
        { id: 'admin', icon: <MdSettings size={24} />, label: 'Admin', path: '/admin', roles: ['ADMIN'] },
        { id: 'profile', icon: <MdPerson size={24} />, label: 'Profile', path: '/profile' }
    ];

    const filteredItems = menuItems.filter(item =>
        !item.roles || item.roles.includes(userRole)
    );

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="hidden sm:flex flex-col w-64 lg:w-72 h-screen fixed left-0 top-0 bg-slate-900/50 backdrop-blur-2xl border-r border-white/5 z-40">
            {/* Logo Section */}
            <div className="p-8 mb-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/10 overflow-hidden">
                        <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white font-outfit leading-none tracking-tight">IB Diary</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Smart Planner</p>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {filteredItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative cursor-pointer ${isActive(item.path)
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`}
                    >
                        <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive(item.path) ? 'text-white' : 'text-blue-500/70 group-hover:text-blue-400'}`}>
                            {item.icon}
                        </span>
                        <span className="font-bold text-sm uppercase tracking-widest leading-none">
                            {item.label}
                        </span>
                        {isActive(item.path) && (
                            <motion.div
                                layoutId="sidebarActive"
                                className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
                            />
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom Section with Add Button */}
            <div className="p-6">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-add-menu'))}
                    className="w-full h-16 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center gap-3 text-white shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all group cursor-pointer"
                >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                        <MdAdd size={24} />
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs">Quick Add</span>
                </button>

                <div className="mt-8 flex items-center gap-4 px-4 py-3 bg-slate-800/40 rounded-2xl border border-white/5 cursor-default">
                    <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Version</p>
                        <p className="text-xs font-black text-white">1.0.4 Premium</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
