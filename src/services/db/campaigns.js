/**
 * Campaign Management — Firestore CRUD
 */
import { uid, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';

/**
 * Save or Update Campaign
 * @param {Object} campaign - { id, name, brief, startDate, endDate, status, pillars, angles, goals }
 */
export async function saveCampaign(campaign) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    // Sanitize — remove client-side timestamps (will use serverTimestamp)
    const data = {
        ...campaign,
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

        return localData;
    } catch (error) {
        console.warn('Firestore saveCampaign failed, using local:', error);
        // Local fallback
        let campaigns = store.get('campaigns') || [];
        if (!data.id) data.id = 'local_' + Date.now();

        const localData = { ...data, updatedAt: new Date(), createdAt: data.createdAt || new Date() };
        const index = campaigns.findIndex(c => c.id === data.id);
        if (index > -1) {
            campaigns[index] = localData;
        } else {
            campaigns.push(localData);
        }
        store.set('campaigns', campaigns);
        return localData;
    }
}

/** Load Campaigns for User */
export async function loadCampaigns() {
    const userId = uid();
    if (!userId) return store.get('campaigns') || [];

    try {
        const { db, collection, query, where, orderBy, getDocs } = await getFirestore();

        const q = query(
            collection(db, 'campaigns'),
            where('userId', '==', userId),
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
    const userId = uid();
    if (!userId) return false;

    try {
        const { db, doc, deleteDoc } = await getFirestore();

        await deleteDoc(doc(db, 'campaigns', campaignId));

        // Update local
        let campaigns = store.get('campaigns') || [];
        campaigns = campaigns.filter(c => c.id !== campaignId);
        store.set('campaigns', campaigns);

        return true;
    } catch (error) {
        console.warn('Firestore deleteCampaign failed, using local:', error);
        let campaigns = store.get('campaigns') || [];
        campaigns = campaigns.filter(c => c.id !== campaignId);
        store.set('campaigns', campaigns);
        return true;
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
