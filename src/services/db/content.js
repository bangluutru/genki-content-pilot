/**
 * Content — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';

/** Save content to Firestore */
export async function saveContent(content) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(collection(db, 'contents'));
    const data = {
        ...content,
        id: ref.id,
        userId,
        status: content.status || 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data);

    // Update local state
    const contents = store.get('contents') || [];
    store.set('contents', [{ ...data, createdAt: new Date(), updatedAt: new Date() }, ...contents]);

    return data;
}

/** Update existing content */
export async function updateContent(contentId, updates) {
    const { db, doc, updateDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'contents', contentId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });

    // Update local state
    const contents = store.get('contents') || [];
    store.set('contents', contents.map(c =>
        c.id === contentId ? { ...c, ...updates, updatedAt: new Date() } : c
    ));
}

/** Delete content */
export async function deleteContent(contentId) {
    const { db, doc, deleteDoc } = await getFirestore();
    const ref = doc(db, 'contents', contentId);
    await deleteDoc(ref);

    const contents = store.get('contents') || [];
    store.set('contents', contents.filter(c => c.id !== contentId));
}

/** Load all contents for current user */
export async function loadContents(limitCount = 50) {
    const userId = uid();
    if (!userId) return [];

    try {
        const { db, collection, query, where, orderBy, limit, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'contents'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        const contents = snap.docs.map(d => ({
            ...d.data(),
            id: d.id,
            createdAt: d.data().createdAt?.toDate() || new Date(),
            updatedAt: d.data().updatedAt?.toDate() || new Date(),
        }));

        store.set('contents', contents);
        return contents;
    } catch (err) {
        console.error('❌ Could not load contents:', err?.code || err?.message || err);
        if (err?.message?.includes('requires an index')) {
            console.error('👉 Firestore cần composite index. Xem link trong error message ở trên để tạo.');
        } else if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
            console.error('👉 Firestore Security Rules chưa cho phép. Xem README: Firestore Security Rules');
        }
        return [];
    }
}

/** Approve content */
export async function approveContent(contentId) {
    const contents = store.get('contents') || [];
    const content = contents.find(c => c.id === contentId);
    if (content) {
        content.status = 'approved';
        content.approvedBy = store.get('user')?.email;
        content.approvedAt = new Date().toISOString();
        store.set('contents', contents);
    }
}

/** Reject content */
export async function rejectContent(contentId, reason) {
    const contents = store.get('contents') || [];
    const content = contents.find(c => c.id === contentId);
    if (content) {
        content.status = 'rejected';
        content.rejectionReason = reason;
        content.rejectedBy = store.get('user')?.email;
        content.rejectedAt = new Date().toISOString();
        store.set('contents', contents);
    }
}
