/**
 * Gemini AI Service — Content generation via Gemini API
 * Direct client-side for dev; production should use Cloud Functions proxy (brainstorm C1)
 */
import { store } from '../utils/state.js';

import { getTopPerformingContent } from './firestore.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

// ===== Internal Helper — Shared Gemini API call =====

/**
 * Call Gemini API with a prompt and configuration
 * @param {string} prompt - The full prompt text
 * @param {Object} config - Generation config overrides
 * @param {string} [config.model] - Model override (default: MODEL)
 * @param {number} [config.temperature] - Temperature (default: 0.8)
 * @param {number} [config.topP] - Top-P (default: 0.95)
 * @param {number} [config.maxOutputTokens] - Max tokens (default: 4096)
 * @param {string} [config.responseMimeType] - Response MIME type (e.g., 'application/json')
 * @returns {string} Generated text content
 */
async function callGemini(prompt, config = {}) {
    const model = config.model || MODEL;
    const generationConfig = {
        temperature: config.temperature ?? 0.8,
        topP: config.topP ?? 0.95,
        maxOutputTokens: config.maxOutputTokens ?? 4096,
    };
    if (config.responseMimeType) {
        generationConfig.responseMimeType = config.responseMimeType;
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
            }),
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content generated');
    return text;
}

// ===== Content Generation =====

/**
 * Generate content from a brief using Gemini AI
 * @param {Object} brief - Structured brief from guided form
 * @returns {Object} { facebook, blog, story }
 */
export async function generateContent(brief) {
    const brand = store.get('brand');

    // Phase 2: Intelligence Loop
    // Fetch top performing content to use as few-shot examples
    let performanceContext = [];
    try {
        performanceContext = await getTopPerformingContent(3);
    } catch (e) {
        console.warn('Failed to load intelligence context', e);
    }

    const systemPrompt = buildSystemPrompt(brand, performanceContext);
    const userPrompt = buildUserPrompt(brief);

    try {
        const text = await callGemini(`${systemPrompt}\n\n---\n\n${userPrompt}`, {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 4096,
        });
        return parseGeneratedContent(text);
    } catch (error) {
        console.error('Gemini error:', error);
        throw error;
    }
}

/** Build system prompt with brand context and intelligence */
function buildSystemPrompt(brand, performanceContext = []) {
    const brandContext = brand ? `
THÔNG TIN THƯƠNG HIỆU:
- Tên: ${brand.name || 'N/A'}
- Ngành: ${brand.industry || 'N/A'}
- Archetype (Hình mẫu): ${brand.archetype || 'Chưa thiết lập'}
- Tone (Giọng điệu): ${brand.tone || 'Thân thiện, chuyên nghiệp'}
- Voice Guidelines (Hướng dẫn giọng văn): ${brand.voice || 'Không có'}
- Khách hàng mục tiêu (Avatars): ${brand.avatars || brand.targetAudience || 'N/A'}
- Hashtag mặc định: ${brand.defaultHashtags || ''}
- Sản phẩm/dịch vụ: ${brand.products || 'N/A'}
${brand.disclaimer ? `- Disclaimer bắt buộc: ${brand.disclaimer}` : ''}
` : 'Chưa có thông tin brand. Viết với tone chuyên nghiệp, thân thiện.';

    let intelligenceContext = '';
    if (performanceContext && performanceContext.length > 0) {
        intelligenceContext = `
PHÂN TÍCH HIỆU QUẢ (INTELLIGENCE):
Dưới đây là các bài viết đã mang lại doanh thu cao nhất cho thương hiệu. Hãy học hỏi giọng văn, cấu trúc và cách kêu gọi hành động (CTA) của chúng:
${performanceContext.map((c, i) => `
${i + 1}. [Hiệu quả: ${c.orders} đơn, ${((c.revenue || 0) / 1000).toFixed(0)}K doanh thu]
"${c.body.substring(0, 300)}..."
`).join('\n')}
`;
    }

    return `Bạn là một Content Marketing Expert chuyên viết nội dung tiếng Việt cho doanh nghiệp.

${brandContext}
${intelligenceContext}

QUY TẮC:
1. Viết NATIVE tiếng Việt (không dịch từ tiếng Anh)
2. Tone phải nhất quán với thương hiệu
3. Nếu ngành TPCN: KHÔNG dùng từ "chữa bệnh", "điều trị". Luôn kèm disclaimer nếu có.
4. SEO: Dùng heading, keyword tự nhiên trong blog
5. Facebook: Ngắn gọn, có emoji, CTA rõ ràng, hashtag
6. Story: Siêu ngắn, hook mạnh, 1-2 dòng

OUTPUT FORMAT (BẮT BUỘC):
Trả về đúng 3 phần, mỗi phần được đánh dấu bằng header:

===FACEBOOK===
[Nội dung Facebook post]

===BLOG===
[Nội dung blog article - có heading, dài hơn]

===STORY===
[Nội dung story caption - siêu ngắn]`;
}

