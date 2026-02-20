/**
 * Create Content Page — Guided brief form + AI generation + tab preview + publish
 * Core feature of ContentPilot v2
 *
 * Handlers split into:
 *  - create/ai-handler.js       (generate, variation, image)
 *  - create/publish-handler.js  (publish, save, init panel)
 *  - create/compliance-handler.js (compliance check, disclaimer)
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { checkDailyLimit, VARIATION_TYPES } from '../services/gemini.js';
import { getStylePresets } from '../services/image-gen.js';
import { copyToClipboard, storage } from '../utils/helpers.js';
import { icon } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { loadCampaigns, loadPillars, loadAngles, loadBrand } from '../services/firestore.js';

// Handler imports
import { handleGenerate, handleVariation, handleImageGen } from './create/ai-handler.js';
import { handlePublish, handleSave, initPublishPanel } from './create/publish-handler.js';
import { runComplianceCheck } from './create/compliance-handler.js';

let currentContent = null;
let autosaveTimer = null;

/** State getter/setter for handler modules */
const getCurrentContent = () => currentContent;
const setCurrentContent = (val) => { currentContent = val; };

export async function renderCreatePage(params = {}) {
  const app = document.getElementById('app');
  const usage = checkDailyLimit();

  // Load context from params if generating from Angle
  window.__createContext = null;
  window.__savedContentId = null; // Reset saved content tracking for new creation
  let contextBannerHTML = '';
  let prefillProduct = '';

  if (params.campaignId && params.angleId) {
    const campaigns = await loadCampaigns();
    const campaign = campaigns.find(c => c.id === params.campaignId);
    if (campaign) {
      // Load from subcollections (NOT embedded arrays — those are always empty after migration)
      const pillars = await loadPillars(campaign.id, campaign);
      const angles = await loadAngles(campaign.id, pillars, campaign);

      const angle = angles.find(a => a.id === params.angleId);
      const pillar = pillars.find(p => p.id === angle?.pillarId);
      if (angle && pillar) {
        window.__createContext = { campaign, pillar, angle };

        // Use brand product name if available, fallback to campaign name
        const brand = store.get('brand') || await loadBrand();
        prefillProduct = brand?.productName || brand?.name || campaign.name;

        contextBannerHTML = `
          <div class="card" style="margin-bottom: var(--space-4); background: var(--bg-tertiary); border: 1px solid var(--accent); padding: var(--space-3);">
            <div class="flex items-center gap-2 mb-1">
              ${icon('target', 16)} <span class="badge badge-accent">Angle: ${angle.name}</span>
            </div>
            <p class="text-sm text-muted">
              <strong>Chiến dịch:</strong> ${campaign.name} &bull; 
              <strong>Pillar:</strong> ${pillar.name}
            </p>
            ${angle.hook ? `<p class="text-xs" style="margin-top: 4px; font-style: italic;">Hook: "${angle.hook}"</p>` : ''}
            ${angle.keyMessage ? `<p class="text-xs" style="margin-top: 4px; font-style: italic;">Message: ${angle.keyMessage}</p>` : ''}
          </div>
        `;
      }
    }
  }

  // Restore draft from localStorage
  const draft = storage.get('draft_brief', null);
  const initialProduct = window.__createContext ? prefillProduct : (draft?.product || '');

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('sparkle', 28)} ${t('create.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('create.subtitle')}
          </p>
        </div>
        <div class="badge ${usage.remaining < 5 ? 'badge-warning' : 'badge-accent'}">
          ${t('create.remainingToday', { remaining: usage.remaining })}
        </div>
      </div>

      ${contextBannerHTML}

      <!-- Step 1: Guided Brief Form -->
      <div id="step-brief" class="card" style="margin-bottom: var(--space-6);">
        <h3 style="margin-bottom: var(--space-6);">${icon('document', 20)} ${t('create.briefTitle')}</h3>

        <div class="brief-form flex flex-col gap-6">
          <div class="input-group">
            <label for="brief-type">${icon('clipboard', 16)} ${t('create.contentType')}</label>
            <select id="brief-type" class="select">
              <option value="product">${t('create.typeProduct')}</option>
              <option value="promotion">${t('create.typePromotion')}</option>
              <option value="education">${t('create.typeEducation')}</option>
              <option value="news">${t('create.typeNews')}</option>
              <option value="testimonial">${t('create.typeTestimonial')}</option>
              <option value="other">${t('create.typeOther')}</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brief-product">${icon('gift', 16)} ${t('create.productLabel')} *</label>
            <input type="text" id="brief-product" class="input" 
                   placeholder="${t('create.productPlaceholder')}"
                   value="${initialProduct}" required>
          </div>

          <div class="input-group">
            <label for="brief-highlight">${icon('star', 16)} ${t('create.highlightLabel')}</label>
            <input type="text" id="brief-highlight" class="input" 
                   placeholder="${t('create.highlightPlaceholder')}"
                   value="${draft?.highlight || ''}">
          </div>

          <div class="input-group">
            <label for="brief-promotion">${icon('gift', 16)} ${t('create.promotionLabel')}</label>
            <input type="text" id="brief-promotion" class="input" 
                   placeholder="${t('create.promotionPlaceholder')}"
                   value="${draft?.promotion || ''}">
          </div>

          <div class="input-group">
            <label for="brief-cta">${icon('cursor', 16)} ${t('create.ctaLabel')}</label>
            <select id="brief-cta" class="select">
              <option value="${t('create.ctaBuyNow')}">${t('create.ctaBuyNow')}</option>
              <option value="${t('create.ctaContact')}">${t('create.ctaContact')}</option>
              <option value="${t('create.ctaInbox')}">${t('create.ctaInbox')}</option>
              <option value="${t('create.ctaRegister')}">${t('create.ctaRegister')}</option>
              <option value="${t('create.ctaViewWebsite')}">${t('create.ctaViewWebsite')}</option>
              <option value="">${t('create.ctaCustom')}</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brief-notes">${icon('edit', 16)} ${t('create.notesLabel')}</label>
            <textarea id="brief-notes" class="textarea" rows="3"
                      placeholder="${t('create.notesPlaceholder')}">${draft?.additionalNotes || ''}</textarea>
          </div>

          <button class="btn btn-primary btn-lg btn-full" id="btn-generate" ${usage.remaining <= 0 ? 'disabled' : ''}>
            ${usage.remaining <= 0 ? icon('warning', 16) + ' ' + t('create.limitReached') : icon('sparkle', 16) + ' ' + t('create.generateButton')}
          </button>
        </div>
      </div>

      <!-- Step 2: AI Loading State -->
      <div id="step-loading" class="hidden">
        <div class="card text-center" style="padding: var(--space-12);">
          <div class="loading-spinner" style="width: 48px; height: 48px; margin: 0 auto var(--space-6);"></div>
          <h3>${t('create.aiWriting')}</h3>
          <p class="text-muted" style="margin-top: var(--space-2);">${t('create.aiTakesTime')}</p>
          <div class="ai-progress" style="margin-top: var(--space-6);">
            <div id="ai-step-0" class="ai-step">${icon('strategy', 16)} ${t('create.aiLearning')}</div>
            <div id="ai-step-1" class="ai-step">${icon('edit', 16)} ${t('create.aiStep1')}</div>
            <div id="ai-step-2" class="ai-step">${icon('pencil', 16)} ${t('create.aiStep2')}</div>
            <div id="ai-step-3" class="ai-step">${icon('newspaper', 16)} ${t('create.aiStep3')}</div>
            <div id="ai-step-4" class="ai-step">${icon('phone', 16)} ${t('create.aiStep4')}</div>
          </div>
        </div>
      </div>

      <!-- Step 3: Preview + Edit (Tab view) -->
      <div id="step-preview" class="hidden">
        <div class="flex justify-between items-center mb-4">
          <h3>${icon('party', 20)} ${t('create.contentReady')}</h3>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="btn-regenerate">${icon('refresh', 16)} ${t('create.regenerate')}</button>
            <button class="btn btn-primary btn-sm" id="btn-save-content">${icon('save', 16)} ${t('create.saveContent')}</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs mb-4">
          <button class="tab active" data-tab="facebook">${icon('phone', 16)} ${t('create.tabFacebook')}</button>
          <button class="tab" data-tab="blog">${icon('blog', 16)} ${t('create.tabBlog')}</button>
          <button class="tab" data-tab="story">${icon('camera', 16)} ${t('create.tabStory')}</button>
          <button class="tab" data-tab="image">${icon('image', 16)} ${t('create.tabImage')}</button>
        </div>

        <!-- Tab Content -->
        <div id="tab-facebook" class="tab-content card">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">${t('create.tabFacebook')} Post</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="facebook">${icon('clipboard', 14)} ${t('create.copyButton')}</button>
          </div>
          <div id="content-facebook" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-blog" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">${t('create.tabBlog')} Article</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="blog">${icon('clipboard', 14)} ${t('create.copyButton')}</button>
          </div>
          <div id="content-blog" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-story" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">${t('create.tabStory')} Caption</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="story">${icon('clipboard', 14)} ${t('create.copyButton')}</button>
          </div>
          <div id="content-story" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-image" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">AI ${t('create.tabImage')}</span>
          </div>
          <div class="image-gen-panel">
            <div class="form-group" style="margin-bottom: var(--space-3);">
              <label class="form-label">${icon('brand', 16)} ${t('create.styleLabel')}</label>
              <div class="style-presets" id="style-presets">
                ${getStylePresets().map((s, i) => `
                  <label class="style-option ${i === 0 ? 'selected' : ''}">
                    <input type="radio" name="img-style" value="${s.id}" ${i === 0 ? 'checked' : ''}>
                    <span>${s.name}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="form-group" style="margin-bottom: var(--space-3);">
              <label class="form-label">${icon('pencil', 16)} ${t('create.promptLabel')}</label>
              <textarea id="image-prompt" class="form-input" rows="3" placeholder="${t('create.promptPlaceholder')}"></textarea>
            </div>
            <button class="btn btn-primary" id="btn-gen-image" style="width: 100%; margin-bottom: var(--space-4);">
              ${icon('image', 16)} ${t('create.generateImage')}
            </button>
            <div id="image-preview" class="image-preview-area">
              <div class="image-placeholder">
                <span style="color: var(--text-muted);">${icon('image', 48)}</span>
                <p class="text-sm text-muted">${t('create.imagePlaceholder')}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance Warning Panel -->
        <div class="card compliance-panel hidden" id="compliance-panel" style="margin-top: var(--space-6); border-left: 4px solid var(--danger);">
          <div class="flex justify-between items-center mb-4">
            <h4 style="margin: 0; color: var(--danger);">${icon('warning', 18)} ${t('create.complianceWarning')}</h4>
            <button class="btn btn-ghost btn-sm" id="btn-close-compliance">✕</button>
          </div>
          <div id="compliance-violations" class="mb-4"></div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" id="btn-add-disclaimer">${icon('pin', 16)} ${t('create.addDisclaimer')}</button>
            <button class="btn btn-ghost btn-sm" id="btn-ignore-compliance">${t('create.ignoreCompliance')}</button>
          </div>
        </div>

        <!-- Variation Panel -->
        <div class="card variation-panel" style="margin-top: var(--space-6);" id="variation-panel">
          <h4 style="margin-bottom: var(--space-4);">${icon('refresh', 18)} ${t('create.variationTitle')}</h4>
          <p class="text-sm text-muted" style="margin-bottom: var(--space-3);">${t('create.variationDesc')}</p>
          <div class="variation-types" id="variation-types">
            ${VARIATION_TYPES.map(v => `
              <button class="variation-type-btn" data-type="${v.id}" title="${v.desc}">
                ${v.name}
              </button>
            `).join('')}
          </div>
          <div id="variation-preview" class="hidden" style="margin-top: var(--space-4);">
            <div class="flex justify-between items-center mb-3">
              <span class="badge badge-accent" id="variation-label">${t('create.variationLabel')}</span>
              <button class="btn btn-ghost btn-sm" id="copy-variation">${icon('clipboard', 14)} ${t('create.copyButton')}</button>
            </div>
            <div id="variation-content" class="content-preview" contenteditable="true"></div>
          </div>
        </div>

        <!-- Publish Panel -->
        <div class="publish-panel card" style="margin-top: var(--space-6);" id="publish-panel">
          <h4 style="margin-bottom: var(--space-4);">${icon('publish', 18)} ${t('create.publishTitle')}</h4>
          <div class="publish-toggles flex flex-col gap-3" style="margin-bottom: var(--space-4);">
            <label class="publish-toggle" id="toggle-fb-label">
              <input type="checkbox" id="toggle-fb" class="toggle-input">
              <span class="toggle-slider"></span>
              <span class="toggle-text">${icon('phone', 14)} ${t('create.publishFacebook')}</span>
              <span id="fb-conn-status" class="text-sm text-muted"></span>
            </label>
            <label class="publish-toggle" id="toggle-wp-label">
              <input type="checkbox" id="toggle-wp" class="toggle-input">
              <span class="toggle-slider"></span>
              <span class="toggle-text">${icon('blog', 14)} ${t('create.publishWordPress')}</span>
              <span id="wp-conn-status" class="text-sm text-muted"></span>
            </label>
          </div>
          <div class="flex gap-2 items-center">
            <button class="btn btn-accent btn-lg" id="btn-publish" style="flex: 1;" disabled>
              ${icon('publish', 16)} ${t('create.publishButton')}
            </button>
            <a href="#/settings" class="btn btn-ghost btn-sm">${icon('settings', 14)} ${t('create.settingsLink')}</a>
          </div>
          <div id="publish-results" class="hidden" style="margin-top: var(--space-4);"></div>
        </div>
      </div>
    </main>

    <style>
      .content-preview {
        white-space: pre-wrap;
        line-height: 1.8;
        padding: var(--space-4);
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        min-height: 200px;
        outline: none;
        border: 2px solid transparent;
        transition: border-color var(--transition-fast);
      }

      .content-preview:focus {
        border-color: var(--accent);
      }

      .ai-step {
        padding: var(--space-2) 0;
        color: var(--text-muted);
        font-size: var(--font-sm);
        transition: color 0.3s ease;
      }

      .ai-step.active {
        color: var(--accent);
        font-weight: 500;
      }

      .ai-step.done {
        color: var(--success);
      }
    </style>
  `;

  attachSidebarEvents();
  attachCreateEvents();
  startAutosave();

  // Auto-fill from template if coming from templates page
  const templateData = sessionStorage.getItem('cp_active_template');
  if (templateData) {
    try {
      const fields = JSON.parse(templateData);
      const templateName = sessionStorage.getItem('cp_template_name') || 'Template';
      sessionStorage.removeItem('cp_active_template');
      sessionStorage.removeItem('cp_template_name');

      if (fields.contentType) {
        const typeEl = document.getElementById('brief-type');
        if (typeEl) typeEl.value = fields.contentType;
      }
      if (fields.product) {
        const prodEl = document.getElementById('brief-product');
        if (prodEl) prodEl.value = fields.product;
      }
      if (fields.highlight) {
        const highEl = document.getElementById('brief-highlight');
        if (highEl) highEl.value = fields.highlight;
      }
      if (fields.promotion) {
        const promoEl = document.getElementById('brief-promotion');
        if (promoEl) promoEl.value = fields.promotion;
      }
      if (fields.cta) {
        const ctaEl = document.getElementById('brief-cta');
        if (ctaEl) ctaEl.value = fields.cta;
      }
      if (fields.additionalNotes) {
        const notesEl = document.getElementById('brief-notes');
        if (notesEl) notesEl.value = fields.additionalNotes;
      }

      showToast(t('create.templateApplied', { name: templateName }), 'success', 3000);
    } catch { /* ignore parse errors */ }
  }

  // Auto-trigger generation when coming from an Angle
  if (window.__createContext) {
    // Hide brief form — user doesn't need to fill anything
    document.getElementById('step-brief')?.classList.add('hidden');
    // Trigger AI generation directly with Angle context
    handleGenerate(setCurrentContent, runComplianceCheck, window.__createContext);
  }
}

function attachCreateEvents() {
  // Generate button — delegates to ai-handler
  document.getElementById('btn-generate')?.addEventListener('click', () => {
    handleGenerate(setCurrentContent, runComplianceCheck);
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.remove('hidden');
    });
  });

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const target = btn.dataset.target;
      const content = document.getElementById(`content-${target}`)?.textContent;
      if (content) {
        await copyToClipboard(content);
        showToast(t('create.copiedSuccess'), 'success');
        btn.innerHTML = icon('check', 14) + ' ' + t('create.copied');
        setTimeout(() => { btn.innerHTML = icon('clipboard', 14) + ' ' + t('create.copyButton'); }, 2000);
      }
    });
  });

  // Regenerate
  document.getElementById('btn-regenerate')?.addEventListener('click', () => {
    document.getElementById('step-preview').classList.add('hidden');
    document.getElementById('step-brief').classList.remove('hidden');
  });

  // Image generation — delegates to ai-handler
  document.querySelectorAll('.style-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  document.getElementById('btn-gen-image')?.addEventListener('click', handleImageGen);

  // Variation buttons — delegates to ai-handler
  document.querySelectorAll('.variation-type-btn').forEach(btn => {
    btn.addEventListener('click', () => handleVariation(btn.dataset.type));
  });

  document.getElementById('copy-variation')?.addEventListener('click', async () => {
    const text = document.getElementById('variation-content')?.textContent;
    if (text) {
      await copyToClipboard(text);
      showToast(t('create.copyVariation'), 'success');
    }
  });

  // Save — delegates to publish-handler
  document.getElementById('btn-save-content')?.addEventListener('click', () => handleSave(getCurrentContent));

  // Publish toggles
  const toggleFb = document.getElementById('toggle-fb');
  const toggleWp = document.getElementById('toggle-wp');
  const publishBtn = document.getElementById('btn-publish');

  const updatePublishBtn = () => {
    const anyOn = toggleFb?.checked || toggleWp?.checked;
    publishBtn.disabled = !anyOn;
  };

  toggleFb?.addEventListener('change', updatePublishBtn);
  toggleWp?.addEventListener('change', updatePublishBtn);

  // Publish button — delegates to publish-handler
  publishBtn?.addEventListener('click', () => handlePublish(getCurrentContent));

  // Load connection status
  initPublishPanel();
}

/** Autosave brief to localStorage every 30s */
function startAutosave() {
  clearInterval(autosaveTimer);
  autosaveTimer = setInterval(() => {
    const product = document.getElementById('brief-product')?.value;
    if (product) {
      storage.set('draft_brief', {
        product,
        highlight: document.getElementById('brief-highlight')?.value || '',
        promotion: document.getElementById('brief-promotion')?.value || '',
        additionalNotes: document.getElementById('brief-notes')?.value || '',
      });
    }
  }, 30000);
}
