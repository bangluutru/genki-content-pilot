/**
 * Dashboard Page — Analytics hub with stats, charts, and activity
 */
import { store } from '../utils/state.js';
import { router } from '../utils/router.js';
import { loadContents, loadContentStats, loadConnections } from '../services/firestore.js';
import { loadBrand } from '../services/firestore.js';
import { timeAgo, truncate } from '../utils/helpers.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { checkDailyLimit } from '../services/gemini.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';

const TYPE_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

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
            ${t('dashboard.greeting', { name: user?.displayName?.split(' ')[0] || t('dashboard.you') })}
          </h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('dashboard.subtitle')}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-outline btn-sm" id="btn-open-report">
            ${icon('mail', 14)} ${t('dashboard.sendReport')}
          </button>
          <div class="badge ${usage.remaining < 5 ? 'badge-warning' : 'badge-accent'}">
            ${t('dashboard.remainingToday', { remaining: usage.remaining, limit: usage.limit })}
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" id="stats-grid">
        ${renderStatCard(icon('create', 24), t('dashboard.totalPosts'), '—', 'stat-total', 'var(--accent)')}
        ${renderStatCard(icon('publish', 24), t('dashboard.published'), '—', 'stat-published', '#10b981')}
        ${renderStatCard(icon('library', 24), t('dashboard.drafts'), '—', 'stat-drafts', '#f59e0b')}
        ${renderStatCard(icon('sparkle', 24), t('dashboard.today'), '—', 'stat-today', '#8b5cf6')}
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="card chart-card">
          <h3 class="chart-title">${icon('chart', 20)} ${t('dashboard.last7Days')}</h3>
          <div class="bar-chart" id="bar-chart">
            <div class="chart-skeleton">${t('common.loading')}</div>
          </div>
        </div>
        <div class="card chart-card">
          <h3 class="chart-title">${icon('campaigns', 18)} ${t('dashboard.contentTypes')}</h3>
          <div class="donut-chart-wrap" id="donut-chart">
            <div class="chart-skeleton">${t('common.loading')}</div>
          </div>
        </div>
      </div>

      <!-- Heatmap + Quick Actions -->
      <div class="charts-row">
        <div class="card chart-card">
          <h3 class="chart-title">${icon('fire', 18)} ${t('dashboard.last4Weeks')}</h3>
          <div class="heatmap-wrap" id="heatmap">
            <div class="chart-skeleton">${t('common.loading')}</div>
          </div>
        </div>
        <div class="card chart-card">
          <h3 class="chart-title">${icon('bolt', 18)} ${t('dashboard.quickActions')}</h3>
          <div class="quick-actions-compact">
            <a href="#/create" class="quick-action-item">
              <span class="qa-icon">${icon('sparkle', 20)}</span>
              <span>${t('dashboard.createNew')}</span>
            </a>
            <a href="#/library" class="quick-action-item">
              <span class="qa-icon">${icon('library', 20)}</span>
              <span>${t('dashboard.library')}</span>
            </a>
            <a href="#/brand" class="quick-action-item">
              <span class="qa-icon">${icon('brand', 20)}</span>
              <span>Brand Profile</span>
            </a>
            <a href="#/settings" class="quick-action-item">
              <span class="qa-icon">${icon('settings', 20)}</span>
              <span>${t('dashboard.connectAPI')}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Recent Content -->
      <div class="recent-section" style="margin-top: var(--space-6);">
        <h3 style="margin-bottom: var(--space-4);">${icon('document', 20)} ${t('dashboard.recentPosts')}</h3>
        <div id="recent-content-list">
          <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
          <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
        </div>
      </div>

      <!-- Report Modal -->
      <div id="report-modal" class="modal-overlay hidden">
        <div class="modal-content" style="max-width: 600px; width: 90%;">
          <div class="modal-header">
            <h3>${icon('mail', 20)} ${t('dashboard.reportModalTitle')}</h3>
            <button class="btn btn-ghost btn-icon close-modal">${icon('cross', 16)}</button>
          </div>
          <div class="modal-body" id="report-modal-body" style="max-height: 60vh; overflow-y: auto;">
            <div class="text-center p-4"><span class="loading-spinner"></span></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost close-modal">${t('common.cancel') || 'Huỷ'}</button>
            <button class="btn btn-primary" id="btn-send-report" disabled>${icon('send', 16)} ${t('dashboard.reportSend')}</button>
          </div>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();
  attachDashboardEvents();

  // Load data
  try {
    await loadBrand();
    const contents = await loadContents(200);
    renderRecentContent(contents.slice(0, 10));

    // Load analytics
    const stats = await loadContentStats();
    animateStats(stats);
    renderBarChart(stats.dailyData);
    renderDonutChart(stats.typeData);
    renderHeatmap(stats.heatmap);
  } catch (error) {
    console.error('Dashboard load error:', error);
    renderRecentContent([]);
    // Show zero-state stats
    animateStats({ total: 0, published: 0, drafts: 0, todayCount: 0 });
    renderBarChart([]);
    renderDonutChart([]);
    renderHeatmap([]);
  }

  // Check brand setup
  if (!store.get('brand')) {
    setTimeout(() => {
      showToast(t('dashboard.brandSetupTip'), 'info', 5000);
    }, 1000);
  }
}

