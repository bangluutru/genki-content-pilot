// campaigns.js — Trang quản lý chiến dịch
// Route: #campaigns

import { loadCampaigns, saveCampaign, deleteCampaign, getCampaign } from '../state.js';
import { getContentsByCampaign } from '../services/db/contents.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../router.js';

let allCampaigns = [];

/**
 * Render trang chiến dịch
 * @param {HTMLElement} container
 */
export function renderCampaigns(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>📋 Chiến dịch</h2>
            <p class="text-secondary">Quản lý các chiến dịch marketing</p>
        </div>

        <!-- Create campaign form -->
        <div class="card" id="campaign-form-card">
            <div class="card-title">Tạo chiến dịch mới</div>
            <form id="campaign-form">
                <div class="form-group">
                    <label class="form-label">Tên chiến dịch</label>
                    <input type="text" id="campaign-name" class="form-input"
                        placeholder="Ví dụ: Ra mắt Collagen Premium tháng 3" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Mô tả</label>
                    <textarea id="campaign-desc" class="form-textarea" rows="2"
                        placeholder="Mục tiêu, đối tượng, thông điệp chính..."></textarea>
                </div>
                <div style="display: flex; gap: var(--space-md);">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label">Ngày bắt đầu</label>
                        <input type="date" id="campaign-start" class="form-input">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label">Ngày kết thúc</label>
                        <input type="date" id="campaign-end" class="form-input">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">➕ Tạo chiến dịch</button>
            </form>
        </div>

        <!-- Campaign list -->
        <div id="campaign-list">
            <div class="loading">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>
    `;

    setupCampaignEvents();
    loadCampaignList();
}

function setupCampaignEvents() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById('campaign-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('campaign-name').value.trim();
        if (!name) return;

        try {
            await saveCampaign({
                name,
                description: document.getElementById('campaign-desc').value.trim(),
                startDate: document.getElementById('campaign-start').value || null,
                endDate: document.getElementById('campaign-end').value || null,
                userId: user.uid,
            });
            showToast('Đã tạo chiến dịch! ✅', 'success');

            // Reset form
            document.getElementById('campaign-form').reset();
            loadCampaignList();
        } catch (error) {
            showToast('Lỗi tạo chiến dịch', 'error');
        }
    });
}

async function loadCampaignList() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        allCampaigns = await loadCampaigns(user.uid);
        renderCampaignList(allCampaigns);

        // Event delegation
        document.getElementById('campaign-list').addEventListener('click', async (e) => {
            const viewBtn = e.target.closest('.btn-view-content');
            if (viewBtn) {
                const campaignId = viewBtn.dataset.id;
                navigate(`library?campaignId=${campaignId}`);
                return;
            }
            const detailBtn = e.target.closest('.btn-detail-campaign');
            if (detailBtn) {
                navigate(`campaign?id=${detailBtn.dataset.id}`);
                return;
            }
            const deleteBtn = e.target.closest('.btn-delete-campaign');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (confirm('Xoá chiến dịch này?')) {
                    await deleteCampaign(id);
                    allCampaigns = allCampaigns.filter(c => c.id !== id);
                    renderCampaignList(allCampaigns);
                    showToast('Đã xoá chiến dịch', 'info');
                }
            }
        });
    } catch (error) {
        console.error('Load campaigns error:', error);
    }
}

function renderCampaignList(campaigns) {
    const container = document.getElementById('campaign-list');

    if (campaigns.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: var(--space-2xl);">
                <p class="text-muted">Chưa có chiến dịch nào</p>
                <p class="text-secondary">Tạo chiến dịch đầu tiên ở form bên trên</p>
            </div>
        `;
        return;
    }

    container.innerHTML = campaigns.map(c => {
        const dateRange = formatDateRange(c.startDate, c.endDate);
        const statusBadge = c.status === 'active'
            ? '<span class="badge badge-published">🟢 Đang chạy</span>'
            : '<span class="badge badge-draft">⏸️ Tạm dừng</span>';

        return `
            <div class="card content-card" data-id="${c.id}">
                <div class="content-card-header">
                    <div>
                        <strong>${escapeHtml(c.name)}</strong>
                        ${dateRange ? `<small class="text-muted">${dateRange}</small>` : ''}
                    </div>
                    ${statusBadge}
                </div>
                ${c.description ? `<p class="text-secondary">${escapeHtml(c.description)}</p>` : ''}
                <div class="content-card-footer">
                    <span class="text-muted">${formatCampaignDate(c.createdAt)}</span>
                    <div class="content-card-actions">
                        <button class="btn btn-secondary btn-detail-campaign" data-id="${c.id}">📋 Chi tiết</button>
                        <button class="btn btn-primary btn-view-content" data-id="${c.id}">📚 Xem bài viết</button>
                        <button class="btn btn-danger btn-delete-campaign" data-id="${c.id}">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ─── Helpers ───

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatCampaignDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateRange(start, end) {
    if (!start && !end) return '';
    const parts = [];
    if (start) parts.push(start);
    if (end) parts.push(end);
    return parts.join(' → ');
}
