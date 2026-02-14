import React from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = "" }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-xl dark:bg-slate-800 bg-white shadow-lg dark:shadow-none border dark:border-white/10 border-slate-200 flex items-center justify-center dark:text-amber-400 text-blue-600 transition-all active:scale-90 hover:scale-105 ${className}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
        </button>
    );
};

export default ThemeToggle;
