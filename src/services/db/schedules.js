/**
 * Schedules — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';

/** Save a content schedule */
export async function saveSchedule(scheduleData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(collection(db, 'schedules'));
    const data = {
        ...scheduleData,
        id: ref.id,
        userId,
        createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return data;
}

/** Load schedules for a given month */
export async function loadSchedules(month, year) {
    const userId = uid();
    if (!userId) return [];

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

    try {
        const { db, collection, query, where, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'schedules'),
            where('userId', '==', userId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch {
        console.warn('Could not load schedules');
        return [];
    }
}

/** Delete a schedule */
export async function deleteSchedule(scheduleId) {
    const { db, doc, deleteDoc } = await getFirestore();
    await deleteDoc(doc(db, 'schedules', scheduleId));
}
