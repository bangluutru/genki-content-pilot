/**
 * Workspace & Team — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';
import { loadActivityLogs } from './activity.js';

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

/**
 * Load team activity — now backed by real activity_logs collection
 * Falls back to empty array if no logs exist yet
 */
export async function loadTeamActivity() {
    try {
        const logs = await loadActivityLogs(20);
        return logs.map(log => ({
            userName: log.userDisplayName || 'User',
            action: formatAction(log.action, log.metadata),
            createdAt: log.createdAt,
        }));
    } catch {
        return [];
    }
}

/** Format action string for display */
function formatAction(action, metadata = {}) {
    const actionLabels = {
        'content.create': `đã tạo bài "${(metadata.brief || '').slice(0, 40)}"`,
        'content.approve': 'đã duyệt một bài viết',
        'content.reject': `đã từ chối bài viết${metadata.reason ? ` — "${metadata.reason.slice(0, 30)}"` : ''}`,
        'content.delete': 'đã xoá một bài viết',
        'campaign.create': `đã tạo chiến dịch "${(metadata.name || '').slice(0, 40)}"`,
        'campaign.delete': 'đã xoá một chiến dịch',
        'pillar.generate': 'đã tạo content pillars bằng AI',
        'angle.generate': 'đã tạo content angles bằng AI',
        'member.invite': `đã mời ${metadata.email || 'thành viên mới'}`,
        'member.role_change': `đã đổi quyền thành viên`,
    };
    return actionLabels[action] || action;
}
