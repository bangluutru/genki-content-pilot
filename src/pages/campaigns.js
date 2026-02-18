/**
 * Campaigns Page — Campaign management, goals tracking
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveCampaign, loadCampaigns } from '../services/firestore.js';
import { t } from '../utils/i18n.js';

export async function renderCampaignsPage() {
  const app = document.getElementById('app');
  const campaigns = store.get('campaigns') || await loadCampaigns() || [];

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">📂 ${t('campaign.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('campaign.subtitle')}
          </p>
        </div>
        <button class="btn btn-primary" id="btn-new-campaign">+ ${t('campaign.create')}</button>
      </div>

      ${campaigns.length === 0 ? `
        <div class="empty-state card" style="text-align: center; padding: var(--space-8);">
          <p style="font-size: 3rem; margin-bottom: var(--space-4);">📂</p>
          <h3>${t('campaign.noCampaigns')}</h3>
          <p class="text-muted" style="margin-top: var(--space-2);">
            ${t('campaign.noCampaignsDesc')}
          </p>
          <button class="btn btn-primary" style="margin-top: var(--space-4);" id="btn-create-first">
            ${t('campaign.createFirst')}
          </button>
        </div>
      ` : `
        <div class="campaigns-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4);">
          ${campaigns.map(c => renderCampaignCard(c)).join('')}
        </div>
      `}
    </main>

    <!-- Create Campaign Modal -->
    <div class="modal-overlay hidden" id="campaign-modal">
      <div class="card" style="width: 600px; max-width: 90vw;">
        <h3 style="margin-bottom: var(--space-4);">${t('campaign.createModal')}</h3>
        <div class="form-group">
          <label>${t('campaign.name')}</label>
          <input type="text" id="campaign-name" class="form-input" placeholder="${t('campaign.namePlaceholder')}">
        </div>
        <div class="form-group">
          <label>${t('campaign.goal')}</label>
          <select id="campaign-goal-type" class="select">
            <option value="orders">${t('campaign.goalOrders')}</option>
            <option value="revenue">${t('campaign.goalRevenue')}</option>
            <option value="engagement">${t('campaign.goalEngagement')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${t('campaign.goalValue')}</label>
          <input type="number" id="campaign-goal-value" class="form-input" placeholder="${t('campaign.goalValuePlaceholder')}">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <div class="form-group">
            <label>${t('campaign.startDate')}</label>
            <input type="date" id="campaign-start" class="form-input">
          </div>
          <div class="form-group">
            <label>${t('campaign.endDate')}</label>
            <input type="date" id="campaign-end" class="form-input">
          </div>
        </div>
        <div class="flex gap-2" style="margin-top: var(--space-6);">
          <button class="btn btn-primary" id="btn-save-campaign">${t('campaign.create')}</button>
          <button class="btn btn-ghost" id="btn-cancel-campaign">${t('actions.cancel')}</button>
        </div>
      </div>
    </div>
  `;

  attachSidebarEvents();
  attachCampaignEvents();
}

function renderCampaignCard(campaign) {
  const progress = campaign.goalValue > 0
    ? Math.min(100, (campaign.currentValue || 0) / campaign.goalValue * 100)
    : 0;

  const statusClass = progress >= 100 ? 'success' : progress >= 50 ? 'warning' : 'info';

  return `
    <div class="card" style="padding: var(--space-4);">
      <div class="flex justify-between items-start mb-4">
        <h4 style="margin: 0;">${campaign.name}</h4>
        <span class="badge badge-${statusClass}">${progress.toFixed(0)}%</span>
      </div>
      <div class="progress-bar" style="margin-bottom: var(--space-4);">
        <div class="progress-fill" style="width: ${progress}%; background: var(--accent);"></div>
      </div>
      <div style="font-size: var(--font-sm); color: var(--text-muted); margin-bottom: var(--space-3);">
        <p><strong>${t('campaign.goal')}:</strong> ${campaign.currentValue || 0} / ${campaign.goalValue} ${campaign.goalType}</p>
        <p><strong>${t('campaign.timeRange')}:</strong> ${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}</p>
      </div>
      <a href="#/library?campaign=${campaign.id}" class="btn btn-outline btn-sm" style="width: 100%;">
        ${t('campaign.viewContent')} (${campaign.contentCount || 0})
      </a>
    </div>
  `;
}

function attachCampaignEvents() {
  const modal = document.getElementById('campaign-modal');

  document.getElementById('btn-new-campaign')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
  });

  document.getElementById('btn-create-first')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
  });

  document.getElementById('btn-cancel-campaign')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  document.getElementById('btn-save-campaign')?.addEventListener('click', async () => {
    const name = document.getElementById('campaign-name')?.value.trim();
    const goalType = document.getElementById('campaign-goal-type')?.value;
    const goalValue = parseInt(document.getElementById('campaign-goal-value')?.value) || 0;
    const startDate = document.getElementById('campaign-start')?.value;
    const endDate = document.getElementById('campaign-end')?.value;

    if (!name || !startDate || !endDate) {
      showToast(t('campaign.fillRequired'), 'warning');
      return;
    }

    try {
      await saveCampaign({
        name,
        goalType,
        goalValue,
        startDate,
        endDate,
        currentValue: 0,
        contentCount: 0,
      });

      showToast(t('toasts.created'), 'success');
      modal?.classList.add('hidden');
      await renderCampaignsPage();
    } catch (err) {
      showToast(t('common.error') + ': ' + err.message, 'error');
    }
  });
}
