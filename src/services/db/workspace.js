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

    const workspaceId = workspaceData.id || userId;
    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'workspaces', workspaceId);

    const dataToSave = {
        ...workspaceData,
        id: workspaceId,
        ownerId: workspaceData.ownerId || userId,
        updatedAt: serverTimestamp(),
    };

    await setDoc(ref, dataToSave, { merge: true });

    store.set('workspace', dataToSave);
    return dataToSave;
}

/** Load workspace */
export async function loadWorkspace() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, collection, query, where, getDocs, doc, getDoc } = await getFirestore();

        // 1. Check workspace_members to see which workspace user belongs to
        const q = query(
            collection(db, 'workspace_members'),
            where('userId', '==', userId),
            where('status', '==', 'active')
        );
        const memberSnap = await getDocs(q);

        if (!memberSnap.empty) {
            // Load the first workspace found
            const workspaceId = memberSnap.docs[0].data().workspaceId;
            const ref = doc(db, 'workspaces', workspaceId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const workspace = { id: workspaceId, ...snap.data() };
                store.set('workspace', workspace);
                return workspace;
            }
        }

        // 2. Fallback: Auto-initialize personal workspace if neither exists
        return await initializePersonalWorkspace(userId);
    } catch (err) {
        console.warn('Could not load workspace:', err);
    }
    return null;
}

/** 
 * Initialize a personal workspace for a new or legacy user 
 * Ensures they have both a workspace doc and a workspace_members doc for RBAC
 */
async function initializePersonalWorkspace(userId) {
    const { db, doc, getDoc, setDoc } = await getFirestore();
    const workspaceId = userId; // Personal workspace ID matches UID

    // 1. CRITICAL: Create Workspace Member FIRST to satisfy firestore.rules RBAC check
    // If not, we won't have read/write permissions for workspaces
    const memberId = `${userId}_${workspaceId}`;
    const memberRef = doc(db, 'workspace_members', memberId);
    try {
        await setDoc(memberRef, {
            workspaceId,
            userId,
            email: store.get('user')?.email || '',
            displayName: store.get('user')?.displayName || '',
            role: 'admin',
            status: 'active',
            joinedAt: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.warn('Silent fallback for member init:', e);
    }

    // 2. Safely read and init Workspace
    const wsRef = doc(db, 'workspaces', workspaceId);
    let workspaceData;

    try {
        const wsSnap = await getDoc(wsRef);
        if (wsSnap.exists()) {
            workspaceData = { id: workspaceId, ...wsSnap.data() };
        } else {
            workspaceData = {
                id: workspaceId,
                name: `${store.get('user')?.displayName || 'My'} Team`,
                tier: 'free',
                ownerId: userId,
                settings: {},
                createdAt: new Date().toISOString()
            };
            await setDoc(wsRef, workspaceData);
        }
    } catch (err) {
        console.warn('Failed to load/init workspace data:', err);
        return null; // Stop execution to avoid partial state
    }

    store.set('workspace', workspaceData);
    return workspaceData;
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
