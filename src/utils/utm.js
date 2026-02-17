/**
 * UTM Generator Utility
 * Auto-generates UTM parameters for content tracking
 */

/**
 * Generate UTM parameters for a content link
 * @param {string} baseUrl - The original URL to add UTM to
 * @param {Object} params - UTM parameters 
 * @returns {string} URL with UTM parameters
 */
export function generateUTM(baseUrl, params = {}) {
    if (!baseUrl) return '';

    const {
        contentId = '',
        platform = 'facebook',
        campaign = 'organic',
        medium = 'social',
    } = params;

    const utmParams = {
        utm_source: platform,
        utm_medium: medium,
        utm_campaign: campaign || 'content-marketing',
        utm_content: contentId || `post_${Date.now()}`,
        utm_term: params.term || '',
    };

    // Remove empty params
    Object.keys(utmParams).forEach(key => {
        if (!utmParams[key]) delete utmParams[key];
    });

    const url = new URL(baseUrl);
    Object.keys(utmParams).forEach(key => {
        url.searchParams.set(key, utmParams[key]);
    });

    return url.toString();
}

/**
 * Parse UTM parameters from URL
 * @param {string} url - URL with UTM parameters
 * @returns {Object} Parsed UTM params
 */
export function parseUTM(url) {
    if (!url) return {};

    try {
        const urlObj = new URL(url);
        return {
            source: urlObj.searchParams.get('utm_source') || '',
            medium: urlObj.searchParams.get('utm_medium') || '',
            campaign: urlObj.searchParams.get('utm_campaign') || '',
            content: urlObj.searchParams.get('utm_content') || '',
            term: urlObj.searchParams.get('utm_term') || '',
        };
    } catch (e) {
        return {};
    }
}

/**
 * Build tracking link for product
 * @param {string} productUrl - Original product URL
 * @param {string} contentId - Content ID for tracking
 * @param {string} platform - Platform name (facebook, blog, etc)
 * @param {string} campaign - Campaign name (optional)
 * @returns {string} Tracking URL
 */
export function buildTrackingLink(productUrl, contentId, platform, campaign = null) {
    return generateUTM(productUrl, {
        contentId,
        platform,
        campaign: campaign || 'content-pilot',
        medium: platform === 'blog' ? 'blog' : 'social',
    });
}

/**
 * Common campaign presets
 */
export const CAMPAIGN_PRESETS = [
    { id: 'tet2026', name: 'Tết 2026', dates: '2026-01-20 to 2026-02-15' },
    { id: 'flashsale', name: 'Flash Sale', dates: 'Weekly' },
    { id: 'newproduct', name: 'Ra mắt sản phẩm mới', dates: 'Ongoing' },
    { id: 'seasonal', name: 'Theo mùa (Dị ứng/Tăng đề kháng)', dates: 'Q1-Q2' },
    { id: 'backtoschool', name: 'Tựu trường', dates: 'August' },
];
