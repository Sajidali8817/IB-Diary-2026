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
        <div className={`flex flex-col h-full relative ${isFocused ? 'pb-20 sm:pb-0' : ''}`}>
            {/* Toolbar */}
            <div className={`
                flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 z-[100] overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth transition-all duration-300
                ${isFocused ?
                    'fixed bottom-0 left-0 right-0 w-full rounded-none px-4 py-3 border-t border-white/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] sm:sticky sm:top-0 sm:bottom-auto sm:mb-4 sm:rounded-2xl sm:max-w-fit sm:w-auto sm:border sm:px-1' :
                    'sticky top-0 mb-4 rounded-2xl max-w-fit'
                }
            `}>
                <button
                    onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
                    className="p-2.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex-shrink-0 active:scale-95"
                    title="Bold"
                >
                    <MdFormatBold size={24} />
                </button>
                <button
                    onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
                    className="p-2.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex-shrink-0 active:scale-95"
                    title="Italic"
                >
                    <MdFormatItalic size={24} />
                </button>
                <button
                    onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
                    className="p-2.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex-shrink-0 active:scale-95"
                    title="Underline"
                >
                    <MdFormatUnderlined size={24} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0" />
                <button
                    onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
                    className="p-2.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex-shrink-0 active:scale-95"
                    title="Bullet List"
                >
                    <MdFormatListBulleted size={24} />
                </button>
                <button
                    onMouseDown={(e) => { e.preventDefault(); execCommand('insertOrderedList'); }}
                    className="p-2.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex-shrink-0 active:scale-95"
                    title="Numbered List"
                >
                    <MdFormatListNumbered size={24} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0" />

                {/* Color Options */}
                <div className="flex items-center gap-2 px-2 flex-shrink-0">
                    {[
                        { color: '#ffffff', label: 'White' },
                        { color: '#3B82F6', label: 'Blue' },
                        { color: '#EF4444', label: 'Red' },
                        { color: '#10B981', label: 'Green' },
                        { color: '#F59E0B', label: 'Amber' },
                        { color: '#8B5CF6', label: 'Purple' }
                    ].map((c) => (
                        <button
                            key={c.color}
                            onMouseDown={(e) => { e.preventDefault(); execCommand('foreColor', c.color); }}
                            className="w-6 h-6 rounded-full border border-white/10 hover:scale-125 transition-transform flex-shrink-0 active:scale-90"
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                        />
                    ))}
                </div>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    // Slight delay to allow toolbar clicks to register if not using onMouseDown
                    setTimeout(() => setIsFocused(false), 200);
                }}
                className="w-full bg-transparent text-slate-200 text-xl font-medium placeholder:text-slate-800 outline-none leading-relaxed transition-all min-h-[400px]"
                data-placeholder={placeholder}
            />

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #1e293b;
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
