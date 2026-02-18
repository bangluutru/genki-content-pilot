/**
 * Theme — Light/Dark mode system for Content Ops Copilot
 * Persists theme to Firestore + localStorage
 * Applies theme class to <html> element
 */

let currentTheme = 'dark'; // Default to dark
const listeners = new Set();

/**
 * Initialize theme system
 * Loads theme from Firestore (user preference) or localStorage fallback
 * NOTE: This runs AFTER the inline script in index.html, which prevents white flash
 */
export async function initTheme(user = null) {
    // Try to load from Firestore first (if user is logged in)
    if (user) {
        try {
            const { getFirestore, doc, getDoc } = await import('firebase/firestore');
            const db = getFirestore();
            const prefsDoc = await getDoc(doc(db, 'users', user.uid, 'preferences', 'ui'));

            if (prefsDoc.exists() && prefsDoc.data().theme) {
                currentTheme = prefsDoc.data().theme;
                applyTheme(currentTheme);
            }
        } catch (error) {
            console.warn('Failed to load theme from Firestore:', error);
        }
    }

    // Fallback to localStorage (already applied by inline script)
    if (!user || !currentTheme) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            currentTheme = savedTheme;
        } else {
            // Default to system preference
            currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    }

    console.log(`🎨 Theme initialized: ${currentTheme}`);
}

/**
 * Apply theme to HTML element
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Get current theme
 */
export function getTheme() {
    return currentTheme;
}

/**
 * Set theme and persist to Firestore + localStorage
 */
export async function setTheme(theme, user = null) {
    if (!['light', 'dark'].includes(theme)) {
        console.error(`Invalid theme: ${theme}`);
        return;
    }

    currentTheme = theme;
    applyTheme(theme);

    // Persist to localStorage
    localStorage.setItem('theme', theme);

    // Persist to Firestore (if user is logged in)
    if (user) {
        try {
            const { getFirestore, doc, setDoc } = await import('firebase/firestore');
            const db = getFirestore();
            await setDoc(doc(db, 'users', user.uid, 'preferences', 'ui'), {
                theme,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Failed to save theme to Firestore:', error);
        }
    }

    // Notify listeners (to update UI icons, etc.)
    notifyListeners();

    console.log(`🎨 Theme changed to: ${theme}`);
}

/**
 * Toggle between light and dark
 */
export async function toggleTheme(user = null) {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme, user);
}

/**
 * Subscribe to theme changes
 * Returns unsubscribe function
 */
export function onThemeChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/**
 * Notify all listeners
 */
function notifyListeners() {
    listeners.forEach(callback => {
        try {
            callback(currentTheme);
        } catch (error) {
            console.error('Theme listener error:', error);
        }
    });
}

/**
 * Get theme icon
 */
export function getThemeIcon(theme = currentTheme) {
    return theme === 'dark' ? '🌙' : '☀️';
}

/**
 * Get theme display name
 */
export function getThemeDisplayName(theme = currentTheme) {
    // Import t() function for translations
    // Note: This creates a circular dependency, so we'll use a simple mapping
    const names = {
        light: { vi: 'Sáng', en: 'Light' },
        dark: { vi: 'Tối', en: 'Dark' }
    };

    // Get current locale from localStorage
    const locale = localStorage.getItem('locale') || 'vi';
    return names[theme]?.[locale] || theme;
}
