/**
 * Firebase Configuration
 * All Firebase config values from environment variables
 * Gracefully handles missing config (dev mode without .env)
 */
import { hasFirebaseConfig } from '../utils/firebaseStatus.js';

let app = null;
let auth = null;
let db = null;
let storage = null;
let _initialized = false;

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export { hasFirebaseConfig };

/** Lazily initialize Firebase (only when needed) */
export async function initFirebase() {
    if (_initialized) return { app, auth, db };

    if (!hasFirebaseConfig()) {
        console.warn('⚠️ Firebase config missing. Running in offline/demo mode.');
        _initialized = true;
        return { app: null, auth: null, db: null, storage: null };
    }

    try {
        const { initializeApp } = await import('firebase/app');
        const { getAuth } = await import('firebase/auth');
        const { getFirestore } = await import('firebase/firestore');
        const { getStorage } = await import('firebase/storage');

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        _initialized = true;
        console.log('✅ Firebase initialized');
    } catch (error) {
        console.error('Firebase init failed:', error);
        _initialized = true;
    }

    return { app, auth, db, storage };
}

export { app, auth, db, storage };
