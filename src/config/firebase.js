/**
 * Firebase Configuration
 * All Firebase config values from environment variables
 * Gracefully handles missing config (dev mode without .env)
 */

let app = null;
let auth = null;
let db = null;
let _initialized = false;

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Check if Firebase config is present */
export function hasFirebaseConfig() {
    return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/** Lazily initialize Firebase (only when needed) */
export async function initFirebase() {
    if (_initialized) return { app, auth, db };

    if (!hasFirebaseConfig()) {
        console.warn('⚠️ Firebase config missing. Running in offline/demo mode.');
        _initialized = true;
        return { app: null, auth: null, db: null };
    }

    try {
        const { initializeApp } = await import('firebase/app');
        const { getAuth } = await import('firebase/auth');
        const { getFirestore } = await import('firebase/firestore');

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        _initialized = true;
        console.log('✅ Firebase initialized');
    } catch (error) {
        console.error('Firebase init failed:', error);
        _initialized = true;
    }

    return { app, auth, db };
}

export { app, auth, db };
