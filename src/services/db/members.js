/**
 * Workspace Members — Firestore CRUD
 * Manages team membership and role-based access control
 *
 * Document ID format: `{userId}_{workspaceId}` for fast lookups
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';
import { logActivity } from './activity.js';

/**
 * Create a member document for a workspace
 * @param {Object} memberData - { workspaceId, userId, email, displayName, photoURL, role, status }
 */
export async function addWorkspaceMember(memberData) {
    const { db, doc, setDoc, serverTimestamp } = await getFirestore();

    const docId = `${memberData.userId}_${memberData.workspaceId}`;
    const data = {
        workspaceId: memberData.workspaceId,
        userId: memberData.userId,
        email: memberData.email || '',
        displayName: memberData.displayName || '',
        photoURL: memberData.photoURL || '',
        role: memberData.role || 'viewer',
        status: memberData.status || 'active',
        invitedBy: memberData.invitedBy || '',
        joinedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'workspace_members', docId), data, { merge: true });
    return { id: docId, ...data };
}

/**
 * Invite a member by email (creates a pending membership)
 * @param {string} workspaceId
 * @param {string} email
 * @param {string} role
 */
export async function inviteMember(workspaceId, email, role = 'editor') {
    const currentUserId = uid();
    if (!currentUserId) throw new Error('Not authenticated');

    const { db, doc, setDoc, serverTimestamp, collection, query, where, getDocs } = await getFirestore();

    // Check if already a member by email
    const q = query(
        collection(db, 'workspace_members'),
        where('workspaceId', '==', workspaceId),
        where('email', '==', email)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
        throw new Error('Email đã là thành viên của workspace này');
    }

    // Create invitation document with temporary ID
    const inviteId = `invited_${Date.now()}_${workspaceId}`;
    const data = {
        workspaceId,
        userId: null, // Will be linked when user accepts/signs in
        invitedEmail: email,
        email,
        displayName: email.split('@')[0],
        photoURL: '',
        role,
        status: 'invited',
        invitedBy: currentUserId,
        joinedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'workspace_members', inviteId), data);

    // Log activity
    logActivity('member.invite', 'member', inviteId, { email, role });

    return { id: inviteId, ...data };
}

/**
 * Load all members of a workspace
 * @param {string} workspaceId
 * @returns {Array} Member documents
 */
export async function loadWorkspaceMembers(workspaceId) {
    if (!workspaceId) return [];

    try {
        const { db, collection, query, where, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'workspace_members'),
            where('workspaceId', '==', workspaceId)
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.warn('Could not load workspace members:', error);
        return [];
    }
}

/**
 * Update a member's role
 * @param {string} memberId - Document ID
 * @param {string} newRole - 'admin' | 'editor' | 'viewer'
 */
export async function updateMemberRole(memberId, newRole) {
    const { db, doc, updateDoc, serverTimestamp } = await getFirestore();
    await updateDoc(doc(db, 'workspace_members', memberId), {
        role: newRole,
        updatedAt: serverTimestamp(),
    });

    // Log activity
    logActivity('member.role_change', 'member', memberId, { newRole });
}

/**
 * Remove a member from workspace
 * @param {string} memberId - Document ID
 */
export async function removeMember(memberId) {
    const { db, doc, deleteDoc } = await getFirestore();
    await deleteDoc(doc(db, 'workspace_members', memberId));
}

/**
 * Get the current user's role in a workspace
 * @param {string} workspaceId
 * @returns {string|null} Role or null if not a member
 */
export async function getCurrentUserRole(workspaceId) {
    const userId = uid();
    if (!userId || !workspaceId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const docId = `${userId}_${workspaceId}`;
        const snap = await getDoc(doc(db, 'workspace_members', docId));

        if (snap.exists()) {
            return snap.data().role;
        }
    } catch (error) {
        console.warn('Could not get user role:', error);
    }
    return null;
}

/**
 * Link an invited member to their real Firebase UID
 * Called when a user signs in and their email matches an invitation
 * @param {string} email
 * @param {string} realUserId - Firebase UID
 */
export async function linkInvitedMember(email, realUserId) {
    if (!email || !realUserId) return;

    try {
        const { db, collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } = await getFirestore();

        // Find any invitations for this email
        const q = query(
            collection(db, 'workspace_members'),
            where('invitedEmail', '==', email),
            where('status', '==', 'invited')
        );

        const snap = await getDocs(q);
        if (snap.empty) return;

        // Link each invitation
        for (const inviteDoc of snap.docs) {
            const inviteData = inviteDoc.data();
            const newDocId = `${realUserId}_${inviteData.workspaceId}`;

            // Create proper member document
            await setDoc(doc(db, 'workspace_members', newDocId), {
                ...inviteData,
                userId: realUserId,
                status: 'active',
                linkedAt: serverTimestamp(),
            });

            // Delete old invitation document
            await deleteDoc(doc(db, 'workspace_members', inviteDoc.id));
        }
    } catch (error) {
        console.warn('Could not link invited member:', error);
    }
}
