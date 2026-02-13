import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdDelete, MdEdit, MdClose, MdCheckBox, MdCheckBoxOutlineBlank, MdSearch, MdSort, MdArrowBack, MdUndo, MdRedo, MdCheck, MdMic, MdPhotoCamera, MdCreate, MdSpellcheck, MdLink, MdShare, MdFormatListBulleted, MdPushPin } from 'react-icons/md';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { checkGrammar } from '../services/geminiService';
import ConfirmModal from '../components/ConfirmModal';
import RichTextEditor from '../components/RichTextEditor';

const NOTE_COLORS = [
    '#FFB3BA', // Pink
    '#FFDFBA', // Peach
    '#FFFFBA', // Yellow
    '#BAFFC9', // Mint
    '#BAE1FF', // Blue
    '#E0BBE4', // Purple
    '#FFC8DD', // Rose
    '#BFD8BD', // Sage
];

const Notes = () => {
    const navigate = useNavigate();
    const { notes, tasks, addNote, updateNote, deleteNote, refreshNotes, toggleNotePin } = useAppContext();

    const [selectedNotes, setSelectedNotes] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [noteToEdit, setNoteToEdit] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [noteToView, setNoteToView] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sortOption, setSortOption] = useState('newest');
    const [sortModalVisible, setSortModalVisible] = useState(false);

    // Linked Task State
    const [linkedTaskId, setLinkedTaskId] = useState('');

    // Form state
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
    const [noteImages, setNoteImages] = useState([]);
    const [matchCount, setMatchCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // 'single' or 'batch'
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [notePinned, setNotePinned] = useState(false);

    useEffect(() => {
        refreshNotes();
        const params = new URLSearchParams(window.location.search);
        if (params.get('add') === 'true') {
            setAddModalVisible(true);
            // Clear the param without refreshing to avoid re-opening on manual refresh
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const getNoteColor = (id) => {
        const hash = id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return NOTE_COLORS[hash % NOTE_COLORS.length];
    };

    const toggleSelection = (id) => {
        setSelectedNotes(prev => {
            if (prev.includes(id)) {
                const newSelection = prev.filter(noteId => noteId !== id);
                if (newSelection.length === 0) {
                    setSelectionMode(false);
                }
                return newSelection;
            } else {
                return [...prev, id];
            }
        });
    };

    const handleLongPress = (id) => {
        setSelectionMode(true);
        setSelectedNotes([id]);
    };

    const handlePress = (note) => {
        if (selectionMode) {
            toggleSelection(note.id);
        } else {
            setNoteToView(note);
            setViewModalVisible(true);
        }
    };

    const handleDeleteSelected = () => {
        setDeleteTarget('batch');
        setShowDeleteConfirm(true);
    };

    const confirmDeletion = () => {
        if (deleteTarget === 'batch') {
            selectedNotes.forEach(id => deleteNote(id));
            toast.success(`${selectedNotes.length} note(s) deleted`);
            setSelectedNotes([]);
            setSelectionMode(false);
        } else if (deleteTarget === 'single' && noteToDelete) {
            deleteNote(noteToDelete);
            toast.success('Note deleted');
            setViewModalVisible(false);
            setNoteToView(null);
            setNoteToDelete(null);
        }
        setShowDeleteConfirm(false);
    };

    const handleAddNote = async () => {
        if (isSavingNote) return;
        if (!noteTitle.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setIsSavingNote(true);
        try {
            await addNote({
                title: noteTitle,
                content: noteContent,
                linkedTaskId: linkedTaskId,
                images: noteImages,
                isPinned: notePinned,
            });

            toast.success('Note created!');
            setNoteTitle('');
            setNoteContent('');
            setLinkedTaskId('');
            setNoteImages([]);
            setAddModalVisible(false);
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleEditNote = async () => {
        if (isSavingNote) return;
        if (!noteTitle.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setIsSavingNote(true);
        try {
            await updateNote(noteToEdit.id, {
                title: noteTitle,
                content: noteContent,
                linkedTaskId: linkedTaskId,
                images: noteImages,
                isPinned: notePinned,
            });

            toast.success('Note updated!');
            setNoteTitle('');
            setNoteContent('');
            setLinkedTaskId('');
            setNoteImages([]);
            setNoteToEdit(null);
            setEditModalVisible(false);
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleAutoSave = async () => {
        // Auto-save when going back - no validation errors, just save if there's content
        if (isSavingNote) return;

        // Check if there's anything to save (title or content)
        const hasContent = noteTitle.trim() || noteContent.trim();
        if (!hasContent) {
            // Nothing to save, just close
            setAddModalVisible(false);
            setEditModalVisible(false);
            setNoteToEdit(null);
            setNoteTitle('');
            setNoteContent('');
            setLinkedTaskId('');
            setNoteImages([]);
            return;
        }

        setIsSavingNote(true);
        try {
            const saveTitle = noteTitle.trim() || 'Untitled';

            if (editModalVisible && noteToEdit) {
                // Update existing note
                await updateNote(noteToEdit.id, {
                    title: saveTitle,
                    content: noteContent,
                    linkedTaskId: linkedTaskId,
                    images: noteImages,
                    isPinned: notePinned,
                });
                toast.success('Note updated!');
            } else { // Changed from else if (addModalVisible) to else
                // Create new note
                await addNote({
                    title: saveTitle,
                    content: noteContent,
                    linkedTaskId: linkedTaskId,
                    images: noteImages,
                    isPinned: notePinned,
                });
                toast.success('Note saved!');
            }

            // Clear form and close
            setNoteTitle('');
            setNoteContent('');
            setLinkedTaskId('');
            setNoteImages([]);
            setNoteToEdit(null);
            setAddModalVisible(false);
            setEditModalVisible(false);
        } catch (error) {
            console.error('Auto-save failed:', error);
            // Close anyway on error to avoid blocking the user
            setAddModalVisible(false);
            setEditModalVisible(false);
            setNoteToEdit(null);
            setNoteTitle('');
            setNoteContent('');
            setLinkedTaskId('');
            setNoteImages([]);
        } finally {
            setIsSavingNote(false);
        }
    };

    const openEditModal = (note) => {
        setNoteToEdit(note);
        setNoteTitle(note.title);
        setNoteContent(note.content || '');
        setLinkedTaskId(note.linkedTaskId || '');
        setNotePinned(note.isPinned || false);
        setEditModalVisible(true);
        setViewModalVisible(false);
    };

    const handleShare = async (title, content) => {
        // Strip HTML tags for clean text sharing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content || '';
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        const shareData = {
            title: title || 'Note',
            text: plainText
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                // Fallback to clipboard
                const fullText = `${shareData.title}\n\n${shareData.text}`;
                await navigator.clipboard.writeText(fullText);
                toast.success('Note copied to clipboard');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Sharing failed:', error);
                toast.error('Could not share note');
            }
        }
    };

    // Voice Recognition Logic
    const startVoiceTyping = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Voice typing not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            toast.error('Voice typing failed: ' + event.error);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNoteContent(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
            toast.success('Text added!');
        };

        recognition.start();
    };

    const handleImagePick = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNoteImages(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setNoteImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGrammarCheck = async () => {
        if (!noteContent.trim()) {
            toast.error('Please enter content to check');
            return;
        }

        setIsCheckingGrammar(true);
        const toastId = toast.loading('Gemini is correcting your grammar...');

        try {
            const correctedText = await checkGrammar(noteContent);
            setNoteContent(correctedText);
            toast.success('Grammar polished!', { id: toastId });
        } catch (error) {
            console.error('Grammar check failed:', error);
            toast.error('AI check failed. Try again.', { id: toastId });
        } finally {
            setIsCheckingGrammar(false);
        }
    };

    // Search Match Count Logic
    useEffect(() => {
        if (!searchQuery.trim() || !noteContent) {
            setMatchCount(0);
            return;
        }
        try {
            const regex = new RegExp(searchQuery, 'gi');
            const matches = noteContent.match(regex);
            setMatchCount(matches ? matches.length : 0);
        } catch (e) {
            setMatchCount(0);
        }
    }, [searchQuery, noteContent]);

    const filteredTasksInModal = useMemo(() => {
        if (!modalSearchQuery.trim()) return tasks;
        return tasks.filter(t => t.title.toLowerCase().includes(modalSearchQuery.toLowerCase()));
    }, [tasks, modalSearchQuery]);

    const filteredNotes = useMemo(() => {
        let result = notes.filter(n =>
            n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.content?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const sortWithPinned = (a, b, sortFn) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return sortFn(a, b);
        };

        switch (sortOption) {
            case 'newest': return result.sort((a, b) => sortWithPinned(a, b, (x, y) => new Date(y.date || y.created_at) - new Date(x.date || x.created_at)));
            case 'oldest': return result.sort((a, b) => sortWithPinned(a, b, (x, y) => new Date(x.date || x.created_at) - new Date(y.date || y.created_at)));
            case 'az': return result.sort((a, b) => sortWithPinned(a, b, (x, y) => (x.title || '').localeCompare(y.title || '')));
            default: return result.sort((a, b) => sortWithPinned(a, b, (x, y) => new Date(y.date || y.created_at) - new Date(x.date || x.created_at)));
        }
    }, [notes, searchQuery, sortOption]);

    // Masonry Split
    const { leftNotes, rightNotes } = useMemo(() => {
        const left = [];
        const right = [];
        filteredNotes.forEach((note, index) => {
            if (index % 2 === 0) left.push(note);
            else right.push(note);
        });
        return { leftNotes: left, rightNotes: right };
    }, [filteredNotes]);

    const renderNoteCard = (note) => {
        const isSelected = selectedNotes.includes(note.id);
        const color = getNoteColor(note.id);
        const linkedTask = note.linkedTaskId ? tasks.find(t => t.id === note.linkedTaskId) : null;

        return (
            <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative mb-3"
            >
                <div
                    onClick={() => handlePress(note)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        handleLongPress(note.id);
                    }}
                    className={`rounded-[2rem] p-5 transition-all border-2 border-transparent relative overflow-hidden ${isSelected ? 'ring-4 ring-blue-500 scale-95' : ''
                        }`}
                    style={{
                        backgroundColor: color,
                        minHeight: '140px',
                    }}
                >
                    {note.isPinned && (
                        <div className="absolute top-0 right-0 p-3">
                            <div className="w-16 h-16 bg-black/5 blur-xl rounded-full pointer-events-none"></div>
                        </div>
                    )}

                    {/* Pin button - Top Right */}
                    <div
                        className="absolute top-3 right-3 z-20 flex gap-1 p-1 bg-white/10 backdrop-blur-sm rounded-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleNotePin(note.id); }}
                            className={`p-1.5 rounded-full transition-all cursor-pointer ${note.isPinned ? 'text-slate-900 bg-black/10' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'}`}
                        >
                            <MdPushPin size={18} className={`pointer-events-none ${note.isPinned ? 'rotate-45' : ''}`} />
                        </button>
                    </div>

                    {/* Edit and Delete buttons - Bottom Right */}
                    <div
                        className="absolute bottom-3 right-3 z-20 flex gap-1 p-1 bg-white/10 backdrop-blur-sm rounded-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(note); }}
                            className={`p-1.5 rounded-full transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-black/5`}
                        >
                            <MdEdit size={18} className="pointer-events-none" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShare(note.title, note.content); }}
                            className={`p-1.5 rounded-full transition-all cursor-pointer text-slate-600 hover:text-blue-600 hover:bg-black/5`}
                        >
                            <MdShare size={18} className="pointer-events-none" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); setDeleteTarget('single'); setShowDeleteConfirm(true); }}
                            className={`p-1.5 rounded-full transition-all cursor-pointer text-slate-600 hover:text-red-600 hover:bg-red-500/10`}
                        >
                            <MdDelete size={18} className="pointer-events-none" />
                        </button>
                    </div>
                    {selectionMode && (
                        isSelected ? (
                            <MdCheckBox size={26} className="text-blue-600" />
                        ) : (
                            <MdCheckBoxOutlineBlank size={26} className="text-slate-900/30" />
                        )
                    )}

                    <h3 className="text-xl font-black text-slate-900 mb-3 pr-36 leading-tight">
                        {note.title || 'Untitled'}
                    </h3>

                    {linkedTask && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/5 rounded-full mb-3 max-w-full">
                            <span className="text-xs">🔗</span>
                            <span className="text-[10px] font-bold text-slate-800 truncate uppercase tracking-wider">{linkedTask.title}</span>
                        </div>
                    )}

                    {note.content && (
                        <div
                            className="text-[14px] font-semibold text-slate-800/80 line-clamp-4 leading-relaxed note-content-preview"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                    )}

                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-900/40 uppercase tracking-widest">
                            {new Date(note.date || note.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </motion.div >
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-24 overflow-x-hidden">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5">
                <div className="p-6">
                    {selectionMode ? (
                        <div className="flex justify-between items-center h-[52px]">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setSelectionMode(false);
                                        setSelectedNotes([]);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
                                >
                                    <MdClose size={28} className="text-white" />
                                </button>
                                <h1 className="text-xl font-bold text-white">
                                    {selectedNotes.length} Selected
                                </h1>
                            </div>
                            <button
                                onClick={handleDeleteSelected}
                                className="h-10 px-4 bg-red-500 rounded-xl hover:bg-red-600 transition-all text-white font-bold flex items-center gap-2"
                            >
                                <MdDelete size={20} />
                                Delete
                            </button>
                        </div>
                    ) : isSearchActive ? (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 h-[52px] shadow-inner">
                            <MdSearch size={22} className="text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="flex-1 bg-transparent text-white outline-none font-medium placeholder:text-slate-500"
                                autoFocus
                            />
                            <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }}>
                                <MdClose size={22} className="text-slate-400" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-black text-white font-outfit leading-none tracking-tight">My Notes</h1>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{notes.length} thoughts recorded</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsSearchActive(true)}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-2xl transition-all"
                                >
                                    <MdSearch size={28} className="text-white" />
                                </button>
                                <button
                                    onClick={() => setSortModalVisible(true)}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-2xl transition-all"
                                >
                                    <MdSort size={28} className="text-white" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Masonry Grid */}
            <div className="p-6">
                {filteredNotes.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                            📝
                        </div>
                        <h3 className="text-white text-xl font-bold">No notes yet</h3>
                        <p className="text-slate-500 text-sm mt-1">Tap the plus button to start writing.</p>
                        <button
                            onClick={() => setAddModalVisible(true)}
                            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                        >
                            Create First Note
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile View: Sequential List (1 column) */}
                        <div className="sm:hidden flex flex-col gap-4">
                            {filteredNotes.map(renderNoteCard)}
                        </div>

                        {/* Tablet/Desktop View: Masonry Split (2 columns) */}
                        <div className="hidden sm:grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-4">
                                {leftNotes.map(renderNoteCard)}
                            </div>
                            <div className="flex flex-col gap-4">
                                {rightNotes.map(renderNoteCard)}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Sort Modal */}
            {sortModalVisible && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 w-full max-w-sm"
                    >
                        <h3 className="text-xl font-bold mb-4">Sort By</h3>
                        {[
                            { id: 'newest', label: 'Newest First' },
                            { id: 'oldest', label: 'Oldest First' },
                            { id: 'az', label: 'A-Z' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { setSortOption(opt.id); setSortModalVisible(false); }}
                                className="w-full flex items-center justify-between py-3 border-b border-slate-200 hover:bg-slate-50"
                            >
                                <span className={`font-medium ${sortOption === opt.id ? 'text-blue-500' : 'text-slate-700'}`}>
                                    {opt.label}
                                </span>
                                {sortOption === opt.id && <span className="text-blue-500">✓</span>}
                            </button>
                        ))}
                    </motion.div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {/* Add/Edit Modal (Native-Match Redesign) */}
            <AnimatePresence>
                {(addModalVisible || editModalVisible) && (
                    <div className="fixed inset-0 bg-[#0F172A] z-[100] flex flex-col sm:p-0">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="flex-1 flex flex-col h-full bg-[#0F172A] relative overflow-hidden"
                        >
                            {/* Native Top Header */}
                            <div className="px-4 py-3 flex items-center gap-3 bg-[#0F172A] safe-top z-20">
                                <button
                                    onClick={handleAutoSave}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-all"
                                >
                                    <MdArrowBack size={26} className="text-white" />
                                </button>

                                <div className="flex-1 relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Find in note..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-900/50 border-none rounded-full py-2 px-4 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-white/10"
                                    />
                                    {searchQuery && matchCount > 0 && (
                                        <div className="absolute right-3 px-2 py-0.5 bg-blue-600 rounded-lg text-[10px] font-black text-white shadow-lg">
                                            {matchCount}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setNotePinned(!notePinned)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${notePinned ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        title={notePinned ? "Unpin Note" : "Pin Note"}
                                    >
                                        <MdPushPin size={24} className={notePinned ? 'rotate-45' : ''} />
                                    </button>
                                    <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                        <MdUndo size={24} />
                                    </button>
                                    <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                        <MdRedo size={24} />
                                    </button>
                                    <button
                                        onClick={editModalVisible ? handleEditNote : handleAddNote}
                                        disabled={isSavingNote}
                                        className={`w-10 h-10 flex items-center justify-center text-white rounded-full transition-all cursor-pointer ${isSavingNote
                                            ? 'bg-blue-600 opacity-70 cursor-not-allowed'
                                            : 'hover:bg-white/5 hover:scale-110 active:scale-95'
                                            }`}
                                    >
                                        {isSavingNote ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <MdCheck size={28} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 pt-10 pb-40">
                                <div className="w-full">
                                    {/* Image Preview Gallery */}
                                    {noteImages.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mb-8">
                                            {noteImages.map((img, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img
                                                        src={img}
                                                        alt="attachment"
                                                        className="w-32 h-32 object-cover rounded-3xl border border-white/10 shadow-lg"
                                                    />
                                                    <button
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MdClose size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <textarea
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        placeholder="Title"
                                        rows={1}
                                        autoFocus={!editModalVisible}
                                        className="w-full bg-transparent text-white text-[32px] font-black placeholder:text-slate-800 outline-none mb-6 leading-tight font-outfit resize-none overflow-hidden"
                                        style={{ height: 'auto' }}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                    />

                                    <div className="relative">
                                        {/* Stylized dot as seen in screenshot */}
                                        <div className="absolute -left-4 top-[14px] w-1.5 h-1.5 bg-slate-500 rounded-full opacity-40" />
                                        <RichTextEditor
                                            value={noteContent}
                                            onChange={setNoteContent}
                                            placeholder="..."
                                        />
                                    </div>

                                    <div className="mt-20 mb-10">
                                        <p className="text-slate-500 text-[13px] font-bold italic">
                                            Last modified: {noteToEdit ? new Date(noteToEdit.date || noteToEdit.updated_at || noteToEdit.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Microphone Button */}
                            <div className="fixed bottom-32 right-6 z-30">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={startVoiceTyping}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl border border-white/10 group transition-colors overflow-hidden ${isListening ? 'bg-red-600 shadow-red-500/40' : 'bg-black'
                                        }`}
                                >
                                    {isListening ? (
                                        <div className="flex items-center gap-1">
                                            {[...Array(4)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        height: [8, 12 + Math.random() * 15, 8]
                                                    }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 0.4 + Math.random() * 0.3,
                                                        delay: i * 0.1
                                                    }}
                                                    className="w-1 bg-white rounded-full"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <MdMic size={32} className="group-hover:scale-110 transition-transform" />
                                    )}
                                </motion.button>
                            </div>

                            {/* Hidden File Inputs */}
                            <input
                                type="file"
                                id="note-image-input"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImagePick}
                            />
                            <input
                                type="file"
                                id="note-camera-input"
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImagePick}
                            />

                            {/* Add Attachment Bottom Sheet (Action Sheet) */}
                            <AnimatePresence>
                                {attachmentMenuVisible && (
                                    <div className="fixed inset-0 z-[110] flex items-end justify-center">
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setAttachmentMenuVisible(false)}
                                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                                        />
                                        <motion.div
                                            initial={{ y: '100%' }}
                                            animate={{ y: 0 }}
                                            exit={{ y: '100%' }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            className="relative w-full max-w-lg bg-[#1E293B] rounded-t-[2.5rem] p-8 shadow-3xl"
                                        >
                                            <h3 className="text-center text-slate-400 font-bold mb-6 tracking-wide">Add Attachment</h3>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => {
                                                        setAttachmentMenuVisible(false);
                                                        document.getElementById('note-camera-input').click();
                                                    }}
                                                    className="w-full bg-[#0F172A] p-5 rounded-2xl flex items-center gap-4 text-white hover:bg-slate-800 transition-colors"
                                                >
                                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-400">
                                                        <MdPhotoCamera size={24} />
                                                    </div>
                                                    <span className="font-bold text-lg">Take Photo</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAttachmentMenuVisible(false);
                                                        document.getElementById('note-image-input').click();
                                                    }}
                                                    className="w-full bg-[#0F172A] p-5 rounded-2xl flex items-center gap-4 text-white hover:bg-slate-800 transition-colors"
                                                >
                                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400">
                                                        <MdAdd size={24} />
                                                    </div>
                                                    <span className="font-bold text-lg">Choose from Library</span>
                                                </button>
                                                <button
                                                    onClick={() => setAttachmentMenuVisible(false)}
                                                    className="w-full bg-slate-800 p-5 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-lg mt-2 border border-white/5"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Searchable Task Picker Modal */}
                            <AnimatePresence>
                                {showTaskPicker && (
                                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-[#1E293B] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-3xl flex flex-col max-h-[80vh]"
                                        >
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-black text-white font-outfit uppercase tracking-wider">Link Connection</h3>
                                                <button onClick={() => { setShowTaskPicker(false); setModalSearchQuery(''); }} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><MdClose size={24} /></button>
                                            </div>

                                            {/* Search Bar in Modal */}
                                            <div className="relative mb-6">
                                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Search tasks..."
                                                    value={modalSearchQuery}
                                                    onChange={(e) => setModalSearchQuery(e.target.value)}
                                                    className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-700"
                                                />
                                            </div>

                                            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
                                                <button
                                                    onClick={() => { setLinkedTaskId(''); setShowTaskPicker(false); setModalSearchQuery(''); }}
                                                    className={`w-full p-5 rounded-2xl text-left font-bold transition-all border flex items-center justify-between ${linkedTaskId === '' ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30' : 'bg-[#0F172A] border-white/5 text-slate-400'
                                                        }`}
                                                >
                                                    <span>Personal Thought (No Link)</span>
                                                    {linkedTaskId === '' && <MdCheck size={20} />}
                                                </button>
                                                {filteredTasksInModal.map(task => (
                                                    <button
                                                        key={task.id}
                                                        onClick={() => { setLinkedTaskId(task.id); setShowTaskPicker(false); setModalSearchQuery(''); }}
                                                        className={`w-full p-5 rounded-2xl text-left font-bold transition-all border flex items-center justify-between ${linkedTaskId === task.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30' : 'bg-[#0F172A] border-white/5 text-slate-400 hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <span className="truncate">{task.title}</span>
                                                        {linkedTaskId === task.id && <MdCheck size={20} />}
                                                    </button>
                                                ))}
                                                {filteredTasksInModal.length === 0 && (
                                                    <div className="text-center py-10 text-slate-600 font-bold uppercase tracking-widest text-xs">No tasks found</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Native Bottom Toolbelt */}
                            <div className="fixed bottom-6 left-6 right-6 z-30 pointer-events-auto">
                                <div className="max-w-md mx-auto bg-slate-100/95 backdrop-blur-2xl rounded-full p-2 flex items-center justify-around shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white">
                                    <button
                                        onClick={() => setAttachmentMenuVisible(true)}
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-slate-900 hover:bg-black/5 active:scale-90 transition-all"
                                    >
                                        <MdPhotoCamera size={26} />
                                    </button>
                                    <button
                                        onClick={() => toast('Drawing mode is currently in development!')}
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-slate-900 hover:bg-black/5 active:scale-90 transition-all"
                                    >
                                        <MdCreate size={26} className="rotate-90" />
                                    </button>
                                    <button
                                        onClick={handleGrammarCheck}
                                        disabled={isCheckingGrammar}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-900 transition-all ${isCheckingGrammar ? 'bg-blue-100 animate-pulse' : 'hover:bg-black/5 active:scale-90'
                                            }`}
                                    >
                                        <MdSpellcheck size={28} />
                                    </button>

                                    <button
                                        onClick={() => setShowTaskPicker(true)}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${linkedTaskId ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-900 hover:bg-black/5 active:scale-90'
                                            }`}
                                    >
                                        <MdLink size={26} />
                                    </button>
                                    <button
                                        onClick={() => handleShare(noteTitle, noteContent)}
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-slate-900 hover:bg-black/5 active:scale-90 transition-all"
                                    >
                                        <MdShare size={26} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Modal */}
            {viewModalVisible && noteToView && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-start mb-4 gap-4">
                            <h2 className="text-2xl font-bold text-white break-words overflow-hidden">
                                {noteToView.title}
                            </h2>
                            <button
                                onClick={() => {
                                    setViewModalVisible(false);
                                    setNoteToView(null);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg flex-shrink-0"
                            >
                                <MdClose size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="text-sm text-slate-400 mb-4 font-medium">
                            {new Date(noteToView.date || noteToView.created_at).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>

                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 mb-6 min-h-[200px] overflow-hidden">
                            <p className="text-white whitespace-pre-wrap break-words leading-relaxed text-lg">
                                {noteToView.content || 'No content'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => openEditModal(noteToView)}
                                className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                            >
                                <MdEdit size={20} />
                                Edit
                            </button>
                            <button
                                onClick={() => handleShare(noteToView.title, noteToView.content)}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                <MdShare size={20} />
                                Share
                            </button>
                            <button
                                onClick={() => {
                                    setNoteToDelete(noteToView.id);
                                    setDeleteTarget('single');
                                    setShowDeleteConfirm(true);
                                }}
                                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                            >
                                <MdDelete size={20} />
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Floating Add Button */}
            {!selectionMode && !addModalVisible && !editModalVisible && (
                <div className="fixed bottom-24 right-6 z-[90]">
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAddModalVisible(true)}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 cursor-pointer"
                    >
                        <MdAdd size={36} />
                    </motion.button>
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDeletion}
                title={deleteTarget === 'batch' ? 'Delete Notes?' : 'Delete Note?'}
                message={deleteTarget === 'batch'
                    ? `Are you sure you want to delete ${selectedNotes.length} note(s)? This action cannot be undone.`
                    : "Are you sure you want to delete this note? This action cannot be undone."
                }
                confirmText={deleteTarget === 'batch' ? `Delete ${selectedNotes.length} Notes` : "Delete Note"}
            />

            <style jsx>{`
                .note-content-preview ul, .note-content-preview ol {
                    margin-left: 1.25rem;
                    margin-top: 0.25rem;
                }
                .note-content-preview ul {
                    list-style-type: disc;
                }
                .note-content-preview ol {
                    list-style-type: decimal;
                }
            `}</style>
        </div>
    );
};

export default Notes;
