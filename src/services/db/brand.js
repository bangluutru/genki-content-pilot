/**
 * Brand Profile — Firestore CRUD
 * Falls back to localStorage when Firebase is not configured (demo/offline mode)
 */
import { uid, currentWorkspaceId, getFirestore } from './helpers.js';
import { hasFirebaseConfig } from '../../config/firebase.js';
import { store } from '../../utils/state.js';

const BRAND_STORAGE_KEY = 'contentpilot_brand_profile';

/** Save or update brand profile */
export async function saveBrand(brandData) {
    const userId = uid();
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) throw new Error('Not authenticated');

    // Try Firestore first
    if (hasFirebaseConfig()) {
        try {
            const { db, doc, setDoc, serverTimestamp } = await getFirestore();
            const ref = doc(db, 'brands', workspaceId);
            await setDoc(ref, {
                ...brandData,
                workspaceId,
                userId,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            store.set('brand', brandData);
            return brandData;
        } catch (e) {
            console.warn('Firestore save failed, falling back to localStorage:', e.message);
        }
    }

    // Fallback to localStorage (demo/offline mode)
    const dataToSave = {
        ...brandData,
        workspaceId,
        userId,
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(dataToSave));
    store.set('brand', brandData);
    return brandData;
}

/** Load brand profile */
export async function loadBrand() {
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) return null;

    // Try Firestore first
    if (hasFirebaseConfig()) {
        try {
            const { db, doc, getDoc } = await getFirestore();
            const ref = doc(db, 'brands', workspaceId);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const brand = snap.data();
                store.set('brand', brand);
                return brand;
            }
        } catch {
            console.warn('Could not load brand from Firestore, trying localStorage');
        }
    }

    // Fallback to localStorage
    try {
        const stored = localStorage.getItem(BRAND_STORAGE_KEY);
        if (stored) {
            const brand = JSON.parse(stored);
            store.set('brand', brand);
            return brand;
        }
    } catch {
        console.warn('Could not load brand from localStorage');
    }

    return null;
}
