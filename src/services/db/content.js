/**
 * Content — Firestore CRUD
 */
import { uid, currentWorkspaceId, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';
import { logActivity } from './activity.js';

/** Save content to Firestore */
export async function saveContent(content) {
    const userId = uid();
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) throw new Error('Not authenticated');

    const data = {
        ...content,
        id: 'mock-' + Date.now().toString(36),
        workspaceId,
        userId,
        status: content.status || 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    try {
        const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();
        const ref = doc(collection(db, 'contents'));
        data.id = ref.id;
        data.createdAt = serverTimestamp();
        data.updatedAt = serverTimestamp();
        await setDoc(ref, data);
    } catch (err) {
        console.warn('Firebase not configured, saving to local store only:', err);
        data.createdAt = new Date();
        data.updatedAt = new Date();
    }

    // Log activity (fire-and-forget)
    logActivity('content.create', 'content', data.id, { brief: content.brief || '' });

    // Update local state
    const contents = store.get('contents') || [];
    store.set('contents', [{ ...data, createdAt: new Date(), updatedAt: new Date() }, ...contents]);

    return data;
}

/** Update existing content */
export async function updateContent(contentId, updates) {
    try {
        const { db, doc, updateDoc, serverTimestamp } = await getFirestore();
        const ref = doc(db, 'contents', contentId);
        await updateDoc(ref, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn('Firebase not configured, updating local store only:', err);
    }

    // Update local state
    const contents = store.get('contents') || [];
    store.set('contents', contents.map(c =>
        c.id === contentId ? { ...c, ...updates, updatedAt: new Date() } : c
    ));
}

/** Delete content */
export async function deleteContent(contentId) {
    try {
        const { db, doc, deleteDoc } = await getFirestore();
        const ref = doc(db, 'contents', contentId);
        await deleteDoc(ref);
    } catch (err) {
        console.warn('Firebase not configured, deleting from local store only:', err);
    }

    // Log activity (fire-and-forget)
    logActivity('content.delete', 'content', contentId);

    const contents = store.get('contents') || [];
    store.set('contents', contents.filter(c => c.id !== contentId));
}

/** Load all contents for current user */
export async function loadContents(limitCount = 50) {
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) return [];

    try {
        const { db, collection, query, where, orderBy, limit, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'contents'),
            // Migrate: Query by workspaceId (Note: older docs may only have userId, 
            // a data migration might be needed if old data disappears)
            where('workspaceId', '==', workspaceId),
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
            console.error('👉 Firestore cần composite index. Chạy: npx firebase-tools deploy --only firestore:indexes');
            console.error('👉 Hoặc click link trong error message ở trên để tạo index thủ công.');
        } else if (err?.code === 'permission-denied' || err?.message?.includes('permission-denied')) {
            console.error('👉 Firestore Security Rules chưa cho phép. Kiểm tra workspace_members.');
        }
        // Re-throw to let the calling page show a meaningful error
        throw err;
    }
}

/** Approve content — persists to Firestore */
export async function approveContent(contentId) {
    const user = store.get('user');
    const updates = {
        status: 'approved',
        approvedBy: user?.email || 'unknown',
        approvedAt: new Date().toISOString(),
    };

    // Persist to Firestore (let errors bubble up to UI)
    const { db, doc, updateDoc } = await getFirestore();
    await updateDoc(doc(db, 'contents', contentId), updates);

    // Only log and update local state if DB write succeeds
    logActivity('content.approve', 'content', contentId, { newStatus: 'approved' });

    // Update local state (immutable update)
    const contents = store.get('contents') || [];
    store.set('contents', contents.map(c =>
        c.id === contentId ? { ...c, ...updates } : c
    ));
}

/** Reject content — persists to Firestore */
export async function rejectContent(contentId, reason) {
    const user = store.get('user');
    const updates = {
        status: 'rejected',
        rejectionReason: reason,
        rejectedBy: user?.email || 'unknown',
        rejectedAt: new Date().toISOString(),
    };

    // Persist to Firestore (let errors bubble up to UI)
    const { db, doc, updateDoc } = await getFirestore();
    await updateDoc(doc(db, 'contents', contentId), updates);

    // Only log and update local state if DB write succeeds
    logActivity('content.reject', 'content', contentId, { reason, newStatus: 'rejected' });

    // Update local state (immutable update)
    const contents = store.get('contents') || [];
    store.set('contents', contents.map(c =>
        c.id === contentId ? { ...c, ...updates } : c
    ));
}
