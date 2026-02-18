// common.js — Shared Firestore helpers
// Dùng chung cho tất cả domain modules (brands, contents, settings, ...)

import { serverTimestamp } from 'firebase/firestore';

// ─── Validation ───

/**
 * Kiểm tra userId tồn tại, throw nếu không
 * @param {string} userId
 * @throws {Error} nếu userId falsy
 */
export function assertUser(userId) {
    if (!userId) {
        throw new Error('User not authenticated');
    }
}

/**
 * Kiểm tra các field bắt buộc có tồn tại trong object
 * @param {string[]} fields - Danh sách tên field
 * @param {object} obj - Object cần kiểm tra
 * @throws {Error} nếu thiếu field
 */
export function assertRequired(fields, obj) {
    const missing = fields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
}

// ─── Document metadata ───

/**
 * Gắn metadata cho document mới (create)
 * @param {object} data - Document data
 * @param {string} userId - User ID
 * @returns {object} data + userId, createdAt, updatedAt
 */
export function withMeta(data, userId) {
    return {
        ...data,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
}

/**
 * Metadata cho update — chỉ updatedAt
 * @returns {object} { updatedAt: serverTimestamp() }
 */
export function updateMeta() {
    return {
        updatedAt: serverTimestamp(),
    };
}

// ─── Document helpers ───

/**
 * Chuyển Firestore doc snapshot thành object có id
 * @param {import('firebase/firestore').DocumentSnapshot} docSnap
 * @returns {object|null}
 */
export function docWithId(docSnap) {
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Chuyển Firestore query snapshot thành mảng objects có id
 * @param {import('firebase/firestore').QuerySnapshot} snapshot
 * @returns {object[]}
 */
export function snapshotToArray(snapshot) {
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Normalize error thành format chuẩn
 * Phát hiện lỗi Firestore phổ biến và trả về message thân thiện
 * @param {Error|object} err
 * @returns {{ code: string, message: string, details?: *, friendly?: string }}
 */
export function normalizeError(err) {
    const message = err?.message || String(err);
    const code = err?.code || 'UNKNOWN';

    // Firestore: missing composite index
    if (message.includes('requires an index') || message.includes('needs an index')) {
        return {
            code: 'FIRESTORE_INDEX_REQUIRED',
            message,
            friendly: 'Firestore thiếu index. Xem README: Firestore Indexes. Lỗi thường kèm link tạo index trực tiếp.',
            details: err?.customData,
        };
    }

    // Firestore: permission denied
    if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
        return {
            code: 'FIRESTORE_PERMISSION_DENIED',
            message,
            friendly: 'Firestore rules chặn truy cập. Xem README: Security Rules',
            details: err?.customData,
        };
    }

    // Firestore: not configured / unavailable
    if (message.includes('Firebase') && (message.includes('not configured') || message.includes('not initialized'))) {
        return {
            code: 'FIREBASE_NOT_CONFIGURED',
            message,
            friendly: 'Firebase chưa cấu hình. Kiểm tra file .env và xem README: Firebase Setup',
        };
    }

    // Firebase error with code
    if (err && err.code) {
        return {
            code: err.code,
            message: err.message || 'Unknown error',
            details: err.customData || undefined,
        };
    }

    // Generic Error
    if (err instanceof Error) {
        return {
            code: 'UNKNOWN',
            message: err.message,
        };
    }

    return {
        code: 'UNKNOWN',
        message: String(err),
    };
}
