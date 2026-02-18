// settings.js — Settings CRUD operations
// Quản lý user settings (API keys, connections) trong Firestore

import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { assertUser, updateMeta, docWithId, normalizeError } from './common.js';
import {
    doc,
    getDoc,
    setDoc,
} from 'firebase/firestore';

/**
 * Lấy settings của user
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getSettings(userId) {
    try {
        assertUser(userId);
        const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, userId));
        if (!docSnap.exists()) return null;
        return docSnap.data();
    } catch (error) {
        console.error('getSettings error:', normalizeError(error));
        return null;
    }
}

/**
 * Lưu settings (API keys, connections)
 * @param {string} userId
 * @param {object} settingsData
 */
export async function saveSettings(userId, settingsData) {
    try {
        assertUser(userId);
        await setDoc(doc(db, COLLECTIONS.SETTINGS, userId), {
            ...settingsData,
            ...updateMeta(),
        }, { merge: true });
    } catch (error) {
        console.error('saveSettings error:', normalizeError(error));
        throw error;
    }
}