function renderStatCard(icon, label, value, id, color) {
  return `
    <div class="stat-card" style="--stat-color: ${color};">
      <div class="stat-icon">${icon}</div>
      <div class="stat-value" id="${id}">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

/** Animate stat numbers counting up */
function animateStats({ total, published, drafts, todayCount }) {
  const animate = (id, target) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (target === 0) { el.textContent = '0'; return; }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 40);
  };
  animate('stat-total', total);
  animate('stat-published', published);
  animate('stat-drafts', drafts);
  animate('stat-today', todayCount);
}

/** Render 7-day bar chart (pure CSS) */
function renderBarChart(dailyData) {
  const el = document.getElementById('bar-chart');
  if (!el) return;

  if (!dailyData.length) {
    el.innerHTML = `<div class="chart-empty">${t('dashboard.noData')}</div>`;
    return;
  }

  const max = Math.max(...dailyData.map(d => d.count), 1);

  el.innerHTML = `
    <div class="bar-chart-inner">
      ${dailyData.map((d, i) => `
        <div class="bar-col">
          <div class="bar-value">${d.count}</div>
          <div class="bar-fill" style="height: 0%; --target-height: ${(d.count / max) * 100}%; animation-delay: ${i * 80}ms;"></div>
          <div class="bar-label">${d.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/** Render donut chart (SVG) */
function renderDonutChart(typeData) {
  const el = document.getElementById('donut-chart');
  if (!el) return;

  if (!typeData.length) {
    el.innerHTML = `<div class="chart-empty">${t('dashboard.noData')}</div>`;
    return;
  }

  const total = typeData.reduce((s, t) => s + t.count, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = typeData.slice(0, 6).map((t, i) => {
    const pct = t.count / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const segment = `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="${TYPE_COLORS[i % TYPE_COLORS.length]}" stroke-width="20" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" class="donut-segment" style="animation-delay: ${i * 100}ms;"/>`;
    offset += dash;
    return segment;
  });

  const legend = typeData.slice(0, 6).map((t, i) => `
    <div class="legend-item">
      <span class="legend-dot" style="background: ${TYPE_COLORS[i % TYPE_COLORS.length]};"></span>
      <span class="legend-name">${t.name}</span>
      <span class="legend-count">${t.count} (${t.pct}%)</span>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="donut-chart-layout">
      <svg viewBox="0 0 160 160" class="donut-svg">
        ${segments.join('')}
        <text x="80" y="76" text-anchor="middle" fill="var(--text-primary)" font-size="20" font-weight="700">${total}</text>
        <text x="80" y="94" text-anchor="middle" fill="var(--text-secondary)" font-size="10">${t('dashboard.posts')}</text>
      </svg>
      <div class="legend-list">${legend}</div>
    </div>
  `;
}

/** Render activity heatmap */
function renderHeatmap(heatmap) {
  const el = document.getElementById('heatmap');
  if (!el) return;

  if (!heatmap.length) {
    el.innerHTML = `<div class="chart-empty">${t('dashboard.noData')}</div>`;
    return;
  }

  const max = Math.max(...heatmap.map(d => d.count), 1);

  const cells = heatmap.map(d => {
    const level = d.count === 0 ? 0 : Math.min(4, Math.ceil((d.count / max) * 4));
    const day = new Date(d.date).getDate();
    return `<div class="heatmap-cell level-${level}" title="${d.date}: ${d.count} ${t('dashboard.posts')}"><span>${day}</span></div>`;
  }).join('');

  el.innerHTML = `
    <div class="heatmap-grid">${cells}</div>
    <div class="heatmap-legend">
      <span class="text-muted text-xs">${t('dashboard.less')}</span>
      <div class="heatmap-cell level-0 mini"></div>
      <div class="heatmap-cell level-1 mini"></div>
      <div class="heatmap-cell level-2 mini"></div>
      <div class="heatmap-cell level-3 mini"></div>
      <div class="heatmap-cell level-4 mini"></div>
      <span class="text-muted text-xs">${t('dashboard.more')}</span>
    </div>
  `;
}

function renderRecentContent(contents) {
  const list = document.getElementById('recent-content-list');
  if (!list) return;

  if (!contents || contents.length === 0) {
    list.innerHTML = `
      <div class="card-flat text-center" style="padding: var(--space-10);">
        <div style="color: var(--text-muted);">${icon('edit', 48)}</div>
        <p style="color: var(--text-secondary);">${t('dashboard.noPosts')}</p>
        <a href="#/create" class="btn btn-primary" style="margin-top: var(--space-4);">
          ${icon('sparkle', 16)} ${t('dashboard.createFirstPost')}
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
            <span class="badge ${content.status === 'published' ? 'badge-success' : 'badge-accent'}">${content.status === 'published' ? t('status.published') : t('status.draft')}</span>
            <span class="text-sm text-muted">${content.contentType || t('dashboard.post')}</span>
          </div>
          <p style="margin-top: var(--space-2); font-weight: 500;">${truncate(content.brief || content.facebook || 'Untitled', 80)}</p>
        </div>
        <span class="text-sm text-muted" style="white-space: nowrap; margin-left: var(--space-4);">${timeAgo(content.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

// --- Weekly Report Logic ---
let recentWeekContents = [];
let ceoEmailConfig = '';

function attachDashboardEvents() {
  const modal = document.getElementById('report-modal');
  const btnOpen = document.getElementById('btn-open-report');
  const btnSend = document.getElementById('btn-send-report');

  document.querySelectorAll('#report-modal .close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  });

  btnOpen?.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    const body = document.getElementById('report-modal-body');
    body.innerHTML = `<div class="text-center p-4"><span class="loading-spinner"></span></div>`;
    btnSend.disabled = true;

    try {
      const connections = store.get('connections') || await loadConnections() || {};
      ceoEmailConfig = connections.ceoEmail || '';

      if (!ceoEmailConfig) {
        body.innerHTML = `
          <div class="card-flat text-center" style="padding: var(--space-6);">
            <div style="margin-bottom: var(--space-3); color: var(--color-warning);">${icon('warning', 32)}</div>
            <p>${t('dashboard.reportNoEmail')}</p>
            <a href="#/settings" class="btn btn-primary mt-4 close-modal">Cài đặt Email CEO</a>
          </div>
        `;
        return;
      }

      // Fetch last 7 days contents
      const allContents = await loadContents(100);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      recentWeekContents = allContents.filter(c => new Date(c.createdAt) >= sevenDaysAgo);
      const publishedCount = recentWeekContents.filter(c => c.status === 'published').length;

      body.innerHTML = `
        <div style="margin-bottom: var(--space-4);">
          <label class="form-label">Email người nhận:</label>
          <div class="p-2 bg-tertiary rounded text-sm mb-4"><strong>${ceoEmailConfig}</strong></div>

          <label class="form-label">${t('dashboard.reportStats')}</label>
          <div class="flex gap-4 mb-4">
             <div class="stat-card" style="--stat-color: var(--accent); padding: var(--space-3); flex: 1;">
               <div style="font-size: 24px; font-weight: 700;">${recentWeekContents.length}</div>
               <div class="text-xs text-muted">${t('dashboard.reportCountPosts')}</div>
             </div>
             <div class="stat-card" style="--stat-color: var(--color-success); padding: var(--space-3); flex: 1;">
               <div style="font-size: 24px; font-weight: 700;">${publishedCount}</div>
               <div class="text-xs text-muted">${t('dashboard.reportCountPubs')}</div>
             </div>
          </div>

          <label class="form-label">${t('dashboard.reportNotes')}</label>
          <textarea id="report-notes" class="form-input" rows="3" placeholder="${t('dashboard.reportNotesPlaceholder')}"></textarea>
          
          <div style="margin-top: var(--space-4);">
            <label class="form-label">Danh sách công việc (${recentWeekContents.length})</label>
            <div class="grid gap-2" style="max-height: 200px; overflow-y: auto; padding-right: 8px;">
              ${recentWeekContents.length === 0 ? '<p class="text-muted text-sm">Không có nội dung nào trong 7 ngày qua.</p>' : ''}
              ${recentWeekContents.map(c => `
                <div class="flex items-center gap-3 p-2 border-b">
                  <input type="checkbox" class="report-chk" value="${c.id}" checked>
                  <div style="flex: 1; min-width: 0;">
                    <div class="text-sm font-medium truncate">${c.product || c.brief || 'Bài viết'}</div>
                    <div class="text-xs text-muted">${c.status} · ${new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      btnSend.disabled = false;
    } catch (err) {
      body.innerHTML = `<p class="text-danger">Lỗi dữ liệu: ${err.message}</p>`;
    }
  });

  btnSend?.addEventListener('click', async () => {
    if (!ceoEmailConfig) return;

    btnSend.disabled = true;
    const originalText = btnSend.innerHTML;
    btnSend.innerHTML = `<span class="loading-spinner-sm"></span> ${t('dashboard.reportGenerating')}`;

    try {
      const notes = document.getElementById('report-notes')?.value?.trim() || 'Không có ghi chú thêm.';
      const checkedIds = Array.from(document.querySelectorAll('.report-chk:checked')).map(el => el.value);
      const selectedContents = recentWeekContents.filter(c => checkedIds.includes(c.id));
      const pubCount = selectedContents.filter(c => c.status === 'published').length;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #006964; border-bottom: 2px solid #006964; padding-bottom: 10px;">Báo cáo nội dung tuần</h2>
          <p>Kính gửi CEO,</p>
          <p>Dưới đây là tổng hợp hiệu suất team nội dung trong tuần qua:</p>
          
          <div style="display: flex; gap: 20px; text-align: center; margin: 20px 0;">
             <div style="background: #f8faf9; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0;">
               <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">\${selectedContents.length}</div>
               <div style="font-size: 13px; color: #64748b;">Tổng số bài (tham gia báo cáo)</div>
             </div>
             <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #a7f3d0;">
               <div style="font-size: 28px; font-weight: bold; color: #059669;">\${pubCount}</div>
               <div style="font-size: 13px; color: #047857;">Bài đã đăng (Published)</div>
             </div>
          </div>

          <h3 style="color: #1e293b;">Ghi chú & Kế hoạch tuần sau:</h3>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-style: italic; white-space: pre-wrap;">\${notes}</div>

          <h3 style="color: #1e293b; margin-top: 25px;">Danh sách công việc chi tiết:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="background: #f8faf9; border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 10px;">Tiêu đề / Brief</th>
              <th style="padding: 10px;">Trạng thái</th>
              <th style="padding: 10px;">Ngày tạo</th>
            </tr>
            \${selectedContents.map(c => \`
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; max-width: 300px;">\${c.product || c.brief || 'Bài viết ContentPilot'}</td>
                <td style="padding: 10px;">
                  <span style="background: \${c.status === 'published' ? '#d1fae5' : '#fef3c7'}; color: \${c.status === 'published' ? '#065f46' : '#92400e'}; padding: 4px 8px; border-radius: 12px; font-size: 12px;">\${c.status}</span>
                </td>
                <td style="padding: 10px;">\${new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            \`).join('')}
          </table>

          <div style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Báo cáo được gửi tự động từ <strong>Content Ops Copilot</strong>.
          </div>
        </div>
      `;

      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ceoEmailConfig,
          subject: '[ContentPilot] Báo Cáo Nội Dung Tuần - ' + new Date().toLocaleDateString(),
          html: htmlContent
        })
      });

      if (!response.ok) throw new Error('Failed to send email API');

      showToast(t('dashboard.reportSuccess'), 'success');
      modal.classList.add('hidden');
    } catch (err) {
      showToast(t('errors.generic') + ': ' + err.message, 'error');
    } finally {
      btnSend.disabled = false;
      btnSend.innerHTML = originalText;
    }
  });
}
