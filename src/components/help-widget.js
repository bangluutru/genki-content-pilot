/**
 * Smart Help Widget — Context-aware floating assistant
 * PERFORMANCE: CSS injected once into <head>. Markdown pre-parsed and cached.
 * FIXED: Widget reinjects after every page navigation (innerHTML wipes the DOM root).
 */
import { getGuideByRoute, GUIDES } from '../data/guides.js';

// ─────────────────────────────────────────────
// Module-level state
// ─────────────────────────────────────────────
let currentGuide = null;

/** Pre-parsed HTML cache — parsed once at module load, never again */
const _htmlCache = new Map();

// Pre-parse all guides at module load (runs once, JS idle time)
GUIDES.forEach(g => {
  _htmlCache.set(g.id, parseMarkdown(g.content));
});

// Static HTML for the Pro Tips tab — computed once
const PRO_TIPS_HTML = parseMarkdown(`
## ⚡ 10 Pro Tips từ Chuyên gia

1. **Tách Avatar càng nhỏ càng tốt:** "Mẹ bỉm 25-30 tuổi lo da chảy xệ sau sinh" tốt hơn "Phụ nữ" rất nhiều.
2. **Hook = 80% thành công:** Dành 50% thời gian cho câu đầu tiên. Người đọc quyết định đọc tiếp trong 1 giây.
3. **Con số > Lời hay:** "Giảm 3.2kg trong 8 tuần" thuyết phục hơn "giảm cân hiệu quả rõ rệt".
4. **Proof trước CTA:** Luôn đặt bằng chứng (review, số liệu, certification) ngay trước lời kêu gọi hành động.
5. **Repurpose 1 bài → 5 nền tảng:** Facebook long-form → TikTok script → 5 Stories → Email → Zalo OA. Tiết kiệm 80% thời gian.
6. **KOC Nano outperform KOL Macro:** KOC 5K follower đúng tệp có thể bán > KOL 1M follower sai tệp.
7. **Compliance score ≥ 90 trước khi đăng TPCN:** Một bài vi phạm = cả tài khoản bị khóa.
8. **Batch content theo tuần:** Tạo 20-30 bài một lúc vào thứ Hai, đủ đăng cả tuần. Hiệu quả hơn viết lẻ từng ngày.
9. **Đọc comment để tìm content ideas:** Comment của khách hàng = nỗi đau thật = ý tưởng bài hay nhất.
10. **Track UTM cho mỗi bài:** Không track = không biết bài nào bán được = không tối ưu được gì.

## 🔥 Content Hooks Phổ biến nhất 2024

- *"POV: Bạn là..."* — đưa người đọc vào đúng tình huống
- *"Ai đã từng... giơ tay lên!"* — tạo cộng đồng chung nỗi đau
- *"Sự thật ít ai biết về..."* — kích thích tò mò
- *"Tôi ước gì biết điều này sớm hơn..."* — tạo cảm giác tiếc nuối
- *"3 dấu hiệu bạn đang [vấn đề]..."* — self-diagnosis, ai cũng muốn biết
`);

