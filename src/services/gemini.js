/**
 * Gemini AI Service — Content generation via Gemini API
 * Production: calls /api/gemini (Cloudflare Functions proxy — key hidden server-side)
 * Dev fallback: if VITE_GEMINI_API_KEY exists, calls Google directly (for npm run dev without wrangler)
 */
import { store } from '../utils/state.js';

import { getTopPerformingContent } from './firestore.js';

const DEV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL = 'gemini-2.0-flash';

// ===== Internal Helper — Shared Gemini API call =====

/**
 * Call Gemini API — routes through Cloudflare proxy in production,
 * falls back to direct call in local dev if VITE_GEMINI_API_KEY is set.
 * @param {string} prompt - The full prompt text
 * @param {Object} config - Generation config overrides
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

    let response;

    // --- Dev offline fallback: mock response if no key ---
    if (!DEV_API_KEY && window.location.hostname === 'localhost') {
        console.warn('No Gemini API config found. Using OFFLINE MOCK response.');
        await new Promise(res => setTimeout(res, 2000));

        // If it's a JSON response request (for strategy/pillars)
        if (config.responseMimeType === 'application/json') {
            if (prompt.includes('CHIẾN DỊCH:')) { // Angle or Pillar
                return prompt.includes('PILLAR:')
                    ? `[{"name":"Mock Angle","type":"educational","hook":"Bạn có biết?","keyMessage":"Điều tuyệt vời","suggestedFormat":"Facebook Post"}]`
                    : `[{"name":"Mock Pillar","description":"Pillar description","priority":"high","suggestedCadence":"2 bài/tuần"}]`;
            }
            return `[{"name":"Mock Campaign","angle":"Storytelling","description":"Mock desc","hook":"Sốc!","contentTypes":["Facebook"]}]`;
        }

        return `
===FACEBOOK===
🎯 Đây là nội dung giả lập (Mock) vì không có API Key!
Sản phẩm này cực kỳ tốt, mua ngay hôm nay để nhận ưu đãi.
👉 Inbox ngay để được tư vấn!

===BLOG===
# Bài viết Blog Giả Lập
Nội dung dài hơn ở đây. Chứng minh lâm sàng 100% hiệu quả.
Liên hệ chuyên gia để biết thêm chi tiết.

===STORY===
Sốc quá! Đừng bỏ lỡ cơ hội này. Nhấp vào link ngay! 💥
`;
    }

    // Check if proxy endpoint is available (production / wrangler dev)
    const useProxy = !DEV_API_KEY && window.location.hostname !== 'localhost';

    if (useProxy) {
        // --- Production path: Cloudflare Functions proxy ---
        response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, config: { model, ...generationConfig } }),
        });
    } else {
        // --- Dev fallback: direct call ---
        response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${DEV_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig,
                }),
            }
        );
    }

    if (!response.ok) {
        // Safely try to parse error body
        let errorMessage = `API request failed (HTTP ${response.status})`;
        try {
            const errText = await response.text();
            if (errText) {
                const errData = JSON.parse(errText);
                errorMessage = errData.error?.message || errData.error || errorMessage;
            }
        } catch {
            // Body was empty or not JSON — use the default error message
        }
        throw new Error(errorMessage);
    }

    // Safely parse successful response
    const responseText = await response.text();
    if (!responseText) throw new Error('Phản hồi từ AI trống. Vui lòng thử lại.');

    let data;
    try {
        data = JSON.parse(responseText);
    } catch {
        throw new Error('Phản hồi AI không hợp lệ. Vui lòng thử lại.');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI không tạo được nội dung. Vui lòng thử lại.');
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

    const systemPrompt = buildSystemPrompt(brand, performanceContext, brief.customPrompt);
    const userPrompt = buildUserPrompt(brief);

    try {
        const text = await callGemini(`${systemPrompt} \n\n-- -\n\n${userPrompt} `, {
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
function buildSystemPrompt(brand, performanceContext = [], customPrompt = null) {
    const brandContext = brand ? `
THÔNG TIN THƯƠNG HIỆU:
        - Tên: ${brand.name || 'N/A'}
        - Ngành: ${brand.industry || 'N/A'}
        - Archetype(Hình mẫu): ${brand.archetype || 'Chưa thiết lập'}
        - Tone(Giọng điệu): ${brand.tone || 'Thân thiện, chuyên nghiệp'}
        - Voice Guidelines(Hướng dẫn giọng văn): ${brand.voice || 'Không có'}
        - Khách hàng mục tiêu(Avatars): ${brand.avatars || 'N/A'}
        - Hashtag mặc định: ${brand.defaultHashtags || ''}
        - Sản phẩm / dịch vụ: (Sẽ được cung cấp trong Brief)
${brand.disclaimer ? `- Disclaimer bắt buộc: ${brand.disclaimer}` : ''}
        ` : 'Chưa có thông tin brand. Viết với tone chuyên nghiệp, thân thiện.';

    let intelligenceContext = '';
    if (performanceContext && performanceContext.length > 0) {
        intelligenceContext = `
PHÂN TÍCH HIỆU QUẢ(INTELLIGENCE):
Dưới đây là các bài viết đã mang lại doanh thu cao nhất cho thương hiệu.Hãy học hỏi giọng văn, cấu trúc và cách kêu gọi hành động(CTA) của chúng:
${performanceContext.map((c, i) => `
${i + 1}. [Hiệu quả: ${c.orders} đơn, ${((c.revenue || 0) / 1000).toFixed(0)}K doanh thu]
"${c.body.substring(0, 300)}..."
`).join('\n')
            }
        `;
    }

    const personaPrompt = customPrompt ? customPrompt : 'Bạn là một Content Marketing Expert chuyên viết nội dung tiếng Việt cho doanh nghiệp.';

    return `${personaPrompt}

            ${brandContext}
${intelligenceContext}

QUY TẮC:
        1. Viết NATIVE tiếng Việt(không dịch từ tiếng Anh)
        2. Tone phải nhất quán với thương hiệu
        3.[QUAN TRỌNG - TPCN COMPLIANCE] NẾU LÀ THỰC PHẨM CHỨC NĂNG:
        - TUYỆT ĐỐI KHÔNG dùng các từ: "chữa khỏi", "đặc trị", "thuốc", "điều trị", "thần dược", "tốt nhất", "số 1", "cam kết 100%", "không tác dụng phụ", "bệnh nhân".
   - Chỉ được phép dùng các từ: "hỗ trợ", "cải thiện", "người dùng".
   - Phải kèm theo câu: "Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh." cuối bài viết.
4. SEO: Dùng heading, keyword tự nhiên trong blog
        5. Facebook: Ngắn gọn, có emoji, CTA rõ ràng, hashtag
        6. Story: Siêu ngắn, hook mạnh, 1 - 2 dòng

OUTPUT FORMAT(BẮT BUỘC):
Trả về đúng 3 phần, mỗi phần được đánh dấu bằng header:

=== FACEBOOK ===
            [Nội dung Facebook post]

            === BLOG ===
            [Nội dung blog article - có heading, dài hơn]

            === STORY ===
            [Nội dung story caption - siêu ngắn]`;
}

/** Build user prompt from guided brief */
function buildUserPrompt(brief) {
    let prompt = 'Hãy viết content cho brief sau:\n\n';

    if (brief.campaign) prompt += `🎯 Thuộc chiến dịch: ${brief.campaign} \n`;
    if (brief.pillar) prompt += `🏛️ Nằm trong Pillar: ${brief.pillar} \n`;
    if (brief.angle) {
        prompt += `📐 Góc tiếp cận(Angle): ${brief.angle.name} \n`;
        if (brief.angle.type) prompt += `   - Phân loại: ${brief.angle.type} \n`;
        if (brief.angle.hook) prompt += `   - Gợi ý Hook(RẤT QUAN TRỌNG): "${brief.angle.hook}"\n`;
        if (brief.angle.keyMessage) prompt += `   - Điểm nhấn chính: ${brief.angle.keyMessage} \n`;
    }

    if (brief.product) prompt += `📦 Sản phẩm / Chủ đề: ${brief.product} \n`;
    if (brief.targetAvatar) prompt += `🎯 TỆP KHÁCH HÀNG MỤC TIÊU(QUAN TRỌNG): Viết ĐÚNG VÀO IDIOM VÀ INSIGHT CỦA TỆP "${brief.targetAvatar}".Chạm đúng nỗi đau và ngôn từ của họ!\n`;
    if (brief.highlight) prompt += `⭐ Điểm nổi bật: ${brief.highlight} \n`;
    if (brief.promotion) prompt += `🎁 Khuyến mãi: ${brief.promotion} \n`;
    if (brief.cta) prompt += `👉 CTA mong muốn: ${brief.cta} \n`;
    if (brief.additionalNotes) prompt += `📝 Ghi chú thêm: ${brief.additionalNotes} \n`;
    if (brief.contentType) prompt += `📋 Loại bài: ${brief.contentType} \n`;

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
    const key = `cp_usage_${today} `;
    const count = parseInt(localStorage.getItem(key) || '0');
    return { count, limit: 20, remaining: Math.max(0, 20 - count) };
}

