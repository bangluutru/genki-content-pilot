// assets.js — Assets + Brand Assets Firestore CRUD
// Collections: assets, brandAssets

import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { assertUser, withMeta, updateMeta, snapshotToArray, normalizeError } from './common.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';

// ─── Assets ───

/**
 * Tạo asset mới
 * @param {object} data - { campaignId, userId, ideaId?, parentAssetId?, type, channel, content, attachments[], qaChecklist? }
 * @returns {Promise<string>}
 */
export async function createAsset(data) {
    try {
        assertUser(data.userId);
        const docData = {
            ...withMeta(data, data.userId),
            campaignId: data.campaignId,
            ideaId: data.ideaId || null,
            parentAssetId: data.parentAssetId || null,
            type: data.type || 'post',
            channel: data.channel || 'facebook',
            status: 'draft',
            content: data.content || '',
            attachments: data.attachments || [],
            qaChecklist: data.qaChecklist || defaultQAChecklist(),
            qaStatus: 'pending',
            qaNotes: '',
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.ASSETS), docData);
        return docRef.id;
    } catch (error) {
        console.error('createAsset error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy tất cả assets của campaign
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listAssets(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.ASSETS),
            where('campaignId', '==', campaignId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listAssets error:', normalizeError(error));
        return [];
    }
}

/**
 * Lấy 1 asset
 * @param {string} assetId
 * @returns {Promise<object|null>}
 */
export async function getAsset(assetId) {
    try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.ASSETS, assetId));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('getAsset error:', normalizeError(error));
        return null;
    }
}

/**
 * Cập nhật asset
 * @param {string} assetId
 * @param {object} updates
 */
export async function updateAsset(assetId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.ASSETS, assetId), {
            ...updates,
            ...updateMeta(),
        });
    } catch (error) {
        console.error('updateAsset error:', normalizeError(error));
        throw error;
    }
}

/**
 * Xoá asset
 * @param {string} assetId
 */
export async function deleteAsset(assetId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.ASSETS, assetId));
    } catch (error) {
        console.error('deleteAsset error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy child assets (repurposed)
 * @param {string} parentAssetId
 * @returns {Promise<object[]>}
 */
export async function getChildAssets(parentAssetId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.ASSETS),
            where('parentAssetId', '==', parentAssetId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('getChildAssets error:', normalizeError(error));
        return [];
    }
}

/**
 * Schedule asset
 * @param {string} assetId
 * @param {string} scheduledDate - ISO date string
 */
export async function scheduleAsset(assetId, scheduledDate) {
    try {
        await updateDoc(doc(db, COLLECTIONS.ASSETS, assetId), {
            status: 'scheduled',
            scheduledAt: scheduledDate,
            ...updateMeta(),
        });
    } catch (error) {
        console.error('scheduleAsset error:', normalizeError(error));
        throw error;
    }
}

// ─── Brand Assets ───

/**
 * Tạo brand asset (proof, review, certificate, case, brandkit)
 * @param {object} data - { campaignId, userId, type, title, fileUrl, meta? }
 * @returns {Promise<string>}
 */
export async function createBrandAsset(data) {
    try {
        assertUser(data.userId);
        const docData = {
            ...withMeta(data, data.userId),
            campaignId: data.campaignId,
            type: data.type || 'proof',
            title: data.title || '',
            fileUrl: data.fileUrl || '',
            meta: data.meta || {},
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.BRAND_ASSETS), docData);
        return docRef.id;
    } catch (error) {
        console.error('createBrandAsset error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy brand assets của campaign
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listBrandAssets(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.BRAND_ASSETS),
            where('campaignId', '==', campaignId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listBrandAssets error:', normalizeError(error));
        return [];
    }
}

/**
 * Xoá brand asset
 * @param {string} id
 */
export async function deleteBrandAsset(id) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.BRAND_ASSETS, id));
    } catch (error) {
        console.error('deleteBrandAsset error:', normalizeError(error));
        throw error;
    }
}

// ─── Helpers ───

function defaultQAChecklist() {
    return [
        { key: 'compliance', label: 'Tuân thủ NĐ 15/2018', passed: false },
        { key: 'disclaimer', label: 'Có disclaimer đúng', passed: false },
        { key: 'brand_tone', label: 'Đúng tone thương hiệu', passed: false },
        { key: 'cta', label: 'CTA rõ ràng', passed: false },
        { key: 'grammar', label: 'Chính tả & ngữ pháp', passed: false },
        { key: 'visual', label: 'Visual phù hợp', passed: false },
    ];
}
