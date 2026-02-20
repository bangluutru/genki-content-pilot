/**
 * Users — Firestore CRUD
 * Stores user profiles beyond what Firebase Auth provides
 * (roles, preferences, lastActiveAt, defaultWorkspaceId)
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';

/**
 * Create or update user profile on login
 * Called once per session — merges so existing data is preserved
 * @param {Object} authUser - Firebase Auth user { uid, email, displayName, photoURL }
 */
export async function upsertUser(authUser) {
    if (!authUser?.uid) return null;

    try {
        const { db, doc, setDoc, getDoc, serverTimestamp } = await getFirestore();
        const ref = doc(db, 'users', authUser.uid);

        // Check if user already exists
        const snap = await getDoc(ref);
        const existingData = snap.exists() ? snap.data() : {};

        const userData = {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
            lastActiveAt: serverTimestamp(),
            // Preserve existing fields (role, preferences, etc.)
            ...(!snap.exists() ? { createdAt: serverTimestamp() } : {}),
        };

        await setDoc(ref, userData, { merge: true });

        // Merge Firestore profile into local store user
        const fullUser = { ...existingData, ...userData };
        store.set('user', fullUser);
        return fullUser;
    } catch (error) {
        console.warn('Could not upsert user profile:', error);
        // Still set basic auth data in store
        store.set('user', authUser);
        return authUser;
    }
}

/** Load user profile from Firestore */
export async function loadUserProfile(userId) {
    if (!userId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            return snap.data();
        }
    } catch (error) {
        console.warn('Could not load user profile:', error);
    }
    return null;
}
