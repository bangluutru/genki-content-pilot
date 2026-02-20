/**
 * AI Content Handlers — Generate, Variation, Image generation
 * Extracted from create.js for maintainability
 */
import { showToast } from '../../components/toast.js';
import { generateContent, checkDailyLimit, incrementUsage, generateVariation, VARIATION_TYPES } from '../../services/gemini.js';
import { openImageEditor } from '../../components/image-editor.js';
import { generateImage, buildImagePrompt } from '../../services/image-gen.js';
import { storage } from '../../utils/helpers.js';
import { icon } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';

/**
 * Handle content generation from brief form OR directly from Angle context
 * @param {Function} setCurrentContent - setter for currentContent state
 * @param {Function} onContentReady - callback when content is generated (for compliance check)
 * @param {Object|null} angleContext - optional { campaign, pillar, angle } for direct generation
 */
export async function handleGenerate(setCurrentContent, onContentReady, angleContext = null) {
    let brief;

    if (angleContext) {
        // Direct generation from Angle — skip form entirely
        const { campaign, pillar, angle } = angleContext;
        brief = {
            contentType: angle.suggestedFormat === 'Blog' ? 'education' : 'product',
            product: campaign.name,
            highlight: angle.keyMessage || '',
            promotion: '',
            cta: '',
            additionalNotes: angle.hook ? `Hook gợi ý: "${angle.hook}"` : '',
            campaign: campaign.name,
            pillar: pillar.name,
            angle: angle,
        };
    } else {
        // Normal flow — read from form fields
        const product = document.getElementById('brief-product')?.value?.trim();
        if (!product) {
            showToast(t('create.productRequired'), 'warning');
            document.getElementById('brief-product')?.focus();
            return;
        }
        brief = {
            contentType: document.getElementById('brief-type')?.value,
            product,
            highlight: document.getElementById('brief-highlight')?.value?.trim(),
            promotion: document.getElementById('brief-promotion')?.value?.trim(),
            cta: document.getElementById('brief-cta')?.value,
            additionalNotes: document.getElementById('brief-notes')?.value?.trim(),
            campaign: window.__createContext?.campaign?.name,
            pillar: window.__createContext?.pillar?.name,
            angle: window.__createContext?.angle,
        };
    }

    // Show loading
    document.getElementById('step-brief').classList.add('hidden');
    document.getElementById('step-loading').classList.remove('hidden');

    // Animate steps
    const steps = ['ai-step-0', 'ai-step-1', 'ai-step-2', 'ai-step-3', 'ai-step-4'];
    let stepIdx = 0;
    const stepTimer = setInterval(() => {
        if (stepIdx > 0) {
            document.getElementById(steps[stepIdx - 1])?.classList.remove('active');
            document.getElementById(steps[stepIdx - 1])?.classList.add('done');
        }
        if (stepIdx < steps.length) {
            document.getElementById(steps[stepIdx])?.classList.add('active');
            stepIdx++;
        }
    }, 3000);

    try {
        const content = await generateContent(brief);
        clearInterval(stepTimer);
        incrementUsage();

        const currentContent = { ...content, brief: brief.product, contentType: brief.contentType };
        setCurrentContent(currentContent);

        // Show preview
        document.getElementById('step-loading').classList.add('hidden');
        document.getElementById('step-preview').classList.remove('hidden');

        document.getElementById('content-facebook').textContent = content.facebook;
        document.getElementById('content-blog').textContent = content.blog;
        document.getElementById('content-story').textContent = content.story;

        // Clear draft
        storage.remove('draft_brief');

        // Run compliance check on Facebook content
        if (onContentReady) onContentReady(content.facebook);

        showToast(t('create.contentReadyToast'), 'success');
    } catch (error) {
        clearInterval(stepTimer);
        console.error('Generate error:', error);
        document.getElementById('step-loading').classList.add('hidden');
        document.getElementById('step-brief').classList.remove('hidden');
        showToast(t('create.generateError', { error: error.message }), 'error', 5000);
    }
}

/**
 * Handle content variation generation
 * @param {string} type - variation type id
 */
