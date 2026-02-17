/**
 * Firestore Service — CRUD operations for ContentPilot
 * Uses lazy Firebase initialization to prevent crashes when config is missing
 */
import { initFirebase, hasFirebaseConfig } from '../config/firebase.js';
import { store } from '../utils/state.js';

/** Get current user ID */
function uid() {
    return store.get('user')?.uid;
}

/** Get Firestore instance and modules lazily */
async function getFirestore() {
    if (!hasFirebaseConfig()) {
        throw new Error('Firebase not configured');
    }
    const { db } = await initFirebase();
    if (!db) throw new Error('Firestore not available');
    const firestoreModule = await import('firebase/firestore');
    return { db, ...firestoreModule };
}

// ===== Brand Profile =====

/** Save or update brand profile */
export async function saveBrand(brandData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'brands', userId);
    await setDoc(ref, {
        ...brandData,
        userId,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    store.set('brand', brandData);
    return brandData;
}

/** Load brand profile */
export async function loadBrand() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const ref = doc(db, 'brands', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const brand = snap.data();
            store.set('brand', brand);
            return brand;
        }
    } catch {
        console.warn('Could not load brand (Firebase may not be configured)');
    }
    return null;
}

// ===== Content =====

/** Save content to Firestore */
export async function saveContent(content) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(collection(db, 'contents'));
    const data = {
        ...content,
        id: ref.id,
        userId,
        status: content.status || 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(ref, data);

    // Update local state
    const contents = store.get('contents') || [];
    store.set('contents', [{ ...data, createdAt: new Date(), updatedAt: new Date() }, ...contents]);

    return data;
}

/** Update existing content */
export async function updateContent(contentId, updates) {
    const { db, doc, updateDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'contents', contentId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });

    // Update local state
    const contents = store.get('contents') || [];
    store.set('contents', contents.map(c =>
        c.id === contentId ? { ...c, ...updates, updatedAt: new Date() } : c
    ));
}

/** Delete content */
export async function deleteContent(contentId) {
    const { db, doc, deleteDoc } = await getFirestore();
    const ref = doc(db, 'contents', contentId);
    await deleteDoc(ref);

    const contents = store.get('contents') || [];
    store.set('contents', contents.filter(c => c.id !== contentId));
}

/** Load all contents for current user */
export async function loadContents(limitCount = 50) {
    const userId = uid();
    if (!userId) return [];

    try {
        const { db, collection, query, where, orderBy, limit, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'contents'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        const contents = snap.docs.map(d => ({
            ...d.data(),
            id: d.id,
            createdAt: d.data().createdAt?.toDate() || new Date(),
            updatedAt: d.data().updatedAt?.toDate() || new Date(),
        }));

        store.set('contents', contents);
        return contents;
    } catch {
        console.warn('Could not load contents (Firebase may not be configured)');
        return [];
    }
}

// ===== Connections (Facebook / WordPress) =====

/** Save platform connections */
export async function saveConnections(connectionData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'connections', userId);
    await setDoc(ref, {
        ...connectionData,
        userId,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    store.set('connections', connectionData);
    return connectionData;
}

/** Load platform connections */
export async function loadConnections() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const ref = doc(db, 'connections', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const connections = snap.data();
            store.set('connections', connections);
            return connections;
        }
    } catch {
        console.warn('Could not load connections');
    }
    return null;
}

/** Delete a platform connection */
export async function deleteConnection(platform) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const connections = store.get('connections') || {};
    delete connections[platform];

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'connections', userId);
    await setDoc(ref, {
        ...connections,
        userId,
        updatedAt: serverTimestamp(),
    });

    store.set('connections', connections);
}

// ===== Analytics =====

