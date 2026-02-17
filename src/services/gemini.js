/**
 * Gemini AI Service — Content generation via Gemini API
 * Direct client-side for dev; production should use Cloud Functions proxy (brainstorm C1)
 */
import { store } from '../utils/state.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

/**
 * Generate content from a brief using Gemini AI
 * @param {Object} brief - Structured brief from guided form
 * @returns {Object} { facebook, blog, story }
 */
export async function generateContent(brief) {
    const brand = store.get('brand');

    const systemPrompt = buildSystemPrompt(brand);
    const userPrompt = buildUserPrompt(brief);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] }
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        topP: 0.95,
                        maxOutputTokens: 4096,
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'API request failed');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('No content generated');

        return parseGeneratedContent(text);
    } catch (error) {
        console.error('Gemini error:', error);
        throw error;
    }
}

/** Build system prompt with brand context */
function buildSystemPrompt(brand) {
    const brandContext = brand ? `
THÔNG TIN THƯƠNG HIỆU:
- Tên: ${brand.name || 'N/A'}
- Ngành: ${brand.industry || 'N/A'}
- Tone: ${brand.tone || 'Thân thiện, chuyên nghiệp'}
- Đối tượng: ${brand.targetAudience || 'N/A'}
- Hashtag mặc định: ${brand.defaultHashtags || ''}
- Sản phẩm/dịch vụ: ${brand.products || 'N/A'}
${brand.disclaimer ? `- Disclaimer bắt buộc: ${brand.disclaimer}` : ''}
` : 'Chưa có thông tin brand. Viết với tone chuyên nghiệp, thân thiện.';

    return `Bạn là một Content Marketing Expert chuyên viết nội dung tiếng Việt cho doanh nghiệp.

${brandContext}

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