export async function handleVariation(type) {
    const activeTab = document.querySelector('.tab.active');
    const platform = activeTab?.dataset.tab || 'facebook';
    const contentEl = document.getElementById(`content-${platform}`);
    const originalContent = contentEl?.textContent?.trim();

    if (!originalContent) {
        showToast(t('create.createVariationFirst'), 'error');
        return;
    }

    const typeName = VARIATION_TYPES.find(v => v.id === type)?.name || type;

    // Highlight clicked button
    document.querySelectorAll('.variation-type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
        if (b.dataset.type === type) {
            b.disabled = true;
            b.innerHTML = '⏳ ' + t('create.creatingVariation');
        }
    });

    try {
        const variation = await generateVariation(originalContent, type, platform);

        const previewEl = document.getElementById('variation-preview');
        const variationContentEl = document.getElementById('variation-content');
        const labelEl = document.getElementById('variation-label');

        if (previewEl && variationContentEl) {
            previewEl.classList.remove('hidden');
            variationContentEl.textContent = variation;
            labelEl.textContent = `${typeName} — ${platform}`;
        }

        showToast(t('create.variationCreated', { type: typeName }), 'success');
    } catch (err) {
        showToast(t('common.error') + ': ' + err.message, 'error');
    } finally {
        // Reset buttons
        document.querySelectorAll('.variation-type-btn').forEach(b => {
            b.disabled = false;
            const vt = VARIATION_TYPES.find(v => v.id === b.dataset.type);
            if (vt) b.innerHTML = vt.name;
        });
    }
}

/**
 * Handle AI image generation
 */
export async function handleImageGen() {
    const btn = document.getElementById('btn-gen-image');
    const preview = document.getElementById('image-preview');
    if (!btn || !preview) return;

    const style = document.querySelector('input[name="img-style"]:checked')?.value || 'product';
    let prompt = document.getElementById('image-prompt')?.value?.trim();

    // Build prompt from brief if empty
    if (!prompt) {
        const brief = {
            product: document.getElementById('brief-product')?.value || '',
            highlight: document.getElementById('brief-highlight')?.value || '',
            contentType: document.getElementById('brief-type')?.selectedOptions[0]?.text || '',
        };
        if (!brief.product) {
            showToast(t('create.fillProductFirst'), 'error');
            return;
        }
        prompt = buildImagePrompt(brief, style);
    }

    // Loading
    btn.disabled = true;
    btn.textContent = '⏳ ' + t('create.generatingImage');
    preview.innerHTML = `
    <div class="image-placeholder">
      <div class="spinner"></div>
      <p class="text-sm text-muted" style="margin-top: var(--space-3);">${t('create.aiDrawing')}</p>
    </div>
  `;

    try {
        const result = await generateImage(prompt);
        preview.innerHTML = `
      <img src="data:${result.mimeType};base64,${result.imageData}" 
           alt="AI Generated Image" class="gen-image" id="generated-image">
      <div class="flex gap-2" style="margin-top: var(--space-3);">
        <button class="btn btn-primary btn-sm" id="btn-edit-image" style="flex: 1;">${icon('pencil', 14)} ${t('create.editImage')}</button>
        <a href="data:${result.mimeType};base64,${result.imageData}" 
           download="contentpilot-image.png" class="btn btn-outline btn-sm" id="btn-download-image">
          ${icon('save', 14)} ${t('create.downloadImage')}
        </a>
        <button class="btn btn-ghost btn-sm" id="btn-regen-image">${icon('refresh', 14)} ${t('create.regenerateImage')}</button>
      </div>
    `;

        document.getElementById('btn-edit-image')?.addEventListener('click', () => {
            const img = document.getElementById('generated-image');
            openImageEditor(img.src, (newSrc) => {
                img.src = newSrc;
                document.getElementById('btn-download-image').href = newSrc;
            });
        });

        document.getElementById('btn-regen-image')?.addEventListener('click', handleImageGen);
        showToast(t('create.imageGenerated'), 'success');
    } catch (err) {
        preview.innerHTML = `
      <div class="image-placeholder">
        <span style="color: var(--text-muted);">${icon('cross', 32)}</span>
        <p class="text-sm" style="color: var(--danger);">${err.message}</p>
        <p class="text-xs text-muted" style="margin-top: var(--space-2);">${t('create.tryDifferentPrompt')}</p>
      </div>
    `;
        showToast(t('create.imageError', { error: err.message }), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = icon('image', 16) + ' ' + t('create.generateImage');
    }
}
