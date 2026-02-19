/**
 * Campaigns Page — Manage long-term marketing campaigns
 */
import { store } from '../utils/state.js';
import { loadCampaigns, saveCampaign, deleteCampaign } from '../services/firestore.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { timeAgo } from '../utils/helpers.js';

export async function renderCampaignsPage() {
  const app = document.getElementById('app');
  const campaigns = await loadCampaigns();

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">${t('campaign.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">${t('campaign.subtitle')}</p>
        </div>
        <button class="btn btn-primary" id="btn-create-campaign">
          ${icon('sparkle', 16)} ${t('campaign.create')}
        </button>
      </div>

      <!-- Campaign List -->
      <div id="campaign-list" class="grid gap-4">
        ${renderCampaignList(campaigns)}
      </div>

      <!-- Create Modal (Hidden by default) -->
      <div id="modal-create-campaign" class="modal-overlay hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${t('campaign.createModal')}</h3>
            <button class="btn-close" id="btn-close-modal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>${t('campaign.name')}</label>
              <input type="text" id="campaign-name" class="input" placeholder="${t('campaign.namePlaceholder')}">
            </div>
            <div class="form-group">
              <label>${t('campaign.goal')}</label>
              <input type="text" id="campaign-goal" class="input" placeholder="${t('campaign.goalPlaceholder')}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>${t('campaign.startDate')}</label>
                <input type="date" id="campaign-start" class="input">
              </div>
              <div class="form-group">
                <label>${t('campaign.endDate')}</label>
                <input type="date" id="campaign-end" class="input">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btn-cancel-modal">${t('actions.cancel')}</button>
            <button class="btn btn-primary" id="btn-save-campaign">${t('actions.save')}</button>
          </div>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();
  attachCampaignEvents();
}

function renderCampaignList(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return `
      <div class="card-flat text-center" style="padding: var(--space-10);">
        <div style="color: var(--text-muted);">${icon('tent', 48)}</div>
        <p style="color: var(--text-secondary);">${t('campaign.noCampaignsDesc')}</p>
        <button class="btn btn-primary" id="btn-create-first" style="margin-top: var(--space-4);">
          ${t('campaign.createFirst')}
        </button>
      </div>
    `;
  }

  return campaigns.map(c => `
    <div class="card campaign-card relative" style="cursor: pointer;" data-campaign-id="${c.id}">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-lg font-bold">${c.name}</h3>
            <span class="badge ${getStatusBadge(c.status)}">${t('status.' + (c.status || 'draft'))}</span>
          </div>
          <p class="text-sm text-muted mb-2">${c.brief || c.goal || 'No description'}</p>
          <div class="flex gap-4 text-xs text-muted">
            <span>${icon('calendar', 14)} ${c.startDate || 'TBD'} - ${c.endDate || 'TBD'}</span>
            <span>${icon('clock', 14)} ${timeAgo(c.createdAt)}</span>
          </div>
        </div>
        <div class="dropdown">
            <button class="btn btn-ghost btn-icon btn-delete-campaign" data-id="${c.id}" title="${t('actions.delete')}">${icon('trash', 16)}</button>
        </div>
      </div>
      
      <!-- Progress / Simple Stats -->
      <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-6">
        <div>
            <span class="block text-xs text-muted uppercase tracking-wider">${t('pillar.title')}</span>
            <span class="text-lg font-semibold">${c.pillars?.length || 0}</span>
        </div>
        <div>
            <span class="block text-xs text-muted uppercase tracking-wider">${t('angle.title')}</span>
            <span class="text-lg font-semibold">${c.angles?.length || 0}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function getStatusBadge(status) {
  switch (status) {
    case 'active': return 'badge-success';
    case 'completed': return 'badge-muted';
    default: return 'badge-accent';
  }
}

function attachCampaignEvents() {
  const modal = document.getElementById('modal-create-campaign');
  const openBtn = document.getElementById('btn-create-campaign');
  const closeBtn = document.getElementById('btn-close-modal');
  const cancelBtn = document.getElementById('btn-cancel-modal');
  const saveBtn = document.getElementById('btn-save-campaign');
  const firstBtn = document.getElementById('btn-create-first');

  const openModal = () => modal?.classList.remove('hidden');
  const closeModal = () => modal?.classList.add('hidden');

  openBtn?.addEventListener('click', openModal);
  firstBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Check for URL params to auto-open modal (from Strategy Hub)
  const hash = window.location.hash;
  if (hash.includes('?')) {
    const params = new URLSearchParams(hash.split('?')[1]);
    if (params.get('action') === 'create') {
      const nameInput = document.getElementById('campaign-name');
      const goalInput = document.getElementById('campaign-goal');

      if (nameInput) nameInput.value = params.get('name') || '';
      if (goalInput) goalInput.value = params.get('brief') || '';

      openModal();

      // Clean up URL without refreshing
      history.replaceState(null, null, '#/campaigns');
    }
  }

  // Save
  saveBtn?.addEventListener('click', async () => {
    const name = document.getElementById('campaign-name').value;
    const goal = document.getElementById('campaign-goal').value;
    const startDate = document.getElementById('campaign-start').value;
    const endDate = document.getElementById('campaign-end').value;

    if (!name) {
      showToast(t('campaign.fillRequired'), 'error');
      return;
    }

    saveBtn.classList.add('loading');
    try {
      await saveCampaign({
        name,
        brief: goal, // Mapping goal to brief for now
        startDate,
        endDate,
        status: 'active',
        pillars: [],
        angles: []
      });
      showToast(t('toasts.created'), 'success');
      closeModal();
      renderCampaignsPage(); // Re-render
    } catch (error) {
      console.error(error);
      showToast(t('errors.generic'), 'error');
    } finally {
      saveBtn.classList.remove('loading');
    }
  });

  // Delete
  document.querySelectorAll('.btn-delete-campaign').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent card click
      if (!confirm(t('common.confirm'))) return;
      const id = e.currentTarget.dataset.id;
      await deleteCampaign(id);
      renderCampaignsPage();
    });
  });

  // Click campaign card → detail page
  document.querySelectorAll('.campaign-card[data-campaign-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't navigate if clicking a button inside the card
      if (e.target.closest('button')) return;
      const id = card.dataset.campaignId;
      window.location.hash = `#/campaign-detail?id=${id}`;
    });
  });
}
