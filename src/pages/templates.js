/**
 * Templates Page — Save and reuse brief templates
 */
import { store } from '../utils/state.js';
import { loadTemplates, saveTemplate, deleteTemplate } from '../services/firestore.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { t } from '../utils/i18n.js';

const DEFAULT_TEMPLATES = [
  { id: '_default_1', name: `📦 ${t('templates.defaultProduct')}`, desc: t('templates.defaultProductDesc'), isDefault: true, fields: { contentType: 'product', product: '', highlight: '', promotion: '', cta: t('templates.ctaBuyNow'), additionalNotes: t('templates.defaultProductNotes') } },
  { id: '_default_2', name: `🎁 ${t('templates.defaultFlashSale')}`, desc: t('templates.defaultFlashSaleDesc'), isDefault: true, fields: { contentType: 'promotion', product: '', highlight: '', promotion: '', cta: t('templates.ctaOrderNow'), additionalNotes: t('templates.defaultFlashSaleNotes') } },
  { id: '_default_3', name: `💡 ${t('templates.defaultTips')}`, desc: t('templates.defaultTipsDesc'), isDefault: true, fields: { contentType: 'education', product: '', highlight: '', promotion: '', cta: t('templates.ctaSavePost'), additionalNotes: t('templates.defaultTipsNotes') } },
  { id: '_default_4', name: `🎬 ${t('templates.defaultBTS')}`, desc: t('templates.defaultBTSDesc'), isDefault: true, fields: { contentType: 'other', product: '', highlight: '', promotion: '', cta: t('templates.ctaFollow'), additionalNotes: t('templates.defaultBTSNotes') } },
  { id: '_default_5', name: `⭐ ${t('templates.defaultTestimonial')}`, desc: t('templates.defaultTestimonialDesc'), isDefault: true, fields: { contentType: 'testimonial', product: '', highlight: '', promotion: '', cta: t('templates.ctaInbox'), additionalNotes: t('templates.defaultTestimonialNotes') } },
  { id: '_default_6', name: `📢 ${t('templates.defaultNews')}`, desc: t('templates.defaultNewsDesc'), isDefault: true, fields: { contentType: 'news', product: '', highlight: '', promotion: '', cta: t('templates.ctaRegister'), additionalNotes: t('templates.defaultNewsNotes') } },
];

export async function renderTemplatesPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">📋 ${t('templates.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">${t('templates.subtitle')}</p>
        </div>
        <button class="btn btn-primary" id="btn-new-template">+ ${t('templates.createNew')}</button>
      </div>

      <!-- Default Templates -->
      <h3 style="margin-bottom: var(--space-4);">🎯 ${t('templates.defaultSection')}</h3>
      <div class="templates-grid" id="default-templates">
        ${DEFAULT_TEMPLATES.map(t => renderTemplateCard(t)).join('')}
      </div>

      <!-- User Templates -->
      <h3 style="margin-top: var(--space-8); margin-bottom: var(--space-4);">💾 ${t('templates.userSection')}</h3>
      <div class="templates-grid" id="user-templates">
        <div class="skeleton" style="height: 120px;"></div>
      </div>

      <!-- Create Template Modal -->
      <div class="modal-overlay hidden" id="template-modal">
        <div class="card" style="max-width: 520px; width: 90%; padding: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">📋 ${t('templates.createModalTitle')}</h3>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('templates.name')} *</label>
            <input type="text" class="form-input" id="tmpl-name" placeholder="${t('templates.namePlaceholder')}">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('templates.description')}</label>
            <input type="text" class="form-input" id="tmpl-desc" placeholder="${t('templates.descPlaceholder')}">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('templates.contentType')}</label>
            <select class="form-input" id="tmpl-type">
              <option value="product">${t('templates.typeProduct')}</option>
              <option value="promotion">${t('templates.typePromotion')}</option>
              <option value="education">${t('templates.typeEducation')}</option>
              <option value="news">${t('templates.typeNews')}</option>
              <option value="testimonial">${t('templates.typeTestimonial')}</option>
              <option value="other">${t('templates.typeOther')}</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('templates.defaultCTA')}</label>
            <input type="text" class="form-input" id="tmpl-cta" placeholder="${t('templates.ctaPlaceholder')}">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${t('templates.aiNotes')}</label>
            <textarea class="form-input" id="tmpl-notes" rows="3" placeholder="${t('templates.aiNotesPlaceholder')}"></textarea>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-primary" id="btn-save-template" style="flex: 1;">💾 ${t('templates.save')}</button>
            <button class="btn btn-ghost" id="btn-close-tmpl-modal">${t('actions.cancel')}</button>
          </div>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();

  // Load user templates
  try {
    const templates = await loadTemplates();
    renderUserTemplates(templates);
  } catch {
    renderUserTemplates([]);
  }

  // Events
  document.getElementById('btn-new-template')?.addEventListener('click', () => {
    document.getElementById('template-modal')?.classList.remove('hidden');
  });

  document.getElementById('btn-close-tmpl-modal')?.addEventListener('click', () => {
    document.getElementById('template-modal')?.classList.add('hidden');
  });

  document.getElementById('template-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'template-modal') {
      document.getElementById('template-modal')?.classList.add('hidden');
    }
  });

  document.getElementById('btn-save-template')?.addEventListener('click', handleSaveTemplate);

  // Use template buttons (defaults)
  document.querySelectorAll('.use-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const template = DEFAULT_TEMPLATES.find(t => t.id === id);
      if (template) useTemplate(template);
    });
  });
}

