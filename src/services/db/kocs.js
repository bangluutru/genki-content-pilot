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

    // Always save to localStorage as backup
    const saveLocal = () => {
        let localKocs = JSON.parse(localStorage.getItem(`kocs_${wsId}`) || '[]');
        const idx = localKocs.findIndex(k => k.id === id);
        if (idx !== -1) localKocs[idx] = dataToSave;
        else localKocs.push(dataToSave);
        localStorage.setItem(`kocs_${wsId}`, JSON.stringify(localKocs));
    };
    saveLocal();

    if (!hasFirebaseConfig() || !db) {
        return dataToSave;
    }

    try {
        const docRef = doc(db, 'kocProfiles', id);
        await setDoc(docRef, dataToSave, { merge: true });
        return dataToSave;
    } catch (e) {
        console.warn('saveKoc Firestore failed, localStorage backup used:', e.message);
        return dataToSave;
    }
}

export async function loadKocs() {
    const wsId = currentWorkspaceId();
    if (!wsId) return [];

    // Always try localStorage first (fast, always available)
    const localKocs = JSON.parse(localStorage.getItem(`kocs_${wsId}`) || '[]');

    if (!hasFirebaseConfig() || !db) {
        return localKocs;
    }

    try {
        const q = query(
            collection(db, 'kocProfiles'),
            where('workspaceId', '==', wsId),
            orderBy('createdAt', 'desc')
        );
        const { getDocs } = await import('firebase/firestore');
        const snap = await getDocs(q);
        const firestoreKocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sync Firestore data back to localStorage for consistency
        if (firestoreKocs.length > 0) {
            localStorage.setItem(`kocs_${wsId}`, JSON.stringify(firestoreKocs));
            return firestoreKocs;
        }
        // If Firestore is empty but localStorage has data, use localStorage
        return localKocs;
    } catch (e) {
        console.warn('loadKocs Firestore error, using localStorage:', e.message);
        return localKocs;
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
