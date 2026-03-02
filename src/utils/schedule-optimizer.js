/**
 * Schedule Optimizer — Smart posting time suggestions
 * Analyzes existing schedules + marketing events to suggest optimal slots
 */
import { getEventsForMonth } from '../data/marketing-events.js';

/** Golden hours by platform (Vietnamese audience research) */
const GOLDEN_HOURS = [
    { time: '09:00', label: '🌅 Sáng', weight: 7 },
    { time: '11:30', label: '☀️ Trưa', weight: 9 },
    { time: '13:00', label: '🍜 Sau trưa', weight: 6 },
    { time: '19:00', label: '🌆 Tối', weight: 10 },
    { time: '20:00', label: '🌙 Prime', weight: 10 },
    { time: '21:00', label: '✨ Khuya', weight: 8 },
];

/**
 * Suggest top 3 best posting slots for the next N days
 * @param {Array} existingSchedules - Current scheduled posts
 * @param {number} currentMonth - 0-indexed month
 * @param {number} currentYear
 * @param {number} daysAhead - How many days to look ahead (default 7)
 * @returns {Array<{date: string, time: string, score: number, reason: string}>}
 */
export function suggestBestSlots(existingSchedules, currentMonth, currentYear, daysAhead = 7) {
    const today = new Date();
    const candidates = [];

    for (let d = 0; d < daysAhead; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();

        // Count existing posts for this day
        const daySchedules = existingSchedules.filter(s => s.date === dateStr);
        const postCount = daySchedules.length;

        // Skip days that are already full (≥3 posts)
        if (postCount >= 3) continue;

        // Check for marketing events on this day
        const monthEvents = getEventsForMonth(date.getMonth(), date.getFullYear());
        const dayEvents = monthEvents.filter(e => e.day === date.getDate());
        const hasEvent = dayEvents.length > 0;

        // Score each golden hour for this day
        for (const slot of GOLDEN_HOURS) {
            // Skip if this time slot is already taken
            const isTimeTaken = daySchedules.some(s => s.time === slot.time);
            if (isTimeTaken) continue;

            let score = slot.weight;

            // Bonus for marketing event days
            if (hasEvent) score += 5;

            // Bonus for low-density days (fewer existing posts = higher score)
            score += (3 - postCount) * 2;

            // Slight penalty for weekends (lower organic reach)
            if (dayOfWeek === 0 || dayOfWeek === 6) score -= 1;

            // Bonus for tomorrow (urgency)
            if (d === 1) score += 1;

            const reason = hasEvent
                ? `📅 ${dayEvents[0].name} — ${slot.label}`
                : postCount === 0
                    ? `📭 Ngày trống — ${slot.label}`
                    : `${slot.label} (${postCount} bài đã lên)`;

            candidates.push({ date: dateStr, time: slot.time, score, reason });
        }
    }

    // Sort by score descending, return top 3
    return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Get posting density for the current month (posts per day-of-week)
 * @param {Array} schedules
 * @returns {Array<{day: string, count: number}>}
 */
export function getPostingDensity(schedules) {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const counts = new Array(7).fill(0);

    schedules.forEach(s => {
        const dow = new Date(s.date + 'T00:00:00').getDay();
        counts[dow]++;
    });

    return days.map((day, i) => ({ day, count: counts[i] }));
}

/**
 * Find gap days (no scheduled posts) within the next N days
 * @param {Array} schedules
 * @param {number} daysAhead
 * @returns {Array<string>} dates with no posts
 */
export function findGaps(schedules, daysAhead = 14) {
    const gaps = [];
    const today = new Date();

    for (let d = 1; d <= daysAhead; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];

        const hasPost = schedules.some(s => s.date === dateStr);
        if (!hasPost) gaps.push(dateStr);
    }

    return gaps;
}