// ─────────────────────────────────────────────
// CSS — injected ONCE into <head>
// ─────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('hw-styles')) return; // already injected
  const style = document.createElement('style');
  style.id = 'hw-styles';
  style.textContent = `
      #help-fab {
        position: fixed; bottom: 24px; right: 24px;
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        z-index: 9000;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        color: #fff; font-size: 22px;
      }
      #help-fab:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.5); }
      .fab-badge {
        position: absolute; top: -4px; right: -4px;
        width: 18px; height: 18px;
        background: #ef4444; border-radius: 50%;
        font-size: 10px; display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 700;
        animation: pulse-badge 2s infinite;
      }
      @keyframes pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
      #help-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 9001; opacity: 0; pointer-events: none;
        transition: opacity 0.25s ease;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
      }
      #help-overlay.open { opacity: 1; pointer-events: auto; }
      #help-panel {
        position: fixed; top: 0; right: -440px;
        width: 420px; max-width: 92vw; height: 100dvh;
        z-index: 9002;
        background: var(--surface, #1e1e2e);
        border-left: 1px solid var(--border, rgba(255,255,255,0.08));
        box-shadow: -8px 0 48px rgba(0,0,0,0.3);
        transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex; flex-direction: column; overflow: hidden;
        will-change: transform;
        transform: translateZ(0);
      }
      #help-panel.open { right: 0; }
      .hw-header {
        padding: 18px 20px 14px;
        background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
        border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        flex-shrink: 0;
      }
      .hw-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
      .hw-page-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--primary, #6366f1); margin-bottom: 4px; }
      .hw-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary, #e2e8f0); line-height: 1.3; margin: 0; }
      .hw-summary { font-size: 0.8rem; color: var(--text-muted, #94a3b8); line-height: 1.5; margin-top: 5px; }
      .hw-close-btn {
        background: none; border: none; cursor: pointer;
        color: var(--text-muted, #94a3b8); padding: 4px; border-radius: 6px;
        display: flex; align-items: center;
        transition: color 0.15s, background 0.15s; flex-shrink: 0;
      }
      .hw-close-btn:hover { color: var(--text-primary,#e2e8f0); background: rgba(255,255,255,0.07); }
      .hw-tabs {
        display: flex; border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        flex-shrink: 0; overflow-x: auto; scrollbar-width: none;
      }
      .hw-tabs::-webkit-scrollbar { display: none; }
      .hw-tab {
        flex: 1; min-width: 70px; padding: 9px 4px;
        background: none; border: none; cursor: pointer;
        font-size: 10px; font-weight: 600;
        color: var(--text-muted, #94a3b8);
        border-bottom: 2px solid transparent; margin-bottom: -1px;
        transition: color 0.15s, border-color 0.15s;
        display: flex; flex-direction: column; align-items: center; gap: 3px; text-align: center;
      }
      .hw-tab.active { color: var(--primary, #6366f1); border-bottom-color: var(--primary, #6366f1); }
      .hw-tab:hover:not(.active) { color: var(--text-secondary, #cbd5e1); }
      .hw-tab-icon { font-size: 15px; }
      /* Tab panels — GPU-accelerated show/hide, no reflow */
      .hw-tab-panel { display: none; }
      .hw-tab-panel.active { display: block; }
      .hw-content {
        flex: 1; overflow-y: auto; padding: 16px 18px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
        overscroll-behavior: contain;
        /* Smooth momentum scroll on iOS */
        -webkit-overflow-scrolling: touch;
      }
      .hw-content::-webkit-scrollbar { width: 3px; }
      .hw-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
      /* Markdown styles */
      .hw-md h2 { font-size: 1rem; font-weight: 700; color: var(--text-primary,#e2e8f0); margin: 18px 0 9px; padding-bottom: 5px; border-bottom: 1px solid var(--border,rgba(255,255,255,0.08)); }
      .hw-md h3 { font-size: 0.9rem; font-weight: 600; color: var(--text-primary,#e2e8f0); margin: 14px 0 7px; }
      .hw-md p { font-size: 0.85rem; color: var(--text-secondary,#94a3b8); line-height: 1.7; margin-bottom: 9px; }
      .hw-md strong { color: var(--text-primary,#e2e8f0); font-weight: 600; }
      .hw-md em { color: #818cf8; font-style: normal; }
      .hw-md li { font-size: 0.85rem; color: var(--text-secondary,#94a3b8); line-height: 1.6; margin-bottom: 5px; padding-left: 14px; position: relative; }
      .hw-md li::before { content: "▸"; position: absolute; left: 0; color: var(--primary,#6366f1); }
      .hw-md ol { counter-reset: list-counter; }
      .hw-md ol li { counter-increment: list-counter; }
      .hw-md ol li::before { content: counter(list-counter) "."; color: var(--primary,#6366f1); font-weight: 700; font-size: 0.82rem; }
      .hw-md code { background: rgba(99,102,241,0.12); color: #a5b4fc; padding: 2px 5px; border-radius: 3px; font-size: 0.8rem; font-family: monospace; }
      .hw-md pre { background: rgba(0,0,0,0.3); border-radius: 7px; padding: 10px; margin: 10px 0; overflow-x: auto; border-left: 3px solid #6366f1; }
      .hw-md pre code { background: none; padding: 0; color: #a5b4fc; font-size: 0.78rem; }
      .hw-md table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.8rem; }
      .hw-md th { background: rgba(99,102,241,0.15); color: #818cf8; font-weight: 600; padding: 6px 8px; text-align: left; }
      .hw-md td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); color: var(--text-secondary,#94a3b8); }
      .hw-md tr:last-child td { border-bottom: none; }
      .hw-alert-tip { background: rgba(99,102,241,0.1); border-left: 3px solid #6366f1; padding: 9px 12px; border-radius: 0 7px 7px 0; margin: 10px 0; font-size: 0.82rem; color: var(--text-secondary,#94a3b8); }
      .hw-alert-warn { background: rgba(245,158,11,0.1); border-left: 3px solid #f59e0b; padding: 9px 12px; border-radius: 0 7px 7px 0; margin: 10px 0; font-size: 0.82rem; color: var(--text-secondary,#94a3b8); }
      .hw-alert-danger { background: rgba(239,68,68,0.1); border-left: 3px solid #ef4444; padding: 9px 12px; border-radius: 0 7px 7px 0; margin: 10px 0; font-size: 0.82rem; color: var(--text-secondary,#94a3b8); }
      /* Guide list for All Guides tab */
      .hw-guide-list { display: flex; flex-direction: column; gap: 5px; }
      .hw-guide-item {
        padding: 9px 12px; border-radius: 7px; cursor: pointer;
        border: 1px solid transparent;
        transition: background 0.12s, border-color 0.12s;
        display: flex; align-items: flex-start; gap: 8px;
      }
      .hw-guide-item:hover { background: rgba(255,255,255,0.05); border-color: var(--border,rgba(255,255,255,0.08)); }
      .hw-guide-item.active { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); }
      .hw-guide-item-title { font-size: 0.85rem; font-weight: 600; color: var(--text-primary,#e2e8f0); }
      .hw-guide-item-summary { font-size: 0.75rem; color: var(--text-muted,#64748b); margin-top: 2px; line-height: 1.4; }
      .hw-footer {
        padding: 11px 18px; border-top: 1px solid var(--border,rgba(255,255,255,0.08));
        flex-shrink: 0; display: flex; gap: 8px;
      }
      .hw-footer a {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 8px 10px;
        background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25);
        border-radius: 7px; color: #818cf8; font-size: 0.8rem; font-weight: 600;
        text-decoration: none; transition: background 0.15s, border-color 0.15s;
      }
      .hw-footer a:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); }
    `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export function initHelpWidget() {
  injectCSS(); // idempotent — only runs once

  const old = document.getElementById('help-widget-root');
  if (old) old.remove();

  const root = document.createElement('div');
  root.id = 'help-widget-root';
  root.innerHTML = buildWidgetShell();
  document.body.appendChild(root);

  attachWidgetEvents(root);

  const route = location.hash.replace('#/', '').split('?')[0] || 'dashboard';
  _applyGuide(getGuideByRoute(route) || GUIDES[0]);
}

