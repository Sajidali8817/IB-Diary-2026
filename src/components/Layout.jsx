import React, { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import AddActionMenu from './AddActionMenu';
import { useNavigate } from 'react-router-dom';

import Sidebar from './Sidebar';
import TaskAlertManager from './TaskAlertManager';

const Layout = ({ children }) => {
    const [actionMenuVisible, setActionMenuVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleOpenMenu = () => setActionMenuVisible(true);
        window.addEventListener('open-add-menu', handleOpenMenu);
        return () => window.removeEventListener('open-add-menu', handleOpenMenu);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 flex flex-col sm:flex-row">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 min-h-screen pb-24 sm:pb-0 sm:pl-64 lg:pl-72 transition-all duration-300 relative overflow-x-hidden">
                {children}
            </main>

            {/* Persistent Mobile Bottom Navigation */}
            <BottomNav />

            {/* Global Add Menu */}
            <AddActionMenu
                visible={actionMenuVisible}
                onClose={() => setActionMenuVisible(false)}
                onAddTask={() => navigate('/tasks?add=true')}
                onAddNote={() => navigate('/notes?add=true')}
                onAddSchedule={() => navigate('/scheduler/add')}
            />

            {/* Global Task Alerts */}
            <TaskAlertManager />
        </div>
    );
};

export default Layout;
