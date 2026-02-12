import React, { useState, useEffect } from 'react';
import { FiWifiOff, FiWifi } from 'react-icons/fi';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOffline, setShowOffline] = useState(false);
    const [showOnline, setShowOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOffline(false);
            setShowOnline(true);
            // Hide the "back online" message after 3 seconds
            setTimeout(() => {
                setShowOnline(false);
            }, 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOffline(true);
            setShowOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Show offline indicator
    if (showOffline) {
        return (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <FiWifiOff size={20} />
                    <span className="font-medium">You're offline</span>
                </div>
            </div>
        );
    }

    // Show "back online" message temporarily
    if (showOnline) {
        return (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <FiWifi size={20} />
                    <span className="font-medium">Back online</span>
                </div>
            </div>
        );
    }

    return null;
};

export default OfflineIndicator;
