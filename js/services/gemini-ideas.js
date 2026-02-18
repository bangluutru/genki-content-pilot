// gemini-ideas.js — Gemini prompts cho Content Pack generation
// Tách riêng khỏi gemini.js

import { CONFIG } from '../config.js';

/**
 * Generate Content Pack (5 assets) từ idea + brief + hooks
 * @param {object} idea - { title, angle, funnelStage }
 * @param {object} brief - Approved campaign brief
 * @param {object} hookBank - { hooks[], objections[] }
 * @param {object} brand - Brand profile
 * @param {string} apiKey
 * @returns {Promise<{tiktok: string, fbPost: string, carousel: string, email: string, landing: string}>}
 */
export async function generateContentPack(idea, brief, hookBank, brand, apiKey) {
    const brandName = brand?.name || 'Thương hiệu';
    const disclaimer = brand?.disclaimer || 'Sản phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh.';

    const funnelLabels = { TOF: 'Top of Funnel — Nhận biết', MOF: 'Middle of Funnel — Cân nhắc', BOF: 'Bottom of Funnel — Chuyển đổi' };

    // Build context from brief
    let briefContext = '';
    if (brief) {
        briefContext = `
SMP: ${brief.smp || 'N/A'}
ICP: ${typeof brief.icpPersona === 'object' ? JSON.stringify(brief.icpPersona) : (brief.icpPersona || 'N/A')}
Offer: ${brief.offer || 'N/A'}
RTB: ${Array.isArray(brief.rtb) ? brief.rtb.join('; ') : (brief.rtb || 'N/A')}
CTA: ${brief.cta || 'N/A'}
Compliance: ${brief.complianceNotes || 'N/A'}`;
    }

    // Build hooks context
    let hooksContext = '';
    if (hookBank?.hooks?.length) {
        const topHooks = hookBank.hooks.slice(0, 10);
        hooksContext = `\nTop hooks:\n${topHooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}`;
    }

    const systemPrompt = `Bạn là chuyên gia content marketing đa kênh cho "${brandName}" — TPCN nhập khẩu Nhật Bản.

QUY TẮC BẮT BUỘC:
1. Viết bằng tiếng Việt, tự nhiên, hấp dẫn
2. TUYỆT ĐỐI KHÔNG dùng từ: "chữa bệnh", "điều trị", "đặc trị", "thần dược"
3. Tuân thủ Nghị định 15/2018/NĐ-CP về quảng cáo TPCN
4. Kèm disclaimer: "${disclaimer}"
5. Giữ đúng tone và messaging của thương hiệu
${briefContext ? `\nCHIẾN DỊCH BRIEF:${briefContext}` : ''}
${hooksContext}`;

    const userPrompt = `Tạo Content Pack cho ý tưởng sau:

Tiêu đề: ${idea.title}
Góc tiếp cận: ${idea.angle || 'Chung'}
Funnel Stage: ${funnelLabels[idea.funnelStage] || idea.funnelStage}

Tạo 5 assets sau, mỗi asset phải phù hợp với funnel stage. Trả về JSON (không markdown code block):
{
    "tiktok": "Script TikTok/Reels 45 giây: [HOOK] 0-3s, [PROBLEM] 3-10s, [SOLUTION] 10-25s, [PROOF] 25-35s, [CTA] 35-45s. Ghi rõ hành động + lời nói.",
    "fbPost": "Bài Facebook 200-400 từ: hook mạnh, storytelling, emoji, hashtag, CTA, disclaimer cuối.",
    "carousel": "Carousel outline 7 slides: mỗi slide ghi [Header] + [Body 1-2 câu] + [Visual note]. Slide 1 = Hook, Slide 7 = CTA.",
    "email": "Email marketing: Subject line + Preview text + Body (greeting, problem, solution, social proof, offer, CTA, P.S.)",
    "landing": "Landing page bullets: 5-7 bullet points dạng benefit-driven, kèm icon gợi ý. Phù hợp để dùng trong hero section."
}

CHỈ trả về JSON.`;

    const response = await callGemini(systemPrompt, userPrompt, apiKey);
    return parseJSON(response, { tiktok: '', fbPost: '', carousel: '', email: '', landing: '' });
}

// ─── Internal helpers ───

async function callGemini(systemPrompt, userPrompt, apiKey) {
    const url = `${CONFIG.GEMINI_API_URL}/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 8192,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini Ideas error: ${errorData.error?.message || `HTTP ${response.status}`}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini trả về response rỗng');
    return text;
}

function parseJSON(responseText, fallback) {
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('Ideas JSON parse failed:', e);
        return fallback;
    }
}
