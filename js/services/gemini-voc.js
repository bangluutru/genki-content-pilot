// gemini-voc.js — Gemini prompts cho VOC clustering + hook generation
// Tách riêng khỏi gemini.js để giữ code sạch

import { CONFIG } from '../config.js';

/**
 * AI cluster VOC entries thành pain/desire/objection/trigger
 * @param {object[]} entries - VOC entries [{ content, tags }]
 * @param {string} apiKey
 * @returns {Promise<{clusters: object[], suggestedTags: string[]}>}
 */
export async function clusterVocEntries(entries, apiKey) {
    const entriesText = entries.map((e, i) => `${i + 1}. ${e.content}`).join('\n');

    const systemPrompt = `Bạn là chuyên gia phân tích Voice of Customer (VOC) cho ngành TPCN/mỹ phẩm Việt Nam.

QUY TẮC:
- Phân tích bằng tiếng Việt
- Phân loại chính xác theo 4 nhóm: pain (nỗi đau), desire (mong muốn), objection (phản đối), trigger (động lực mua)
- Mỗi cluster có tên ngắn gọn, summary, và danh sách entry liên quan
- Gợi ý tags phù hợp cho từng entry
- KHÔNG bịa đặt thông tin, chỉ phân tích dựa trên dữ liệu đầu vào`;

    const userPrompt = `Phân tích ${entries.length} VOC entries sau thành clusters:

${entriesText}

Trả về JSON (không markdown code block):
{
    "clusters": [
        {
            "type": "pain|desire|objection|trigger",
            "name": "Tên cluster ngắn",
            "summary": "Tóm tắt 1-2 câu",
            "entryNumbers": [1, 3, 7]
        }
    ],
    "suggestedTags": ["tag1", "tag2", "tag3"]
}

CHỈ trả về JSON.`;

    const response = await callGemini(systemPrompt, userPrompt, apiKey);
    return parseJSON(response, { clusters: [], suggestedTags: [] });
}

/**
 * Generate hook bank từ clusters
 * @param {object[]} clusters - VOC clusters
 * @param {object} brand - Brand profile
 * @param {string} apiKey
 * @returns {Promise<{hooks: string[], objections: string[]}>}
 */
export async function generateHookBank(clusters, brand, apiKey) {
    const brandName = brand?.name || 'Thương hiệu';
    const disclaimer = brand?.disclaimer || 'Sản phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh.';

    const clusterText = clusters.map(c =>
        `[${c.type.toUpperCase()}] ${c.name}: ${c.summary}`
    ).join('\n');

    const systemPrompt = `Bạn là copywriter chuyên viết hook và xử lý phản đối cho ngành TPCN/mỹ phẩm Việt Nam.

QUY TẮC BẮT BUỘC:
1. Viết bằng tiếng Việt, tự nhiên, hấp dẫn
2. TUYỆT ĐỐI KHÔNG dùng từ: "chữa bệnh", "điều trị", "đặc trị", "thần dược"
3. Tuân thủ Nghị định 15/2018/NĐ-CP về quảng cáo TPCN
4. Hook phải gây tò mò, tạo cảm xúc, hoặc nêu vấn đề cụ thể
5. Xử lý phản đối phải empathy, logic, có bằng chứng
6. Thương hiệu: "${brandName}"
7. Disclaimer: "${disclaimer}"`;

    const userPrompt = `Dựa trên phân tích VOC clusters sau:

${clusterText}

Tạo:
1. 30 hooks (câu mở đầu gây chú ý) phân theo loại: pain-based, desire-based, trigger-based
2. 20 câu xử lý phản đối (objection handling) từ các objections tìm được

Trả về JSON (không markdown code block):
{
    "hooks": [
        "Hook 1...",
        "Hook 2..."
    ],
    "objections": [
        "Phản đối: ... → Xử lý: ...",
        "Phản đối: ... → Xử lý: ..."
    ]
}

CHỈ trả về JSON.`;

    const response = await callGemini(systemPrompt, userPrompt, apiKey);
    return parseJSON(response, { hooks: [], objections: [] });
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
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 8192,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini VOC error: ${errorData.error?.message || `HTTP ${response.status}`}`);
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
        console.warn('VOC JSON parse failed:', e);
        return fallback;
    }
}
