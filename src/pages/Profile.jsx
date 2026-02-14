import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
    MdEdit, MdDevices, MdLock, MdEmail, MdNotifications,
    MdChevronRight, MdCamera, MdLocalFireDepartment, MdCheckCircle, MdBarChart,
    MdLogout, MdDarkMode, MdLightMode
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import ThemeToggle from '../components/ThemeToggle';
import { MdArrowBack } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';

const Profile = () => {
    const navigate = useNavigate();
    const { userProfile, userRole, tasks, streak, updateProfile, logout } = useAppContext();
    const { theme, toggleTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        mobile: '',
        address: '',
        company: '',
        designation: ''
    });

    // Calculate Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const performLogoutAction = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully', { icon: '👋' });
    };

    const handleEditProfile = () => {
        setEditForm({
            name: userProfile?.name || '',
            mobile: userProfile?.mobile || '',
            address: userProfile?.address || '',
            company: userProfile?.company || '',
            designation: userProfile?.designation || ''
        });
        setEditModalVisible(true);
    };

    const handleSaveProfile = () => {
        updateProfile(editForm);
        setEditModalVisible(false);
        toast.success('Profile updated successfully!');
    };

    const SettingItem = ({ icon: Icon, label, color, onClick, type = 'arrow', value, onToggle }) => {
        const Component = type === 'toggle' ? 'div' : 'button';

        return (
            <Component
                onClick={type === 'arrow' ? onClick : undefined}
                className={`flex items-center justify-between p-4 ${type === 'arrow' ? 'dark:hover:bg-white/5 hover:bg-slate-50 cursor-pointer' : ''} transition-all`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        <Icon size={22} style={{ color }} />
                    </div>
                    <span className="dark:text-white text-slate-900 font-medium">{label}</span>
                </div>
                {type === 'toggle' ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(!value);
                        }}
                        className={`w-12 h-6 rounded-full transition-all ${value ? 'bg-blue-500' : 'bg-slate-600'
                            }`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                ) : (
                    <MdChevronRight size={20} className="text-slate-500" />
                )}
            </Component>
        );
    };

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 pb-24 selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-300">
            <div className="min-h-screen">
                {/* Header Actions */}
                <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                    >
                        <MdArrowBack size={24} />
                    </button>
                    <ThemeToggle className="!bg-white/20 !backdrop-blur-md !border-white/30 !text-white hover:!bg-white/30 shadow-none" />
                </div>

                {/* Premium Header with Gradient */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-b-[2.5rem] pb-20 pt-16 px-6 relative shadow-2xl">
                    <div className="flex flex-col items-center text-center">
                        {/* Profile Image */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative mb-4 cursor-pointer group"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/25 border-2 border-white/40 flex items-center justify-center shadow-2xl">
                                <span className="text-white text-3xl font-black font-outfit">
                                    {userProfile?.name?.[0] || 'U'}
                                </span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-7 h-7 bg-slate-800 rounded-full border-2 border-white flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                <MdCamera size={16} className="text-white" />
                            </div>
                        </motion.div>

                        <h2 className="text-white text-2xl font-black font-outfit leading-none mb-1">{userProfile?.name || 'User'}</h2>
                        <p className="text-blue-100/70 text-xs font-bold uppercase tracking-widest">{userProfile?.designation || 'IB Employee'}</p>
                    </div>
                </div>

                {/* Stats Cards - Overlapping Header */}
                <div className="px-4 -mt-10 relative z-10">
                    <div className="grid grid-cols-3 gap-3">
                        <motion.div
                            whileHover={{ y: -5 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="dark:bg-slate-900 bg-white rounded-2xl p-4 text-center shadow-xl cursor-pointer transition-all dark:border-white/5 border-slate-100 border"
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2">
                                <MdLocalFireDepartment size={20} className="text-amber-500" />
                            </div>
                            <p className="text-xl font-black dark:text-white text-slate-800 leading-none mb-1">{streak}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Day Streak</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="dark:bg-slate-900 bg-white rounded-2xl p-4 text-center shadow-xl cursor-pointer transition-all dark:border-white/5 border-slate-100 border"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2">
                                <MdCheckCircle size={20} className="text-blue-500" />
                            </div>
                            <p className="text-xl font-black dark:text-white text-slate-800 leading-none mb-1">{totalTasks}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Tasks</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="dark:bg-slate-900 bg-white rounded-2xl p-4 text-center shadow-xl cursor-pointer transition-all dark:border-white/5 border-slate-100 border"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                                <MdBarChart size={20} className="text-emerald-500" />
                            </div>
                            <p className="text-xl font-black dark:text-white text-slate-800 leading-none mb-1">{completionRate}%</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Completion</p>
                        </motion.div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="px-4 mt-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Account Management</h3>
                    <div className="dark:bg-slate-900/50 bg-white backdrop-blur-xl dark:border-white/5 border-slate-200 border rounded-[2rem] overflow-hidden shadow-2xl">
                        <SettingItem
                            icon={MdEdit}
                            label="Edit Profile Information"
                            color="#3B82F6"
                            onClick={handleEditProfile}
                        />
                        <div className="h-px dark:bg-white/5 bg-slate-100 mx-4" />
                        <SettingItem
                            icon={MdDevices}
                            label="Active Login Sessions"
                            color="#8B5CF6"
                            onClick={() => toast('Feature coming soon!')}
                        />
                        <div className="h-px dark:bg-white/5 bg-slate-100 mx-4" />
                        <SettingItem
                            icon={MdLock}
                            label="Security & Password"
                            color="#F59E0B"
                            onClick={() => toast('Feature coming soon!')}
                        />
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="px-4 mt-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">System Preferences</h3>
                    <div className="dark:bg-slate-900/50 bg-white backdrop-blur-xl dark:border-white/5 border-slate-200 border rounded-[2rem] overflow-hidden shadow-2xl">
                        <SettingItem
                            icon={MdNotifications}
                            label="Push Notifications"
                            color="#3B82F6"
                            type="toggle"
                            value={notificationsEnabled}
                            onToggle={setNotificationsEnabled}
                        />

                    </div>
                </div>

                {/* Logout Button */}
                <div className="px-4 mt-10 pb-10">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowLogoutConfirm(true);
                        }}
                        className="w-full h-16 dark:bg-red-500/10 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white shadow-xl shadow-red-500/10 hover:shadow-red-500/30 transition-all dark:border-red-500/20 border-red-100 border cursor-pointer group"
                    >
                        <MdLogout size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Log Out From Profile
                    </button>
                    <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-8">
                        IB Diary Premium v1.0.4
                    </p>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {editModalVisible && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 border rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl shadow-black/50"
                        >
                            <h2 className="text-2xl font-black dark:text-white text-slate-900 font-outfit mb-6">Edit Profile</h2>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full dark:bg-slate-950 bg-slate-50 dark:text-white text-slate-900 rounded-2xl p-4 dark:border-white/5 border-slate-200 border focus:border-blue-500 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <input
                                        type="text"
                                        value={editForm.mobile}
                                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                                        className="w-full dark:bg-slate-950 bg-slate-50 dark:text-white text-slate-900 rounded-2xl p-4 dark:border-white/5 border-slate-200 border focus:border-blue-500 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Designation</label>
                                    <input
                                        type="text"
                                        value={editForm.designation}
                                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                                        className="w-full dark:bg-slate-950 bg-slate-50 dark:text-white text-slate-900 rounded-2xl p-4 dark:border-white/5 border-slate-200 border focus:border-blue-500 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setEditModalVisible(false)}
                                    className="flex-1 py-4 dark:bg-slate-700 bg-slate-200 dark:text-white text-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs dark:hover:bg-slate-600 hover:bg-slate-300 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={performLogoutAction}
                    title="Logout?"
                    message="Are you sure you want to logout from your account? You will need to sign in again to access your diary."
                    confirmText="Yes, Logout"
                />
            </AnimatePresence>
        </div >
    );
};

export default Profile;
