/**
 * Smart Templates — AI-powered template autofill with context
 * Templates that auto-fill from Brand Profile, marketing events, and library data
 */
import { store } from '../utils/state.js';
import { getUpcomingEvents } from '../data/marketing-events.js';

/**
 * AI Template definitions with resolver functions
 */
const AI_TEMPLATES = [
    {
        id: 'event-week',
        name: '🎉 Sự kiện tuần này',
        desc: 'Tự fill tên sự kiện marketing từ lịch',
        resolve: () => {
            const events = getUpcomingEvents(7);
            if (events.length > 0) {
                return {
                    product: events[0].name,
                    highlight: events[0].tip || events[0].name,
                    audience: 'Khách hàng quan tâm đến sự kiện',
                    angle: `Content cho sự kiện ${events[0].name} — ${events[0].tip || 'tạo nội dung phù hợp'}`,
                };
            }
            return { product: 'Không có sự kiện trong 7 ngày tới', highlight: '', audience: '' };
        },
    },
    {
        id: 'best-seller',
        name: '📦 Sản phẩm best-seller',
        desc: 'Tự fill SP #1 từ Brand Profile',
        resolve: () => {
            const brand = store.get('brand') || {};
            const products = brand.products || [];
            const top = products[0];
            return top
                ? { product: top.name, highlight: top.description || top.usp || '', audience: brand.targetAudience || '' }
                : { product: 'Chưa có sản phẩm trong Brand Profile', highlight: '', audience: '' };
        },
    },
    {
        id: 'testimonial',
        name: '💬 Testimonial replay',
        desc: 'Bài có Score cao nhất từ Library',
        resolve: () => {
            const contents = store.get('contents') || [];
            const published = contents
                .filter(c => c.status === 'published')
                .sort((a, b) => (b.score || 0) - (a.score || 0));
            const top = published[0];
            return top
                ? {
                    product: top.product || top.brief?.slice(0, 50) || 'Top content',
                    highlight: 'Viết lại dưới dạng testimonial/review từ góc nhìn khách hàng',
                    audience: top.audience || '',
                    angle: 'Testimonial',
                }
                : { product: 'Chưa có bài published', highlight: '', audience: '' };
        },
    },
    {
        id: 'flash-sale',
        name: '🔥 Flash sale',
        desc: 'Promo hiện tại từ Brand Profile USP',
        resolve: () => {
            const brand = store.get('brand') || {};
            const products = brand.products || [];
            // Find product with promo keywords
            const promoProduct = products.find(p =>
                /khuyến mãi|giảm|ưu đãi|sale|flash|deal|tặng|freeship/i.test(p.description || p.usp || ''),
            ) || products[0];
            return promoProduct
                ? {
                    product: promoProduct.name,
                    highlight: promoProduct.description || promoProduct.usp || '',
                    audience: brand.targetAudience || '',
                    angle: 'Flash Sale / Khuyến mãi',
                }
                : { product: 'Chưa có sản phẩm', highlight: 'Thêm chương trình KM vào USP sản phẩm', audience: '' };
        },
    },
    {
        id: 'data-driven',
        name: '📊 Data-driven post',
        desc: 'Số liệu content tuần từ Dashboard',
        resolve: () => {
            const contents = store.get('contents') || [];
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekContents = contents.filter(c => new Date(c.createdAt) >= weekAgo);
            const total = weekContents.length;
            const published = weekContents.filter(c => c.status === 'published').length;

            return {
                product: `Tuần qua: ${total} bài, ${published} đã đăng`,
                highlight: 'Viết bài chia sẻ kết quả content marketing tuần qua, kèm bài học',
                audience: 'Cộng đồng marketing / Followers',
                angle: 'Behind-the-scenes / Data sharing',
            };
        },
    },
];

/**
 * Resolve a smart template by ID
 * @param {string} templateId
 * @returns {Object|null} Resolved brief data
 */
export function resolveTemplate(templateId) {
    const tmpl = AI_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return null;
    return tmpl.resolve();
}

/**
 * Get all AI templates definitions (for rendering)
 * @returns {Array}
 */
export function getAITemplates() {
    return AI_TEMPLATES;
}
