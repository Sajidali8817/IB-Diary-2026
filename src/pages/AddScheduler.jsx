import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdArrowBack, MdAccountCircle, MdSearch, MdClose,
    MdEmail, MdWhatsapp, MdCalendarToday, MdAccessTime,
    MdSend
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const AddScheduler = () => {
    const { userRole, userProfile } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole && userRole !== 'ADMIN' && userRole !== 'EA') {
            navigate('/dashboard');
        }
    }, [userRole]);
    const [loading, setLoading] = useState(false);

    // Recipient State
    const [hodSearch, setHodSearch] = useState('');
    const [selectedHOD, setSelectedHOD] = useState(null);
    const [hodSuggestions, setHodSuggestions] = useState([]);
    const [searchingHods, setSearchingHods] = useState(false);


    // Message State
    const [messageMode, setMessageMode] = useState('EMAIL'); // EMAIL, WHATSAPP
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        subject: '',
        body: '',
        cc: '',
        toAddress: '',
    });

    // Message Templates
    const messageTemplates = {
        MEETING: {
            name: 'Meeting',
            icon: '🤝',
            color: 'blue',
            email: {
                subject: 'Meeting: [Topic]',
                body: `Dear [Recipient Name],

I'd like to schedule a brief meeting to discuss [Topic].

📅 Date: [Date]
⏰ Time: [Time]
📍 Venue: [Location/Link]

Agenda:
• [Point 1]
• [Point 2]

Please confirm your availability.

Best regards,
[Your Name]`
            },
            whatsapp: {
                body: `🤝 *Meeting Invitation*

Discussing: *[Topic]*
📅 *Date:* [Date]
⏰ *Time:* [Time]
📍 *Venue:* [Location]

Please confirm your availability.`
            }
        },
        CALL: {
            name: 'Call',
            icon: '📞',
            color: 'emerald',
            email: {
                subject: 'Scheduled Call: [Topic]',
                body: `Dear [Recipient Name],

Regarding our upcoming call:

📞 Topic: [Topic]
📅 Date: [Date]
⏰ Time: [Time]

Key Discussion:
1. [Point 1]
2. [Point 2]

Ready to connect at the scheduled time.

Regards,
[Your Name]`
            },
            whatsapp: {
                body: `📞 *Quick Call*

Topic: *[Topic]*
📅 *Date:* [Date]
⏰ *Time:* [Time]

I'll reach out at the scheduled time.`
            }
        },
        EMAIL: {
            name: 'Email',
            icon: '📧',
            color: 'violet',
            email: {
                subject: '[Subject]',
                body: `Dear [Recipient Name],

[Refined message content here].

Highlights:
• [Point 1]
• [Point 2]

Let me know if you have any questions.

Best regards,
[Your Name]`
            },
            whatsapp: {
                body: `📧 *Update*

[Brief update text]

*Highlights:*
• [Point 1]
• [Point 2]

Thanks!`
            }
        },
        FOLLOWUP: {
            name: 'Follow-up',
            icon: '🔄',
            color: 'amber',
            email: {
                subject: 'Follow-up: [Topic]',
                body: `Dear [Recipient Name],

Following up on our discussion regarding [Topic].

Status:
✓ [Completed]
⏳ [Pending]

Next Steps:
1. [Step 1]
2. [Step 2]

Awaiting your update.

Best regards,
[Your Name]`
            },
            whatsapp: {
                body: `🔄 *Follow-up: [Topic]*

*Status:*
✓ [Done]
⏳ [Pending]

*Next:* [Action Item]

Please update when possible.`
            }
        },
        EVENT: {
            name: 'Event',
            icon: '🎉',
            color: 'pink',
            email: {
                subject: 'Invite: [Event Name]',
                body: `Dear [Recipient Name],

You're invited to [Event Name].

🎉 Date: [Date]
⏰ Time: [Time]
📍 Venue: [Location]

RSVP by [Date].

Warm regards,
[Your Name]`
            },
            whatsapp: {
                body: `🎉 *Event Invite*

*[Event Name]*
📅 *Date:* [Date]
📍 *Venue:* [Location]

Please RSVP by [Date].`
            }
        },
        REPORT: {
            name: 'Report',
            icon: '📊',
            color: 'cyan',
            email: {
                subject: '[Type] Report: [Date]',
                body: `Dear [Recipient Name],

Summary for [Period]:

📊 Key Metrics:
• Progress: [%]%
• Status: [Health]

Highlights:
✓ [Achievement]
⚠️ [Challenge]

Detailed report attached/available.

Regards,
[Your Name]`
            },
            whatsapp: {
                body: `📊 *[Type] Report*

*Metrics:*
• Progress: [%]%
• Status: [Health]

*Highlights:*
✓ [Done]
⚠️ [Issue]

Details available in the portal.`
            }
        }
    };

    // Schedule State
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD format
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5)); // Current time HH:mm


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

    const handleSelectTemplate = (templateKey) => {
        const template = messageTemplates[templateKey];
        setSelectedTemplate(templateKey);

        if (messageMode === 'EMAIL') {
            setFormData(prev => ({
                ...prev,
                subject: template.email.subject,
                body: template.email.body
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                body: template.whatsapp.body
            }));
        }
    };

    const handleSchedule = async () => {
        if (!formData.toAddress || !formData.body) {
            toast.error('Recipient and Message body are required');
            return;
        }

        const scheduleTime = new Date(`${date}T${time}:00`);
        if (scheduleTime < new Date()) {
            toast.error('Cannot schedule for a past time');
            return;
        }

        const tzOffset = scheduleTime.getTimezoneOffset() * 60000;
        const localISOTime = new Date(scheduleTime.getTime() - tzOffset).toISOString().slice(0, -1);

        try {
            setLoading(true);
            const payload = {
                hod_id: selectedHOD?.id || null,
                send_via: messageMode,
                send_to: formData.toAddress,
                send_from: 'system', // Align with mobile 'system'
                cc: messageMode === 'EMAIL' ? (formData.cc || null) : null,
                subject: messageMode === 'EMAIL' ? (formData.subject || null) : null,
                body: formData.body,
                send_at: localISOTime // Precise local ISO format
            };

            await apiService.scheduleMessage(payload);
            toast.success('Message scheduled successfully');
            navigate('/scheduler');
        } catch (error) {
            toast.error(error.message || 'Scheduling failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-40">
            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5 mb-10">
                <header className="flex items-center gap-4 p-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white cursor-pointer"
                    >
                        <MdArrowBack size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white font-outfit leading-none mb-1">New Schedule</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Create Automated Message</p>
                    </div>
                </header>
            </div>

            <div className="px-6">

                <div className="space-y-8">
                    {/* 1. Recipient Selection */}
                    <Section title="Recipient (HOD)" icon={<MdAccountCircle />} className="relative z-20">
                        {!selectedHOD ? (
                            <div className="relative z-50">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name or department..."
                                    value={hodSearch}
                                    onChange={(e) => setHodSearch(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-700"
                                />

                                <AnimatePresence>
                                    {(hodSuggestions.length > 0 || hodSearch.length > 1) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/5 rounded-2xl overflow-hidden z-20 shadow-2xl"
                                        >
                                            {hodSuggestions.length > 0 ? (
                                                hodSuggestions.map(hod => (
                                                    <button
                                                        key={hod.id}
                                                        onClick={() => handleSelectHOD(hod)}
                                                        className="w-full p-4 hover:bg-white/5 flex items-center gap-4 text-left border-b border-white/5 last:border-0 cursor-pointer"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                                                            {(hod.name || 'U').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold">{hod.name || 'Unknown'}</p>
                                                            <p className="text-slate-500 text-xs">{hod.dept || hod.department || 'No Dept'}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : hodSearch.length > 1 && (
                                                <div className="p-8 text-center">
                                                    <div className="text-2xl mb-2">🔍</div>
                                                    <p className="text-white font-bold text-sm">No HODs found</p>
                                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Try a different name</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-lg">
                                        {selectedHOD.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-black">{selectedHOD.name}</p>
                                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{selectedHOD.dept}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedHOD(null); setHodSearch(''); }} className="text-slate-500 hover:text-white transition-colors">
                                    <MdClose size={24} />
                                </button>
                            </div>
                        )}
                    </Section>

                    {/* 2. Contact Details */}
                    <Section title="Contact Info" icon={<MdEmail />}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recipient Addressing</label>
                                    <input
                                        type="text"
                                        placeholder={messageMode === 'EMAIL' ? "Recipient Email" : "Recipient Mobile"}
                                        value={formData.toAddress}
                                        onChange={(e) => setFormData({ ...formData, toAddress: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
                                    />
                                </div>
                                {messageMode === 'EMAIL' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">CC (Carbon Copy)</label>
                                        <input
                                            type="email"
                                            placeholder="Optional email..."
                                            value={formData.cc}
                                            onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* 4. Message Content */}
                    <Section title="Message Details" icon={<MdSend />}>
                        <div className="space-y-6">
                            {/* Mode Switcher */}
                            <div className="bg-slate-900 rounded-2xl p-1 flex gap-1">
                                <button
                                    onClick={() => {
                                        setMessageMode('EMAIL');
                                        if (selectedTemplate) {
                                            setFormData(prev => ({
                                                ...prev,
                                                subject: messageTemplates[selectedTemplate].email.subject,
                                                body: messageTemplates[selectedTemplate].email.body
                                            }));
                                        }
                                    }}
                                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${messageMode === 'EMAIL' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <MdEmail size={18} /> Email
                                </button>
                                <button
                                    onClick={() => {
                                        setMessageMode('WHATSAPP');
                                        if (selectedTemplate) {
                                            setFormData(prev => ({
                                                ...prev,
                                                body: messageTemplates[selectedTemplate].whatsapp.body
                                            }));
                                        }
                                    }}
                                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${messageMode === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <MdWhatsapp size={18} /> WhatsApp
                                </button>
                            </div>

                            {/* Template Selection */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Quick Templates</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.entries(messageTemplates).map(([key, template]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleSelectTemplate(key)}
                                            className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${selectedTemplate === key
                                                ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                                : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'
                                                }`}
                                        >
                                            <span className="text-2xl">{template.icon}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{template.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {messageMode === 'EMAIL' && (
                                <div className="space-y-2 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 shrink-0">From:</span>
                                        <span className="text-blue-400 font-bold text-xs truncate">{userProfile?.email || 'system@ibgroup.co.in'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 border-t border-white/5 pt-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 shrink-0">To:</span>
                                        <span className="text-emerald-400 font-bold text-xs truncate">{formData.toAddress || 'Select recipient'}</span>
                                    </div>
                                    {formData.cc && (
                                        <div className="flex items-center gap-3 border-t border-white/5 pt-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 shrink-0">CC:</span>
                                            <span className="text-amber-400 font-bold text-xs truncate">{formData.cc}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {messageMode === 'EMAIL' && (
                                <input
                                    type="text"
                                    placeholder="Subject of the email"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
                                />
                            )}

                            <textarea
                                rows={12}
                                placeholder="Type your message here..."
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-800 resize-none font-outfit"
                            />
                        </div>
                    </Section>

                    {/* 5. Scheduling */}
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
                                        style={{ colorScheme: 'dark' }}
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
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
                                        style={{ colorScheme: 'dark' }}
                                        className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Action Button */}
                    <button
                        onClick={handleSchedule}
                        disabled={loading}
                        className="w-full py-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><MdSend size={24} /> Schedule Now</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, icon, children, className = '' }) => (
    <div className={`bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
            <div className="text-blue-500 text-xl">{icon}</div>
            <h2 className="text-white font-black text-xl font-outfit uppercase tracking-tighter">{title}</h2>
        </div>
        {children}
    </div>
);

export default AddScheduler;
