// ideas.js — Ideas + Scoring Firestore CRUD
// Collections: ideas, ideaScores

import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { assertUser, withMeta, updateMeta, snapshotToArray, normalizeError } from './common.js';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';

// ─── Ideas ───

/**
 * Tạo idea mới
 * @param {object} data - { campaignId, userId, title, angle, funnelStage, notes }
 * @returns {Promise<string>}
 */
export async function createIdea(data) {
    try {
        assertUser(data.userId);
        const docData = {
            ...withMeta(data, data.userId),
            campaignId: data.campaignId,
            title: data.title,
            angle: data.angle || '',
            funnelStage: data.funnelStage || 'TOF',
            status: 'backlog',
            notes: data.notes || '',
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.IDEAS), docData);
        return docRef.id;
    } catch (error) {
        console.error('createIdea error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy tất cả ideas của campaign
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listIdeas(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.IDEAS),
            where('campaignId', '==', campaignId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listIdeas error:', normalizeError(error));
        return [];
    }
}

/**
 * Cập nhật idea
 * @param {string} ideaId
 * @param {object} updates
 */
export async function updateIdea(ideaId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.IDEAS, ideaId), {
            ...updates,
            ...updateMeta(),
        });
    } catch (error) {
        console.error('updateIdea error:', normalizeError(error));
        throw error;
    }
}

/**
 * Xoá idea
 * @param {string} ideaId
 */
export async function deleteIdea(ideaId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.IDEAS, ideaId));
    } catch (error) {
        console.error('deleteIdea error:', normalizeError(error));
        throw error;
    }
}

// ─── Idea Scores ───

/**
 * Lưu score cho idea (1 score per user per idea — overwrite via addDoc mới)
 * @param {object} data - { ideaId, userId, painLevel, proofPotential, productionFit, conversionFit }
 * @returns {Promise<string>}
 */
export async function saveIdeaScore(data) {
    try {
        assertUser(data.userId);
        const total = (data.painLevel || 0) + (data.proofPotential || 0) +
            (data.productionFit || 0) + (data.conversionFit || 0);
        const docData = {
            ideaId: data.ideaId,
            userId: data.userId,
            painLevel: data.painLevel || 1,
            proofPotential: data.proofPotential || 1,
            productionFit: data.productionFit || 1,
            conversionFit: data.conversionFit || 1,
            total,
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.IDEA_SCORES), docData);
        return docRef.id;
    } catch (error) {
        console.error('saveIdeaScore error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy scores cho idea
 * @param {string} ideaId
 * @returns {Promise<object[]>}
 */
export async function getIdeaScores(ideaId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.IDEA_SCORES),
            where('ideaId', '==', ideaId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('getIdeaScores error:', normalizeError(error));
        return [];
    }
}
