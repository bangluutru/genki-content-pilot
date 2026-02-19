/**
 * Workspace & Team — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';
import { loadContents } from './content.js';

/** Save workspace */
export async function saveWorkspace(workspaceData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'workspaces', userId);
    await setDoc(ref, {
        ...workspaceData,
        ownerId: userId,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    store.set('workspace', workspaceData);
    return workspaceData;
}

/** Load workspace */
export async function loadWorkspace() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const ref = doc(db, 'workspaces', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const workspace = snap.data();
            store.set('workspace', workspace);
            return workspace;
        }
    } catch {
        console.warn('Could not load workspace');
    }
    return null;
}

/** Load team activity (recent content as activity proxy) */
export async function loadTeamActivity() {
    const contents = store.get('contents') || await loadContents(20);
    return contents.slice(0, 20).map(c => ({
        userName: store.get('user')?.displayName || 'Bạn',
        action: `đã tạo bài "${(c.brief || c.facebook || 'Untitled').slice(0, 40)}"`,
        createdAt: c.createdAt,
    }));
}
