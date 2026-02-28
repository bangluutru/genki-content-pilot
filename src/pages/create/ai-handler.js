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
import { store } from '../../utils/state.js';
import { t } from '../../utils/i18n.js';
import { runPredictionCheck } from './predictive-handler.js';

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
        // Handle Product selection
        const productSelect = document.getElementById('brief-product-select')?.value;
        let productStr = '';
        let productId = null;
        if (productSelect === 'custom') {
            productStr = document.getElementById('brief-product')?.value?.trim();
        } else if (productSelect) {
            const brand = store.get('brand') || {};
            const pObj = (brand.products || []).find(p => p.id === productSelect);
            if (pObj) {
                productStr = `${pObj.name} - ${pObj.highlight}`;
                productId = pObj.id;
            }
        } else {
            productStr = document.getElementById('brief-product')?.value?.trim();
        }

        if (!productStr) {
            showToast(t('create.productRequired'), 'warning');
            document.getElementById('brief-product-select')?.focus();
            return;
        }

        // Handle Avatars (String array vs single ID for now to preserve multi-avatar logic)
        const avatarSelect = document.getElementById('brief-avatars-select')?.value;
        let avatarsArr = [];
        let avatarId = null;

        if (avatarSelect === 'custom') {
            avatarsArr = document.getElementById('brief-avatars')?.value?.split(',').map(s => s.trim()).filter(Boolean);
        } else if (avatarSelect) {
            const brand = store.get('brand') || {};
            const aObj = (brand.avatars || []).find(a => a.id === avatarSelect);
            if (aObj) {
                avatarsArr = [`${aObj.name} (${aObj.description})`];
                avatarId = aObj.id;
            }
        } else {
            avatarsArr = document.getElementById('brief-avatars')?.value?.split(',').map(s => s.trim()).filter(Boolean);
        }

        // Handle System Prompt Selection
        const promptSelect = document.getElementById('brief-prompt-select')?.value;
        let customPrompt = null;
        let promptId = null;
        if (promptSelect) {
            const brand = store.get('brand') || {};
            const prObj = (brand.prompts || []).find(p => p.id === promptSelect);
            if (prObj) {
                customPrompt = prObj.content;
                promptId = prObj.id;
            }
        }

        brief = {
            contentType: document.getElementById('brief-type')?.value,
            product: productStr,
            productId: productId,
            avatars: avatarsArr,
            avatarId: avatarId,
            promptId: promptId,
            customPrompt: customPrompt,
            highlight: document.getElementById('brief-highlight')?.value?.trim(),
            promotion: document.getElementById('brief-promotion')?.value?.trim(),
            cta: document.getElementById('brief-cta')?.value,
            additionalNotes: document.getElementById('brief-notes')?.value?.trim(),
            campaign: window.__createContext?.campaign?.name,
            pillar: window.__createContext?.pillar?.name,
            angle: window.__createContext?.angle,
        };

        const selectedKocId = document.getElementById('brief-koc')?.value;
        if (selectedKocId && window.__loadedKocs) {
            const selectedKoc = window.__loadedKocs.find(k => k.id === selectedKocId);
            if (selectedKoc && selectedKoc.style) {
                // Prepend KOC style to additional notes
                const kocInstruction = `[QUAN TRỌNG: PHONG CÁCH KOC/AFFILIATE ĐƯỢC CHỌN - ${selectedKoc.name}]: ${selectedKoc.style}`;
                brief.additionalNotes = brief.additionalNotes ? `${kocInstruction}\n${brief.additionalNotes}` : kocInstruction;
            }
        }
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
        let rawContentResult = null;
        let finalContent = { facebook: '', blog: '', story: '' };

        if (brief.avatars && brief.avatars.length > 0) {
            // Multiple variants path
            const promises = brief.avatars.map(async (avatar) => {
                const b = { ...brief, targetAvatar: avatar };
                return generateContent(b);
            });
            const results = await Promise.all(promises);

            results.forEach((res, idx) => {
                const avatar = brief.avatars[idx];
                const header = `=== DÀNH CHO: ${avatar.toUpperCase()} ===\n`;
                finalContent.facebook += (idx > 0 ? '\n\n' : '') + header + res.facebook;
                finalContent.blog += (idx > 0 ? '\n\n' : '') + header + res.blog;
                finalContent.story += (idx > 0 ? '\n\n' : '') + header + res.story;
            });
            rawContentResult = finalContent;
        } else {
            // Standard single generation path
            rawContentResult = await generateContent(brief);
            finalContent = rawContentResult;
        }

        clearInterval(stepTimer);
        incrementUsage();

        const currentContent = { ...rawContentResult, facebook: finalContent.facebook, blog: finalContent.blog, story: finalContent.story, brief: brief.product, contentType: brief.contentType };
        setCurrentContent(currentContent);

        // Show preview
        document.getElementById('step-loading').classList.add('hidden');
        document.getElementById('step-preview').classList.remove('hidden');

        document.getElementById('content-facebook').textContent = finalContent.facebook;
        document.getElementById('content-blog').textContent = finalContent.blog;
        document.getElementById('content-story').textContent = finalContent.story;

        // Clear draft
        storage.remove('draft_brief');

        // Run predictive check
        runPredictionCheck(finalContent.facebook);

        // Run compliance check on Facebook content (bugfix: passed finalContent.facebook)
        if (onContentReady) onContentReady(finalContent.facebook);

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
        const imageSrc = `data:${result.mimeType};base64,${result.imageData}`;

        // Save to image history (localStorage, max 10)
        try {
            const history = JSON.parse(localStorage.getItem('cp_image_history') || '[]');
            history.unshift({ src: imageSrc, prompt, date: new Date().toISOString() });
            if (history.length > 10) history.length = 10;
            localStorage.setItem('cp_image_history', JSON.stringify(history));
        } catch { /* localStorage quota exceeded, ignore */ }

        preview.innerHTML = `
      <img src="${imageSrc}" 
           alt="AI Generated Image" class="gen-image" id="generated-image">
      <div class="flex gap-2" style="margin-top: var(--space-3);">
        <button class="btn btn-primary btn-sm" id="btn-edit-image" style="flex: 1;">${icon('pencil', 14)} ${t('create.editImage')}</button>
        <a href="${imageSrc}" 
           download="contentpilot-image.png" class="btn btn-outline btn-sm" id="btn-download-image">
          ${icon('save', 14)} ${t('create.downloadImage')}
        </a>
        <button class="btn btn-ghost btn-sm" id="btn-regen-image">${icon('refresh', 14)} ${t('create.regenerateImage')}</button>
      </div>
    `;

        // Render image history gallery
        renderImageHistory();

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

