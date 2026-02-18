// campaigns.js — Campaign CRUD operations
// Quản lý campaigns trong Firestore

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
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
} from 'firebase/firestore';

/**
 * Tạo campaign mới
 * @param {object} data - { name, description, startDate?, endDate?, userId }
 * @returns {Promise<string>} Campaign Firestore doc ID
 */
export async function saveCampaign(data) {
    try {
        assertUser(data.userId);
        const docData = {
            ...withMeta(data, data.userId),
            status: data.status || 'active',
            contentCount: 0,
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.CAMPAIGNS), docData);
        return docRef.id;
    } catch (error) {
        console.error('saveCampaign error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy danh sách campaigns theo user
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function loadCampaigns(userId) {
    try {
        assertUser(userId);
        const q = query(
            collection(db, COLLECTIONS.CAMPAIGNS),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('loadCampaigns error:', normalizeError(error));
        return [];
    }
}

/**
 * Lấy 1 campaign theo ID
 * @param {string} campaignId
 * @returns {Promise<object|null>}
 */
export async function getCampaign(campaignId) {
    try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId));
        return docWithId(docSnap);
    } catch (error) {
        console.error('getCampaign error:', normalizeError(error));
        return null;
    }
}

/**
 * Cập nhật campaign
 * @param {string} campaignId
 * @param {object} updates
 */
export async function updateCampaign(campaignId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId), {
            ...updates,
            ...updateMeta(),
        });
    } catch (error) {
        console.error('updateCampaign error:', normalizeError(error));
        throw error;
    }
}

/**
 * Xoá campaign
 * @param {string} campaignId
 */
export async function deleteCampaign(campaignId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.CAMPAIGNS, campaignId));
    } catch (error) {
        console.error('deleteCampaign error:', normalizeError(error));
        throw error;
    }
}
