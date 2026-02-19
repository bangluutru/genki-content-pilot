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
