/**
 * SPA Router — Hash-based routing for ContentPilot v2
 * Simple, no dependencies, handles back/forward buttons
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeHooks = [];
        window.addEventListener('hashchange', () => this.resolve());
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., 'dashboard', 'create')
     * @param {Function} handler - Async function that returns HTML string or renders to container
     */
    on(path, handler) {
        this.routes.set(path, handler);
        return this;
    }

    /** Add a before-navigation hook (e.g., auth guard) */
    before(hook) {
        this.beforeHooks.push(hook);
        return this;
    }

    /** Navigate to a route */
    navigate(path) {
        window.location.hash = `#/${path}`;
    }

    /** Get current hash path */
    getPath() {
        const hash = window.location.hash.slice(2) || '';
        return hash.split('?')[0]; // Remove query params
    }

    /** Get query params from hash */
    getParams() {
        const hash = window.location.hash.slice(2) || '';
        const queryString = hash.split('?')[1] || '';
        return Object.fromEntries(new URLSearchParams(queryString));
    }

    /** Resolve the current route */
    async resolve() {
        const path = this.getPath();

        // Run before hooks (e.g., auth guard)
        for (const hook of this.beforeHooks) {
            const result = await hook(path);
            if (result === false) return; // Hook blocked navigation
        }

        const handler = this.routes.get(path);
        if (handler) {
            this.currentRoute = path;
            await handler(this.getParams());
            this.updateActiveNav();
        } else {
            // Default route
            this.navigate('login');
        }
    }

    /** Update active nav item based on current route */
    updateActiveNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            const route = item.dataset.route;
            item.classList.toggle('active', route === this.currentRoute);
        });

        // Mobile nav
        document.querySelectorAll('.nav-item-mobile').forEach(item => {
            const route = item.dataset.route;
            item.classList.toggle('router-link-active', route === this.currentRoute);
        });
    }

    /** Start the router */
    start() {
        if (!window.location.hash) {
            this.navigate('login');
        } else {
            this.resolve();
        }
    }

    /** Get current route name */
    getCurrentRoute() {
        return this.currentRoute || this.getPath();
    }
}

export const router = new Router();

