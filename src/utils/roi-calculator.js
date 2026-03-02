/**
 * ROI Calculator — Content performance metrics
 */

/**
 * Calculate Return on Ad Spend
 * @param {number} revenue - Total revenue generated
 * @param {number} spend - Total ad spend
 * @returns {string} ROAS value (e.g. "3.2x")
 */
export function calculateROAS(revenue, spend) {
    if (!spend || spend === 0) return '∞';
    return (revenue / spend).toFixed(1) + 'x';
}

/**
 * Calculate Cost per Lead
 * @param {number} spend
 * @param {number} leads
 * @returns {string} Formatted CPL
 */
export function calculateCPL(spend, leads) {
    if (!leads || leads === 0) return '—';
    const cpl = spend / leads;
    return cpl >= 1000 ? (cpl / 1000).toFixed(0) + 'K' : cpl.toFixed(0) + 'đ';
}

/**
 * Calculate Cost per Acquisition
 * @param {number} spend
 * @param {number} orders
 * @returns {string}
 */
export function calculateCPA(spend, orders) {
    if (!orders || orders === 0) return '—';
    const cpa = spend / orders;
    return cpa >= 1000 ? (cpa / 1000).toFixed(0) + 'K' : cpa.toFixed(0) + 'đ';
}

/**
 * Rank content by ROI (revenue/click ratio, or just revenue if no clicks)
 * @param {Array} conversions
 * @returns {Array} Top 3 performers
 */
export function rankContentByROI(conversions) {
    if (!conversions?.length) return [];

    return [...conversions]
        .map(c => ({
            ...c,
            roi: c.clicks > 0 ? (c.revenue || 0) / c.clicks : 0,
            cr: c.clicks > 0 ? ((c.orders || 0) / c.clicks * 100).toFixed(1) : '0',
        }))
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 3);
}

/**
 * Calculate summary stats from conversions
 * @param {Array} conversions
 * @returns {Object}
 */
export function calculateSummary(conversions) {
    const totalClicks = conversions.reduce((s, c) => s + (c.clicks || 0), 0);
    const totalOrders = conversions.reduce((s, c) => s + (c.orders || 0), 0);
    const totalRevenue = conversions.reduce((s, c) => s + (c.revenue || 0), 0);
    const avgCR = totalClicks > 0 ? (totalOrders / totalClicks * 100).toFixed(2) : '0';

    return { totalClicks, totalOrders, totalRevenue, avgCR };
}