/** Build user prompt from guided brief */
function buildUserPrompt(brief) {
    let prompt = 'Hãy viết content cho brief sau:\n\n';

    if (brief.product) prompt += `📦 Sản phẩm/Chủ đề: ${brief.product}\n`;
    if (brief.highlight) prompt += `⭐ Điểm nổi bật: ${brief.highlight}\n`;
    if (brief.promotion) prompt += `🎁 Khuyến mãi: ${brief.promotion}\n`;
    if (brief.cta) prompt += `👉 CTA mong muốn: ${brief.cta}\n`;
    if (brief.additionalNotes) prompt += `📝 Ghi chú thêm: ${brief.additionalNotes}\n`;
    if (brief.contentType) prompt += `📋 Loại bài: ${brief.contentType}\n`;

    return prompt;
}

/** Parse AI response into 3 sections */
function parseGeneratedContent(text) {
    const result = {
        facebook: '',
        blog: '',
        story: '',
        raw: text,
    };

    // Try to parse with markers
    const fbMatch = text.match(/===FACEBOOK===([\s\S]*?)(?====BLOG===|$)/);
    const blogMatch = text.match(/===BLOG===([\s\S]*?)(?====STORY===|$)/);
    const storyMatch = text.match(/===STORY===([\s\S]*?)$/);

    if (fbMatch) result.facebook = fbMatch[1].trim();
    if (blogMatch) result.blog = blogMatch[1].trim();
    if (storyMatch) result.story = storyMatch[1].trim();

    // Fallback: if parsing failed, put everything in facebook
    if (!result.facebook && !result.blog && !result.story) {
        result.facebook = text.trim();
        result.blog = text.trim();
        result.story = text.split('\n')[0]?.trim() || text.trim();
    }

    return result;
}

/** Check daily usage limit */
export function checkDailyLimit() {
    const today = new Date().toISOString().split('T')[0];
    const key = `cp_usage_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    return { count, limit: 20, remaining: Math.max(0, 20 - count) };
}

/** Increment usage counter */
export function incrementUsage() {
    const today = new Date().toISOString().split('T')[0];
    const key = `cp_usage_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, count.toString());
    return count;
}

// ===== Content Variations =====

export const VARIATION_TYPES = [
    { id: 'shorter', name: '✂️ Ngắn hơn', desc: 'Rút gọn, giữ ý chính' },
    { id: 'longer', name: '📝 Dài hơn', desc: 'Mở rộng, thêm chi tiết' },
    { id: 'formal', name: '🎩 Trang trọng', desc: 'Tone nghiêm túc, chuyên nghiệp' },
    { id: 'casual', name: '😊 Thân mật', desc: 'Tone gần gũi, vui vẻ' },
    { id: 'question', name: '❓ Câu hỏi', desc: 'Dạng hỏi-đáp, tương tác' },
    { id: 'story', name: '📖 Storytelling', desc: 'Dạng kể chuyện, cảm xúc' },
];

