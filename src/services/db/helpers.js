/**
 * Shared Firestore Helpers
 * Common utilities for all db modules
 */
import { initFirebase, hasFirebaseConfig } from '../../config/firebase.js';
import { store } from '../../utils/state.js';

/** Get current user ID from store */
export function uid() {
    return store.get('user')?.uid;
}

/** Get Firestore instance and modules lazily */
export async function getFirestore() {
    if (!hasFirebaseConfig()) {
        throw new Error('Firebase not configured');
    }
    const { db } = await initFirebase();
    if (!db) throw new Error('Firestore not available');
    const firestoreModule = await import('firebase/firestore');
    return { db, ...firestoreModule };
}
