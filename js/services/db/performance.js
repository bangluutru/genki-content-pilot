// performance.js — Performance Metrics + Learning Logs + Experiments Firestore CRUD
// Collections: performanceMetrics, learningLogs, experiments

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
    writeBatch,
    serverTimestamp,
} from 'firebase/firestore';

// ─── Performance Metrics ───

/**
 * Thêm 1 metric record
 * @param {object} data - { assetId, campaignId, userId, date, views, watchTime, retention3s, ctr, leads, sales, spend, cpa }
 * @returns {Promise<string>}
 */
export async function addMetric(data) {
    try {
        assertUser(data.userId);
        const docData = {
            ...withMeta(data, data.userId),
            assetId: data.assetId || null,
            campaignId: data.campaignId,
            date: data.date || new Date().toISOString().split('T')[0],
            views: Number(data.views) || 0,
            watchTime: Number(data.watchTime) || 0,
            retention3s: Number(data.retention3s) || 0,
            ctr: Number(data.ctr) || 0,
            leads: Number(data.leads) || 0,
            sales: Number(data.sales) || 0,
            spend: Number(data.spend) || 0,
            cpa: Number(data.cpa) || 0,
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.PERFORMANCE_METRICS), docData);
        return docRef.id;
    } catch (error) {
        console.error('addMetric error:', normalizeError(error));
        throw error;
    }
}

/**
 * Bulk import metrics (CSV)
 * @param {object[]} rows
 * @returns {Promise<number>}
 */
export async function addMetrics(rows) {
    try {
        const batch = writeBatch(db);
        rows.forEach(row => {
            const ref = doc(collection(db, COLLECTIONS.PERFORMANCE_METRICS));
            batch.set(ref, {
                ...withMeta(row, row.userId),
                assetId: row.assetId || null,
                campaignId: row.campaignId,
                date: row.date || new Date().toISOString().split('T')[0],
                views: Number(row.views) || 0,
                watchTime: Number(row.watchTime) || 0,
                retention3s: Number(row.retention3s) || 0,
                ctr: Number(row.ctr) || 0,
                leads: Number(row.leads) || 0,
                sales: Number(row.sales) || 0,
                spend: Number(row.spend) || 0,
                cpa: Number(row.cpa) || 0,
            });
        });
        await batch.commit();
        return rows.length;
    } catch (error) {
        console.error('addMetrics error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy metrics cho campaign
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listMetrics(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.PERFORMANCE_METRICS),
            where('campaignId', '==', campaignId),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listMetrics error:', normalizeError(error));
        return [];
    }
}

/**
 * Xoá metric
 * @param {string} id
 */
export async function deleteMetric(id) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.PERFORMANCE_METRICS, id));
    } catch (error) {
        console.error('deleteMetric error:', normalizeError(error));
        throw error;
    }
}

// ─── Learning Logs ───

/**
 * Thêm learning log
 * @param {object} data - { campaignId, userId, assetId?, hypothesis, result, insight, nextAction }
 * @returns {Promise<string>}
 */
export async function addLearningLog(data) {
    try {
        assertUser(data.userId);
        const docData = {
            campaignId: data.campaignId,
            userId: data.userId,
            assetId: data.assetId || null,
            hypothesis: data.hypothesis || '',
            result: data.result || '',
            insight: data.insight || '',
            nextAction: data.nextAction || '',
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.LEARNING_LOGS), docData);
        return docRef.id;
    } catch (error) {
        console.error('addLearningLog error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy learning logs cho campaign
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listLearningLogs(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.LEARNING_LOGS),
            where('campaignId', '==', campaignId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listLearningLogs error:', normalizeError(error));
        return [];
    }
}

// ─── Experiments ───

/**
 * Tạo experiment
 * @param {object} data - { campaignId, userId, ideaId?, type, variants[] }
 * @returns {Promise<string>}
 */
export async function createExperiment(data) {
    try {
        assertUser(data.userId);
        const docData = {
            campaignId: data.campaignId,
            userId: data.userId,
            ideaId: data.ideaId || null,
            type: data.type || 'hook_ab',
            variants: data.variants || [],
            winner: null,
            status: 'running',
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.EXPERIMENTS), docData);
        return docRef.id;
    } catch (error) {
        console.error('createExperiment error:', normalizeError(error));
        throw error;
    }
}

/**
 * Lấy experiments cho campaign
 * @param {string} campaignId
 * @returns {Promise<object[]>}
 */
export async function listExperiments(campaignId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.EXPERIMENTS),
            where('campaignId', '==', campaignId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshotToArray(snapshot);
    } catch (error) {
        console.error('listExperiments error:', normalizeError(error));
        return [];
    }
}

/**
 * Cập nhật experiment (set winner, close)
 * @param {string} experimentId
 * @param {object} updates
 */
export async function updateExperiment(experimentId, updates) {
    try {
        await updateDoc(doc(db, COLLECTIONS.EXPERIMENTS, experimentId), {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('updateExperiment error:', normalizeError(error));
        throw error;
    }
}