/**
 * Generate a variation of existing content
 * @param {string} originalContent - Original text
 * @param {string} variationType - One of VARIATION_TYPES ids
 * @param {string} platform - 'facebook', 'blog', or 'story'
 * @returns {string} Variation text
 */
export async function generateVariation(originalContent, variationType, platform = 'facebook') {
    const typeLabels = {
        shorter: 'Viết lại NGẮN HƠN (giảm 40-50% độ dài), giữ ý chính và CTA',
        longer: 'Viết lại DÀI HƠN (tăng 50-80% độ dài), thêm chi tiết và ví dụ',
        formal: 'Viết lại với TONE TRANG TRỌNG, chuyên nghiệp, nghiêm túc',
        casual: 'Viết lại với TONE THÂN MẬT, gần gũi, vui vẻ, nhiều emoji hơn',
        question: 'Viết lại dạng CÂU HỎI - ĐÁP, bắt đầu bằng câu hỏi gây tò mò',
        story: 'Viết lại dạng KỂ CHUYỆN (storytelling), có nhân vật và cảm xúc',
    };

    const instruction = typeLabels[variationType] || typeLabels.shorter;

    const prompt = `Bạn là content writer chuyên nghiệp. Hãy viết lại nội dung sau theo yêu cầu.

YÊU CẦU: ${instruction}

PLATFORM: ${platform === 'blog' ? 'Blog article' : platform === 'story' ? 'Story caption (siêu ngắn)' : 'Facebook post'}

NỘI DUNG GỐC:
---
${originalContent}
---

CHỈ TRẢ VỀ nội dung đã viết lại, KHÔNG giải thích hay comment gì thêm.`;

    try {
        const text = await callGemini(prompt, { temperature: 0.9 });
        return text.trim();
    } catch (error) {
        console.error('Variation error:', error);
        throw error;
    }
}

// ===== Strategy & Campaign AI =====

/**
 * Generate Strategy Ideas based on Brand Identity & Business Goal
 * @param {Object} brand - Brand Identity
 * @param {string} goal - Current Business Goal
 * @returns {Array} List of Campaign Ideas
 */
export async function generateStrategy(brand, goal) {
    const systemPrompt = `Bạn là Chief Marketing Officer (CMO) với 20 năm kinh nghiệm.
Nhiệm vụ: Lên chiến lược content cho thương hiệu dựa trên mục tiêu kinh doanh.

THÔNG TIN THƯƠNG HIỆU:
- Tên: ${brand.name}
- Ngành: ${brand.industry}
- Archetype: ${brand.archetype || 'N/A'}
- Voice: ${brand.voice || 'N/A'}
- Khách hàng: ${brand.avatars || brand.targetAudience}

OUTPUT FORMAT:
Trả về JSON array thuần túy (không markdown block), mỗi item là một object:
[
  {
    "name": "Tên chiến dịch (ngắn gọn, thu hút)",
    "angle": "Góc độ tiếp cận (e.g., Fear of missing out, Educational, Storytelling)",
    "description": "Mô tả chiến dịch và tại sao nó phù hợp với goal",
    "hook": "Câu hook mẫu để bắt đầu",
    "contentTypes": ["Facebook", "Blog", "Reels"]
  }
]
`;

    const userPrompt = `MỤC TIÊU KINH DOANH HIỆN TẠI: "${goal}"

Hãy đề xuât 3 ý tưởng chiến dịch (Campaign Concepts) khác biệt nhau để đạt mục tiêu này.
Mỗi ý tưởng phải phù hợp với Archetype và Voice của thương hiệu.`;

    try {
        const text = await callGemini(`${systemPrompt}\n\n---\n\n${userPrompt}`, {
            temperature: 1.0,
            responseMimeType: 'application/json',
        });
        return JSON.parse(text);
    } catch (error) {
        console.error('Strategy AI error:', error);
        throw error;
    }
}

