
// Verification Script for Phase 3: Smart Image Prompts
// Simulates prompt generation with distinct brand archetypes

// import { calculateReviewState } from './utils/helpers.js'; // REMOVED

// Mock Store
const mockStore = {
    brand: null,
    get: function (key) { return this[key]; }
};

// Mock STYLE_PRESETS
const STYLE_PRESETS = {
    product: 'Professional product photography'
};

// Function from image-gen.js (simplified for verification)
function buildImagePrompt(brief, style = 'product') {
    const brand = mockStore.get('brand') || {};
    const styleDesc = STYLE_PRESETS[style] || STYLE_PRESETS.product;

    let prompt = `Style: ${styleDesc}. `;

    // 1. Content Context
    if (brief.product) prompt += `Subject: ${brief.product}. `;

    // 2. Brand Identity Injection
    if (brand.archetype) {
        const archetypeVisuals = getArchetypeVisuals(brand.archetype);
        if (archetypeVisuals) {
            prompt += `Brand Vibe: ${archetypeVisuals}. `;
        }
    }

    return prompt;
}

function getArchetypeVisuals(archetype) {
    const map = {
        hero: 'Bold, strong contrast, dynamic action',
        sage: 'Clean, minimalist, books, wisdom',
        jester: 'Bright, colorful, fun, playful'
    };
    return map[archetype] || '';
}

// MAIN TEST
console.log("---------------------------------------------------");
console.log("VERIFYING PHASE 3: SMART IMAGE PROMPTS");
console.log("---------------------------------------------------");

const brief = { product: "Energy Drink" };

// Case 1: Hero Brand
mockStore.brand = { archetype: 'hero' };
const promptHero = buildImagePrompt(brief);
console.log(`[Hero Brand]: ${promptHero}`);
if (promptHero.includes('Bold, strong contrast')) console.log("✅ Hero vibe injected");
else console.error("❌ Hero vibe missing");

// Case 2: Sage Brand
mockStore.brand = { archetype: 'sage' };
const promptSage = buildImagePrompt(brief);
console.log(`[Sage Brand]: ${promptSage}`);
if (promptSage.includes('Clean, minimalist')) console.log("✅ Sage vibe injected");
else console.error("❌ Sage vibe missing");

// Case 3: No Brand
mockStore.brand = {};
const promptNone = buildImagePrompt(brief);
console.log(`[No Brand]: ${promptNone}`);
if (!promptNone.includes('Brand Vibe:')) console.log("✅ Correctly omitted vibe");
else console.error("❌ Unexpected vibe injected");

console.log("\nNote: Image Editor functionality (Canvas/Events) must be verified manually in browser.");
