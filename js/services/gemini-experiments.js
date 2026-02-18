// gemini-experiments.js — Gemini prompts cho experiment variant generation

import { CONFIG } from '../config.js';

/**
 * Generate 3 hook variants cho A/B test
 * @param {string} originalHook - Hook gốc
 * @param {object} brand - Brand profile
 * @param {string} experimentType - hook_ab|thumbnail_ab|cta_ab
 * @param {string} apiKey
 * @returns {Promise<{variants: string[]}>}
 */
export async function generateExperimentVariants(originalHook, brand, experimentType, apiKey) {
    const brandName = brand?.name || 'Thương hiệu';
    const disclaimer = brand?.disclaimer || 'Sản phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh.';

    const typeLabels = {
        hook_ab: 'hooks (câu mở đầu gây chú ý)',
        thumbnail_ab: 'thumbnail concepts (mô tả visual)',
        cta_ab: 'CTAs (lời kêu gọi hành động)',
    };
    const variantType = typeLabels[experimentType] || typeLabels.hook_ab;

    const systemPrompt = `Bạn là chuyên gia A/B testing và copywriting cho "${brandName}" — TPCN nhập khẩu Nhật Bản.

QUY TẮC:
1. Viết bằng tiếng Việt, tự nhiên, hấp dẫn
2. KHÔNG dùng từ: "chữa bệnh", "điều trị", "đặc trị"
3. Tuân thủ NĐ 15/2018/NĐ-CP
4. Mỗi variant phải khác biệt rõ ràng về góc tiếp cận (emotional, logical, urgency, social proof, curiosity)
5. Disclaimer: "${disclaimer}"`;

    const userPrompt = `Dựa trên ${variantType} gốc:

"${originalHook}"

Tạo 3 biến thể A/B test, mỗi biến thể dùng góc tiếp cận KHÁC NHAU.

Trả về JSON (không markdown code block):
{
    "variants": [
        "Biến thể 1 (góc: emotional)...",
        "Biến thể 2 (góc: urgency)...",
        "Biến thể 3 (góc: social proof)..."
    ]
}

CHỈ trả về JSON.`;

    const response = await callGemini(systemPrompt, userPrompt, apiKey);
    return parseJSON(response, { variants: [] });
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
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 4096,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini Experiment error: ${errorData.error?.message || `HTTP ${response.status}`}`);
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
        console.warn('Experiment JSON parse failed:', e);
        return fallback;
    }
}