/**
 * Generate Content Pillars from Campaign Brief
 * @param {Object} brand - Brand Identity
 * @param {string} campaignBrief - Campaign name/description
 * @returns {Array} List of pillar objects
 */
export async function generatePillars(brand, campaignBrief) {
    const systemPrompt = `Bạn là Content Strategist chuyên nghiệp.
Nhiệm vụ: Tạo các Content Pillars (trụ cột nội dung) cho chiến dịch marketing.

THÔNG TIN THƯƠNG HIỆU:
- Tên: ${brand.name}
- Ngành: ${brand.industry}
- Archetype: ${brand.archetype || 'N/A'}
- Khách hàng: ${brand.avatars || brand.targetAudience || 'N/A'}

Content Pillar = chủ đề lớn mà thương hiệu sẽ xoay quanh trong chiến dịch.
Mỗi pillar phải rõ ràng, không trùng lặp, và phục vụ mục tiêu chiến dịch.

OUTPUT FORMAT:
Trả về JSON array thuần túy (không markdown block):
[
  {
    "name": "Tên pillar ngắn gọn (3-5 từ)",
    "description": "Mô tả pillar và tại sao nó quan trọng cho chiến dịch (1-2 câu)",
    "priority": "high|medium|low",
    "suggestedCadence": "Tần suất đăng gợi ý (ví dụ: 3 bài/tuần)"
  }
]`;

    const userPrompt = `CHIẾN DỊCH: "${campaignBrief}"

Hãy tạo 4 Content Pillars khác biệt, phù hợp với chiến dịch trên.
Sắp xếp theo priority từ cao xuống thấp.`;

    try {
        const text = await callGemini(`${systemPrompt}\n\n---\n\n${userPrompt}`, {
            temperature: 0.8,
            responseMimeType: 'application/json',
        });
        return JSON.parse(text);
    } catch (error) {
        console.error('Pillar AI error:', error);
        throw error;
    }
}

/**
 * Generate Angles from a Content Pillar
 * @param {Object} brand - Brand Identity
 * @param {Object} pillar - { name, description }
 * @param {string} campaignBrief - Campaign context
 * @returns {Array} List of angle objects
 */
export async function generateAngles(brand, pillar, campaignBrief) {
    const systemPrompt = `Bạn là Creative Director chuyên content marketing.
Nhiệm vụ: Tạo các Content Angles (góc tiếp cận) từ một Content Pillar.

THÔNG TIN THƯƠNG HIỆU:
- Tên: ${brand.name}
- Ngành: ${brand.industry}
- Voice: ${brand.voice || 'N/A'}
- Khách hàng: ${brand.avatars || brand.targetAudience || 'N/A'}

Content Angle = cách triển khai cụ thể từ một pillar. Mỗi angle là một bài viết tiềm năng.
Các angle phải đa dạng về tone, format, và góc nhìn.

OUTPUT FORMAT:
Trả về JSON array thuần túy (không markdown block):
[
  {
    "name": "Tên angle ngắn gọn",
    "type": "educational|storytelling|social-proof|fomo|problem-solution|behind-the-scenes",
    "hook": "Câu hook mẫu để bắt đầu bài viết (1 câu thu hút)",
    "keyMessage": "Thông điệp chính của angle",
    "suggestedFormat": "Facebook Post|Blog|Reels|Story"
  }
]`;

    const userPrompt = `CHIẾN DỊCH: "${campaignBrief}"
PILLAR: "${pillar.name}" — ${pillar.description}

Hãy tạo 4 Content Angles đa dạng từ pillar trên.
Mỗi angle phải có hook hấp dẫn và thông điệp rõ ràng.`;

    try {
        const text = await callGemini(`${systemPrompt}\n\n---\n\n${userPrompt}`, {
            temperature: 0.9,
            responseMimeType: 'application/json',
        });
        return JSON.parse(text);
    } catch (error) {
        console.error('Angle AI error:', error);
        throw error;
    }
}
