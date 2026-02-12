// Web Notification Service
class NotificationService {
    constructor() {
        this.permission = 'default';
        this.scheduledNotifications = new Map();
    }

    // Request notification permission
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        return false;
    }

    // Show notification
    showNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        const notification = new Notification(title, {
            icon: '/vite.svg',
            badge: '/vite.svg',
            ...options,
        });

        return notification;
    }

    // Schedule task notification
    async scheduleTaskNotification(task) {
        if (!task.dueDate || !task.dueTime) return null;

        try {
            const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
            const now = new Date();
            const timeUntilDue = dueDateTime.getTime() - now.getTime();

            if (timeUntilDue <= 0) {
                console.log('Task due date is in the past');
                return null;
            }

            const timeoutId = setTimeout(() => {
                this.showNotification('Task Due Now!', {
                    body: task.title,
                    tag: `task-${task.id}`,
                });
                this.scheduledNotifications.delete(`task-${task.id}`);
            }, timeUntilDue);

            this.scheduledNotifications.set(`task-${task.id}`, timeoutId);
            console.log(`✅ Scheduled notification for task: ${task.title}`);
            return `task-${task.id}`;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    }

    // Schedule reminder before task
    async scheduleTaskReminderBefore(task, minutesBefore = 15) {
        if (!task.dueDate || !task.dueTime) return null;

        try {
            const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
            const reminderTime = new Date(dueDateTime.getTime() - minutesBefore * 60 * 1000);
            const now = new Date();
            const timeUntilReminder = reminderTime.getTime() - now.getTime();

            if (timeUntilReminder <= 0) {
                console.log('Reminder time is in the past');
                return null;
            }

            const timeoutId = setTimeout(() => {
                this.showNotification(`Task Due in ${minutesBefore} Minutes`, {
                    body: task.title,
                    tag: `reminder-${task.id}`,
                });
                this.scheduledNotifications.delete(`reminder-${task.id}`);
            }, timeUntilReminder);

            this.scheduledNotifications.set(`reminder-${task.id}`, timeoutId);
            console.log(`✅ Scheduled reminder for task: ${task.title}`);
            return `reminder-${task.id}`;
        } catch (error) {
            console.error('Error scheduling reminder:', error);
            return null;
        }
    }

    // Cancel task notifications
    async cancelTaskNotifications(taskId) {
        const taskNotifId = `task-${taskId}`;
        const reminderNotifId = `reminder-${taskId}`;

        if (this.scheduledNotifications.has(taskNotifId)) {
            clearTimeout(this.scheduledNotifications.get(taskNotifId));
            this.scheduledNotifications.delete(taskNotifId);
        }

        if (this.scheduledNotifications.has(reminderNotifId)) {
            clearTimeout(this.scheduledNotifications.get(reminderNotifId));
            this.scheduledNotifications.delete(reminderNotifId);
        }

        console.log(`🗑️ Cancelled notifications for task: ${taskId}`);
    }

    // Reschedule all pending notifications
    async rescheduleAllPendingNotifications(tasks) {
        const updatedTasks = [];

        for (const task of tasks) {
            if (!task.completed && task.dueDate && task.dueTime) {
                const notificationId = await this.scheduleTaskNotification(task);
                const reminderNotificationId = await this.scheduleTaskReminderBefore(task, 15);

                updatedTasks.push({
                    ...task,
                    notificationId,
                    reminderNotificationId,
                });
            } else {
                updatedTasks.push(task);
            }
        }

        return updatedTasks;
    }
}

const notificationService = new NotificationService();

export const {
    requestPermission,
    showNotification,
    scheduleTaskNotification,
    scheduleTaskReminderBefore,
    cancelTaskNotifications,
    rescheduleAllPendingNotifications,
} = {
    requestPermission: () => notificationService.requestPermission(),
    showNotification: (title, options) => notificationService.showNotification(title, options),
    scheduleTaskNotification: (task) => notificationService.scheduleTaskNotification(task),
    scheduleTaskReminderBefore: (task, minutes) => notificationService.scheduleTaskReminderBefore(task, minutes),
    cancelTaskNotifications: (taskId) => notificationService.cancelTaskNotifications(taskId),
    rescheduleAllPendingNotifications: (tasks) => notificationService.rescheduleAllPendingNotifications(tasks),
};

export default notificationService;
