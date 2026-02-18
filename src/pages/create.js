/**
 * Create Content Page — Guided brief form + AI generation + tab preview + publish
 * Core feature of ContentPilot v2
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { generateContent, checkDailyLimit, incrementUsage, generateVariation, VARIATION_TYPES } from '../services/gemini.js';
import {
  openImageEditor

} from '../components/image-editor.js';
import { checkCompliance, highlightViolations, addDisclaimer, DISCLAIMER_TEMPLATES } from '../services/compliance.js';
import { saveContent, loadConnections } from '../services/firestore.js';
import { copyToClipboard, storage } from '../utils/helpers.js';
import { publishToFacebook } from '../services/facebook.js';
import { publishToWordPress } from '../services/wordpress.js';
import { generateImage, buildImagePrompt, getStylePresets } from '../services/image-gen.js';
import { t } from '../utils/i18n.js';

let currentContent = null;
let autosaveTimer = null;

export function renderCreatePage() {
  const app = document.getElementById('app');
  const usage = checkDailyLimit();

  // Restore draft from localStorage
  const draft = storage.get('draft_brief', null);

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">✨ ${t('create.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('create.subtitle')}
          </p>
        </div>
        <div class="badge ${usage.remaining < 5 ? 'badge-warning' : 'badge-accent'}">
          ${t('create.remainingToday', { remaining: usage.remaining })}
        </div>
      </div>

      <!-- Step 1: Guided Brief Form -->
      <div id="step-brief" class="card" style="margin-bottom: var(--space-6);">
        <h3 style="margin-bottom: var(--space-6);">📝 ${t('create.briefTitle')}</h3>

        <div class="brief-form flex flex-col gap-6">
          <div class="input-group">
            <label for="brief-type">📋 ${t('create.contentType')}</label>
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
            <label for="brief-product">📦 ${t('create.productLabel')} *</label>
            <input type="text" id="brief-product" class="input" 
                   placeholder="${t('create.productPlaceholder')}"
                   value="${draft?.product || ''}" required>
          </div>

          <div class="input-group">
            <label for="brief-highlight">⭐ ${t('create.highlightLabel')}</label>
            <input type="text" id="brief-highlight" class="input" 
                   placeholder="${t('create.highlightPlaceholder')}"
                   value="${draft?.highlight || ''}">
          </div>

          <div class="input-group">
            <label for="brief-promotion">🎁 ${t('create.promotionLabel')}</label>
            <input type="text" id="brief-promotion" class="input" 
                   placeholder="${t('create.promotionPlaceholder')}"
                   value="${draft?.promotion || ''}">
          </div>

          <div class="input-group">
            <label for="brief-cta">👉 ${t('create.ctaLabel')}</label>
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
            <label for="brief-notes">📝 ${t('create.notesLabel')}</label>
            <textarea id="brief-notes" class="textarea" rows="3"
                      placeholder="${t('create.notesPlaceholder')}">${draft?.additionalNotes || ''}</textarea>
          </div>

          <button class="btn btn-primary btn-lg btn-full" id="btn-generate" ${usage.remaining <= 0 ? 'disabled' : ''}>
            ${usage.remaining <= 0 ? '⚠️ ' + t('create.limitReached') : '✨ ' + t('create.generateButton')}
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
            <div id="ai-step-1" class="ai-step active">📝 ${t('create.aiStep1')}</div>
            <div id="ai-step-2" class="ai-step">✍️ ${t('create.aiStep2')}</div>
            <div id="ai-step-3" class="ai-step">📰 ${t('create.aiStep3')}</div>
            <div id="ai-step-4" class="ai-step">📱 ${t('create.aiStep4')}</div>
          </div>
        </div>
      </div>

      <!-- Step 3: Preview + Edit (Tab view) -->
      <div id="step-preview" class="hidden">
        <div class="flex justify-between items-center mb-4">
          <h3>🎉 ${t('create.contentReady')}</h3>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="btn-regenerate">🔄 ${t('create.regenerate')}</button>
            <button class="btn btn-primary btn-sm" id="btn-save-content">💾 ${t('create.saveContent')}</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs mb-4">
          <button class="tab active" data-tab="facebook">📱 ${t('create.tabFacebook')}</button>
          <button class="tab" data-tab="blog">📰 ${t('create.tabBlog')}</button>
          <button class="tab" data-tab="story">📸 ${t('create.tabStory')}</button>
          <button class="tab" data-tab="image">🖼️ ${t('create.tabImage')}</button>
        </div>

        <!-- Tab Content -->
        <div id="tab-facebook" class="tab-content card">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">${t('create.tabFacebook')} Post</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="facebook">📋 ${t('create.copyButton')}</button>
          </div>
          <div id="content-facebook" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-blog" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">${t('create.tabBlog')} Article</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="blog">📋 ${t('create.copyButton')}</button>
          </div>
          <div id="content-blog" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-story" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">${t('create.tabStory')} Caption</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="story">📋 ${t('create.copyButton')}</button>
          </div>
          <div id="content-story" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-image" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">AI ${t('create.tabImage')}</span>
          </div>
          <div class="image-gen-panel">
            <div class="form-group" style="margin-bottom: var(--space-3);">
              <label class="form-label">🎨 ${t('create.styleLabel')}</label>
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
              <label class="form-label">✏️ ${t('create.promptLabel')}</label>
              <textarea id="image-prompt" class="form-input" rows="3" placeholder="${t('create.promptPlaceholder')}"></textarea>
            </div>
            <button class="btn btn-primary" id="btn-gen-image" style="width: 100%; margin-bottom: var(--space-4);">
              🖼️ ${t('create.generateImage')}
            </button>
            <div id="image-preview" class="image-preview-area">
              <div class="image-placeholder">
                <span style="font-size: 3rem;">🖼️</span>
                <p class="text-sm text-muted">${t('create.imagePlaceholder')}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance Warning Panel -->
        <div class="card compliance-panel hidden" id="compliance-panel" style="margin-top: var(--space-6); border-left: 4px solid var(--danger);">
          <div class="flex justify-between items-center mb-4">
            <h4 style="margin: 0; color: var(--danger);">⚠️ ${t('create.complianceWarning')}</h4>
            <button class="btn btn-ghost btn-sm" id="btn-close-compliance">✕</button>
          </div>
          <div id="compliance-violations" class="mb-4"></div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" id="btn-add-disclaimer">📌 ${t('create.addDisclaimer')}</button>
            <button class="btn btn-ghost btn-sm" id="btn-ignore-compliance">${t('create.ignoreCompliance')}</button>
          </div>
        </div>

        <!-- Variation Panel -->
        <div class="card variation-panel" style="margin-top: var(--space-6);" id="variation-panel">
          <h4 style="margin-bottom: var(--space-4);">🔄 ${t('create.variationTitle')}</h4>
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
              <button class="btn btn-ghost btn-sm" id="copy-variation">📋 ${t('create.copyButton')}</button>
            </div>
            <div id="variation-content" class="content-preview" contenteditable="true"></div>
          </div>
        </div>

        <!-- Publish Panel -->
        <div class="publish-panel card" style="margin-top: var(--space-6);" id="publish-panel">
          <h4 style="margin-bottom: var(--space-4);">🚀 ${t('create.publishTitle')}</h4>
          <div class="publish-toggles flex flex-col gap-3" style="margin-bottom: var(--space-4);">
            <label class="publish-toggle" id="toggle-fb-label">
              <input type="checkbox" id="toggle-fb" class="toggle-input">
              <span class="toggle-slider"></span>
              <span class="toggle-text">📱 ${t('create.publishFacebook')}</span>
              <span id="fb-conn-status" class="text-sm text-muted"></span>
            </label>
            <label class="publish-toggle" id="toggle-wp-label">
              <input type="checkbox" id="toggle-wp" class="toggle-input">
              <span class="toggle-slider"></span>
              <span class="toggle-text">📝 ${t('create.publishWordPress')}</span>
              <span id="wp-conn-status" class="text-sm text-muted"></span>
            </label>
          </div>
          <div class="flex gap-2 items-center">
            <button class="btn btn-accent btn-lg" id="btn-publish" style="flex: 1;" disabled>
              🚀 ${t('create.publishButton')}
            </button>
            <a href="#/settings" class="btn btn-ghost btn-sm">⚙️ ${t('create.settingsLink')}</a>
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
}

function attachCreateEvents() {
  // Generate button
  document.getElementById('btn-generate')?.addEventListener('click', handleGenerate);

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
        btn.textContent = '✅ ' + t('create.copied');
        setTimeout(() => { btn.textContent = '📋 ' + t('create.copyButton'); }, 2000);
      }
    });
  });

  // Regenerate
  document.getElementById('btn-regenerate')?.addEventListener('click', () => {
    document.getElementById('step-preview').classList.add('hidden');
    document.getElementById('step-brief').classList.remove('hidden');
  });

  // Image generation
  document.querySelectorAll('.style-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  document.getElementById('btn-gen-image')?.addEventListener('click', handleImageGen);

  // Variation buttons
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

  // Save
  document.getElementById('btn-save-content')?.addEventListener('click', handleSave);

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

  // Publish button
  publishBtn?.addEventListener('click', handlePublish);

  // Load connection status for publish panel
  initPublishPanel();
}

async function initPublishPanel() {
  const connections = store.get('connections') || await loadConnections() || {};
  const fb = connections.facebook;
  const wp = connections.wordpress;

  const fbStatus = document.getElementById('fb-conn-status');
  const wpStatus = document.getElementById('wp-conn-status');
  const toggleFb = document.getElementById('toggle-fb');
  const toggleWp = document.getElementById('toggle-wp');

  if (fb?.pageId) {
    if (fbStatus) fbStatus.textContent = `(${fb.pageName || t('settings.connected')})`;
  } else {
    if (fbStatus) fbStatus.innerHTML = `(<a href="#/settings">${t('create.notConnected')}</a>)`;
    if (toggleFb) { toggleFb.disabled = true; }
  }

  if (wp?.siteUrl) {
    if (wpStatus) wpStatus.textContent = `(${wp.siteName || t('settings.connected')})`;
  } else {
    if (wpStatus) wpStatus.innerHTML = `(<a href="#/settings">${t('create.notConnected')}</a>)`;
    if (toggleWp) { toggleWp.disabled = true; }
  }
}

async function handleGenerate() {
  const product = document.getElementById('brief-product')?.value?.trim();
  if (!product) {
    showToast(t('create.productRequired'), 'warning');
    document.getElementById('brief-product')?.focus();
    return;
  }

  const brief = {
    contentType: document.getElementById('brief-type')?.value,
    product,
    highlight: document.getElementById('brief-highlight')?.value?.trim(),
    promotion: document.getElementById('brief-promotion')?.value?.trim(),
    cta: document.getElementById('brief-cta')?.value,
    additionalNotes: document.getElementById('brief-notes')?.value?.trim(),
  };

  // Show loading
  document.getElementById('step-brief').classList.add('hidden');
  document.getElementById('step-loading').classList.remove('hidden');

  // Animate steps
  const steps = ['ai-step-1', 'ai-step-2', 'ai-step-3', 'ai-step-4'];
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

    currentContent = { ...content, brief: product, contentType: brief.contentType };

    // Show preview
    document.getElementById('step-loading').classList.add('hidden');
    document.getElementById('step-preview').classList.remove('hidden');

    document.getElementById('content-facebook').textContent = content.facebook;
    document.getElementById('content-blog').textContent = content.blog;
    document.getElementById('content-story').textContent = content.story;

    // Clear draft
    storage.remove('draft_brief');

    // Run compliance check on Facebook content
    runComplianceCheck(content.facebook);

    showToast(t('create.contentReadyToast'), 'success');
  } catch (error) {
    clearInterval(stepTimer);
    console.error('Generate error:', error);
    document.getElementById('step-loading').classList.add('hidden');
    document.getElementById('step-brief').classList.remove('hidden');
    showToast(t('create.generateError', { error: error.message }), 'error', 5000);
  }
}

async function handlePublish() {
  if (!currentContent) return;

  const connections = store.get('connections') || {};
  const publishFb = document.getElementById('toggle-fb')?.checked;
  const publishWp = document.getElementById('toggle-wp')?.checked;
  const publishBtn = document.getElementById('btn-publish');
  const resultsEl = document.getElementById('publish-results');

  if (!publishFb && !publishWp) {
    showToast(t('create.selectPlatform'), 'warning');
    return;
  }

  // Get latest edited content
  const facebook = document.getElementById('content-facebook')?.textContent || '';
  const blog = document.getElementById('content-blog')?.textContent || '';

  // Disable button + show loading
  publishBtn.disabled = true;
  publishBtn.innerHTML = '⏳ ' + t('create.publishing');
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = `<span class="text-muted">🔄 ${t('create.processing')}</span>`;

  const results = [];
  const publishedTo = [];
  const publishedUrls = {};

  // Publish to Facebook
  if (publishFb && connections.facebook) {
    const fb = connections.facebook;
    const fbResult = await publishToFacebook(facebook, fb.pageId, fb.accessToken);
    if (fbResult.success) {
      results.push(`<div class="publish-result-item text-success">✅ Facebook: <a href="${fbResult.postUrl}" target="_blank" rel="noopener">${t('create.viewPost')}</a></div>`);
      publishedTo.push('facebook');
      publishedUrls.facebook = fbResult.postUrl;
    } else {
      results.push(`<div class="publish-result-item text-danger">❌ Facebook: ${fbResult.error}</div>`);
    }
  }

  // Publish to WordPress
  if (publishWp && connections.wordpress) {
    const wp = connections.wordpress;
    const wpResult = await publishToWordPress({
      title: currentContent.brief || 'ContentPilot Post',
      content: blog,
      status: 'publish',
      siteUrl: wp.siteUrl,
      username: wp.username,
      appPassword: wp.appPassword,
    });
    if (wpResult.success) {
      results.push(`<div class="publish-result-item text-success">✅ WordPress: <a href="${wpResult.postUrl}" target="_blank" rel="noopener">${t('create.viewPost')}</a></div>`);
      publishedTo.push('wordpress');
      publishedUrls.wordpress = wpResult.postUrl;
    } else {
      results.push(`<div class="publish-result-item text-danger">❌ WordPress: ${wpResult.error}</div>`);
    }
  }

  // Show results
  resultsEl.innerHTML = results.join('');

  // Auto-save content with published status
  if (publishedTo.length > 0) {
    try {
      const story = document.getElementById('content-story')?.textContent || '';
      await saveContent({
        ...currentContent,
        facebook,
        blog,
        story,
        status: 'published',
        publishedTo,
        publishedUrls,
        publishedAt: new Date().toISOString(),
      });
      showToast(t('create.publishSuccess', { platforms: publishedTo.join(' + ') }), 'success');
    } catch (e) {
      console.error('Auto-save after publish error:', e);
    }
  }

  // Reset button
  publishBtn.disabled = false;
  publishBtn.innerHTML = '🚀 ' + t('create.publishButton');
}

async function handleSave() {
  if (!currentContent) return;

  try {
    // Get edited content from contenteditable
    const facebook = document.getElementById('content-facebook')?.textContent || '';
    const blog = document.getElementById('content-blog')?.textContent || '';
    const story = document.getElementById('content-story')?.textContent || '';

    await saveContent({
      ...currentContent,
      facebook,
      blog,
      story,
      status: 'draft',
    });

    showToast(t('create.savedToLibrary'), 'success');
  } catch (error) {
    console.error('Save error:', error);
    showToast(t('create.saveError'), 'error');
  }
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

async function handleImageGen() {
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
        <button class="btn btn-primary btn-sm" id="btn-edit-image" style="flex: 1;">✏️ ${t('create.editImage')}</button>
        <a href="data:${result.mimeType};base64,${result.imageData}" 
           download="contentpilot-image.png" class="btn btn-outline btn-sm" id="btn-download-image">
          💾 ${t('create.downloadImage')}
        </a>
        <button class="btn btn-ghost btn-sm" id="btn-regen-image">🔄 ${t('create.regenerateImage')}</button>
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
        <span style="font-size: 2rem;">❌</span>
        <p class="text-sm" style="color: var(--danger);">${err.message}</p>
        <p class="text-xs text-muted" style="margin-top: var(--space-2);">${t('create.tryDifferentPrompt')}</p>
      </div>
    `;
    showToast(t('create.imageError', { error: err.message }), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🖼️ ' + t('create.generateImage');
  }
}

async function handleVariation(type) {
  // Get active tab content
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
    const contentEl = document.getElementById('variation-content');
    const labelEl = document.getElementById('variation-label');

    if (previewEl && contentEl) {
      previewEl.classList.remove('hidden');
      contentEl.textContent = variation;
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
 * Run compliance check and show warnings if violations found
 */
