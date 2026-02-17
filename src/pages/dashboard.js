/**
 * Dashboard Page — Analytics hub with stats, charts, and activity
 */
import { store } from '../utils/state.js';
import { router } from '../utils/router.js';
import { loadContents, loadContentStats } from '../services/firestore.js';
import { loadBrand } from '../services/firestore.js';
import { timeAgo, truncate } from '../utils/helpers.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { checkDailyLimit } from '../services/gemini.js';

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
            Xin chào, ${user?.displayName?.split(' ')[0] || 'bạn'} 👋
          </h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            Tổng quan hoạt động content của bạn
          </p>
        </div>
        <div class="badge ${usage.remaining < 5 ? 'badge-warning' : 'badge-accent'}">
          ${usage.remaining}/${usage.limit} bài còn lại hôm nay
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" id="stats-grid">
        ${renderStatCard('📝', 'Tổng bài viết', '—', 'stat-total', 'var(--accent)')}
        ${renderStatCard('🚀', 'Đã publish', '—', 'stat-published', '#10b981')}
        ${renderStatCard('📄', 'Bản nháp', '—', 'stat-drafts', '#f59e0b')}
        ${renderStatCard('⚡', 'Hôm nay', '—', 'stat-today', '#8b5cf6')}
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="card chart-card">
          <h3 class="chart-title">📊 Bài tạo 7 ngày qua</h3>
          <div class="bar-chart" id="bar-chart">
            <div class="chart-skeleton">Đang tải...</div>
          </div>
        </div>
        <div class="card chart-card">
          <h3 class="chart-title">📂 Phân loại content</h3>
          <div class="donut-chart-wrap" id="donut-chart">
            <div class="chart-skeleton">Đang tải...</div>
          </div>
        </div>
      </div>

      <!-- Heatmap + Quick Actions -->
      <div class="charts-row">
        <div class="card chart-card">
          <h3 class="chart-title">🔥 Hoạt động 4 tuần qua</h3>
          <div class="heatmap-wrap" id="heatmap">
            <div class="chart-skeleton">Đang tải...</div>
          </div>
        </div>
        <div class="card chart-card">
          <h3 class="chart-title">⚡ Hành động nhanh</h3>
          <div class="quick-actions-compact">
            <a href="#/create" class="quick-action-item">
              <span class="qa-icon">✨</span>
              <span>Tạo bài mới</span>
            </a>
            <a href="#/library" class="quick-action-item">
              <span class="qa-icon">📚</span>
              <span>Thư viện</span>
            </a>
            <a href="#/brand" class="quick-action-item">
              <span class="qa-icon">🎨</span>
              <span>Brand Profile</span>
            </a>
            <a href="#/settings" class="quick-action-item">
              <span class="qa-icon">⚙️</span>
              <span>Kết nối API</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Recent Content -->
      <div class="recent-section" style="margin-top: var(--space-6);">
        <h3 style="margin-bottom: var(--space-4);">📄 Bài viết gần đây</h3>
        <div id="recent-content-list">
          <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
          <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();

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
      showToast('Hãy setup Brand Profile để AI viết chuẩn tone hơn!', 'info', 5000);
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
    el.innerHTML = '<div class="chart-empty">Chưa có dữ liệu</div>';
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
    el.innerHTML = '<div class="chart-empty">Chưa có dữ liệu</div>';
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
        <text x="80" y="94" text-anchor="middle" fill="var(--text-secondary)" font-size="10">bài viết</text>
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
    el.innerHTML = '<div class="chart-empty">Chưa có dữ liệu</div>';
    return;
  }

  const max = Math.max(...heatmap.map(d => d.count), 1);

  const cells = heatmap.map(d => {
    const level = d.count === 0 ? 0 : Math.min(4, Math.ceil((d.count / max) * 4));
    const day = new Date(d.date).getDate();
    return `<div class="heatmap-cell level-${level}" title="${d.date}: ${d.count} bài"><span>${day}</span></div>`;
  }).join('');

  el.innerHTML = `
    <div class="heatmap-grid">${cells}</div>
    <div class="heatmap-legend">
      <span class="text-muted text-xs">Ít</span>
      <div class="heatmap-cell level-0 mini"></div>
      <div class="heatmap-cell level-1 mini"></div>
      <div class="heatmap-cell level-2 mini"></div>
      <div class="heatmap-cell level-3 mini"></div>
      <div class="heatmap-cell level-4 mini"></div>
      <span class="text-muted text-xs">Nhiều</span>
    </div>
  `;
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
