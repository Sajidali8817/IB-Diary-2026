import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowBack, MdAdd, MdSearch, MdClose,
    MdEdit, MdDelete, MdAccountCircle, MdEmail, MdPhone, MdBusiness
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const HODManagement = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole && userRole !== 'ADMIN') {
            navigate('/dashboard');
        }
    }, [userRole]);
    const [hods, setHods] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingHOD, setEditingHOD] = useState(null);
    const [formData, setFormData] = useState({
        hod_id: '',
        name: '',
        email: '',
        mobile: '',
        department: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    useEffect(() => {
        fetchHods();
    }, []);

    const fetchHods = async () => {
        setLoading(true);
        try {
            const data = await apiService.getHods();
            setHods(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load HODs');
            setHods([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingHOD) {
                await apiService.updateHod(editingHOD.id, formData);
                toast.success('HOD updated');
            } else {
                await apiService.createHod(formData);
                toast.success('HOD created');
            }
            fetchHods();
            closeModal();
        } catch (error) {
            toast.error(error.message || 'Save failed');
        }
    };

    const handleDelete = (id) => {
        setIdToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await apiService.deleteHod(idToDelete);
            toast.success('HOD deleted');
            fetchHods();
        } catch (error) {
            toast.error(error.message || 'Delete failed');
        } finally {
            setShowDeleteConfirm(false);
            setIdToDelete(null);
        }
    };

    const openModal = (hod = null) => {
        if (hod) {
            setEditingHOD(hod);
            setFormData({
                hod_id: hod.hod_id || '',
                name: hod.name || '',
                email: hod.email || '',
                mobile: hod.mobile || '',
                department: hod.department || hod.dept || ''
            });
        } else {
            setEditingHOD(null);
            setFormData({ hod_id: '', name: '', email: '', mobile: '', department: '' });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingHOD(null);
    };

    const filteredHods = Array.isArray(hods) ? hods.filter(h =>
        h.name?.toLowerCase().includes(search.toLowerCase()) ||
        (h.department || h.dept)?.toLowerCase().includes(search.toLowerCase())
    ) : [];

    return (
        <div className="min-h-screen bg-slate-950 p-6 pb-24">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin')}
                    className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white"
                >
                    <MdArrowBack size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-white font-outfit">HOD Management</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{hods.length} Heads of Department</p>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative mb-8">
                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-700"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {loading ? (
                        [...Array(6)].map((_, i) => <div key={i} className="h-32 bg-slate-900/40 rounded-3xl animate-pulse" />)
                    ) : (
                        filteredHods.map((hod, index) => (
                            <motion.div
                                key={hod.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 group hover:bg-slate-900/60 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-black">
                                        {hod.name?.[0] || 'H'}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openModal(hod)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-blue-400 transition-all">
                                            <MdEdit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(hod.id)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-all">
                                            <MdDelete size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-white font-black text-lg mb-1">{hod.name}</h3>
                                <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{(hod.department || hod.dept || 'Engineering')}</p>

                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <MdEmail size={14} />
                                        <span className="text-xs font-semibold truncate">{hod.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <MdPhone size={14} />
                                        <span className="text-xs font-semibold">{hod.mobile}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalVisible && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-3xl overflow-y-auto max-h-[90vh] no-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter">
                                    {editingHOD ? 'Edit User' : 'Add New User'}
                                </h2>
                                <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><MdClose size={28} /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <InputField label="HOD ID" placeholder="EMP001" value={formData.hod_id} onChange={t => setFormData({ ...formData, hod_id: t })} required />
                                <InputField label="Full Name" placeholder="Rahul Sharma" value={formData.name} onChange={t => setFormData({ ...formData, name: t })} required />
                                <InputField label="Department" placeholder="Sales & Marketing" value={formData.department} onChange={t => setFormData({ ...formData, department: t })} required />
                                <InputField label="Email" placeholder="rahul@company.com" value={formData.email} onChange={t => setFormData({ ...formData, email: t })} type="email" required />
                                <InputField label="Mobile" placeholder="+91 99999 99999" value={formData.mobile} onChange={t => setFormData({ ...formData, mobile: t })} type="tel" required />

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
                                    >
                                        {editingHOD ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Remove HOD?"
                message="Are you sure you want to remove this HOD? This action cannot be undone."
                confirmText="Remove HOD"
            />

            {/* Floating Add Button */}
            {!isModalVisible && (
                <div className="fixed bottom-24 right-6 z-[100]">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal()}
                        className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 cursor-pointer"
                    >
                        <MdAdd size={36} />
                    </motion.button>
                </div>
            )}
        </div>
    );
};

const InputField = ({ label, placeholder, value, onChange, type = "text", required = false }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{label} {required && '*'}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
        />
    </div>
);

export default HODManagement;
