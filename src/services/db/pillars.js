/**
 * Pillars & Angles — Firestore Subcollections
 *
 * Structure:
 *   campaigns/{campaignId}/pillars/{pillarId}
 *   campaigns/{campaignId}/pillars/{pillarId}/angles/{angleId}
 *
 * MIGRATION: Also reads from legacy embedded arrays for backward compatibility.
 * New writes always go to subcollections. Legacy data is read-only.
 */
import { uid, getFirestore } from './helpers.js';
import { logActivity } from './activity.js';

// ===== PILLARS =====

/**
 * Load pillars for a campaign
 * Tries subcollection first, falls back to embedded array
 * @param {string} campaignId
 * @param {Object} [campaignData] - Optional campaign doc data (for embedded fallback)
 * @returns {Array} Pillar objects with IDs
 */
export async function loadPillars(campaignId, campaignData = null) {
    try {
        const { db, collection, getDocs, orderBy, query } = await getFirestore();
        const q = query(
            collection(db, 'campaigns', campaignId, 'pillars'),
            orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    } catch (error) {
        console.warn('Could not load pillars from subcollection:', error);
    }

    // Fallback: read from embedded array (legacy)
    if (campaignData?.pillars?.length) {
        return campaignData.pillars;
    }

    return [];
}

/**
 * Save a single pillar to subcollection
 * @param {string} campaignId
 * @param {Object} pillarData - { name, description, priority, suggestedCadence }
 * @returns {Object} Saved pillar with ID
 */
export async function savePillar(campaignId, pillarData) {
    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();

    let ref;
    if (pillarData.id) {
        ref = doc(db, 'campaigns', campaignId, 'pillars', pillarData.id);
    } else {
        ref = doc(collection(db, 'campaigns', campaignId, 'pillars'));
    }

    const data = {
        name: pillarData.name || '',
        description: pillarData.description || '',
        priority: pillarData.priority || 'medium',
        suggestedCadence: pillarData.suggestedCadence || '',
        createdAt: pillarData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data, { merge: true });
    return { id: ref.id, ...data };
}

/**
 * Save multiple pillars (bulk — for AI generation)
 * @param {string} campaignId
 * @param {Array} pillars - Array of pillar objects from AI
 * @returns {Array} Saved pillars with Firestore IDs
 */
export async function savePillarsBulk(campaignId, pillars) {
    const saved = [];
    for (const p of pillars) {
        const result = await savePillar(campaignId, p);
        saved.push(result);
    }
    logActivity('pillar.generate', 'campaign', campaignId, { count: pillars.length });
    return saved;
}

/**
 * Delete a pillar and its angles
 * @param {string} campaignId
 * @param {string} pillarId
 */
export async function deletePillar(campaignId, pillarId) {
    const { db, doc, deleteDoc, collection, getDocs } = await getFirestore();

    // Delete all angles under this pillar
    const anglesSnap = await getDocs(collection(db, 'campaigns', campaignId, 'pillars', pillarId, 'angles'));
    for (const angleDoc of anglesSnap.docs) {
        await deleteDoc(angleDoc.ref);
    }

    // Delete pillar
    await deleteDoc(doc(db, 'campaigns', campaignId, 'pillars', pillarId));
}

// ===== ANGLES =====

/**
 * Load angles for a campaign (across all pillars)
 * Tries subcollections first, falls back to embedded array
 * @param {string} campaignId
 * @param {Array} pillars - List of pillar objects (with IDs)
 * @param {Object} [campaignData] - Optional campaign doc data (for embedded fallback)
 * @returns {Array} Angle objects with pillarId
 */
export async function loadAngles(campaignId, pillars, campaignData = null) {
    if (!pillars || pillars.length === 0) return [];

    try {
        const { db, collection, getDocs } = await getFirestore();
        let allAngles = [];

        for (const pillar of pillars) {
            const snap = await getDocs(
                collection(db, 'campaigns', campaignId, 'pillars', pillar.id, 'angles')
            );
            const angles = snap.docs.map(d => ({
                id: d.id,
                pillarId: pillar.id,
                ...d.data(),
            }));
            allAngles = [...allAngles, ...angles];
        }

        if (allAngles.length > 0) {
            return allAngles;
        }
    } catch (error) {
        console.warn('Could not load angles from subcollections:', error);
    }

    // Fallback: read from embedded array (legacy)
    if (campaignData?.angles?.length) {
        return campaignData.angles;
    }

    return [];
}

/**
 * Save a single angle to subcollection
 * @param {string} campaignId
 * @param {string} pillarId
 * @param {Object} angleData - { name, type, hook, keyMessage, suggestedFormat }
 * @returns {Object} Saved angle with ID
 */
export async function saveAngle(campaignId, pillarId, angleData) {
    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();

    let ref;
    if (angleData.id) {
        ref = doc(db, 'campaigns', campaignId, 'pillars', pillarId, 'angles', angleData.id);
    } else {
        ref = doc(collection(db, 'campaigns', campaignId, 'pillars', pillarId, 'angles'));
    }

    const data = {
        name: angleData.name || '',
        type: angleData.type || 'general',
        hook: angleData.hook || '',
        keyMessage: angleData.keyMessage || '',
        suggestedFormat: angleData.suggestedFormat || 'Facebook Post',
        createdAt: angleData.createdAt || serverTimestamp(),
    };

    await setDoc(ref, data, { merge: true });
    return { id: ref.id, pillarId, ...data };
}

/**
 * Save multiple angles (bulk — for AI generation)
 * @param {string} campaignId
 * @param {string} pillarId
 * @param {Array} angles - Array of angle objects from AI
 * @returns {Array} Saved angles with Firestore IDs
 */
export async function saveAnglesBulk(campaignId, pillarId, angles) {
    const saved = [];
    for (const a of angles) {
        const result = await saveAngle(campaignId, pillarId, a);
        saved.push(result);
    }
    logActivity('angle.generate', 'campaign', campaignId, { pillarId, count: angles.length });
    return saved;
}

/**
 * Delete an angle
 * @param {string} campaignId
 * @param {string} pillarId
 * @param {string} angleId
 */
export async function deleteAngle(campaignId, pillarId, angleId) {
    const { db, doc, deleteDoc } = await getFirestore();
    await deleteDoc(doc(db, 'campaigns', campaignId, 'pillars', pillarId, 'angles', angleId));
}
