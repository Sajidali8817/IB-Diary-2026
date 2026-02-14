import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowBack, MdAdd, MdSearch, MdClose,
    MdEdit, MdDelete, MdFactory, MdNumbers, MdBadge
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import ThemeToggle from '../../components/ThemeToggle';

const PlantManagement = () => {
    const { userRole } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole && userRole !== 'ADMIN') {
            navigate('/dashboard');
        }
    }, [userRole]);
    const [plants, setPlants] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingPlant, setEditingPlant] = useState(null);
    const [formData, setFormData] = useState({
        plant_code: '',
        plant_name: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    useEffect(() => {
        fetchPlants();
    }, []);

    const fetchPlants = async () => {
        setLoading(true);
        try {
            const data = await apiService.getPlants();
            setPlants(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load plants');
            setPlants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingPlant) {
                await apiService.updatePlant(editingPlant.id, formData);
                toast.success('Plant updated');
            } else {
                await apiService.createPlant(formData);
                toast.success('Plant created');
            }
            fetchPlants();
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
            await apiService.deletePlant(idToDelete);
            toast.success('Plant removed');
            fetchPlants();
        } catch (error) {
            toast.error(error.message || 'Delete failed');
        } finally {
            setShowDeleteConfirm(false);
            setIdToDelete(null);
        }
    };

    const openModal = (plant = null) => {
        if (plant) {
            setEditingPlant(plant);
            setFormData({
                plant_code: plant.plant_code || '',
                plant_name: plant.plant_name || ''
            });
        } else {
            setEditingPlant(null);
            setFormData({ plant_code: '', plant_name: '' });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingPlant(null);
    };

    const filteredPlants = Array.isArray(plants) ? plants.filter(p =>
        p.plant_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.plant_code?.toLowerCase().includes(search.toLowerCase())
    ) : [];

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 p-6 pb-24 transition-colors duration-300">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin')}
                    className="w-12 h-12 rounded-2xl dark:bg-slate-900 bg-white flex items-center justify-center dark:text-white text-slate-900 shadow-sm border dark:border-transparent border-slate-200"
                >
                    <MdArrowBack size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black dark:text-white text-slate-900 font-outfit">Plant Management</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{plants.length} Plants Registered</p>
                </div>
                <ThemeToggle />
            </header>

            {/* Search Bar */}
            <div className="relative mb-8">
                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-slate-500 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by code or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full dark:bg-slate-900 bg-white dark:border-white/5 border-slate-200 border rounded-2xl py-4 pl-12 pr-4 dark:text-white text-slate-900 outline-none focus:border-emerald-500 transition-all font-bold dark:placeholder:text-slate-700 placeholder:text-slate-400 shadow-sm"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {loading ? (
                        [...Array(6)].map((_, i) => <div key={i} className="h-28 dark:bg-slate-900/40 bg-slate-100 rounded-3xl animate-pulse" />)
                    ) : (
                        filteredPlants.map((plant, index) => (
                            <motion.div
                                key={plant.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="dark:bg-slate-900/40 bg-white backdrop-blur-xl dark:border-white/5 border-slate-200 border rounded-3xl p-6 group dark:hover:bg-slate-900/60 hover:bg-slate-50 transition-all border-l-4 border-l-emerald-500/50 shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl dark:bg-emerald-500/10 bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl">
                                            <MdFactory size={24} />
                                        </div>
                                        <div>
                                            <h3 className="dark:text-white text-slate-900 font-black text-lg leading-tight">{plant.plant_name}</h3>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                                {plant.plant_code}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openModal(plant)} className="p-2 dark:hover:bg-white/5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500 transition-all">
                                            <MdEdit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(plant.id)} className="p-2 dark:hover:bg-white/5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-all">
                                            <MdDelete size={18} />
                                        </button>
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
                            className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 border rounded-[2.5rem] w-full max-w-md p-8 shadow-3xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black dark:text-white text-slate-900 font-outfit uppercase tracking-tighter">
                                    {editingPlant ? 'Edit Plant' : 'Add New Plant'}
                                </h2>
                                <button onClick={closeModal} className="p-2 dark:hover:bg-white/5 hover:bg-slate-100 rounded-full text-slate-400"><MdClose size={28} /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <InputField label="Plant Code" placeholder="e.g. PLT001" value={formData.plant_code} onChange={t => setFormData({ ...formData, plant_code: t })} required />
                                <InputField label="Plant Name" placeholder="e.g. Main Processing unit" value={formData.plant_name} onChange={t => setFormData({ ...formData, plant_name: t })} required />

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-4 dark:bg-slate-800 bg-slate-200 dark:text-slate-300 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs dark:hover:bg-slate-700 hover:bg-slate-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all"
                                    >
                                        {editingPlant ? 'Update' : 'Create'}
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
                title="Remove Plant?"
                message="Are you sure you want to remove this plant? This action cannot be undone."
                confirmText="Remove Plant"
            />

            {/* Floating Add Button */}
            {!isModalVisible && (
                <div className="fixed bottom-24 right-6 z-[100]">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal()}
                        className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 cursor-pointer"
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
            className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl p-4 dark:text-white text-slate-900 font-bold outline-none focus:border-emerald-500 transition-all dark:placeholder:text-slate-800 placeholder:text-slate-400"
        />
    </div>
);

export default PlantManagement;
