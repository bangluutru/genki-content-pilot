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

/**
 * Create a brand new workspace (super admin only — enforced by Firestore rules)
 * @param {string} name - Workspace name
 * @returns {Object} The created workspace
 */
export async function createNewWorkspace(name) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, setDoc } = await getFirestore();
    const workspaceId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);

    // 1. Create workspace_members FIRST (needed for RBAC read access)
    const memberId = `${userId}_${workspaceId}`;
    await setDoc(doc(db, 'workspace_members', memberId), {
        workspaceId,
        userId,
        email: store.get('user')?.email || '',
        displayName: store.get('user')?.displayName || '',
        role: 'admin',
        status: 'active',
        joinedAt: new Date().toISOString(),
    });

    // 2. Create workspace
    const workspaceData = {
        id: workspaceId,
        name,
        tier: 'free',
        ownerId: userId,
        settings: {},
        createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'workspaces', workspaceId), workspaceData);

    // 3. Update state — add to userWorkspaces + set as active
    const existing = store.get('userWorkspaces') || [];
    const withRole = { ...workspaceData, role: 'admin' };
    store.set('userWorkspaces', [...existing, withRole]);
    store.set('workspace', withRole);
    localStorage.setItem('activeWorkspaceId', workspaceId);

    return withRole;
}

/** Load workspace — prioritizes saved preference, then first active membership */
export async function loadWorkspace() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, collection, query, where, getDocs, doc, getDoc } = await getFirestore();

        // 1. Find all workspaces user belongs to
        const q = query(
            collection(db, 'workspace_members'),
            where('userId', '==', userId),
            where('status', '==', 'active')
        );
        const memberSnap = await getDocs(q);

        if (memberSnap.empty) {
            // User has no workspace — do NOT auto-create
            store.set('workspace', null);
            store.set('userWorkspaces', []);
            return null;
        }

        // 2. Build list of all memberships
        const memberships = memberSnap.docs.map(d => ({
            workspaceId: d.data().workspaceId,
            role: d.data().role,
        }));

        // 3. Load workspace details for each membership
        const workspaces = [];
        for (const m of memberships) {
            try {
                const ref = doc(db, 'workspaces', m.workspaceId);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    workspaces.push({ id: m.workspaceId, role: m.role, ...snap.data() });
                }
            } catch (e) {
                console.warn('Could not load workspace:', m.workspaceId, e);
            }
        }

        store.set('userWorkspaces', workspaces);

        if (workspaces.length === 0) {
            store.set('workspace', null);
            return null;
        }

        // 4. Select workspace: prefer saved choice, then first available
        const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const preferred = savedWorkspaceId
            ? workspaces.find(w => w.id === savedWorkspaceId)
            : null;
        const active = preferred || workspaces[0];

        store.set('workspace', active);
        localStorage.setItem('activeWorkspaceId', active.id);
        return active;
    } catch (err) {
        console.warn('Could not load workspace:', err);
        store.set('workspace', null);
        store.set('userWorkspaces', []);
    }
    return null;
}

/**
 * Load all workspaces the current user belongs to
 * @returns {Array} Workspace objects with role
 */
export async function loadAllUserWorkspaces() {
    return store.get('userWorkspaces') || [];
}

/**
 * Switch to a different workspace
 * @param {string} workspaceId
 */
export async function switchWorkspace(workspaceId) {
    const workspaces = store.get('userWorkspaces') || [];
    const target = workspaces.find(w => w.id === workspaceId);
    if (!target) return null;

    store.set('workspace', target);
    localStorage.setItem('activeWorkspaceId', workspaceId);
    return target;
}

/** 
 * Initialize a personal workspace for a new or legacy user 
 * NOTE: No longer auto-called. Only used when admin explicitly creates a workspace.
 * Ensures they have both a workspace doc and a workspace_members doc for RBAC
 */
async function initializePersonalWorkspace(userId) {
    const { db, doc, getDoc, setDoc } = await getFirestore();
    const workspaceId = userId; // Personal workspace ID matches UID

    // 1. CRITICAL: Create Workspace Member FIRST to satisfy firestore.rules RBAC check
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
        return null;
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
