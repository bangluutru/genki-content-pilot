// gemini.js — Gọi Gemini API để tạo content
// Service duy nhất cho AI content generation

import { CONFIG } from '../config.js';

/**
 * Tạo content từ brief + brand context + campaign brief (nếu có)
 * @param {string} brief - Mô tả ngắn về bài viết
 * @param {object} brand - Brand profile (tone, products, disclaimer)
 * @param {string} apiKey - Gemini API key
 * @param {string} contentType - Loại bài: product, promo, education, testimonial, announcement
 * @param {object} [campaignBrief] - Campaign brief đã approved (optional)
 * @returns {Promise<{fbPost: string, blog: string, caption: string}>}
 */
export async function generateContent(brief, brand, apiKey, contentType = 'product', campaignBrief = null) {
    const systemPrompt = buildSystemPrompt(brand, campaignBrief);
    const userPrompt = buildUserPrompt(brief, contentType, campaignBrief);

    const response = await callGeminiAPI(systemPrompt, userPrompt, apiKey);
    return parseResponse(response);
}

/**
 * Xây dựng system prompt từ brand profile + campaign brief
 * Bao gồm: tone, sản phẩm, disclaimer TPCN, SMP, ICP, compliance
 */
function buildSystemPrompt(brand, campaignBrief = null) {
    const brandName = brand?.name || 'Công ty';
    const tone = brand?.tone || 'thân thiện, chuyên nghiệp';
    const hashtags = brand?.hashtags || '';
    const disclaimer = brand?.disclaimer || 'Sản phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh.';

    let prompt = `Bạn là chuyên gia content marketing cho "${brandName}" — công ty kinh doanh thực phẩm chức năng nhập khẩu Nhật Bản.

QUY TẮC BẮT BUỘC:
1. Viết bằng tiếng Việt, tự nhiên, không máy móc
2. Tone: ${tone}
3. TUYỆT ĐỐI KHÔNG dùng từ: "chữa bệnh", "điều trị", "đặc trị", "thần dược"
4. LUÔN kèm disclaimer ở cuối bài Facebook: "${disclaimer}"
5. Hashtag mặc định: ${hashtags}
6. Thông tin phải chính xác, không bịa đặt công dụng
7. Tuân thủ Nghị định 15/2018/NĐ-CP về quảng cáo TPCN

PHONG CÁCH:
- Facebook: ngắn gọn, emoji vừa phải, có CTA rõ ràng
- Blog: dài hơn, có heading structure, SEO-friendly, chuyên nghiệp
- Caption: siêu ngắn, dùng cho Story/Reel, có emoji, bắt mắt`;

    // Inject campaign brief fields if available
    if (campaignBrief) {
        prompt += '\n\nCHIẾN DỊCH BRIEF:';

        if (campaignBrief.smp) {
            prompt += `\n- SMP (Single-Minded Proposition): ${campaignBrief.smp}`;
        }
        if (campaignBrief.icpPersona) {
            const icp = typeof campaignBrief.icpPersona === 'object'
                ? JSON.stringify(campaignBrief.icpPersona)
                : campaignBrief.icpPersona;
            prompt += `\n- ICP (Ideal Customer): ${icp}`;
        }
        if (campaignBrief.insight) {
            prompt += `\n- Consumer Insight: ${campaignBrief.insight}`;
        }
        if (campaignBrief.complianceNotes) {
            prompt += `\n- Lưu ý compliance: ${campaignBrief.complianceNotes}`;
        }
    }

    return prompt;
}

/**
 * Xây dựng user prompt cho 3 format + campaign brief context
 */
function buildUserPrompt(brief, contentType, campaignBrief = null) {
    const typeLabels = {
        product: 'Giới thiệu sản phẩm',
        promo: 'Chương trình khuyến mãi',
        education: 'Kiến thức sức khoẻ',
        testimonial: 'Đánh giá khách hàng',
        announcement: 'Thông báo',
    };

    let prompt = `Loại bài: ${typeLabels[contentType] || contentType}

Brief: ${brief}`;

    // Inject offer, RTB, channels, CTA from campaign brief
    if (campaignBrief) {
        if (campaignBrief.offer) {
            prompt += `\nOffer: ${campaignBrief.offer}`;
        }
        if (campaignBrief.rtb && Array.isArray(campaignBrief.rtb) && campaignBrief.rtb.length > 0) {
            prompt += `\nRTB (Reasons to Believe): ${campaignBrief.rtb.join('; ')}`;
        }
        if (campaignBrief.channels) {
            const channels = typeof campaignBrief.channels === 'object'
                ? Object.keys(campaignBrief.channels).filter(k => campaignBrief.channels[k]).join(', ')
                : campaignBrief.channels;
            prompt += `\nChannels: ${channels}`;
        }
        if (campaignBrief.cta) {
            prompt += `\nCTA: ${campaignBrief.cta}`;
        }
    }

    prompt += `

Hãy tạo 3 phiên bản content. Trả về chính xác dạng JSON sau (không có markdown code block):
{
    "fbPost": "Nội dung bài Facebook Page (200-400 từ, có emoji, hashtag, CTA, disclaimer ở cuối)",
    "blog": "Nội dung bài blog (500-800 từ, có tiêu đề ## heading, paragraph rõ ràng, SEO-friendly)",
    "caption": "Caption ngắn cho Story/Reel (50-80 từ, bắt mắt, có emoji)"
}

CHỈ trả về JSON, không giải thích gì thêm.`;

    return prompt;
}

/**
 * Gọi Gemini API
 */
async function callGeminiAPI(systemPrompt, userPrompt, apiKey) {
    const url = `${CONFIG.GEMINI_API_URL}/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [{
                parts: [{ text: userPrompt }],
            }],
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 4096,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(`Gemini API error: ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini trả về response rỗng');
    return text;
}

/**
 * Parse response JSON từ Gemini
 */
function parseResponse(responseText) {
    // Xoá markdown wrapper nếu có (```json ... ```)
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned);
        return {
            fbPost: parsed.fbPost || '',
            blog: parsed.blog || '',
            caption: parsed.caption || '',
        };
    } catch (e) {
        // Nếu parse JSON thất bại → trả về raw text làm FB post
        console.warn('Không parse được JSON từ Gemini, dùng raw text:', e);
        return {
            fbPost: responseText,
            blog: responseText,
            caption: responseText.slice(0, 200),
        };
    }
}
