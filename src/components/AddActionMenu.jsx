import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdAssignment, MdNote, MdAdd, MdSchedule } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';


const AddActionMenu = ({ visible, onClose, onAddTask, onAddNote, onAddSchedule }) => {
    const { userRole } = useAppContext();

    return (
        <AnimatePresence>
            {visible && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Menu Content */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: '100%', opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-sm bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-white/10"
                    >
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-black text-white font-outfit uppercase tracking-widest">Create New</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-700/50 rounded-full text-slate-400 hover:text-white transition-all"
                                >
                                    <MdClose size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        onAddTask();
                                        onClose();
                                    }}
                                    className="flex flex-col items-center gap-3 p-6 bg-blue-600/10 border-2 border-blue-500/30 rounded-3xl hover:bg-blue-600/20 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform">
                                        <MdAssignment size={28} />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase tracking-widest">New Task</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onAddNote();
                                        onClose();
                                    }}
                                    className="flex flex-col items-center gap-3 p-6 bg-indigo-600/10 border-2 border-indigo-500/30 rounded-3xl hover:bg-indigo-600/20 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 group-hover:scale-110 transition-transform">
                                        <MdNote size={28} />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase tracking-widest">New Note</span>
                                </button>

                                {(userRole === 'ADMIN' || userRole === 'EA') && (
                                    <button
                                        onClick={() => {
                                            onAddSchedule();
                                            onClose();
                                        }}
                                        className="flex flex-col items-center gap-3 p-6 bg-emerald-600/10 border-2 border-emerald-500/30 rounded-3xl hover:bg-emerald-600/20 transition-all group col-span-2"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                                            <MdSchedule size={28} />
                                        </div>
                                        <span className="text-sm font-black text-white uppercase tracking-widest">New Schedule</span>
                                    </button>
                                )}
                            </div>

                            <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
                                Select an option to continue
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddActionMenu;
