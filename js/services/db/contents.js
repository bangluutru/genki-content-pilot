// contents.js — Content CRUD operations
// Quản lý content (bài viết) trong Firestore

import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { CONFIG } from '../../config.js';
import { assertUser, withMeta, updateMeta, docWithId, snapshotToArray, normalizeError } from './common.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
} from 'firebase/firestore';

/**
 * Lấy danh sách content theo user
 * @param {string} userId
 * @param {object} filters - { status, limit }
 * @returns {Promise<object[]>}
 */
export async function getContents(userId, filters = {}) {
    try {
        assertUser(userId);
        const q = query(
            collection(db, COLLECTIONS.CONTENTS),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(filters.limit || 50)
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('getContents error:', normalizeError(error));
        return [];
    }
}

/**
 * Lấy 1 content theo ID
 * @param {string} contentId
 * @returns {Promise<object|null>}
 */
export async function getContent(contentId) {
    try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.CONTENTS, contentId));
        return docWithId(docSnap);
    } catch (error) {
        console.error('getContent error:', normalizeError(error));
        return null;
    }
}

/**
 * Tạo content mới (draft)
 * @param {object} contentData
 * @returns {Promise<string>} Content ID
 */
export async function createContent(contentData) {
    try {
        const data = {
            ...withMeta(contentData, contentData.createdBy),
            status: CONFIG.STATUS.DRAFT,
            publishedTo: [],
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.CONTENTS), data);
        return docRef.id;
    } catch (error) {
        console.error('createContent error:', normalizeError(error));
        throw error;
    }
}

/**
 * Cập nhật content (edit, publish status)
 * @param {string} contentId
 * @param {object} updates
 */
export async function updateContent(contentId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CONTENTS, contentId), {
            ...updates,
            ...updateMeta(),
        });
    } catch (error) {
        console.error('updateContent error:', normalizeError(error));
        throw error;
    }
}

/**
 * Xoá content
 * @param {string} contentId
 */
export async function deleteContent(contentId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.CONTENTS, contentId));
    } catch (error) {
        console.error('deleteContent error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy danh sách content theo campaign
 * @param {string} campaignId
 * @param {number} [limitCount=50]
 * @returns {Promise<object[]>}
 */
export async function getContentsByCampaign(campaignId, limitCount = 50) {
    try {
        const q = query(
            collection(db, COLLECTIONS.CONTENTS),
            where('campaignId', '==', campaignId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('getContentsByCampaign error:', normalizeError(error));
        return [];
    }
}

/**
 * Cập nhật trạng thái content (approval workflow)
 * @param {string} contentId
 * @param {object} statusData - { status, approvedBy?, rejectionReason? }
 */
export async function updateContentStatus(contentId, statusData) {
    try {
        const updates = {
            status: statusData.status,
            ...updateMeta(),
        };
        if (statusData.approvedBy) {
            updates.approvedBy = statusData.approvedBy;
            updates.approvedAt = serverTimestamp();
        }
        if (statusData.rejectionReason) {
            updates.rejectionReason = statusData.rejectionReason;
        }
        await updateDoc(doc(db, COLLECTIONS.CONTENTS, contentId), updates);
    } catch (error) {
        console.error('updateContentStatus error:', normalizeError(error));
        throw error;
    }
}
