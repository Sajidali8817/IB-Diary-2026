import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDelete, MdInfo, MdWarning } from 'react-icons/md';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    type = "danger" // danger, info, warning
}) => {
    const getIcon = () => {
        switch (type) {
            case 'danger': return <MdDelete size={40} />;
            case 'warning': return <MdWarning size={40} />;
            case 'info': return <MdInfo size={40} />;
            default: return <MdDelete size={40} />;
        }
    };

    const getColorClass = () => {
        switch (type) {
            case 'danger': return 'bg-red-500/10 text-red-500';
            case 'warning': return 'bg-amber-500/10 text-amber-500';
            case 'info': return 'bg-blue-500/10 text-blue-500';
            default: return 'bg-red-500/10 text-red-500';
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'danger': return 'bg-red-500 shadow-red-500/20';
            case 'warning': return 'bg-amber-500 shadow-amber-500/20';
            case 'info': return 'bg-blue-500 shadow-blue-500/20';
            default: return 'bg-red-500 shadow-red-500/20';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 border rounded-[2.5rem] w-full max-w-sm p-8 shadow-3xl text-center"
                    >
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${getColorClass()}`}>
                            {getIcon()}
                        </div>
                        <h2 className="text-2xl font-black dark:text-white text-slate-900 font-outfit mb-2">{title}</h2>
                        <p className="text-slate-500 font-bold text-sm mb-8">{message}</p>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 dark:bg-slate-800 bg-slate-100 dark:text-white text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg ${getButtonClass()}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
