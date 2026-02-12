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

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-1 mb-4 p-1 bg-white/5 rounded-2xl w-full max-w-fit sticky top-0 z-10 backdrop-blur-md border border-white/5 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
                <button
                    onClick={() => execCommand('bold')}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0"
                    title="Bold"
                >
                    <MdFormatBold size={20} />
                </button>
                <button
                    onClick={() => execCommand('italic')}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0"
                    title="Italic"
                >
                    <MdFormatItalic size={20} />
                </button>
                <button
                    onClick={() => execCommand('underline')}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0"
                    title="Underline"
                >
                    <MdFormatUnderlined size={20} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0" />
                <button
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0"
                    title="Bullet List"
                >
                    <MdFormatListBulleted size={20} />
                </button>
                <button
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0"
                    title="Numbered List"
                >
                    <MdFormatListNumbered size={20} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0" />

                {/* Color Options */}
                <div className="flex items-center gap-1.5 px-2 flex-shrink-0">
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
                            onClick={() => execCommand('foreColor', c.color)}
                            className="w-5 h-5 rounded-full border border-white/10 hover:scale-125 transition-transform flex-shrink-0"
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
