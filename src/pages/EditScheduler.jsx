import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MdArrowBack, MdAccountCircle, MdSearch, MdClose,
    MdEmail, MdWhatsapp, MdCalendarToday, MdAccessTime,
    MdSend
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

const EditScheduler = () => {
    const { id } = useParams();
    const { userRole } = useAppContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Recipient State
    const [hodSearch, setHodSearch] = useState('');
    const [selectedHOD, setSelectedHOD] = useState(null);
    const [hodSuggestions, setHodSuggestions] = useState([]);
    const [searchingHods, setSearchingHods] = useState(false);


    // Message State
    const [messageMode, setMessageMode] = useState('EMAIL');
    const [formData, setFormData] = useState({
        subject: '',
        body: '',
        cc: '',
        toAddress: '',
    });

    // Schedule State
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        if (userRole && userRole !== 'ADMIN' && userRole !== 'EA') {
            navigate('/dashboard');
        }
    }, [userRole]);

    useEffect(() => {
        const init = async () => {
            try {

                // Fetch schedule details
                const data = await apiService.getSchedules(); // Get all to find the one, or use a specific detail API if exists
                const item = Array.isArray(data) ? data.find(s => s.id === parseInt(id)) : null;

                if (!item) {
                    toast.error('Schedule not found');
                    navigate('/scheduler');
                    return;
                }

                // Populate form
                setMessageMode(item.send_via);
                setFormData({
                    subject: item.subject || '',
                    body: item.body || '',
                    cc: item.cc || '',
                    toAddress: item.send_to || '',
                });

                // Set Date/Time from send_at
                if (item.send_at) {
                    const d = new Date(item.send_at);
                    setDate(d.toLocaleDateString('en-CA'));
                    setTime(d.toTimeString().slice(0, 5));
                }

                // Handle HOD/Plant/Hatchery
                if (item.hod_id) {
                    // First try searching by send_to (email)
                    let hods = await apiService.getHods(item.send_to);
                    let matchedHod = Array.isArray(hods) ? hods.find(h => h.id == item.hod_id) : null;

                    // If not found, try searching by generic fetch (top list) or name if available
                    if (!matchedHod) {
                        hods = await apiService.getHods('');
                        matchedHod = Array.isArray(hods) ? hods.find(h => h.id == item.hod_id) : null;
                    }

                    if (matchedHod) {
                        setSelectedHOD(matchedHod);
                        setHodSearch(matchedHod.name);
                    } else if (item.hod_name) {
                        // Fallback if we have name in item but couldn't fetch detail
                        setSelectedHOD({ id: item.hod_id, name: item.hod_name, dept: item.hod_dept || 'Unknown' });
                        setHodSearch(item.hod_name);
                    }
                }

            } catch (error) {
                console.error('Failed to load scheduler details:', error);
                toast.error('Failed to load details');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);


    useEffect(() => {
        const timer = setTimeout(() => {
            if (hodSearch.length > 1 && (!selectedHOD || hodSearch !== selectedHOD.name)) {
                searchHODs();
            } else if (hodSearch.length <= 1) {
                setHodSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [hodSearch]);

    const searchHODs = async () => {
        try {
            setSearchingHods(true);
            const data = await apiService.getHods(hodSearch);
            // Robustly handle both direct array and wrapped array in 'results' or similar
            const list = Array.isArray(data) ? data : (data?.results || data?.data || []);
            setHodSuggestions(list);
        } catch (error) {
            console.error('HOD search failed:', error);
            setHodSuggestions([]);
        } finally {
            setSearchingHods(false);
        }
    };

    const handleSelectHOD = (hod) => {
        setSelectedHOD(hod);
        setHodSearch(hod.name);
        setHodSuggestions([]);
        setFormData(prev => ({
            ...prev,
            toAddress: messageMode === 'EMAIL' ? (hod.email || '') : (hod.mobile || '')
        }));
    };

    const handleUpdate = async () => {
        if (!formData.toAddress || !formData.body) {
            toast.error('Recipient and Message body are required');
            return;
        }

        const scheduleTime = new Date(`${date}T${time}:00`);
        const tzOffset = scheduleTime.getTimezoneOffset() * 60000;
        const localISOTime = new Date(scheduleTime.getTime() - tzOffset).toISOString().slice(0, -1);

        try {
            setSaving(true);
            const payload = {
                hod_id: selectedHOD?.id || null,
                send_via: messageMode,
                send_to: formData.toAddress,
                send_from: 'system',
                cc: messageMode === 'EMAIL' ? (formData.cc || null) : null,
                subject: messageMode === 'EMAIL' ? (formData.subject || null) : null,
                body: formData.body,
                send_at: localISOTime
            };

            await apiService.updateSchedule(id, payload);
            toast.success('Schedule updated successfully');
            navigate('/scheduler');
        } catch (error) {
            toast.error(error.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-50 pb-40 transition-colors duration-300">
            {/* Header */}
            <div className="dark:bg-slate-900/50 bg-white/50 backdrop-blur-xl sticky top-0 z-30 dark:border-white/5 border-slate-200 border-b mb-10">
                <header className="flex items-center gap-4 p-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-2xl dark:bg-slate-900 bg-white flex items-center justify-center dark:text-white text-slate-900 cursor-pointer shadow-sm border dark:border-transparent border-slate-200"
                    >
                        <MdArrowBack size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black dark:text-white text-slate-900 font-outfit leading-none mb-1">Edit Schedule</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Modify Automated Message</p>
                    </div>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </header>
            </div>

            <div className="px-6">
                <div className="space-y-8">
                    <Section title="Recipient (HOD)" icon={<MdAccountCircle />} className="relative z-20">
                        {!selectedHOD ? (
                            <div className="relative z-50">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-slate-500 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name or department..."
                                    value={hodSearch}
                                    onChange={(e) => setHodSearch(e.target.value)}
                                    className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl py-4 pl-12 pr-4 dark:text-white text-slate-900 outline-none focus:border-blue-500 transition-all font-bold dark:placeholder:text-slate-700 placeholder:text-slate-400"
                                />
                                <AnimatePresence>
                                    {(hodSuggestions.length > 0 || hodSearch.length > 1) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-2 dark:bg-slate-900 bg-white dark:border-white/5 border-slate-200 border rounded-2xl overflow-hidden z-20 shadow-2xl"
                                        >
                                            {hodSuggestions.length > 0 ? (
                                                hodSuggestions.map(hod => (
                                                    <button
                                                        key={hod.id}
                                                        onClick={() => handleSelectHOD(hod)}
                                                        className="w-full p-4 dark:hover:bg-white/5 hover:bg-slate-50 flex items-center gap-4 text-left dark:border-white/5 border-slate-100 border-b last:border-0 cursor-pointer"
                                                    >
                                                        <div className="w-10 h-10 rounded-full dark:bg-blue-500/10 bg-blue-50 text-blue-500 flex items-center justify-center font-black">
                                                            {(hod.name || 'U').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="dark:text-white text-slate-900 font-bold">{hod.name || 'Unknown'}</p>
                                                            <p className="text-slate-500 text-xs">{hod.dept || hod.department || 'No Dept'}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : hodSearch.length > 1 && (
                                                <div className="p-8 text-center">
                                                    <div className="text-2xl mb-2">🔍</div>
                                                    <p className="dark:text-white text-slate-900 font-bold text-sm">No HODs found</p>
                                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Try a different name</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="dark:bg-blue-500/10 bg-blue-50 dark:border-blue-500/20 border-blue-100 border rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-lg">
                                        {selectedHOD.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="dark:text-white text-slate-900 font-black">{selectedHOD.name}</p>
                                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{selectedHOD.dept}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedHOD(null); setHodSearch(''); }} className="text-slate-500 hover:dark:text-white hover:text-slate-900 transition-colors">
                                    <MdClose size={24} />
                                </button>
                            </div>
                        )}
                    </Section>

                    <Section title="Contact Info" icon={<MdEmail />}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recipient Addressing</label>
                                    <input
                                        type="text"
                                        value={formData.toAddress}
                                        onChange={(e) => setFormData({ ...formData, toAddress: e.target.value })}
                                        className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl p-4 dark:text-white text-slate-900 font-bold outline-none focus:border-blue-500 transition-all font-outfit"
                                    />
                                </div>
                                {messageMode === 'EMAIL' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">CC (Carbon Copy)</label>
                                        <input
                                            type="email"
                                            value={formData.cc}
                                            onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                                            className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl p-4 dark:text-white text-slate-900 font-bold outline-none focus:border-blue-500 transition-all font-outfit"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* Reuse Section, Location, Content, Timing from AddScheduler with updated states */}

                    <Section title="Message Details" icon={<MdSend />}>
                        <div className="space-y-6">
                            <div className="dark:bg-slate-900 bg-slate-100 rounded-2xl p-1 flex gap-1">
                                <button onClick={() => setMessageMode('EMAIL')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${messageMode === 'EMAIL' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><MdEmail size={18} /> Email</button>
                                <button onClick={() => setMessageMode('WHATSAPP')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${messageMode === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}><MdWhatsapp size={18} /> WhatsApp</button>
                            </div>
                            {messageMode === 'EMAIL' && (
                                <input
                                    type="text"
                                    placeholder="Subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl p-4 dark:text-white text-slate-900 font-bold outline-none font-outfit"
                                />
                            )}
                            <textarea
                                rows={5}
                                placeholder="Message body"
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl p-4 dark:text-white text-slate-900 font-bold outline-none resize-none font-outfit"
                            />
                        </div>
                    </Section>

                    <Section title="Schedule Timing" icon={<MdCalendarToday />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Dispatch Date</label>
                                <div className="relative">
                                    <MdCalendarToday className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl p-4 pl-12 dark:text-white text-slate-900 font-bold outline-none focus:border-blue-500 transition-all cursor-pointer dark-[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Dispatch Time</label>
                                <div className="relative">
                                    <MdAccessTime className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full dark:bg-slate-950 bg-slate-50 dark:border-white/5 border-slate-200 border rounded-2xl p-4 pl-12 dark:text-white text-slate-900 font-bold outline-none focus:border-blue-500 transition-all cursor-pointer dark-[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="w-full py-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" /> : "Update Schedule"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, icon, children, className = '' }) => (
    <div className={`dark:bg-slate-900/40 bg-white/60 backdrop-blur-xl dark:border-white/5 border-slate-200 border rounded-[2.5rem] p-8 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
            <div className="text-blue-500 text-xl">{icon}</div>
            <h2 className="dark:text-white text-slate-900 font-black text-xl font-outfit uppercase tracking-tighter">{title}</h2>
        </div>
        {children}
    </div>
);

export default EditScheduler;
