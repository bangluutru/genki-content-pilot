/**
 * AI Image Generation Service — Using Gemini Imagen API
 * Generates images from text prompts based on content briefs
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash-exp';

const STYLE_PRESETS = {
    product: 'Professional product photography, clean white background, studio lighting, commercial quality, high resolution',
    lifestyle: 'Lifestyle photography, natural setting, warm lighting, authentic feel, aspirational mood',
    flatlay: 'Flat lay composition, overhead view, organized arrangement, aesthetic styling, Instagram-worthy',
    infographic: 'Clean infographic design, modern data visualization, bold colors, clear typography, professional',
    social: 'Social media post design, eye-catching, vibrant colors, modern layout, engaging visual',
    minimal: 'Minimalist design, lots of white space, clean lines, elegant simplicity, premium feel',
};

/**
 * Generate an image prompt from content brief
 * @param {Object} brief - Content brief
 * @returns {string} Generated prompt
 */
export function buildImagePrompt(brief, style = 'product') {
    const styleDesc = STYLE_PRESETS[style] || STYLE_PRESETS.product;
    let prompt = styleDesc + '. ';

    if (brief.product) prompt += `Subject: ${brief.product}. `;
    if (brief.highlight) prompt += `Key feature: ${brief.highlight}. `;
    if (brief.contentType) prompt += `Purpose: ${brief.contentType} content. `;

    prompt += 'No text overlay. High quality, 4K resolution.';
    return prompt;
}

/**
 * Generate image using Gemini's image generation
 * Uses Gemini 2.0 Flash with responseModalities for image output
 * @param {string} prompt - Image prompt
 * @returns {Object} { imageData: base64, mimeType }
 */
export async function generateImage(prompt) {
    if (!API_KEY) throw new Error('Gemini API key not configured');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Generate an image: ${prompt}` }]
                    }],
                    generationConfig: {
                        responseModalities: ['TEXT', 'IMAGE'],
                    },
                }),
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Image generation failed');
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        // Find image part
        const imagePart = parts.find(p => p.inlineData);
        if (imagePart) {
            return {
                imageData: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType || 'image/png',
            };
        }

        // If no image, return text description as fallback
        const textPart = parts.find(p => p.text);
        throw new Error(textPart?.text || 'Không thể tạo ảnh. Vui lòng thử prompt khác.');
    } catch (error) {
        console.error('Image gen error:', error);
        throw error;
    }
}

/**
 * Get available style presets
 * @returns {Array} [{id, name, description}]
 */
export function getStylePresets() {
    return [
        { id: 'product', name: '📦 Product Photo', desc: 'Ảnh sản phẩm chuyên nghiệp' },
        { id: 'lifestyle', name: '🌿 Lifestyle', desc: 'Phong cách sống tự nhiên' },
        { id: 'flatlay', name: '🎨 Flat Lay', desc: 'Bố cục từ trên xuống' },
        { id: 'infographic', name: '📊 Infographic', desc: 'Thiết kế thông tin' },
        { id: 'social', name: '📱 Social Media', desc: 'Hình cho mạng xã hội' },
        { id: 'minimal', name: '✨ Minimal', desc: 'Tối giản, cao cấp' },
    ];
}
