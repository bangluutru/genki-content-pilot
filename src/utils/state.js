/**
 * Reactive State Store — Simple event-based state management
 * No dependencies, lightweight, perfect for vanilla JS SPA
 */

class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = new Map();
    }

    /** Get a value from state */
    get(key) {
        return this.state[key];
    }

    /** Set a value and notify listeners */
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;

        if (oldValue !== value) {
            this.notify(key, value, oldValue);
        }
    }

    /** Update multiple values at once */
    update(partial) {
        Object.entries(partial).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /** Subscribe to changes on a specific key */
    on(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => this.listeners.get(key)?.delete(callback);
    }

    /** Notify all listeners of a key change */
    notify(key, newValue, oldValue) {
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            keyListeners.forEach(cb => cb(newValue, oldValue));
        }

        // Also notify wildcard listeners
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
            wildcardListeners.forEach(cb => cb(key, newValue, oldValue));
        }
    }

    /** Get entire state snapshot */
    getState() {
        return { ...this.state };
    }
}

// Global app store
export const store = new Store({
    user: null,
    brand: null,
    contents: [],
    currentContent: null,
    isLoading: false,
    isOnline: navigator.onLine,
});

// Track online status
window.addEventListener('online', () => store.set('isOnline', true));
window.addEventListener('offline', () => store.set('isOnline', false));
