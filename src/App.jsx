import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages (will be created)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import HODManagement from './pages/admin/HODManagement';
import Journey from './pages/Journey';
import Scheduler from './pages/Scheduler';
import AddScheduler from './pages/AddScheduler';
import EditScheduler from './pages/EditScheduler';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <ThemeProvider>
            <AppProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/*" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Routes>
                                        <Route path="/dashboard" element={<Dashboard />} />
                                        <Route path="/tasks" element={<Tasks />} />
                                        <Route path="/notes" element={<Notes />} />
                                        <Route path="/profile" element={<Profile />} />
                                        <Route path="/admin" element={<AdminDashboard />} />
                                        <Route path="/admin/hods" element={<HODManagement />} />
                                        <Route path="/journey" element={<Journey />} />
                                        <Route path="/scheduler" element={<Scheduler />} />
                                        <Route path="/scheduler/add" element={<AddScheduler />} />
                                        <Route path="/scheduler/edit/:id" element={<EditScheduler />} />
                                    </Routes>
                                </Layout>
                            </ProtectedRoute>
                        } />
                    </Routes>
                    {/* PWA Components */}
                    <InstallPrompt />
                    <OfflineIndicator />
                </Router>
            </AppProvider>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    className: 'dark:bg-slate-800 dark:text-white bg-white text-slate-900 shadow-xl border dark:border-white/10 border-slate-200',
                    style: {
                        borderRadius: '16px',
                        padding: '16px',
                        fontWeight: '600',
                        fontSize: '14px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#3B82F6',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </ThemeProvider>
    );
}

export default App;
