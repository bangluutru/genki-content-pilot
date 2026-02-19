/**
 * Brand Profile — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';

/** Save or update brand profile */
export async function saveBrand(brandData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'brands', userId);
    await setDoc(ref, {
        ...brandData,
        userId,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    store.set('brand', brandData);
    return brandData;
}

/** Load brand profile */
export async function loadBrand() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const ref = doc(db, 'brands', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const brand = snap.data();
            store.set('brand', brand);
            return brand;
        }
    } catch {
        console.warn('Could not load brand (Firebase may not be configured)');
    }
    return null;
}