function runComplianceCheck(content) {
  const result = checkCompliance(content);
  const panel = document.getElementById('compliance-panel');
  const violationsEl = document.getElementById('compliance-violations');

  if (!result.isCompliant) {
    // Show violations
    const violationsHTML = result.violations.map(v => `
      <div class="compliance-violation-item" style="margin-bottom: var(--space-3); padding: var(--space-3); background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md);">
        <div class="flex items-start gap-3">
          <span style="font-size: 1.2rem;">⚠️</span>
          <div style="flex: 1;">
            <p style="margin: 0; color: var(--danger); font-weight: 600;">"${v.word}"</p>
            <p style="margin: var(--space-1) 0 0; font-size: var(--font-sm); color: var(--text-muted);">${v.message}</p>
            ${v.suggestion ? `<p style="margin: var(--space-1) 0 0; font-size: var(--font-sm);"><strong>${t('create.suggestion')}</strong> ${v.suggestion}</p>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    violationsEl.innerHTML = `
      <div style="padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--space-4);">
        <p style="margin: 0;"><strong>${t('create.violationsFound', { count: result.violations.length })}</strong></p>
        <p style="margin: var(--space-1) 0 0; font-size: var(--font-sm); color: var(--text-muted);">
          ${t('create.complianceScore')} <span class="badge badge-danger">${result.score}/100</span>
        </p>
      </div>
      ${violationsHTML}
    `;

    panel.classList.remove('hidden');

    // Setup event handlers (remove old listeners by cloning)
    const closeBtn = document.getElementById('btn-close-compliance');
    const ignoreBtn = document.getElementById('btn-ignore-compliance');
    const disclaimerBtn = document.getElementById('btn-add-disclaimer');

    closeBtn?.replaceWith(closeBtn.cloneNode(true));
    ignoreBtn?.replaceWith(ignoreBtn.cloneNode(true));
    disclaimerBtn?.replaceWith(disclaimerBtn.cloneNode(true));

    document.getElementById('btn-close-compliance')?.addEventListener('click', () => {
      panel.classList.add('hidden');
    });

    document.getElementById('btn-ignore-compliance')?.addEventListener('click', () => {
      panel.classList.add('hidden');
      showToast(t('common.warning') + ': ' + t('create.ignoreCompliance'), 'warning');
    });

    document.getElementById('btn-add-disclaimer')?.addEventListener('click', () => {
      addDisclaimerToContent();
    });
  } else if (result.warnings.length > 0) {
    // Just warnings, show toast
    showToast(`⚠️ ${t('create.violationsFound', { count: result.warnings.length })}`, 'warning');
  }
}

/**
 * Add disclaimer to all content variants
 */
function addDisclaimerToContent() {
  const fbContent = document.getElementById('content-facebook');
  const blogContent = document.getElementById('content-blog');
  const storyContent = document.getElementById('content-story');

  if (fbContent) {
    fbContent.textContent = addDisclaimer(fbContent.textContent, 'tpcn');
  }
  if (blogContent) {
    blogContent.textContent = addDisclaimer(blogContent.textContent, 'tpcn');
  }
  if (storyContent) {
    storyContent.textContent = addDisclaimer(storyContent.textContent, 'tpcn');
  }

  document.getElementById('compliance-panel')?.classList.add('hidden');
  showToast(t('create.addDisclaimer') + '! 📌', 'success');
}
