// Simple event emitter for cross-component communication
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);

        // Return unsubscribe function
        return () => {
            this.events[event] = this.events[event].filter(l => l !== listener);
        };
    }

    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
    }

    off(event, listenerToRemove) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    }
}

export const eventEmitter = new EventEmitter();
export default eventEmitter;
