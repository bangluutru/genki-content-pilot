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

import { store } from '../utils/state.js';

/**
 * Generate an image prompt from content brief
 * @param {Object} brief - Content brief
 * @returns {string} Generated prompt
 */
export function buildImagePrompt(brief, style = 'product') {
    const brand = store.get('brand') || {};
    const styleDesc = STYLE_PRESETS[style] || STYLE_PRESETS.product;

    let prompt = `Style: ${styleDesc}. `;

    // 1. Content Context
    if (brief.product) prompt += `Subject: ${brief.product}. `;
    if (brief.highlight) prompt += `Key feature: ${brief.highlight}. `;
    if (brief.contentType) prompt += `Context: ${brief.contentType} content. `;

    // 2. Brand Identity Injection
    if (brand.archetype) {
        const archetypeVisuals = getArchetypeVisuals(brand.archetype);
        if (archetypeVisuals) {
            prompt += `Brand Vibe: ${archetypeVisuals}. `;
        }
    }

    if (brand.tone) {
        prompt += `Mood: ${brand.tone}. `;
    }

    // 3. Technical Quality
    prompt += 'No text overlay. High quality, 4K resolution, commercially licensed style.';

    return prompt;
}

function getArchetypeVisuals(archetype) {
    const map = {
        hero: 'Bold, strong contrast, dynamic action, energetic',
        sage: 'Clean, minimalist, books, wisdom, muted intellectual colors',
        magician: 'Mystical, glowing effects, transformative, surreal',
        ruler: 'Luxury, gold accents, symmetrical, commanding, premium',
        creator: 'Artistic, colorful, innovative, textured, expressive',
        caregiver: 'Warm, soft lighting, cozy, safe, pastel tones',
        jester: 'Bright, colorful, fun, playful, high energy',
        lover: 'Romantic, soft focus, elegance, intimate, sensual',
        explorer: 'Outdoors, nature, wide angles, adventurous, gritty',
        outlaw: 'Edgy, dark mode, rebellious, high contrast, neon',
        innocent: 'Pure, white space, bright, happy, natural light',
        everyman: 'Real people, authentic, down-to-earth, relatable'
    };
    return map[archetype] || '';
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
            let errorMessage = 'Image generation failed';
            try {
                const errText = await response.text();
                if (errText) {
                    const errData = JSON.parse(errText);
                    errorMessage = errData.error?.message || errorMessage;
                }
            } catch { /* ignore parse errors */ }
            throw new Error(errorMessage);
        }

        const responseText = await response.text();
        if (!responseText) throw new Error('Empty response from image API');
        const data = JSON.parse(responseText);
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
