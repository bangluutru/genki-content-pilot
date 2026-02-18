/**
 * i18n — Internationalization system for Content Ops Copilot
 * Supports Vietnamese (vi) and English (en)
 * Default language: Vietnamese
 */

let currentLocale = 'vi'; // Default to Vietnamese
let translations = {};
const listeners = new Set();

/**
 * Initialize i18n system
 * Loads locale from Firestore (user preference) or localStorage fallback
 */
export async function initI18n(user = null) {
    // Try to load from Firestore first (if user is logged in)
    if (user) {
        try {
            const { getFirestore, doc, getDoc } = await import('firebase/firestore');
            const db = getFirestore();
            const prefsDoc = await getDoc(doc(db, 'users', user.uid, 'preferences', 'ui'));

            if (prefsDoc.exists() && prefsDoc.data().locale) {
                currentLocale = prefsDoc.data().locale;
            }
        } catch (error) {
            console.warn('Failed to load locale from Firestore:', error);
        }
    }

    // Fallback to localStorage
    if (!currentLocale || currentLocale === 'vi') {
        const savedLocale = localStorage.getItem('locale');
        if (savedLocale && ['vi', 'en'].includes(savedLocale)) {
            currentLocale = savedLocale;
        }
    }

    // Load translation file
    await loadTranslations(currentLocale);

    console.log(`✅ i18n initialized: ${currentLocale}`);
}

/**
 * Load translation file
 */
async function loadTranslations(locale) {
    try {
        const module = await import(`../locales/${locale}.json`);
        translations = module.default || module;
    } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
        // Fallback to Vietnamese if English fails
        if (locale === 'en') {
            const fallback = await import('../locales/vi.json');
            translations = fallback.default || fallback;
        }
    }
}

/**
 * Get translated string by key
 * Supports nested keys: t('nav.dashboard')
 * Supports interpolation: t('brand.logoHelp', { maxSize: '2MB' })
 */
export function t(key, params = {}) {
    const keys = key.split('.');
    let value = translations;

    // Navigate nested object
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            console.warn(`Translation missing: ${key}`);
            return key; // Return key if translation not found
        }
    }

    // Return key if value is not a string
    if (typeof value !== 'string') {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
    }

    // Interpolate parameters (replace {{param}} with value)
    let result = value;
    for (const [param, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), paramValue);
    }

    return result;
}

/**
 * Get current locale
 */
export function getLocale() {
    return currentLocale;
}

/**
 * Set locale and persist to Firestore + localStorage
 */
export async function setLocale(locale, user = null) {
    if (!['vi', 'en'].includes(locale)) {
        console.error(`Invalid locale: ${locale}`);
        return;
    }

    currentLocale = locale;
    await loadTranslations(locale);

    // Persist to localStorage
    localStorage.setItem('locale', locale);

    // Persist to Firestore (if user is logged in)
    if (user) {
        try {
            const { getFirestore, doc, setDoc } = await import('firebase/firestore');
            const db = getFirestore();
            await setDoc(doc(db, 'users', user.uid, 'preferences', 'ui'), {
                locale,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Failed to save locale to Firestore:', error);
        }
    }

    // Notify listeners (to re-render UI)
    notifyListeners();

    console.log(`🌐 Locale changed to: ${locale}`);
}

/**
 * Subscribe to locale changes
 * Returns unsubscribe function
 */
export function onLocaleChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/**
 * Notify all listeners
 */
function notifyListeners() {
    listeners.forEach(callback => {
        try {
            callback(currentLocale);
        } catch (error) {
            console.error('Locale listener error:', error);
        }
    });
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale = currentLocale) {
    const names = {
        vi: 'Tiếng Việt',
        en: 'English'
    };
    return names[locale] || locale;
}

/**
 * Get locale flag emoji
 */
export function getLocaleFlag(locale = currentLocale) {
    const flags = {
        vi: '🇻🇳',
        en: '🇬🇧'
    };
    return flags[locale] || '🌐';
}
