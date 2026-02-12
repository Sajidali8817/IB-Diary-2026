// src/sw.js
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

let tasks = [];

// --- IndexedDB Helper ---
const DB_NAME = 'ib-diary-sw-db';
const STORE_NAME = 'tasks-store';

const getTasksFromDB = () => {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const getReq = store.get('current-tasks');
            getReq.onsuccess = () => resolve(getReq.result || []);
            getReq.onerror = () => resolve([]);
        };
        request.onerror = () => resolve([]);
    });
};

const saveTasksToDB = (newTasks) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(newTasks, 'current-tasks');
    };
};

// Load tasks on startup
getTasksFromDB().then(res => {
    tasks = res;
    console.log('SW: Tasks loaded from DB', tasks.length);
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_TASKS') {
        tasks = event.data.tasks;
        saveTasksToDB(tasks);
        console.log('SW: Tasks updated and saved', tasks.length);
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
                self.registration.showNotification('⏰ Task Alarm!', {
                    body: `It's time: ${task.title}`,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: `task-${task.id}`,
                    renotify: true,
                    requireInteraction: true,
                    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500],
                    data: {
                        taskId: task.id,
                        title: task.title
                    },
                    actions: [
                        { action: 'open', title: '📂 Open Diary' },
                        { action: 'stop', title: '🛑 Stop Alert' }
                    ]
                });
            }
        }
    });
}, 10000);

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    notification.close();

    if (action === 'stop') {
        // Just close the notification (we could sync state back but close is primary)
        return;
    }

    // Default or "open" action: Focus or open the app window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            if (windowClients.length > 0) {
                // Send message to the app to trigger alarm sound even if it was just focused
                windowClients[0].postMessage({
                    type: 'NOTIFICATION_OPENED',
                    taskId: notification.data?.taskId
                });
                return windowClients[0].focus();
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
