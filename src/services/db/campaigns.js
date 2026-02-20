/**
 * Campaign Management — Firestore CRUD
 */
import { uid, currentWorkspaceId, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';
import { logActivity } from './activity.js';

/**
 * Save or Update Campaign
 * @param {Object} campaign - { id, name, brief, startDate, endDate, status, pillars, angles, goals }
 */
export async function saveCampaign(campaign) {
    const userId = uid();
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) throw new Error('Not authenticated');

    // Sanitize — remove client-side timestamps (will use serverTimestamp)
    const data = {
        ...campaign,
        workspaceId,
        userId,
    };

    // Auto-set status for new campaigns
    if (!data.id) {
        data.status = data.status || 'draft';
    }

    try {
        const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();

        // Use existing ID or create new ref
        let campaignRef;
        if (data.id) {
            campaignRef = doc(db, 'campaigns', data.id.toString());
        } else {
            campaignRef = doc(collection(db, 'campaigns'));
            data.id = campaignRef.id;
        }

        // Use serverTimestamp for consistency
        const firestoreData = {
            ...data,
            updatedAt: serverTimestamp(),
        };
        if (!campaign.id) {
            firestoreData.createdAt = serverTimestamp();
        }

        await setDoc(campaignRef, firestoreData, { merge: true });

        // Update local store (use JS Date for local)
        const localData = { ...data, updatedAt: new Date() };
        if (!campaign.id) localData.createdAt = new Date();

        const campaigns = store.get('campaigns') || [];
        const index = campaigns.findIndex(c => c.id === data.id);
        if (index > -1) {
            campaigns[index] = localData;
        } else {
            campaigns.push(localData);
        }
        store.set('campaigns', campaigns);

        // Log activity (fire-and-forget)
        if (!campaign.id) {
            logActivity('campaign.create', 'campaign', localData.id, { name: localData.name || '' });
        }

        return localData;
    } catch (error) {
        console.warn('Firestore saveCampaign failed:', error);
        throw error; // Let UI handle the error (e.g., show Toast)
    }
}

/** Load Campaigns for User */
export async function loadCampaigns() {
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) return store.get('campaigns') || [];

    try {
        const { db, collection, query, where, orderBy, getDocs } = await getFirestore();

        const q = query(
            collection(db, 'campaigns'),
            where('workspaceId', '==', workspaceId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const campaigns = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date()),
                updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : new Date()),
            };
        });

        store.set('campaigns', campaigns);
        return campaigns;
    } catch (error) {
        console.warn('Firestore loadCampaigns failed, using local:', error);
        return store.get('campaigns') || [];
    }
}

/** Delete Campaign */
export async function deleteCampaign(campaignId) {
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) return false;

    try {
        const { db, doc, collection, getDocs, deleteDoc } = await getFirestore();

        // 1. Cascading Delete: Pillars and Angles subcollections
        const pillarsRef = collection(db, 'campaigns', campaignId, 'pillars');
        const pillarsSnap = await getDocs(pillarsRef);

        for (const pillarDoc of pillarsSnap.docs) {
            const pillarId = pillarDoc.id;
            const anglesRef = collection(db, 'campaigns', campaignId, 'pillars', pillarId, 'angles');
            const anglesSnap = await getDocs(anglesRef);

            // Delete all angles under this pillar
            for (const angleDoc of anglesSnap.docs) {
                await deleteDoc(angleDoc.ref);
            }
            // Delete the pillar itself
            await deleteDoc(pillarDoc.ref);
        }

        // 2. Delete the campaign document
        await deleteDoc(doc(db, 'campaigns', campaignId));

        // Log activity (fire-and-forget)
        logActivity('campaign.delete', 'campaign', campaignId);

        // Update local
        let campaigns = store.get('campaigns') || [];
        campaigns = campaigns.filter(c => c.id !== campaignId);
        store.set('campaigns', campaigns);

        return true;
    } catch (error) {
        console.warn('Firestore deleteCampaign failed:', error);
        throw error;
    }
}

/**
 * Update Campaign Pillars
 * @param {string} campaignId
 * @param {Array} pillars - Array of pillar objects
 */
export async function updateCampaignPillars(campaignId, pillars) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    try {
        const { db, doc, setDoc, serverTimestamp } = await getFirestore();
        await setDoc(doc(db, 'campaigns', campaignId), {
            pillars,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.warn('Firestore updateCampaignPillars failed, updating local:', error);
    }

    // Always update local store
    const campaigns = store.get('campaigns') || [];
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.pillars = pillars;
        campaign.updatedAt = new Date();
        store.set('campaigns', [...campaigns]);
    }
}

/**
 * Update Campaign Angles
 * @param {string} campaignId
 * @param {Array} angles - Array of angle objects
 */
export async function updateCampaignAngles(campaignId, angles) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    try {
        const { db, doc, setDoc, serverTimestamp } = await getFirestore();
        await setDoc(doc(db, 'campaigns', campaignId), {
            angles,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.warn('Firestore updateCampaignAngles failed, updating local:', error);
    }

    // Always update local store
    const campaigns = store.get('campaigns') || [];
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.angles = angles;
        campaign.updatedAt = new Date();
        store.set('campaigns', [...campaigns]);
    }
}
