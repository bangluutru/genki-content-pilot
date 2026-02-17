/**
 * Content Library Page — List, search, filter saved content
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { loadContents, deleteContent } from '../services/firestore.js';
import { copyToClipboard, timeAgo, truncate } from '../utils/helpers.js';
import { confirm } from '../components/modal.js';

export async function renderLibraryPage() {
    const app = document.getElementById('app');

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">📚 Thư viện content</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            Tất cả bài viết đã tạo
          </p>
        </div>
        <a href="#/create" class="btn btn-primary btn-sm">✨ Tạo mới</a>
      </div>

      <!-- Search & Filter -->
      <div class="flex gap-4 mb-6" style="flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <input type="search" id="search-input" class="input" placeholder="🔍 Tìm kiếm bài viết...">
        </div>
        <select id="filter-status" class="select" style="width: auto; min-width: 150px;">
          <option value="all">Tất cả</option>
          <option value="draft">Nháp</option>
          <option value="published">Đã đăng</option>
        </select>
        <select id="filter-type" class="select" style="width: auto; min-width: 150px;">
          <option value="all">Mọi loại</option>
          <option value="product">Sản phẩm</option>
          <option value="promotion">Khuyến mãi</option>
          <option value="education">Kiến thức</option>
          <option value="news">Tin tức</option>
        </select>
      </div>

      <!-- Content List -->
      <div id="library-list">
        <div class="skeleton" style="height: 100px; margin-bottom: var(--space-3);"></div>
        <div class="skeleton" style="height: 100px; margin-bottom: var(--space-3);"></div>
        <div class="skeleton" style="height: 100px; margin-bottom: var(--space-3);"></div>
      </div>

      <div id="library-empty" class="hidden card-flat text-center" style="padding: var(--space-12);">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">📭</div>
        <p class="text-muted">Chưa có bài viết nào</p>
        <a href="#/create" class="btn btn-primary" style="margin-top: var(--space-4);">✨ Tạo bài đầu tiên</a>
      </div>
    </main>
  `;

    attachSidebarEvents();

    // Load content
    try {
        const contents = await loadContents(100);
        renderContentList(contents);
        attachLibraryEvents(contents);
    } catch (error) {
        console.error('Library load error:', error);
        showToast('Lỗi tải thư viện', 'error');
        renderContentList([]);
    }
}

function renderContentList(contents) {
    const list = document.getElementById('library-list');
    const empty = document.getElementById('library-empty');

    if (!list) return;

    if (!contents || contents.length === 0) {
        list.classList.add('hidden');
        empty?.classList.remove('hidden');
        return;
    }

    empty?.classList.add('hidden');
    list.classList.remove('hidden');

    list.innerHTML = contents.map(c => `
    <div class="card library-card" style="padding: var(--space-4); margin-bottom: var(--space-3);" data-id="${c.id}">
      <div class="flex justify-between items-center" style="margin-bottom: var(--space-2);">
        <div class="flex items-center gap-2">
          <span class="badge ${c.status === 'published' ? 'badge-success' : 'badge-accent'}">
            ${c.status === 'published' ? '✅ Đã đăng' : '📝 Nháp'}
          </span>
          <span class="badge badge-warning" style="text-transform: none;">${c.contentType || 'Bài viết'}</span>
        </div>
        <span class="text-sm text-muted">${timeAgo(c.createdAt)}</span>
      </div>

      <p style="font-weight: 500; margin-bottom: var(--space-2);">
        ${truncate(c.brief || c.facebook?.split('\n')[0] || 'Untitled', 120)}
      </p>

      <p class="text-sm text-muted" style="margin-bottom: var(--space-3);">
        ${truncate(c.facebook || '', 150)}
      </p>

      <div class="flex gap-2" style="flex-wrap: wrap;">
        <button class="btn btn-ghost btn-sm copy-fb-btn" data-id="${c.id}">📋 Copy FB</button>
        <button class="btn btn-ghost btn-sm copy-blog-btn" data-id="${c.id}">📋 Copy Blog</button>
        <button class="btn btn-ghost btn-sm btn-delete" data-id="${c.id}" style="margin-left: auto; color: var(--danger);">🗑️ Xoá</button>
      </div>
    </div>
  `).join('');
}

function attachLibraryEvents(allContents) {
    // Search
    document.getElementById('search-input')?.addEventListener('input', (e) => {
        filterAndRender(allContents);
    });

    // Filters
    document.getElementById('filter-status')?.addEventListener('change', () => filterAndRender(allContents));
    document.getElementById('filter-type')?.addEventListener('change', () => filterAndRender(allContents));

    // Copy & Delete (event delegation)
    document.getElementById('library-list')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        const content = allContents.find(c => c.id === id);

        if (btn.classList.contains('copy-fb-btn') && content) {
            await copyToClipboard(content.facebook || '');
            showToast('Đã copy Facebook post! 📋', 'success');
        }

        if (btn.classList.contains('copy-blog-btn') && content) {
            await copyToClipboard(content.blog || '');
            showToast('Đã copy Blog article! 📋', 'success');
        }

        if (btn.classList.contains('btn-delete') && content) {
            const confirmed = await confirm('Bạn có chắc muốn xoá bài viết này?');
            if (confirmed) {
                try {
                    await deleteContent(id);
                    allContents = allContents.filter(c => c.id !== id);
                    renderContentList(allContents);
                    showToast('Đã xoá', 'info');
                } catch {
                    showToast('Lỗi xoá bài', 'error');
                }
            }
        }
    });
}

function filterAndRender(allContents) {
    const search = document.getElementById('search-input')?.value?.toLowerCase() || '';
    const status = document.getElementById('filter-status')?.value || 'all';
    const type = document.getElementById('filter-type')?.value || 'all';

    let filtered = allContents;

    if (search) {
        filtered = filtered.filter(c =>
            (c.brief || '').toLowerCase().includes(search) ||
            (c.facebook || '').toLowerCase().includes(search) ||
            (c.blog || '').toLowerCase().includes(search)
        );
    }

    if (status !== 'all') {
        filtered = filtered.filter(c => c.status === status);
    }

    if (type !== 'all') {
        filtered = filtered.filter(c => c.contentType === type);
    }

    renderContentList(filtered);
}
