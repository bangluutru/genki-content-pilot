/**
 * Super Admin configuration
 * Only super admins can create new workspaces.
 * This list must match the UIDs in firestore.rules.
 */
export const SUPER_ADMIN_UIDS = [
    '7qxzjNiNAlbeYFFnRlu3qvBBRMw2', // bangluutru@gmail.com
    'EYsMlTXMwPYjkuc7nEoMdn39CHr1', // haibangtran@gmail.com
];

/**
 * Check if the current user is a super admin
 * @param {string} uid - Firebase UID
 * @returns {boolean}
 */
export function isSuperAdmin(uid) {
    return SUPER_ADMIN_UIDS.includes(uid);
}
