import React, { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the default browser install prompt
            e.preventDefault();
            // Store the event for later use
            setDeferredPrompt(e);
            // Show our custom install prompt after a delay
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000); // Show after 3 seconds
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the browser's install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for this session
        sessionStorage.setItem('installPromptDismissed', 'true');
    };

    // Don't show if already installed or dismissed
    if (isInstalled || !showPrompt || sessionStorage.getItem('installPromptDismissed')) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-slide-up">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-6 border border-blue-500/30">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
                    aria-label="Dismiss"
                >
                    <FiX size={20} />
                </button>

                {/* Content */}
                <div className="flex items-start gap-4">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <FiDownload className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">
                            Install IB E-Diary
                        </h3>
                        <p className="text-blue-100 text-sm mb-4">
                            Install our app for quick access and offline use. Works like a native app!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 bg-white text-blue-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2.5 text-white/90 hover:text-white font-medium transition-colors"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
