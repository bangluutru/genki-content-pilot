/**
 * Content Library Page — List, search, filter saved content
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { loadContents, deleteContent, updateContent, loadConnections } from '../services/firestore.js';
import { copyToClipboard, timeAgo, truncate } from '../utils/helpers.js';
import { confirm } from '../components/modal.js';
import { publishToFacebook } from '../services/facebook.js';
import { publishToWordPress } from '../services/wordpress.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';

export async function renderLibraryPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('library', 28)} ${t('library.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('library.subtitle')}
          </p>
        </div>
        <a href="#/create" class="btn btn-primary btn-sm">${icon('sparkle', 16)} ${t('library.createNew')}</a>
      </div>

      <!-- Search & Filter -->
      <div class="flex gap-4 mb-6" style="flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <input type="search" id="search-input" class="input" placeholder="${icon('search', 14)} ${t('library.searchPlaceholder')}">
        </div>
        <select id="filter-status" class="select" style="width: auto; min-width: 150px;">
          <option value="all">${t('common.all')}</option>
          <option value="draft">${t('status.draft')}</option>
          <option value="published">${t('status.published')}</option>
        </select>
        <select id="filter-type" class="select" style="width: auto; min-width: 150px;">
          <option value="all">${t('library.allTypes')}</option>
          <option value="product">${t('library.typeProduct')}</option>
          <option value="promotion">${t('library.typePromotion')}</option>
          <option value="education">${t('library.typeEducation')}</option>
          <option value="news">${t('library.typeNews')}</option>
        </select>
      </div>

      <!-- Content List -->
      <div id="library-list">
        <div class="skeleton" style="height: 100px; margin-bottom: var(--space-3);"></div>
        <div class="skeleton" style="height: 100px; margin-bottom: var(--space-3);"></div>
        <div class="skeleton" style="height: 100px; margin-bottom: var(--space-3);"></div>
      </div>

      <div id="library-empty" class="hidden card-flat text-center" style="padding: var(--space-12);">
        <div style="color: var(--text-muted);">${icon('inbox', 48)}</div>
        <p class="text-muted">${t('library.empty')}</p>
        <a href="#/create" class="btn btn-primary" style="margin-top: var(--space-4);">${icon('sparkle', 16)} ${t('library.createFirst')}</a>
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
    showToast(t('library.loadError'), 'error');
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

  list.innerHTML = contents.map(c => {
    // Build version history timeline events
    const events = [];
    if (c.createdAt) events.push({ action: t('library.versionCreated'), time: c.createdAt, color: 'var(--text-muted)', icon: '📝' });
    if (c.updatedAt && c.updatedAt !== c.createdAt) events.push({ action: t('library.versionEdited'), time: c.updatedAt, color: 'var(--color-info)', icon: '✏️' });
    if (c.approvedAt || c.status === 'approved') events.push({ action: t('library.versionApproved'), time: c.approvedAt || c.updatedAt, color: 'var(--color-warning)', icon: '✅' });
    if (c.publishedAt || c.status === 'published') events.push({ action: t('library.versionPublished'), time: c.publishedAt || c.updatedAt, color: 'var(--color-success)', icon: '🚀' });

    const timelineHtml = events.length > 0 ? `
      <div class="version-history hidden" id="history-${c.id}" style="margin-top: var(--space-3); padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-md); transition: max-height 0.3s ease;">
        <div style="font-size: 12px; font-weight: 600; margin-bottom: var(--space-2); color: var(--text-secondary);">${t('library.versionHistory')}</div>
        ${events.map((ev, i) => `
          <div class="flex items-center gap-2" style="padding: 4px 0; ${i < events.length - 1 ? 'border-left: 2px solid var(--border); margin-left: 8px; padding-left: 14px;' : 'margin-left: 8px; padding-left: 14px;'}">
            <span style="position: relative; left: -22px; width: 12px; height: 12px; border-radius: 50%; background: ${ev.color}; flex-shrink: 0; display: inline-block;"></span>
            <span style="margin-left: -22px; font-size: 11px;">${ev.icon} ${ev.action}</span>
            <span class="text-xs text-muted" style="margin-left: auto;">${ev.time ? timeAgo(ev.time) : ''}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
    <div class="card library-card" style="padding: var(--space-4); margin-bottom: var(--space-3);" data-id="${c.id}">
      <div class="flex justify-between items-center" style="margin-bottom: var(--space-2);">
        <div class="flex items-center gap-2">
          <span class="badge ${c.status === 'published' ? 'badge-success' : 'badge-accent'}">
            ${c.status === 'published' ? icon('check', 12) + ' ' + t('status.published') : icon('edit', 12) + ' ' + t('status.draft')}
          </span>
          <span class="badge badge-warning" style="text-transform: none;">${c.contentType || t('library.post')}</span>
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
        <button class="btn btn-ghost btn-sm copy-fb-btn" data-id="${c.id}">${icon('clipboard', 14)} ${t('library.copyFB')}</button>
        <button class="btn btn-ghost btn-sm copy-blog-btn" data-id="${c.id}">${icon('clipboard', 14)} ${t('library.copyBlog')}</button>
        <button class="btn btn-accent btn-sm publish-btn" data-id="${c.id}">${icon('publish', 14)} ${t('actions.publish')}</button>
        ${events.length > 0 ? `<button class="btn btn-ghost btn-sm btn-history" data-id="${c.id}" style="font-size: 11px;">${icon('templates', 14)} ${t('library.versionHistory')}</button>` : ''}
        <button class="btn btn-ghost btn-sm btn-delete" data-id="${c.id}" style="margin-left: auto; color: var(--danger);">${icon('trash', 14)} ${t('actions.delete')}</button>
      </div>

      ${timelineHtml}

      <div class="publish-result hidden" id="publish-result-${c.id}" style="margin-top: var(--space-3);"></div>
    </div>
  `;
  }).join('');
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
      showToast(t('library.copiedFB'), 'success');
    }

    if (btn.classList.contains('copy-blog-btn') && content) {
      await copyToClipboard(content.blog || '');
      showToast(t('library.copiedBlog'), 'success');
    }

    if (btn.classList.contains('btn-delete') && content) {
      const confirmed = await confirm(t('library.deleteConfirm'));
      if (confirmed) {
        try {
          await deleteContent(id);
          allContents = allContents.filter(c => c.id !== id);
          renderContentList(allContents);
          showToast(t('toasts.deleted'), 'info');
        } catch {
          showToast(t('library.deleteError'), 'error');
        }
      }
    }

    if (btn.classList.contains('publish-btn') && content) {
      await handleQuickPublish(content, btn);
    }

    // Version history toggle
    if (btn.classList.contains('btn-history')) {
      const historyEl = document.getElementById(`history-${id}`);
      if (historyEl) {
        historyEl.classList.toggle('hidden');
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

async function handleQuickPublish(content, btn) {
  const connections = store.get('connections') || await loadConnections() || {};
  const fb = connections.facebook;
  const wp = connections.wordpress;

  if (!fb?.pageId && !wp?.siteUrl) {
    showToast(t('library.noConnections'), 'warning', 4000);
    return;
  }

  const confirmed = await confirm(
    t('library.publishConfirm', { platforms: [fb?.pageId ? 'Facebook' : '', wp?.siteUrl ? 'WordPress' : ''].filter(Boolean).join(' + ') })
  );
  if (!confirmed) return;

  const resultEl = document.getElementById(`publish-result-${content.id}`);
  btn.disabled = true;
  btn.textContent = icon('clock', 14) + ' ' + t('library.publishing');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `<span class="text-muted">${icon('refresh', 14)} ${t('library.processing')}</span>`;
  }

  const results = [];
  const publishedTo = [];

  // Facebook
  if (fb?.pageId) {
    const fbResult = await publishToFacebook(content.facebook || '', fb.pageId, fb.accessToken);
    if (fbResult.success) {
      results.push(`${icon('check', 14)} FB: <a href="${fbResult.postUrl}" target="_blank">${t('library.view')} →</a>`);
      publishedTo.push('facebook');
    } else {
      results.push(`${icon('cross', 14)} FB: ${fbResult.error}`);
    }
  }

  // WordPress
  if (wp?.siteUrl) {
    const wpResult = await publishToWordPress({
      title: content.brief || 'ContentPilot Post',
      content: content.blog || '',
      status: 'publish',
      siteUrl: wp.siteUrl,
      username: wp.username,
      appPassword: wp.appPassword,
    });
    if (wpResult.success) {
      results.push(`${icon('check', 14)} WP: <a href="${wpResult.postUrl}" target="_blank">${t('library.view')} →</a>`);
      publishedTo.push('wordpress');
    } else {
      results.push(`${icon('cross', 14)} WP: ${wpResult.error}`);
    }
  }

  if (resultEl) resultEl.innerHTML = results.join(' · ');

  // Update status
  if (publishedTo.length > 0 && content.id) {
    try {
      await updateContent(content.id, {
        status: 'published',
        publishedTo,
        publishedAt: new Date().toISOString(),
      });
    } catch { /* silent */ }
    showToast(t('library.publishSuccess', { platforms: publishedTo.join(' + ') }), 'success');
  }

  btn.disabled = false;
  btn.textContent = icon('publish', 14) + ' ' + t('actions.publish');
}
