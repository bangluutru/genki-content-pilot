// library.js — Thư viện content: danh sách, tìm kiếm, lọc
// Route: #library — hỗ trợ ?campaignId=... để lọc theo chiến dịch

import { getContents, deleteContent, getContentsByCampaign } from '../state.js';
import { getCampaign } from '../services/db/campaigns.js';
import { getCurrentUser } from '../auth.js';
import { renderContentCard } from '../components/content-card.js';
import { showToast } from '../components/toast.js';
import { getParam } from '../router.js';

let allContents = [];
let activeCampaignId = null;
let activeCampaignName = '';

/**
 * Render trang thư viện content
 * @param {HTMLElement} container - Element #app
 */
export function renderLibrary(container) {
    // Read campaignId from URL params
    activeCampaignId = getParam('campaignId', '') || null;

    container.innerHTML = `
        <div class="page-header">
            <h2>📚 Thư viện Content</h2>
            <p class="text-secondary">Tất cả bài viết đã tạo</p>
        </div>

        <!-- Campaign filter badge -->
        <div id="campaign-filter-badge" class="hidden" style="margin-bottom: var(--space-md);">
            <span class="badge badge-published" style="font-size: 14px; padding: 6px 12px;">
                📋 Chiến dịch: <strong id="campaign-filter-name"></strong>
                <button id="btn-clear-filter" style="background:none;border:none;cursor:pointer;margin-left:8px;font-size:16px;">✕</button>
            </span>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
            <input type="text" id="search-input" class="form-input"
                placeholder="🔍 Tìm kiếm bài viết..." style="max-width: 400px;">
            <select id="filter-status" class="form-select" style="width: auto; min-width: 140px;">
                <option value="all">Tất cả</option>
                <option value="draft">📝 Nháp</option>
                <option value="pending_approval">⏳ Chờ duyệt</option>
                <option value="approved">✅ Đã duyệt</option>
                <option value="rejected">❌ Từ chối</option>
                <option value="published">🚀 Đã đăng</option>
            </select>
        </div>

        <!-- Content list -->
        <div id="content-list">
            <div class="loading">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>
    `;

    // Load contents
    loadLibrary();

    // Search + filter events
    document.getElementById('search-input').addEventListener('input', filterContents);
    document.getElementById('filter-status').addEventListener('change', filterContents);
}

async function loadLibrary() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Load by campaign or all
        if (activeCampaignId) {
            allContents = await getContentsByCampaign(activeCampaignId);
            // Show campaign filter badge
            const campaign = await getCampaign(activeCampaignId);
            activeCampaignName = campaign?.name || activeCampaignId;
            const badge = document.getElementById('campaign-filter-badge');
            badge.classList.remove('hidden');
            document.getElementById('campaign-filter-name').textContent = activeCampaignName;

            // Clear filter button
            document.getElementById('btn-clear-filter').addEventListener('click', () => {
                window.location.hash = '#library';
            });
        } else {
            allContents = await getContents(user.uid);
        }

        renderList(allContents);

        // Event delegation cho delete buttons
        document.getElementById('content-list').addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (confirm('Xoá bài viết này?')) {
                    await deleteContent(id);
                    allContents = allContents.filter(c => c.id !== id);
                    renderList(allContents);
                    showToast('Đã xoá bài viết', 'info');
                }
            }
        });
    } catch (error) {
        console.error('Library load error:', error);
    }
}

function filterContents() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const status = document.getElementById('filter-status').value;

    let filtered = allContents;

    if (status !== 'all') {
        filtered = filtered.filter(c => c.status === status);
    }

    if (search) {
        filtered = filtered.filter(c =>
            (c.brief || '').toLowerCase().includes(search) ||
            (c.facebookPost || '').toLowerCase().includes(search)
        );
    }

    renderList(filtered);
}

function renderList(contents) {
    const container = document.getElementById('content-list');

    if (contents.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: var(--space-2xl);">
                <p class="text-muted">Không tìm thấy bài viết nào</p>
                <a href="#create" class="btn btn-primary" style="margin-top: var(--space-md);">✨ Tạo bài mới</a>
            </div>
        `;
    } else {
        container.innerHTML = contents.map(c => renderContentCard(c)).join('');
    }
}
