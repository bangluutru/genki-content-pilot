/**
 * Activity Logs — Firestore CRUD
 * Records user actions for audit trail and activity feed
 */
import { uid, currentWorkspaceId, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';

/**
 * Log a user activity to Firestore
 * Fire-and-forget — errors are swallowed to never block main flow
 * @param {string} action - e.g. 'content.create', 'content.approve', 'campaign.delete'
 * @param {string} targetType - 'content' | 'campaign' | 'pillar' | 'angle' | 'member'
 * @param {string} targetId - ID of the affected entity
 * @param {Object} [metadata] - Extra context { oldStatus, newStatus, targetName, ... }
 */
export async function logActivity(action, targetType, targetId, metadata = {}) {
    const userId = uid();
    const workspaceId = currentWorkspaceId();
    if (!userId || !workspaceId) return;

    const user = store.get('user');
    const logEntry = {
        workspaceId,
        userId,
        userDisplayName: user?.displayName || user?.email || 'Unknown',
        action,
        targetType,
        targetId: targetId || '',
        metadata,
        createdAt: new Date().toISOString(), // Use ISO for immediate local reading
    };

    // Write to Firestore (fire-and-forget)
    try {
        const { db, collection, addDoc, serverTimestamp } = await getFirestore();
        await addDoc(collection(db, 'activity_logs'), {
            ...logEntry,
            createdAt: serverTimestamp(), // Overwrite with server timestamp for Firestore
        });
    } catch (error) {
        console.warn('Could not log activity:', error);
    }
}

/**
 * Load recent activity logs
 * @param {number} limitCount - Max entries to load
 * @returns {Array} Activity log entries sorted by most recent
 */
export async function loadActivityLogs(limitCount = 30) {
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) return [];

    try {
        const { db, collection, query, where, orderBy, limit, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'activity_logs'),
            where('workspaceId', '==', workspaceId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            };
        });
    } catch (error) {
        console.warn('Could not load activity logs:', error);
        return [];
    }
}
