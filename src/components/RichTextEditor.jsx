import React, { useRef, useEffect } from 'react';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatListBulleted, MdFormatListNumbered } from 'react-icons/md';

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);

    // Initial value setup
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, []);

    // Keep editor in sync if value changes externally (e.g. on load)
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Only update if the difference is significant to avoid cursor jumps
            if (value === '' && editorRef.current.innerHTML !== '') {
                editorRef.current.innerHTML = '';
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current.focus();
        handleInput();
    };

    const [isFocused, setIsFocused] = React.useState(false);

    // ... (existing effects and handles)

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Toolbar - Only visible when focused */}
            {isFocused && (
                <div className={`
                    fixed right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 p-1 dark:bg-slate-800/95 bg-white/95 backdrop-blur-2xl dark:border-white/20 border-slate-200 border z-[100] transition-all duration-300 rounded-2xl px-2 py-4 shadow-2xl
                    sm:sticky sm:top-0 sm:translate-y-0 sm:flex-row sm:mb-4 sm:max-w-fit sm:border-white/10 sm:px-1
                `}>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
                        className="p-2.5 dark:hover:bg-white/10 hover:bg-slate-100 rounded-xl dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-all flex-shrink-0 active:scale-95"
                        title="Bold"
                    >
                        <MdFormatBold size={24} />
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
                        className="p-2.5 dark:hover:bg-white/10 hover:bg-slate-100 rounded-xl dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-all flex-shrink-0 active:scale-95"
                        title="Italic"
                    >
                        <MdFormatItalic size={24} />
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
                        className="p-2.5 dark:hover:bg-white/10 hover:bg-slate-100 rounded-xl dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-all flex-shrink-0 active:scale-95"
                        title="Underline"
                    >
                        <MdFormatUnderlined size={24} />
                    </button>

                    <div className="dark:bg-white/10 bg-slate-200 flex-shrink-0 w-full h-px my-1 sm:w-px sm:h-6 sm:mx-1" />

                    <button
                        onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
                        className="p-2.5 dark:hover:bg-white/10 hover:bg-slate-100 rounded-xl dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-all flex-shrink-0 active:scale-95"
                        title="Bullet List"
                    >
                        <MdFormatListBulleted size={24} />
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); execCommand('insertOrderedList'); }}
                        className="p-2.5 dark:hover:bg-white/10 hover:bg-slate-100 rounded-xl dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-all flex-shrink-0 active:scale-95"
                        title="Numbered List"
                    >
                        <MdFormatListNumbered size={24} />
                    </button>

                    <div className="dark:bg-white/10 bg-slate-200 flex-shrink-0 w-full h-px my-1 sm:w-px sm:h-6 sm:mx-1" />

                    {/* Color Options */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0 px-0 py-2 sm:flex-row sm:px-2 sm:py-0">
                        {[
                            { color: '#ffffff', label: 'White' }, // Keep white for dark mode
                            { color: '#000000', label: 'Black' }, // Add black for light mode!
                            { color: '#3B82F6', label: 'Blue' },
                            { color: '#EF4444', label: 'Red' },
                            { color: '#10B981', label: 'Green' },
                            { color: '#F59E0B', label: 'Amber' },
                            { color: '#8B5CF6', label: 'Purple' }
                        ].map((c) => (
                            <button
                                key={c.color}
                                onMouseDown={(e) => { e.preventDefault(); execCommand('foreColor', c.color); }}
                                className="w-6 h-6 rounded-full dark:border-white/10 border-slate-200 border hover:scale-125 transition-transform flex-shrink-0 active:scale-90"
                                style={{ backgroundColor: c.color }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Editable Area - Scrollable */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setTimeout(() => setIsFocused(false), 200);
                }}
                className={`flex-1 w-full bg-transparent dark:text-slate-200 text-slate-800 text-xl font-medium outline-none leading-relaxed transition-all overflow-y-auto custom-scrollbar ${isFocused ? 'pr-16 sm:pr-0' : ''}`}
                data-placeholder={placeholder}
            />

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: inherit;
                    opacity: 0.4;
                    pointer-events: none;
                    display: block;
                }
                [contenteditable] {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                [contenteditable] ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }
                [contenteditable] ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
