/**
 * Conversion Tracking — Firestore CRUD
 */
import { uid, currentWorkspaceId, getFirestore } from './helpers.js';
import { store } from '../../utils/state.js';

/** Save conversion data for a content piece */
export async function saveConversion(conversionData) {
    const userId = uid();
    const workspaceId = currentWorkspaceId();
    if (!userId || !workspaceId) throw new Error('Not authenticated');

    try {
        const { db, collection, addDoc, serverTimestamp } = await getFirestore();
        const ref = collection(db, 'conversions');
        await addDoc(ref, {
            ...conversionData,
            userId,
            workspaceId,
            createdAt: serverTimestamp(),
        });

        // Update local cache
        const conversions = store.get('conversions') || [];
        store.set('conversions', [...conversions, { ...conversionData, id: Date.now() }]);

        return conversionData;
    } catch (e) {
        // Fallback to local store
        const conversions = store.get('conversions') || [];
        const newConversion = { ...conversionData, id: Date.now(), userId, workspaceId };
        store.set('conversions', [...conversions, newConversion]);
        return newConversion;
    }
}

/** Load conversion data */
export async function loadConversions(dateRange = null) {
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) return [];

    try {
        const { db, collection, query, where, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'conversions'),
            where('workspaceId', '==', workspaceId)
        );

        const snapshot = await getDocs(q);
        const conversions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        store.set('conversions', conversions);
        return conversions;
    } catch (error) {
        console.warn('Failed to load conversions from Firestore, falling back to local:', error);
        return store.get('conversions') || [];
    }
}

/**
 * Get top performing content based on Revenue
 * Used for AI Intelligence Loop
 * @param {number} limitCount - Number of top posts to fetch
 * @returns {Array} List of { title, body, revenue, orders }
 */
export async function getTopPerformingContent(limitCount = 3) {
    const workspaceId = currentWorkspaceId();
    if (!workspaceId) return [];

    try {
        const { db, collection, query, where, orderBy, limit, getDocs, doc, getDoc } = await getFirestore();

        // 1. Get top conversions
        const q = query(
            collection(db, 'conversions'),
            where('workspaceId', '==', workspaceId),
            orderBy('revenue', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        if (snap.empty) return [];

        const topConversions = snap.docs.map(d => d.data());

        // 2. Hydrate with actual content body (if not in conversion record)
        const results = await Promise.all(topConversions.map(async (conv) => {
            if (conv.contentId) {
                try {
                    const contentRef = doc(db, 'contents', conv.contentId);
                    const contentSnap = await getDoc(contentRef);
                    if (contentSnap.exists()) {
                        const contentData = contentSnap.data();
                        return {
                            title: contentData.title || conv.title,
                            body: contentData.facebook || contentData.blog || contentData.body || '',
                            revenue: conv.revenue,
                            orders: conv.orders,
                            platform: conv.platform
                        };
                    }
                } catch (e) {
                    console.warn(`Could not load content for conversion ${conv.id}`, e);
                }
            }
            return {
                title: conv.title || 'Unknown',
                body: '',
                revenue: conv.revenue,
                orders: conv.orders
            };
        }));

        // Filter out items with no body
        return results.filter(r => r.body && r.body.length > 50);

    } catch (e) {
        console.warn('Could not load top performing content:', e);
        return [];
    }
}
