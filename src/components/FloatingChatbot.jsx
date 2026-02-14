import React, { useState, useRef, useEffect } from 'react';
import { MdClose, MdSend, MdMic, MdMicOff, MdSmartToy, MdDelete } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const FloatingChatbot = ({ visible, onClose }) => {
    const { tasks, notes, userProfile, refreshTasks, refreshNotes } = useAppContext();
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: `Hello ${userProfile?.name || 'there'}! I'm your AI productivity assistant. I can help you create Tasks and Notes using natural language. Try saying "Create a high priority task called 'Review Budget' due at 5 PM."`,
            sender: 'ai'
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const scrollViewRef = useRef(null);

    // Web Speech API
    const recognition = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + ' ' + transcript);
            };

            recognition.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    toast.error('Voice recognition error');
                }
            };

            recognition.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const startVoiceRecognition = () => {
        if (recognition.current) {
            try {
                recognition.current.start();
                setIsListening(true);
            } catch (error) {
                console.error('Failed to start recognition:', error);
                toast.error('Microphone access denied');
            }
        } else {
            toast.error('Speech recognition not supported in this browser');
        }
    };

    const stopVoiceRecognition = () => {
        if (recognition.current) {
            recognition.current.stop();
            setIsListening(false);
        }
    };

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (textOverride = null) => {
        const textToSend = textOverride || input.trim();
        if (!textToSend || isTyping) return;

        if (!textOverride) {
            const userMessage = { id: Date.now().toString(), text: textToSend, sender: 'user' };
            setMessages(prev => [...prev, userMessage]);
            setInput('');
        }

        setIsTyping(true);

        const history = messages.slice(1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.actionPerformed ? 'Action completed successfully.' : m.text
        }));

        try {
            const response = await apiService.sendChatMessage(textToSend, history);

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                text: response.response || 'Sorry, I could not process that.',
                sender: 'ai',
                actionPerformed: response.action_performed,
                data: response.data,
            };

            const isClearCommand = textToSend.toLowerCase() === '/clear' || textToSend.toLowerCase() === '/clean';

            if (response.action_performed === 'clear_history' || isClearCommand) {
                setIsTyping(false);
                setMessages([
                    {
                        id: Date.now().toString(),
                        text: response.response || 'Chat history cleared. Ready for a new topic!',
                        sender: 'ai'
                    }
                ]);
            } else {
                setMessages(prev => [...prev, aiMessage]);
            }

            if (response.action_performed === 'create_task') {
                refreshTasks();
                toast.success('Task created!');
            } else if (response.action_performed === 'create_note') {
                refreshNotes();
                toast.success('Note created!');
            }

        } catch (error) {
            console.error('Chatbot API Error:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: `Sorry, I couldn't connect to the server. Error: ${error.message}`,
                sender: 'ai',
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setIsTyping(false);
    };

    const renderActionCard = (msg) => {
        if (!msg.actionPerformed || !msg.data) return null;

        const isTask = msg.actionPerformed === 'create_task';
        const icon = isTask ? '✅' : '📝';
        const label = isTask ? 'Task Created' : 'Note Created';
        const title = msg.data.title || msg.data.name || 'Untitled';

        return (
            <div className="mt-2 bg-green-100 border border-green-300 rounded-lg p-3 flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 uppercase">{label}</p>
                    <p className="text-sm font-bold text-slate-900">{title}</p>
                </div>
            </div>
        );
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 dark:bg-black/60 bg-slate-900/20 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="dark:bg-slate-800 bg-white rounded-[2.5rem] w-full md:max-w-2xl h-[92dvh] md:h-[80vh] flex flex-col shadow-2xl overflow-hidden dark:border-white/5 border-slate-200 border"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 dark:border-slate-700 border-slate-100 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center">
                            <MdSmartToy size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold dark:text-white text-slate-900">AI Assistant</h2>
                            <p className="text-xs dark:text-slate-400 text-slate-500">Create tasks & notes with chat</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <MdDelete size={24} className="dark:text-slate-400 text-slate-500" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                            <MdClose size={24} className="dark:text-slate-400 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={scrollViewRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[80%] ${msg.sender === 'ai' ? '' : 'flex flex-col items-end'}`}>
                                <div
                                    className={`rounded-2xl p-3 ${msg.sender === 'ai'
                                        ? 'dark:bg-slate-700 bg-slate-100 dark:text-white text-slate-900'
                                        : 'bg-blue-500 text-white'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.sender === 'ai' && renderActionCard(msg)}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="dark:bg-slate-700 bg-slate-100 rounded-2xl p-3 flex items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 dark:bg-slate-400 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 dark:bg-slate-400 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 dark:bg-slate-400 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-xs dark:text-slate-400 text-slate-500 italic">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 pb-10 md:pb-4 dark:border-slate-700 border-slate-100 border-t">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask me anything..."
                            className="flex-1 dark:bg-slate-900 bg-slate-50 dark:text-white text-slate-900 rounded-2xl px-4 py-3 dark:border-slate-700 border-slate-200 border focus:border-blue-500 outline-none resize-none max-h-32 text-sm"
                            rows={1}
                            maxLength={500}
                        />
                        <button
                            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isListening
                                ? 'bg-red-500 text-white'
                                : 'dark:bg-slate-700 bg-slate-100 border border-transparent dark:border-blue-500/30 text-blue-500'
                                }`}
                        >
                            {isListening ? <MdMicOff size={22} /> : <MdMic size={22} />}
                        </button>
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${input.trim()
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'dark:bg-slate-700 bg-slate-100 dark:text-slate-500 text-slate-400'
                                }`}
                        >
                            <MdSend size={22} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Clear Confirmation Modal */}
            <ConfirmModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    handleSend('/clear');
                    setShowClearConfirm(false);
                }}
                title="Clear Chat?"
                message="This will delete your entire chat history. This action cannot be undone."
                confirmText="Clear History"
            />
        </div>
    );
};

export default FloatingChatbot;
