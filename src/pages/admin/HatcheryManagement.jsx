import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowBack, MdAdd, MdSearch, MdClose,
    MdEdit, MdDelete, MdEgg, MdFactory, MdLocationOn
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const HatcheryManagement = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole && userRole !== 'ADMIN') {
            navigate('/dashboard');
        }
    }, [userRole]);
    const [hatcheries, setHatcheries] = useState([]);
    const [plants, setPlants] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingHatchery, setEditingHatchery] = useState(null);
    const [formData, setFormData] = useState({
        hatchery_code: '',
        hatchery_name: '',
        plant_id: null
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [hListData, pListData] = await Promise.all([
                apiService.getHatcheries(),
                apiService.getPlants()
            ]);
            setHatcheries(Array.isArray(hListData) ? hListData : []);
            setPlants(Array.isArray(pListData) ? pListData : []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load management data');
            setHatcheries([]);
            setPlants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.plant_id) {
            toast.error('Please select a plant');
            return;
        }

        try {
            if (editingHatchery) {
                await apiService.updateHatchery(editingHatchery.id, formData);
                toast.success('Hatchery updated');
            } else {
                await apiService.createHatchery(formData);
                toast.success('Hatchery created');
            }
            fetchInitialData();
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
            await apiService.deleteHatchery(idToDelete);
            toast.success('Hatchery removed');
            fetchInitialData();
        } catch (error) {
            toast.error(error.message || 'Delete failed');
        } finally {
            setShowDeleteConfirm(false);
            setIdToDelete(null);
        }
    };

    const openModal = (hatchery = null) => {
        if (hatchery) {
            setEditingHatchery(hatchery);
            setFormData({
                hatchery_code: hatchery.hatchery_code || '',
                hatchery_name: hatchery.hatchery_name || '',
                plant_id: hatchery.plant_id || null
            });
        } else {
            setEditingHatchery(null);
            setFormData({ hatchery_code: '', hatchery_name: '', plant_id: null });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingHatchery(null);
    };

    const filteredHatcheries = Array.isArray(hatcheries) ? hatcheries.filter(h =>
        h.hatchery_name?.toLowerCase().includes(search.toLowerCase()) ||
        h.hatchery_code?.toLowerCase().includes(search.toLowerCase())
    ) : [];

    const getPlantName = (plantId) => {
        if (!Array.isArray(plants)) return 'No Plant Linked';
        const plant = plants.find(p => p.id === plantId);
        return plant ? plant.plant_name : 'No Plant Linked';
    };

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
                    <h1 className="text-2xl font-black text-white font-outfit">Hatchery Management</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{hatcheries.length} Hatcheries Active</p>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative mb-8">
                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Search hatcheries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-amber-500 transition-all font-bold placeholder:text-slate-700"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {loading ? (
                        [...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-900/40 rounded-3xl animate-pulse" />)
                    ) : Array.isArray(filteredHatcheries) && filteredHatcheries.map((hatchery, index) => (
                        <motion.div
                            key={hatchery.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 group hover:bg-slate-900/60 transition-all border-l-4 border-l-amber-500/50"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl">
                                    <MdEgg size={24} />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openModal(hatchery)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-blue-400 transition-all">
                                        <MdEdit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(hatchery.id)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-all">
                                        <MdDelete size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-white font-black text-lg mb-1 leading-tight">{hatchery.hatchery_name}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                    {hatchery.hatchery_code}
                                </span>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <MdFactory size={14} className="text-slate-700" />
                                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{getPlantName(hatchery.plant_id)}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
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
                                    {editingHatchery ? 'Edit Hatchery' : 'Add New Hatchery'}
                                </h2>
                                <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><MdClose size={28} /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <InputField label="Hatchery Code" placeholder="e.g. HTY001" value={formData.hatchery_code} onChange={t => setFormData({ ...formData, hatchery_code: t })} required />
                                <InputField label="Hatchery Name" placeholder="e.g. South Wing Hatchery" value={formData.hatchery_name} onChange={t => setFormData({ ...formData, hatchery_name: t })} required />

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Link To Plant *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Array.isArray(plants) && plants.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, plant_id: p.id })}
                                                className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all text-center ${formData.plant_id === p.id
                                                    ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20'
                                                    : 'bg-slate-950 border-white/5 text-slate-500 hover:bg-slate-900'
                                                    }`}
                                            >
                                                {p.plant_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                                        className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-700 active:scale-95 transition-all"
                                    >
                                        {editingHatchery ? 'Update' : 'Create'}
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
                title="Remove Hatchery?"
                message="Are you sure you want to remove this hatchery? This action cannot be undone."
                confirmText="Remove Hatchery"
            />

            {/* Floating Add Button */}
            {!isModalVisible && (
                <div className="fixed bottom-24 right-6 z-[100]">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal()}
                        className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center text-white shadow-2xl shadow-amber-500/40 cursor-pointer"
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
            className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-all placeholder:text-slate-800"
        />
    </div>
);

export default HatcheryManagement;
