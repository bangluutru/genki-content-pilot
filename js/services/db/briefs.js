// briefs.js — Campaign Brief CRUD with versioning and approval
// Collection: campaignBriefs

import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { assertUser, withMeta, updateMeta, docWithId, snapshotToArray, normalizeError } from './common.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
} from 'firebase/firestore';

/**
 * Tạo brief mới (version 1 hoặc clone từ version trước)
 * @param {object} data - Brief data + campaignId, userId
 * @returns {Promise<string>} Brief doc ID
 */
export async function createBrief(data) {
    try {
        assertUser(data.userId);
        const docData = {
            ...withMeta(data, data.userId),
            campaignId: data.campaignId,
            version: data.version || 1,
            status: 'draft',
            createdBy: data.userId,
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.CAMPAIGN_BRIEFS), docData);
        return docRef.id;
    } catch (error) {
        console.error('createBrief error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy tất cả versions của brief theo campaign, mới nhất trước
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listBriefVersions(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.CAMPAIGN_BRIEFS),
            where('campaignId', '==', campaignId),
            orderBy('version', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listBriefVersions error:', normalizeError(error));
        return [];
    }
}

/**
 * Cập nhật brief draft
 * @param {string} briefId
 * @param {object} updates
 */
export async function updateBrief(briefId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CAMPAIGN_BRIEFS, briefId), {
            ...updates,
            ...updateMeta(),
        });
    } catch (error) {
        console.error('updateBrief error:', normalizeError(error));
        throw error;
    }
}

/**
 * Submit brief for review
 * @param {string} briefId
 */
export async function submitBrief(briefId) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CAMPAIGN_BRIEFS, briefId), {
            status: 'in_review',
            ...updateMeta(),
        });
    } catch (error) {
        console.error('submitBrief error:', normalizeError(error));
        throw error;
    }
}

/**
 * Approve brief
 * @param {string} briefId
 * @param {string} userId - Approver
 */
export async function approveBrief(briefId, userId) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CAMPAIGN_BRIEFS, briefId), {
            status: 'approved',
            approvedBy: userId,
            approvedAt: serverTimestamp(),
            ...updateMeta(),
        });
    } catch (error) {
        console.error('approveBrief error:', normalizeError(error));
        throw error;
    }
}

/**
 * Reject brief
 * @param {string} briefId
 * @param {string} userId - Reviewer
 * @param {string} reason
 */
export async function rejectBrief(briefId, userId, reason) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CAMPAIGN_BRIEFS, briefId), {
            status: 'rejected',
            approvedBy: userId,
            rejectionReason: reason || 'Không đạt yêu cầu',
            ...updateMeta(),
        });
    } catch (error) {
        console.error('rejectBrief error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy brief đã approved mới nhất cho campaign
 * @param {string} campaignId
 * @returns {Promise<object|null>}
 */
export async function getApprovedBrief(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.CAMPAIGN_BRIEFS),
            where('campaignId', '==', campaignId),
            where('status', '==', 'approved'),
            orderBy('version', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        console.error('getApprovedBrief error:', normalizeError(error));
        return null;
    }
}
