import { collection, doc, setDoc, getDocs, deleteDoc, query, where, orderBy, getFirestore } from 'firebase/firestore';
import { db, hasFirebaseConfig } from '../../config/firebase.js';
import { currentWorkspaceId } from './helpers.js';

export async function saveKoc(kocData) {
    const wsId = currentWorkspaceId();
    if (!wsId) return;

    const id = kocData.id || `koc_${Date.now()}`;

    const dataToSave = {
        ...kocData,
        id,
        workspaceId: wsId,
        updatedAt: new Date().toISOString()
    };
    if (!kocData.id) {
        dataToSave.createdAt = new Date().toISOString();
    }

    // fallback for local testing without valid Firebase connection
    if (!hasFirebaseConfig() || !db) {
        let localKocs = JSON.parse(localStorage.getItem(`kocs_${wsId}`) || '[]');
        const idx = localKocs.findIndex(k => k.id === id);
        if (idx !== -1) localKocs[idx] = dataToSave;
        else localKocs.push(dataToSave);
        localStorage.setItem(`kocs_${wsId}`, JSON.stringify(localKocs));
        return dataToSave;
    }

    try {
        const docRef = doc(db, 'kocProfiles', id);
        await setDoc(docRef, dataToSave, { merge: true });
        return dataToSave;
    } catch (e) {
        console.error('saveKoc error:', e);
        throw e;
    }
}

export async function loadKocs() {
    const wsId = currentWorkspaceId();
    if (!wsId) return [];

    if (!hasFirebaseConfig() || !db) {
        return JSON.parse(localStorage.getItem(`kocs_${wsId}`) || '[]');
    }

    try {
        const q = query(
            collection(db, 'kocProfiles'),
            where('workspaceId', '==', wsId),
            orderBy('createdAt', 'desc')
        );
        const { getDocs } = await import('firebase/firestore'); // ensure getDocs is properly imported
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        if (e.code === 'permission-denied') return []; // fallback if not configured
        console.warn('loadKocs using fallback due to error:', e);
        return JSON.parse(localStorage.getItem(`kocs_${wsId}`) || '[]');
    }
}

export async function deleteKoc(id) {
    const wsId = currentWorkspaceId();
    if (!wsId) return;

    if (!hasFirebaseConfig() || !db) {
        let localKocs = JSON.parse(localStorage.getItem(`kocs_${wsId}`) || '[]');
        localKocs = localKocs.filter(k => k.id !== id);
        localStorage.setItem(`kocs_${wsId}`, JSON.stringify(localKocs));
        return true;
    }

    const { deleteDoc, doc } = await import('firebase/firestore');
    try {
        await deleteDoc(doc(db, 'kocProfiles', id));
        return true;
    } catch (e) {
        console.warn('deleteKoc fallback:', e);
        let localKocs = JSON.parse(localStorage.getItem(`kocs_${wsId}`) || '[]');
        localKocs = localKocs.filter(k => k.id !== id);
        localStorage.setItem(`kocs_${wsId}`, JSON.stringify(localKocs));
        return true;
    }
}