/** Render image history gallery strip below the image preview */
function renderImageHistory() {
    // Remove existing gallery
    document.getElementById('image-history-gallery')?.remove();

    let history;
    try { history = JSON.parse(localStorage.getItem('cp_image_history') || '[]'); } catch { return; }
    if (history.length === 0) return;

    const gallery = document.createElement('div');
    gallery.id = 'image-history-gallery';
    gallery.innerHTML = `
      <div class="flex justify-between items-center" style="margin-top: var(--space-4); margin-bottom: var(--space-2);">
        <span class="text-xs" style="font-weight: 600;">${icon('image', 14)} ${t('create.imageHistory')} (${history.length})</span>
        <button class="btn btn-ghost btn-sm" id="btn-clear-img-history" style="font-size: 11px; color: var(--danger);">
          ${icon('trash', 12)} ${t('create.clearHistory')}
        </button>
      </div>
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: var(--space-2);">
        ${history.map((item, i) => `
          <div style="flex-shrink: 0; position: relative; cursor: pointer;" class="img-history-item" data-idx="${i}">
            <img src="${item.src}" alt="Image ${i + 1}" 
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid var(--border); transition: border-color 0.2s;"
                 onmouseover="this.style.borderColor='var(--color-primary)'" 
                 onmouseout="this.style.borderColor='var(--border)'">
            <div class="text-xs text-muted" style="text-align: center; margin-top: 2px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${item.prompt?.substring(0, 12) || '—'}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const container = document.getElementById('tab-image');
    if (container) container.appendChild(gallery);

    // Clear history button
    document.getElementById('btn-clear-img-history')?.addEventListener('click', () => {
        localStorage.removeItem('cp_image_history');
        gallery.remove();
        showToast(t('create.clearHistory'), 'info');
    });

    // Click to load image
    gallery.querySelectorAll('.img-history-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.idx);
            const entry = history[idx];
            if (!entry) return;
            const imgEl = document.getElementById('generated-image');
            if (imgEl) {
                imgEl.src = entry.src;
                document.getElementById('btn-download-image')?.setAttribute('href', entry.src);
            }
        });
    });
}

