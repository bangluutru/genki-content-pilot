/**
 * Templates — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';

/** Save a brief template */
export async function saveTemplate(templateData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(collection(db, 'templates'));
    const data = {
        ...templateData,
        id: ref.id,
        userId,
        createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return data;
}

/** Load user templates */
export async function loadTemplates() {
    const userId = uid();
    if (!userId) return [];

    try {
        const { db, collection, query, where, orderBy, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'templates'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch {
        console.warn('Could not load templates');
        return [];
    }
}

/** Delete a template */
export async function deleteTemplate(templateId) {
    const { db, doc, deleteDoc } = await getFirestore();
    await deleteDoc(doc(db, 'templates', templateId));
}
