/**
 * Campaigns Page — Campaign management, goals tracking
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveCampaign, loadCampaigns } from '../services/firestore.js';

export async function renderCampaignsPage() {
    const app = document.getElementById('app');
    const campaigns = store.get('campaigns') || await loadCampaigns() || [];

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">📂 Campaign Management</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            Quản lý chiến dịch marketing, theo dõi KPI và ROI
          </p>
        </div>
        <button class="btn btn-primary" id="btn-new-campaign">+ Tạo Campaign</button>
      </div>

      ${campaigns.length === 0 ? `
        <div class="empty-state card" style="text-align: center; padding: var(--space-8);">
          <p style="font-size: 3rem; margin-bottom: var(--space-4);">📂</p>
          <h3>Chưa có campaign nào</h3>
          <p class="text-muted" style="margin-top: var(--space-2);">
            Tạo campaign để nhóm content theo chủ đề, theo dõi hiệu quả tổng thể
          </p>
          <button class="btn btn-primary" style="margin-top: var(--space-4);" id="btn-create-first">
            Tạo Campaign đầu tiên
          </button>
        </div>
      ` : `
        <div class="campaigns-grid" style="displaygrid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4);">
          ${campaigns.map(c => renderCampaignCard(c)).join('')}
        </div>
      `}
    </main>

    <!-- Create Campaign Modal -->
    <div class="modal-overlay hidden" id="campaign-modal">
      <div class="card" style="width: 600px; max-width: 90vw;">
        <h3 style="margin-bottom: var(--space-4);">Tạo Campaign mới</h3>
        <div class="form-group">
          <label>Tên campaign</label>
          <input type="text" id="campaign-name" class="form-input" placeholder="VD: Tết 2026 - Tăng đề kháng">
        </div>
        <div class="form-group">
          <label>Mục tiêu</label>
          <select id="campaign-goal-type" class="select">
            <option value="orders">Số đơn hàng</option>
            <option value="revenue">Doanh thu</option>
            <option value="engagement">Engagement</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chỉ tiêu (số)</label>
          <input type="number" id="campaign-goal-value" class="form-input" placeholder="VD: 500">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <div class="form-group">
            <label>Ngày bắt đầu</label>
            <input type="date" id="campaign-start" class="form-input">
          </div>
          <div class="form-group">
            <label>Ngày kết thúc</label>
            <input type="date" id="campaign-end" class="form-input">
          </div>
        </div>
        <div class="flex gap-2" style="margin-top: var(--space-6);">
          <button class="btn btn-primary" id="btn-save-campaign">Tạo Campaign</button>
          <button class="btn btn-ghost" id="btn-cancel-campaign">Huỷ</button>
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
        <p><strong>Mục tiêu:</strong> ${campaign.currentValue || 0} / ${campaign.goalValue} ${campaign.goalType}</p>
        <p><strong>Thời gian:</strong> ${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()}</p>
      </div>
      <a href="#/library?campaign=${campaign.id}" class="btn btn-outline btn-sm" style="width: 100%;">
        Xem content (${campaign.contentCount || 0})
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
            showToast('Vui lòng điền đầy đủ thông tin', 'warning');
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

            showToast('Đã tạo campaign thành công!', 'success');
            modal?.classList.add('hidden');
            await renderCampaignsPage();
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error');
        }
    });
}