/** Increment usage counter */
export function incrementUsage() {
    const today = new Date().toISOString().split('T')[0];
    const key = `cp_usage_${today} `;
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

    const prompt = `Bạn là content writer chuyên nghiệp.Hãy viết lại nội dung sau theo yêu cầu.

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
 * Generate a list of campaign angles/ideas based on a business goal
 * @param {Object} brand - Brand context
 * @param {Object} context - Strategy context { goal, product, avatars }
 * @returns {Array} List of ideas objects
 */
export async function generateStrategy(brand, context = {}) {
    const goal = context.goal || context; // Fallback for old string usage
    const productStr = context.product ? `Sản phẩm trọng tâm: ${context.product}` : (brand?.products ? `Sản phẩm trọng tâm: ${brand.products}` : '');
    const avatarsStr = context.avatars ? `Khách hàng mục tiêu chiến dịch: ${context.avatars}` : '';

    // Build context string from brand + specific strategy inputs
    const brandInfo = [
        brand?.name ? `Brand: ${brand.name}` : '',
        brand?.industry ? `Ngành: ${brand.industry}` : '',
        productStr,
        avatarsStr || (brand?.avatars ? `Khách hàng mục tiêu: ${brand.avatars}` : '')
    ].filter(Boolean).join('\n');

    const systemPrompt = `Bạn là Chief Marketing Officer(CMO) với 20 năm kinh nghiệm.
Nhiệm vụ: Lên chiến lược content cho thương hiệu dựa trên mục tiêu kinh doanh.

THÔNG TIN THƯƠNG HIỆU:
${brandInfo}
        - Archetype: ${brand.archetype || 'N/A'}
        - Voice: ${brand.voice || 'N/A'}

OUTPUT FORMAT:
Trả về JSON array thuần túy(không markdown block), mỗi item là một object:
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

Hãy đề xuât 3 ý tưởng chiến dịch(Campaign Concepts) khác biệt nhau để đạt mục tiêu này.
Mỗi ý tưởng phải phù hợp với Archetype và Voice của thương hiệu.`;

    try {
        const text = await callGemini(`${systemPrompt} \n\n-- -\n\n${userPrompt} `, {
            temperature: 1.0,
            responseMimeType: 'application/json',
        });
        return safeParseJSON(text);
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
Nhiệm vụ: Tạo các Content Pillars(trụ cột nội dung) cho chiến dịch marketing.

THÔNG TIN THƯƠNG HIỆU:
        - Tên: ${brand.name}
        - Ngành: ${brand.industry}
        - Archetype: ${brand.archetype || 'N/A'}
        - Khách hàng: ${brand.avatars || 'N/A'}

Content Pillar = chủ đề lớn mà thương hiệu sẽ xoay quanh trong chiến dịch.
Mỗi pillar phải rõ ràng, không trùng lặp, và phục vụ mục tiêu chiến dịch.

OUTPUT FORMAT:
Trả về JSON array thuần túy(không markdown block):
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
        const text = await callGemini(`${systemPrompt} \n\n-- -\n\n${userPrompt} `, {
            temperature: 0.8,
            responseMimeType: 'application/json',
        });
        return safeParseJSON(text);
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
Nhiệm vụ: Tạo các Content Angles(góc tiếp cận) từ một Content Pillar.

THÔNG TIN THƯƠNG HIỆU:
        - Tên: ${brand.name}
        - Ngành: ${brand.industry}
        - Voice: ${brand.voice || 'N/A'}
        - Khách hàng: ${brand.avatars || 'N/A'}

Content Angle = cách triển khai cụ thể từ một pillar.Mỗi angle là một bài viết tiềm năng.
Các angle phải đa dạng về tone, format, và góc nhìn.

OUTPUT FORMAT:
Trả về JSON array thuần túy(không markdown block):
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
        const text = await callGemini(`${systemPrompt} \n\n-- -\n\n${userPrompt} `, {
            temperature: 0.9,
            responseMimeType: 'application/json',
        });
        return safeParseJSON(text);
    } catch (error) {
        console.error('Angle AI error:', error);
        throw error;
    }
}

// ===== Visual & Design AI =====

/**
 * Generate an AI Image Prompt (e.g. Midjourney) based on the content brief
 * @param {Object} brief - The content brief
 * @returns {string} The prompt hint
 */
export async function generateImagePrompt(brief) {
    const brand = store.get('brand');
    const systemPrompt = `Bạn là một AI Prompt Engineer xuất sắc chuyên thiết kế prompt cho Midjourney, DALL-E, và Stable Diffusion.
Nhiệm vụ: Dựa vào thông điệp sản phẩm và đối tượng khách hàng, hãy viết 1 prompt ngắn gọn bằng Tiếng Anh (khoảng 30-50 từ) để render hình ảnh quảng cáo (Commercial Photography, Cinematic, Social Media Ad).
Chỉ trả về độ phân giải, ánh sáng, phong cách, màu sắc.
OUTPUT TRẢ VỀ CHỈ LÀ ĐOẠN PROMPT TIẾNG ANH, KHÔNG GIẢI THÍCH GÌ THÊM.`;

    let userPrompt = `Hãy viết Prompt thiết kế cho sản phẩm: "${brief.product || brief.name || 'Sản phẩm kinh doanh'}".\n`;
    if (brief.highlight) userPrompt += `Điểm nổi bật: ${brief.highlight}\n`;
    if (brief.targetAvatar) userPrompt += `Khách hàng: ${brief.targetAvatar}\n`;
    if (brief.promotion) userPrompt += `Ưu đãi: ${brief.promotion}\n`;
    userPrompt += `\nYêu cầu: Viết một câu lệnh prompt Midjourney thật chi tiết, có "cinematic lighting, photorealistic, 8k, aspect ratio 16:9".`;

    try {
        const text = await callGemini(`${systemPrompt}\n\n---\n\n${userPrompt}`, {
            temperature: 0.8,
        });
        return text.trim();
    } catch (error) {
        console.error('Visual prompt AI error:', error);
        throw error;
    }
}

// ===== Utility: Safe JSON Parser =====

/**
 * Safely parse JSON from AI response text.
 * Handles cases where AI wraps JSON in markdown code blocks.
 */
function safeParseJSON(text) {
    if (!text) throw new Error('AI trả về nội dung trống.');

    // Try direct parse first
    try {
        return JSON.parse(text);
    } catch {
        // AI sometimes wraps JSON in ```json ... ``` blocks
        const jsonMatch = text.match(/```(?: json) ?\s * ([\s\S] *?)```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch {
                // fall through
            }
        }

        // Try to find the array/object boundary manually 
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            try {
                return JSON.parse(text.substring(firstBracket, lastBracket + 1));
            } catch {
                // fall through
            }
        }

        throw new Error('AI trả về dữ liệu không đúng định dạng JSON. Vui lòng thử lại.');
    }
}
