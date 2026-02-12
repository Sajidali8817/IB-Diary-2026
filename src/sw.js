// src/sw.js
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

let tasks = [];

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_TASKS') {
        tasks = event.data.tasks;
        console.log('SW: Tasks updated', tasks.length);
    }
});

// Check tasks every 10 seconds
setInterval(() => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    tasks.forEach(task => {
        if (!task.dueDate || !task.dueTime || task.completed) return;

        // Simple date string comparison
        const taskDate = new Date(task.dueDate);
        const today = new Date();
        const isSameDay = taskDate.toDateString() === today.toDateString();

        if (isSameDay) {
            const [h, m] = task.dueTime.split(':').map(Number);
            if (h === currentHours && m === currentMinutes) {
                // Only show if we haven't shown it recently (simple dedup needed?)
                // Better: reliance on `tag` to prevent duplicates
                self.registration.showNotification('Task Reminder', {
                    body: `It's time for: ${task.title}`,
                    icon: '/pwa-192x192.png',
                    tag: `task-${task.id}-${task.dueTime}`, // Prevents duplicate notifications
                    renotify: true,
                    requireInteraction: true,
                    vibrate: [200, 100, 200]
                });
            }
        }
    });
}, 10000);
// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Focus or open the app window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            if (windowClients.length > 0) {
                return windowClients[0].focus();
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
