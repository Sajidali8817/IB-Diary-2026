// Storage utility for localStorage with JSON serialization
const storage = {
    // Save data to localStorage
    setItem: async (key, value) => {
        try {
            const jsonValue = JSON.stringify(value);
            localStorage.setItem(key, jsonValue);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },

    // Get data from localStorage
    getItem: async (key) => {
        try {
            const jsonValue = localStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    // Remove item from localStorage
    removeItem: async (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    },

    // Clear all localStorage
    clear: async () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    },
};

// Task storage functions
export const loadTasks = async (prefix = '') => {
    try {
        const tasks = await storage.getItem(`${prefix}@tasks`);
        return tasks || [];
    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
};

export const saveTasks = async (tasks, prefix = '') => {
    try {
        await storage.setItem(`${prefix}@tasks`, tasks);
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
};

// Notes storage functions
export const loadNotes = async (prefix = '') => {
    try {
        const notes = await storage.getItem(`${prefix}@notes`);
        return notes || [];
    } catch (error) {
        console.error('Error loading notes:', error);
        return [];
    }
};

export const saveNotes = async (notes, prefix = '') => {
    try {
        await storage.setItem(`${prefix}@notes`, notes);
    } catch (error) {
        console.error('Error saving notes:', error);
    }
};

export default storage;
