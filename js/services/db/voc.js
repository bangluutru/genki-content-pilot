// voc.js — VOC (Voice of Customer) Firestore CRUD
// Collections: vocEntries, vocClusters, hookBanks

import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { assertUser, withMeta, snapshotToArray, normalizeError } from './common.js';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    setDoc,
    getDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    writeBatch,
    serverTimestamp,
} from 'firebase/firestore';

// ─── VOC Entries ───

/**
 * Thêm 1 VOC entry
 * @param {object} data - { campaignId, userId, sourceType, content, tags[] }
 * @returns {Promise<string>}
 */
export async function addVocEntry(data) {
    try {
        assertUser(data.userId);
        const docData = {
            ...withMeta(data, data.userId),
            campaignId: data.campaignId,
            sourceType: data.sourceType || 'manual',
            content: data.content,
            tags: data.tags || [],
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.VOC_ENTRIES), docData);
        return docRef.id;
    } catch (error) {
        console.error('addVocEntry error:', normalizeError(error));
        throw error;
    }
}

/**
 * Bulk add VOC entries (CSV import)
 * @param {object[]} entries - Array of { campaignId, userId, sourceType, content, tags[] }
 * @returns {Promise<number>} Count added
 */
export async function addVocEntries(entries) {
    try {
        const batch = writeBatch(db);
        entries.forEach(entry => {
            const ref = doc(collection(db, COLLECTIONS.VOC_ENTRIES));
            batch.set(ref, {
                ...withMeta(entry, entry.userId),
                campaignId: entry.campaignId,
                sourceType: entry.sourceType || 'csv',
                content: entry.content,
                tags: entry.tags || [],
            });
        });
        await batch.commit();
        return entries.length;
    } catch (error) {
        console.error('addVocEntries error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy tất cả VOC entries của campaign
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listVocEntries(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.VOC_ENTRIES),
            where('campaignId', '==', campaignId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listVocEntries error:', normalizeError(error));
        return [];
    }
}

/**
 * Xoá 1 VOC entry
 * @param {string} entryId
 */
export async function deleteVocEntry(entryId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.VOC_ENTRIES, entryId));
    } catch (error) {
        console.error('deleteVocEntry error:', normalizeError(error));
        throw error;
    }
}

// ─── VOC Clusters ───

/**
 * Lưu AI clusters cho campaign (overwrite)
 * @param {string} campaignId
 * @param {string} userId
 * @param {object[]} clusters - [{ type, name, summary, entrySnippets[] }]
 */
export async function saveClusters(campaignId, userId, clusters) {
    try {
        const docId = `${campaignId}_clusters`;
        await setDoc(doc(db, COLLECTIONS.VOC_CLUSTERS, docId), {
            campaignId,
            userId,
            clusters,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('saveClusters error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy clusters của campaign
 * @param {string} campaignId
 * @returns {Promise<object|null>}
 */
export async function loadClusters(campaignId) {
    try {
        const docId = `${campaignId}_clusters`;
        const docSnap = await getDoc(doc(db, COLLECTIONS.VOC_CLUSTERS, docId));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('loadClusters error:', normalizeError(error));
        return null;
    }
}

// ─── Hook Bank ───

/**
 * Lưu hook bank cho campaign (overwrite)
 * @param {string} campaignId
 * @param {string} userId
 * @param {object} data - { hooks[], objections[] }
 */
export async function saveHookBank(campaignId, userId, data) {
    try {
        const docId = `${campaignId}_hooks`;
        await setDoc(doc(db, COLLECTIONS.HOOK_BANKS, docId), {
            campaignId,
            userId,
            hooks: data.hooks || [],
            objections: data.objections || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('saveHookBank error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy hook bank của campaign
 * @param {string} campaignId
 * @returns {Promise<object|null>}
 */
export async function loadHookBank(campaignId) {
    try {
        const docId = `${campaignId}_hooks`;
        const docSnap = await getDoc(doc(db, COLLECTIONS.HOOK_BANKS, docId));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('loadHookBank error:', normalizeError(error));
        return null;
    }
}
