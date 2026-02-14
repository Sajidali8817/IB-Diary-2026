import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdHome, MdAssignment, MdAdd, MdNote, MdPerson, MdSchedule, MdMap, MdSettings } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

const BottomNav = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const userTabs = [
        { id: 'home', icon: <MdHome size={24} />, label: 'Home', path: '/dashboard' },
        { id: 'tasks', icon: <MdAssignment size={24} />, label: 'Tasks', path: '/tasks' },
        { id: 'add', icon: <MdAdd size={32} />, label: 'Add', isCenter: true },
        { id: 'notes', icon: <MdNote size={24} />, label: 'Notes', path: '/notes' },
        { id: 'profile', icon: <MdPerson size={24} />, label: 'Profile', path: '/profile' }
    ];

    const adminTabs = [
        { id: 'home', icon: <MdHome size={24} />, label: 'Home', path: '/dashboard' },
        { id: 'tasks', icon: <MdAssignment size={24} />, label: 'Tasks', path: '/tasks' },
        { id: 'scheduler', icon: <MdSchedule size={24} />, label: 'Sched', path: '/scheduler' },
        { id: 'admin', icon: <MdSettings size={24} />, label: 'Admin', path: '/admin' },
        { id: 'notes', icon: <MdNote size={24} />, label: 'Notes', path: '/notes' },
        { id: 'profile', icon: <MdPerson size={24} />, label: 'Profile', path: '/profile' }
    ];

    const currentTabs = (userRole === 'ADMIN' || userRole === 'EA') ? adminTabs : userTabs;

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            {/* Glassmorphic Background */}
            <div className="absolute inset-0 dark:bg-slate-900/90 bg-white/90 backdrop-blur-xl dark:border-white/10 border-slate-200 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-colors duration-300"></div>

            <div className="relative flex items-center justify-around h-20 px-2 max-w-lg mx-auto">
                {currentTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (tab.isCenter) {
                                // Trigger global add event or use a prop if available
                                window.dispatchEvent(new CustomEvent('open-add-menu'));
                            } else {
                                navigate(tab.path);
                            }
                        }}
                        className={`relative flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${tab.isCenter ? '-mt-10' : ''
                            }`}
                    >
                        {tab.isCenter ? (
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40 dark:border-slate-900 border-white border-4"
                            >
                                {tab.icon}
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <motion.div
                                    animate={{
                                        scale: isActive(tab.path) ? 1.1 : 1
                                    }}
                                    className={`p-1 transition-colors duration-300 ${isActive(tab.path) ? 'text-blue-500' : 'dark:text-slate-400 text-slate-400'}`}
                                >
                                    {tab.icon}
                                </motion.div>
                                <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors duration-300 ${isActive(tab.path) ? 'text-blue-500' : 'dark:text-slate-500 text-slate-500'
                                    }`}>
                                    {tab.label}
                                </span>
                                {isActive(tab.path) && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -top-1 w-1 h-1 bg-blue-500 rounded-full"
                                    />
                                )}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Safe Area Inset for iOS */}
            <div className="h-safe-bottom dark:bg-slate-900/90 bg-white/90 backdrop-blur-xl transition-colors duration-300"></div>
        </nav>
    );
};

export default BottomNav;