export function updateHelpContext(routeId) {
  if (!document.getElementById('help-widget-root')) {
    initHelpWidget();
    return;
  }
  _applyGuide(getGuideByRoute(routeId) || GUIDES[0]);
}

// ─────────────────────────────────────────────
// Widget shell HTML (no <style> — CSS is in <head>)
// ─────────────────────────────────────────────
function buildWidgetShell() {
  // Pre-build the All Guides panel HTML once
  const allGuidesHTML = `<div class="hw-guide-list hw-all-guides">${GUIDES.map(g => `
      <div class="hw-guide-item" data-guide-id="${g.id}">
        <div>
          <div class="hw-guide-item-title">${g.title}</div>
          <div class="hw-guide-item-summary">${g.shortSummary || ''}</div>
        </div>
      </div>`).join('')}</div>`;

  return `
    <button id="help-fab" title="Trợ giúp thông minh — Nhấn để xem hướng dẫn trang này">
      💡<span class="fab-badge" title="Có hướng dẫn!">?</span>
    </button>

    <div id="help-overlay"></div>

    <div id="help-panel">
      <div class="hw-header">
        <div class="hw-header-top">
          <div>
            <div class="hw-page-label">💡 Trợ giúp theo ngữ cảnh</div>
            <h2 class="hw-title" id="hw-title">Đang tải...</h2>
            <p class="hw-summary" id="hw-summary"></p>
          </div>
          <button class="hw-close-btn" id="hw-close" aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="hw-tabs">
        <button class="hw-tab active" data-tab="current">
          <span class="hw-tab-icon">📖</span>Trang này
        </button>
        <button class="hw-tab" data-tab="all">
          <span class="hw-tab-icon">🗂️</span>Tất cả Guides
        </button>
        <button class="hw-tab" data-tab="tips">
          <span class="hw-tab-icon">⚡</span>Pro Tips
        </button>
      </div>

      <div class="hw-content">
        <!-- 3 pre-rendered tab panels, shown/hidden via CSS display -->
        <div class="hw-tab-panel active" id="hw-panel-current">
          <div class="hw-md" id="hw-current-body"></div>
        </div>
        <div class="hw-tab-panel" id="hw-panel-all">
          ${allGuidesHTML}
        </div>
        <div class="hw-tab-panel" id="hw-panel-tips">
          <div class="hw-md">${PRO_TIPS_HTML}</div>
        </div>
      </div>

      <div class="hw-footer">
        <a href="#/help" id="hw-goto-help">📚 Trung tâm Trợ giúp</a>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// Event binding
// ─────────────────────────────────────────────
function attachWidgetEvents(root) {
  const fab = root.querySelector('#help-fab');
  const overlay = root.querySelector('#help-overlay');
  const panel = root.querySelector('#help-panel');
  const closeBtn = root.querySelector('#hw-close');
  const gotoHelp = root.querySelector('#hw-goto-help');
  const tabs = root.querySelectorAll('.hw-tab');

  const openDrawer = () => { overlay.classList.add('open'); panel.classList.add('open'); };
  const closeDrawer = () => { overlay.classList.remove('open'); panel.classList.remove('open'); };

  fab.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  gotoHelp.addEventListener('click', closeDrawer);

  // Tab switching — instant (just toggle CSS class, no re-parse)
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      root.querySelectorAll('.hw-tab-panel').forEach(p => p.classList.remove('active'));
      root.querySelector(`#hw-panel-${target}`)?.classList.add('active');
    });
  });

  // All Guides — click to show guide in "current" tab
  root.querySelector('.hw-all-guides')?.addEventListener('click', e => {
    const item = e.target.closest('.hw-guide-item');
    if (!item) return;
    const g = GUIDES.find(x => x.id === item.dataset.guideId);
    if (!g) return;
    _applyGuide(g);
    // Switch to "Trang này" tab
    tabs.forEach(t => t.classList.remove('active'));
    root.querySelector('[data-tab="current"]')?.classList.add('active');
    root.querySelectorAll('.hw-tab-panel').forEach(p => p.classList.remove('active'));
    root.querySelector('#hw-panel-current')?.classList.add('active');
  });
}

