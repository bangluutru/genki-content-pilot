/**
 * Dashboard Page — Recent content + quick actions
 */
import { store } from '../utils/state.js';
import { router } from '../utils/router.js';
import { loadContents } from '../services/firestore.js';
import { loadBrand } from '../services/firestore.js';
import { timeAgo, truncate } from '../utils/helpers.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { checkDailyLimit } from '../services/gemini.js';

export async function renderDashboard() {
    const app = document.getElementById('app');
    const user = store.get('user');
    const usage = checkDailyLimit();

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="dashboard-header flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">
            Xin chào, ${user?.displayName?.split(' ')[0] || 'bạn'} 👋
          </h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            Hôm nay bạn muốn tạo content gì?
          </p>
        </div>
        <div class="badge ${usage.remaining < 5 ? 'badge-warning' : 'badge-accent'}">
          ${usage.remaining}/${usage.limit} bài còn lại
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-8);">
        <a href="#/create" class="action-card card" style="text-align: center; cursor: pointer; text-decoration: none;">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">✨</div>
          <strong>Tạo bài mới</strong>
          <p class="text-sm text-muted" style="margin-top: var(--space-1);">AI viết content trong 30 giây</p>
        </a>
        <a href="#/brand" class="action-card card" style="text-align: center; cursor: pointer; text-decoration: none;">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">🎨</div>
          <strong>Brand Profile</strong>
          <p class="text-sm text-muted" style="margin-top: var(--space-1);">Cập nhật thông tin thương hiệu</p>
        </a>
        <a href="#/library" class="action-card card" style="text-align: center; cursor: pointer; text-decoration: none;">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">📚</div>
          <strong>Thư viện</strong>
          <p class="text-sm text-muted" style="margin-top: var(--space-1);">Xem tất cả bài đã tạo</p>
        </a>
      </div>

      <!-- Recent Content -->
      <div class="recent-section">
        <h3 style="margin-bottom: var(--space-4);">📄 Bài viết gần đây</h3>
        <div id="recent-content-list">
          <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
          <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
        </div>
      </div>

      <!-- Network Status -->
      <div id="network-status" class="hidden" style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 500;">
        <div class="badge badge-danger" style="padding: var(--space-2) var(--space-4); font-size: var(--font-sm);">
          ⚠️ Mất kết nối mạng
        </div>
      </div>
    </main>
  `;

    attachSidebarEvents();

    // Load data
    try {
        await loadBrand();
        const contents = await loadContents(10);
        renderRecentContent(contents);
    } catch (error) {
        console.error('Dashboard load error:', error);
        renderRecentContent([]);
    }

    // Network status listener
    const unsub = store.on('isOnline', (isOnline) => {
        const el = document.getElementById('network-status');
        if (el) el.classList.toggle('hidden', isOnline);
    });

    // Check brand setup
    if (!store.get('brand')) {
        setTimeout(() => {
            showToast('Hãy setup Brand Profile để AI viết chuẩn tone hơn!', 'info', 5000);
        }, 1000);
    }
}

function renderRecentContent(contents) {
    const list = document.getElementById('recent-content-list');
    if (!list) return;

    if (!contents || contents.length === 0) {
        list.innerHTML = `
      <div class="card-flat text-center" style="padding: var(--space-10);">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">📝</div>
        <p style="color: var(--text-secondary);">Chưa có bài viết nào</p>
        <a href="#/create" class="btn btn-primary" style="margin-top: var(--space-4);">
          ✨ Tạo bài đầu tiên
        </a>
      </div>
    `;
        return;
    }

    list.innerHTML = contents.map(content => `
    <div class="card content-card" style="padding: var(--space-4); margin-bottom: var(--space-3); cursor: pointer;" data-id="${content.id}">
      <div class="flex justify-between items-center">
        <div style="flex: 1; min-width: 0;">
          <div class="flex items-center gap-2">
            <span class="badge ${content.status === 'published' ? 'badge-success' : 'badge-accent'}">${content.status === 'published' ? 'Đã đăng' : 'Nháp'}</span>
            <span class="text-sm text-muted">${content.contentType || 'Bài viết'}</span>
          </div>
          <p style="margin-top: var(--space-2); font-weight: 500;">${truncate(content.brief || content.facebook || 'Untitled', 80)}</p>
        </div>
        <span class="text-sm text-muted" style="white-space: nowrap; margin-left: var(--space-4);">${timeAgo(content.createdAt)}</span>
      </div>
    </div>
  `).join('');
}
