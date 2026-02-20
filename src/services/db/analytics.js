/**
 * Analytics — Content stats dashboard
 */
import { uid } from './helpers.js';
import { store } from '../../utils/state.js';
import { loadContents } from './content.js';

/** Load content stats for analytics dashboard */
export async function loadContentStats() {
    const contents = store.get('contents') || await loadContents(200);

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Basic counts
    const total = contents.length;
    const published = contents.filter(c => c.status === 'published').length;
    const drafts = contents.filter(c => c.status === 'draft').length;

    // Pre-compute date-count map (O(n) single pass)
    const dateCountMap = {};
    const typeMap = {};
    let todayCount = 0;

    contents.forEach(c => {
        const d = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
        const dateStr = d.toISOString().split('T')[0];
        dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
        if (dateStr === today) todayCount++;

        const type = c.contentType || 'Khác';
        typeMap[type] = (typeMap[type] || 0) + 1;
    });

    // Last 7 days breakdown (O(7) lookups)
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'short' });
        dailyData.push({ date: dateStr, label: dayLabel, count: dateCountMap[dateStr] || 0 });
    }

    // Content type distribution
    const typeData = Object.entries(typeMap)
        .map(([name, count]) => ({ name, count, pct: total ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);

    // Weekly activity heatmap (last 4 weeks, O(28) lookups)
    const heatmap = [];
    for (let i = 27; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        heatmap.push({ date: dateStr, count: dateCountMap[dateStr] || 0 });
    }

    return { total, published, drafts, todayCount, dailyData, typeData, heatmap };
}