/** Load content stats for analytics dashboard */
export async function loadContentStats() {
    const contents = store.get('contents') || await loadContents(200);

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Basic counts
    const total = contents.length;
    const published = contents.filter(c => c.status === 'published').length;
    const drafts = contents.filter(c => c.status === 'draft').length;
    const todayCount = contents.filter(c => {
        const d = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
        return d.toISOString().split('T')[0] === today;
    }).length;

    // Last 7 days breakdown
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'short' });
        const count = contents.filter(c => {
            const d = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
            return d.toISOString().split('T')[0] === dateStr;
        }).length;
        dailyData.push({ date: dateStr, label: dayLabel, count });
    }

    // Content type distribution
    const typeMap = {};
    contents.forEach(c => {
        const type = c.contentType || 'Khác';
        typeMap[type] = (typeMap[type] || 0) + 1;
    });
    const typeData = Object.entries(typeMap)
        .map(([name, count]) => ({ name, count, pct: total ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);

    // Weekly activity (last 4 weeks, 7 days each = 28 cells)
    const heatmap = [];
    for (let i = 27; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = contents.filter(c => {
            const d = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
            return d.toISOString().split('T')[0] === dateStr;
        }).length;
        heatmap.push({ date: dateStr, count });
    }

    return { total, published, drafts, todayCount, dailyData, typeData, heatmap };
}

// ===== Schedules (Calendar) =====

/** Save a content schedule */
export async function saveSchedule(scheduleData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(collection(db, 'schedules'));
    const data = {
        ...scheduleData,
        id: ref.id,
        userId,
        createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return data;
}

/** Load schedules for a given month */
export async function loadSchedules(month, year) {
    const userId = uid();
    if (!userId) return [];

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

    try {
        const { db, collection, query, where, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'schedules'),
            where('userId', '==', userId),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch {
        console.warn('Could not load schedules');
        return [];
    }
}

/** Delete a schedule */
export async function deleteSchedule(scheduleId) {
    const { db, doc, deleteDoc } = await getFirestore();
    await deleteDoc(doc(db, 'schedules', scheduleId));
}

// ===== Templates =====

/** Save a brief template */
export async function saveTemplate(templateData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, collection, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(collection(db, 'templates'));
    const data = {
        ...templateData,
        id: ref.id,
        userId,
        createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return data;
}

/** Load user templates */
export async function loadTemplates() {
    const userId = uid();
    if (!userId) return [];

    try {
        const { db, collection, query, where, orderBy, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'templates'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch {
        console.warn('Could not load templates');
        return [];
    }
}

/** Delete a template */
export async function deleteTemplate(templateId) {
    const { db, doc, deleteDoc } = await getFirestore();
    await deleteDoc(doc(db, 'templates', templateId));
}

// ===== Workspace / Team =====

/** Save workspace */
export async function saveWorkspace(workspaceData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    const { db, doc, setDoc, serverTimestamp } = await getFirestore();
    const ref = doc(db, 'workspaces', userId);
    await setDoc(ref, {
        ...workspaceData,
        ownerId: userId,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    store.set('workspace', workspaceData);
    return workspaceData;
}

/** Load workspace */
export async function loadWorkspace() {
    const userId = uid();
    if (!userId) return null;

    try {
        const { db, doc, getDoc } = await getFirestore();
        const ref = doc(db, 'workspaces', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const workspace = snap.data();
            store.set('workspace', workspace);
            return workspace;
        }
    } catch {
        console.warn('Could not load workspace');
    }
    return null;
}

/** Load team activity (recent content as activity proxy) */
export async function loadTeamActivity() {
    const contents = store.get('contents') || await loadContents(20);
    return contents.slice(0, 20).map(c => ({
        userName: store.get('user')?.displayName || 'Bạn',
        action: `đã tạo bài "${(c.brief || c.facebook || 'Untitled').slice(0, 40)}"`,
        createdAt: c.createdAt,
    }));
}

// ===== Conversion Tracking (Phase 11) =====

/** Save conversion data for a content piece */
export async function saveConversion(conversionData) {
    const userId = uid();
    if (!userId) throw new Error('Not authenticated');

    try {
        const { db, collection, addDoc, serverTimestamp } = await getFirestore();
        const ref = collection(db, 'conversions');
        await addDoc(ref, {
            ...conversionData,
            userId,
            createdAt: serverTimestamp(),
        });

        // Update local cache
        const conversions = store.get('conversions') || [];
        conversions.push({ ...conversionData, id: Date.now() });
        store.set('conversions', conversions);

        return conversionData;
    } catch (e) {
        // Fallback to localStorage
        const conversions = store.get('conversions') || [];
        const newConversion = { ...conversionData, id: Date.now(), userId };
        conversions.push(newConversion);
        store.set('conversions', conversions);
        return newConversion;
    }
}

/** Load conversion data */
export async function loadConversions(dateRange = null) {
    const userId = uid();
    if (!userId) return [];

    try {
        const { db, collection, query, where, getDocs } = await getFirestore();
        const q = query(
            collection(db, 'conversions'),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        const conversions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        store.set('conversions', conversions);
        return conversions;
    } catch (e) {
        // Fallback to localStorage
        return store.get('conversions') || [];
    }
}