// ─────────────────────────────────────────────
// Apply guide to DOM (instant — uses pre-cached HTML)
// ─────────────────────────────────────────────
function _applyGuide(guide) {
  if (!guide) return;
  currentGuide = guide;

  const titleEl = document.getElementById('hw-title');
  const summaryEl = document.getElementById('hw-summary');
  const bodyEl = document.getElementById('hw-current-body');
  const allItems = document.querySelectorAll('.hw-guide-item');

  if (titleEl) titleEl.textContent = guide.title;
  if (summaryEl) summaryEl.textContent = guide.shortSummary || '';
  // Use pre-cached HTML — no re-parsing!
  if (bodyEl) bodyEl.innerHTML = _htmlCache.get(guide.id) || '';

  // Highlight active in all-guides list
  allItems.forEach(item => {
    item.classList.toggle('active', item.dataset.guideId === guide.id);
  });
}

// ─────────────────────────────────────────────
// Markdown Parser (runs once at module load, not on user interaction)
// ─────────────────────────────────────────────
function parseMarkdown(md) {
  if (!md) return '';
  let html = md;

  // Code blocks first
  html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
  );
  // Inline code
  html = html.replace(/`([^`]+)`/g, (_, c) => `<code>${c.replace(/</g, '&lt;')}</code>`);

  // Alerts
  html = html.replace(/^> \[!TIP\]\n> (.*?)$/gm, '<div class="hw-alert-tip"><strong>💡 Mẹo:</strong> $1</div>');
  html = html.replace(/^> \[!IMPORTANT\]\n> (.*?)$/gm, '<div class="hw-alert-warn"><strong>🌟 Quan trọng:</strong> $1</div>');
  html = html.replace(/^> \[!CAUTION\]\n> (.*?)$/gm, '<div class="hw-alert-danger"><strong>⚠️ Chú ý:</strong> $1</div>');
  html = html.replace(/^> (.*?)$/gm, '<p><em>$1</em></p>');

  // Tables
  html = html.replace(/^(\|.+\|)\n\|[-: |]+\|\n((?:\|.+\|\n?)+)/gm, (_, header, rows) => {
    const ths = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const trs = rows.trim().split('\n').map(row =>
      `<tr>${row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('')}</tr>`
    ).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });

  // Headers
  html = html.replace(/^#### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');

  // Bold & italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Lists — wrap consecutive items
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, match => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });
  html = html.replace(/((?:^- .+\n?)+)/gm, match => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Paragraphs
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (/^<[houltdbp]/.test(trimmed)) return trimmed;
    return `<p>${trimmed}</p>`;
  }).join('\n');

  return html;
}
