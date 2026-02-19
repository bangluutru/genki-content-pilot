/**
 * Platform Connections — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';

/** Save platform connections */
export async function saveConnections(connectionData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'connections', userId);
    await setDoc(ref, {
        ...connectionData,
        userId,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    store.set('connections', connectionData);
    return connectionData;
}

/** Load platform connections */
export async function loadConnections() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const ref = doc(db, 'connections', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const connections = snap.data();
            store.set('connections', connections);
            return connections;
        }
    } catch {
        console.warn('Could not load connections');
    }
    return null;
}

/** Delete a platform connection */
export async function deleteConnection(platform) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const connections = store.get('connections') || {};
    delete connections[platform];

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'connections', userId);
    await setDoc(ref, {
        ...connections,
        userId,
        updatedAt: serverTimestamp(),
    });

    store.set('connections', connections);
}
