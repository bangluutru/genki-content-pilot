// brands.js — Brand CRUD operations
// Quản lý brand profile trong Firestore

import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { assertUser, withMeta, updateMeta, normalizeError } from './common.js';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    limit,
} from 'firebase/firestore';

/**
 * Lấy brand profile theo user ID
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getBrand(userId) {
    try {
        assertUser(userId);
        const q = query(
            collection(db, COLLECTIONS.BRANDS),
            where('ownerId', '==', userId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('getBrand error:', normalizeError(error));
        return null;
    }
}

/**
 * Lưu/cập nhật brand profile
 * @param {object} brandData
 * @param {string} [brandId] - Nếu có → update, không → create
 * @returns {Promise<string>} Brand ID
 */
export async function saveBrand(brandData, brandId = null) {
    try {
        if (brandId) {
            // Update
            await updateDoc(doc(db, COLLECTIONS.BRANDS, brandId), {
                ...brandData,
                ...updateMeta(),
            });
            return brandId;
        } else {
            // Create — use withMeta for full metadata
            const data = withMeta(brandData, brandData.ownerId);
            const docRef = await addDoc(collection(db, COLLECTIONS.BRANDS), data);
            return docRef.id;
        }
    } catch (error) {
        console.error('saveBrand error:', normalizeError(error));
        throw error;
    }
}