function renderTemplateCard(tmpl) {
  return `
    <div class="template-card card">
      <div class="flex justify-between items-center" style="margin-bottom: var(--space-2);">
        <strong style="font-size: var(--font-base);">${tmpl.name}</strong>
        ${tmpl.isDefault ? `<span class="badge badge-accent" style="font-size: 10px;">${t('templates.defaultBadge')}</span>` : `<button class="btn btn-ghost btn-sm delete-tmpl-btn" data-id="${tmpl.id}" title="${t('actions.delete')}">🗑️</button>`}
      </div>
      <p class="text-sm text-muted" style="margin-bottom: var(--space-3);">${tmpl.desc || ''}</p>
      <button class="btn btn-primary btn-sm use-template-btn" data-id="${tmpl.id}" style="width: 100%;">
        ✨ ${t('templates.useTemplate')}
      </button>
    </div>
  `;
}

function renderUserTemplates(templates) {
  const container = document.getElementById('user-templates');
  if (!container) return;

  if (!templates.length) {
    container.innerHTML = `
      <div class="card-flat text-center" style="padding: var(--space-8); grid-column: 1 / -1;">
        <span style="font-size: 2rem;">📋</span>
        <p class="text-sm text-muted" style="margin-top: var(--space-2);">${t('templates.noCustomTemplates')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = templates.map(t => renderTemplateCard(t)).join('');

  // Attach use & delete events
  container.querySelectorAll('.use-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tmpl = templates.find(t => t.id === btn.dataset.id);
      if (tmpl) useTemplate(tmpl);
    });
  });

  container.querySelectorAll('.delete-tmpl-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('templates.deleteConfirm'))) return;
      try {
        await deleteTemplate(btn.dataset.id);
        showToast(t('templates.deleted'), 'success');
        const updated = await loadTemplates();
        renderUserTemplates(updated);
      } catch (err) {
        showToast(t('common.error') + ': ' + err.message, 'error');
      }
    });
  });
}

async function handleSaveTemplate() {
  const name = document.getElementById('tmpl-name')?.value?.trim();
  if (!name) {
    showToast(t('templates.nameRequired'), 'error');
    return;
  }

  const template = {
    name,
    desc: document.getElementById('tmpl-desc')?.value?.trim() || '',
    fields: {
      contentType: document.getElementById('tmpl-type')?.value || 'product',
      cta: document.getElementById('tmpl-cta')?.value?.trim() || '',
      additionalNotes: document.getElementById('tmpl-notes')?.value?.trim() || '',
      product: '',
      highlight: '',
      promotion: '',
    },
  };

  try {
    await saveTemplate(template);
    showToast(t('templates.saved'), 'success');
    document.getElementById('template-modal')?.classList.add('hidden');
    const updated = await loadTemplates();
    renderUserTemplates(updated);
  } catch (err) {
    showToast(t('common.error') + ': ' + err.message, 'error');
  }
}

function useTemplate(template) {
  // Store template in sessionStorage and navigate to create page
  sessionStorage.setItem('cp_active_template', JSON.stringify(template.fields));
  sessionStorage.setItem('cp_template_name', template.name);
  window.location.hash = '#/create';
  showToast(t('templates.using', { name: template.name }), 'success');
}
