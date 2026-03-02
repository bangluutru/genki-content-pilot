/**
 * Content Recycling Handler — AI-powered evergreen content suggestions
 */
import { showToast } from '../../components/toast.js';
import { t } from '../../utils/i18n.js';
import { icon } from '../../utils/icons.js';

/**
 * Analyze content library and render recycling suggestions
 * @param {Array} contents - All content items from library
 * @param {HTMLElement} container - Container to render into
 */
export async function renderRecyclingWidget(contents, container) {
    if (!container || !contents?.length) return;

    // Find evergreen candidates: older than 14 days, status published or draft
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    const candidates = contents
        .filter(c => (now - new Date(c.createdAt).getTime()) > fourteenDays)
        .filter(c => {
            const text = (c.facebook || c.brief || '').toLowerCase();
            // Evergreen signals: FAQ, hướng dẫn, review, testimonial, giới thiệu
            return /faq|hướng dẫn|review|testimonial|giới thiệu|cách dùng|công dụng|so sánh/.test(text);
        })
        .slice(0, 5);

    if (candidates.length === 0) {
        container.innerHTML = '';
        return;
    }

    const daysAgo = (dateStr) => Math.floor((now - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));

    container.innerHTML = `
    <div class="card" style="margin-bottom: var(--space-4); border-left: 3px solid var(--color-success);">
      <h4 style="margin-bottom: var(--space-3); display: flex; align-items: center; gap: 8px;">
        ${icon('refresh', 18)} ${t('library.recycleTitle')}
      </h4>
      <p class="text-sm text-muted" style="margin-bottom: var(--space-3);">
        AI phát hiện ${candidates.length} bài có tiềm năng tái sử dụng:
      </p>
      <div class="grid gap-2">
        ${candidates.map(c => `
          <div class="card-flat flex items-center gap-3" style="padding: var(--space-3);">
            <div style="flex: 1; min-width: 0;">
              <div class="text-sm font-medium truncate">${c.brief || c.product || 'Bài viết'}</div>
              <div class="text-xs text-muted">${daysAgo(c.createdAt)} ngày trước · ${c.status || 'draft'}</div>
            </div>
            <a href="#/create?recycle=${c.id}" class="btn btn-ghost btn-xs" title="${t('library.recycleNow')}">
              ${icon('refresh', 14)} ${t('library.recycleNow')}
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
