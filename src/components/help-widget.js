/**
 * Smart Help Widget — Context-aware floating assistant
 * Tự động hiển thị hướng dẫn phù hợp với trang đang mở.
 * FIX: Reinjects itself after every page navigation since innerHTML wipes the body.
 */
import { getGuideByRoute, GUIDES } from '../data/guides.js';

// State
let isDrawerOpen = false;
let currentGuide = null;
let _initialized = false;

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Khởi tạo (hoặc tái tạo) widget trên trang hiện tại.
 * Gọi sau mỗi lần router render trang mới.
 */
export function initHelpWidget() {
  // Remove stale widget if DOM was replaced by a page render
  const old = document.getElementById('help-widget-root');
  if (old) old.remove();

  const root = document.createElement('div');
  root.id = 'help-widget-root';
  root.innerHTML = buildWidgetHTML();
  document.body.appendChild(root);

  attachWidgetEvents(root);
  _initialized = true;

  // Set initial context based on current hash
  const route = location.hash.replace('#/', '').split('?')[0] || 'dashboard';
  _applyGuideToDOM(getGuideByRoute(route) || GUIDES[0]);
}

/**
 * Cập nhật context khi chuyển trang.
 */
export function updateHelpContext(routeId) {
  // If widget was removed (page re-render), recreate it
  if (!document.getElementById('help-widget-root')) {
    initHelpWidget();
    return;
  }
  const guide = getGuideByRoute(routeId) || GUIDES[0];
  currentGuide = guide;
  _applyGuideToDOM(guide);
}

// ─────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────

function buildWidgetHTML() {
  return `
    <style>
      #help-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary, #6366f1), #8b5cf6);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        z-index: 9000;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        color: #fff;
        font-size: 22px;
      }
      #help-fab:hover {
        transform: scale(1.08) translateY(-2px);
        box-shadow: 0 8px 28px rgba(99,102,241,0.5);
      }
      #help-fab .fab-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 18px;
        height: 18px;
        background: #ef4444;
        border-radius: 50%;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        animation: pulse-badge 2s infinite;
      }
      @keyframes pulse-badge {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      #help-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 9001;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(2px);
      }
      #help-overlay.open { opacity: 1; pointer-events: auto; }

      #help-panel {
        position: fixed;
        top: 0;
        right: -440px;
        width: 420px;
        max-width: 92vw;
        height: 100dvh;
        z-index: 9002;
        background: var(--surface, #1e1e2e);
        border-left: 1px solid var(--border, rgba(255,255,255,0.08));
        box-shadow: -8px 0 48px rgba(0,0,0,0.3);
        transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #help-panel.open { right: 0; }

      /* Panel Header */
      .hw-header {
        padding: 20px 20px 16px;
        background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
        border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        flex-shrink: 0;
      }
      .hw-header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .hw-page-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--primary, #6366f1);
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }
      .hw-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-primary, #e2e8f0);
        line-height: 1.3;
        margin: 0;
      }
      .hw-summary {
        font-size: 0.82rem;
        color: var(--text-muted, #94a3b8);
        line-height: 1.5;
        margin-top: 6px;
      }
      .hw-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-muted, #94a3b8);
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        transition: color 0.2s, background 0.2s;
        flex-shrink: 0;
      }
      .hw-close-btn:hover { color: var(--text-primary, #e2e8f0); background: rgba(255,255,255,0.07); }

      /* Tab bar */
      .hw-tabs {
        display: flex;
        border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        flex-shrink: 0;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .hw-tabs::-webkit-scrollbar { display: none; }
      .hw-tab {
        flex: 1;
        min-width: 80px;
        padding: 10px 6px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted, #94a3b8);
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        transition: color 0.2s, border-color 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
      }
      .hw-tab.active {
        color: var(--primary, #6366f1);
        border-bottom-color: var(--primary, #6366f1);
      }
      .hw-tab:hover:not(.active) { color: var(--text-secondary, #cbd5e1); }
      .hw-tab-icon { font-size: 16px; }

      /* Content area */
      .hw-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
      }
      .hw-content::-webkit-scrollbar { width: 4px; }
      .hw-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

      /* Markdown styles */
      .hw-md h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary, #e2e8f0); margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border, rgba(255,255,255,0.08)); }
      .hw-md h3 { font-size: 0.95rem; font-weight: 600; color: var(--text-primary, #e2e8f0); margin: 16px 0 8px; }
      .hw-md p { font-size: 0.88rem; color: var(--text-secondary, #94a3b8); line-height: 1.7; margin-bottom: 10px; }
      .hw-md strong { color: var(--text-primary, #e2e8f0); font-weight: 600; }
      .hw-md em { color: var(--primary, #818cf8); font-style: normal; }
      .hw-md li { font-size: 0.88rem; color: var(--text-secondary, #94a3b8); line-height: 1.6; margin-bottom: 6px; padding-left: 16px; position: relative; }
      .hw-md li::before { content: "▸"; position: absolute; left: 0; color: var(--primary, #6366f1); }
      .hw-md ol { counter-reset: list-counter; }
      .hw-md ol li { counter-increment: list-counter; }
      .hw-md ol li::before { content: counter(list-counter) "."; color: var(--primary, #6366f1); font-weight: 700; font-size: 0.85rem; }
      .hw-md code { background: rgba(99,102,241,0.12); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-size: 0.82rem; font-family: monospace; }
      .hw-md pre { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin: 12px 0; overflow-x: auto; border-left: 3px solid var(--primary, #6366f1); }
      .hw-md pre code { background: none; padding: 0; color: #a5b4fc; font-size: 0.8rem; }
      .hw-md table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.82rem; }
      .hw-md th { background: rgba(99,102,241,0.15); color: var(--primary, #818cf8); font-weight: 600; padding: 7px 10px; text-align: left; }
      .hw-md td { padding: 7px 10px; border-bottom: 1px solid var(--border, rgba(255,255,255,0.06)); color: var(--text-secondary, #94a3b8); }
      .hw-md tr:last-child td { border-bottom: none; }
      .hw-alert-tip { background: rgba(99,102,241,0.1); border-left: 3px solid #6366f1; padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 12px 0; font-size: 0.85rem; color: var(--text-secondary, #94a3b8); }
      .hw-alert-tip strong { color: #818cf8; }
      .hw-alert-warn { background: rgba(245,158,11,0.1); border-left: 3px solid #f59e0b; padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 12px 0; font-size: 0.85rem; color: var(--text-secondary, #94a3b8); }
      .hw-alert-warn strong { color: #fbbf24; }
      .hw-alert-danger { background: rgba(239,68,68,0.1); border-left: 3px solid #ef4444; padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 12px 0; font-size: 0.85rem; color: var(--text-secondary, #94a3b8); }
      .hw-alert-danger strong { color: #f87171; }

      /* Nav bar at bottom */
      .hw-footer {
        padding: 12px 20px;
        border-top: 1px solid var(--border, rgba(255,255,255,0.08));
        flex-shrink: 0;
        display: flex;
        gap: 8px;
      }
      .hw-footer a {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 12px;
        background: rgba(99,102,241,0.12);
        border: 1px solid rgba(99,102,241,0.25);
        border-radius: 8px;
        color: #818cf8;
        font-size: 0.82rem;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.2s, border-color 0.2s;
      }
      .hw-footer a:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); }

      /* All guides sidebar */
      .hw-guide-list { display: flex; flex-direction: column; gap: 6px; }
      .hw-guide-item {
        padding: 10px 14px;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid transparent;
        transition: background 0.15s, border-color 0.15s;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .hw-guide-item:hover { background: rgba(255,255,255,0.05); border-color: var(--border, rgba(255,255,255,0.08)); }
      .hw-guide-item.active { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); }
      .hw-guide-item-title { font-size: 0.88rem; font-weight: 600; color: var(--text-primary, #e2e8f0); }
      .hw-guide-item-summary { font-size: 0.78rem; color: var(--text-muted, #64748b); margin-top: 2px; line-height: 1.4; }
    </style>

    <!-- FAB button -->
    <button id="help-fab" title="Trợ giúp thông minh — Nhấn để xem hướng dẫn trang này">
      💡
      <span class="fab-badge" title="Có hướng dẫn cho trang này!">?</span>
    </button>

    <!-- Overlay -->
    <div id="help-overlay"></div>

    <!-- Side Panel -->
    <div id="help-panel">
      <!-- Header -->
      <div class="hw-header">
        <div class="hw-header-top">
          <div>
            <div class="hw-page-label" id="hw-page-label">💡 Trợ giúp theo ngữ cảnh</div>
            <h2 class="hw-title" id="hw-title">Đang tải...</h2>
            <p class="hw-summary" id="hw-summary"></p>
          </div>
          <button class="hw-close-btn" id="hw-close" aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="hw-tabs">
        <button class="hw-tab active" data-tab="current">
          <span class="hw-tab-icon">📖</span>
          Trang này
        </button>
        <button class="hw-tab" data-tab="all">
          <span class="hw-tab-icon">🗂️</span>
          Tất cả Guides
        </button>
        <button class="hw-tab" data-tab="tips">
          <span class="hw-tab-icon">⚡</span>
          Pro Tips
        </button>
      </div>

      <!-- Content -->
      <div class="hw-content" id="hw-body">
        <!-- injected by JS -->
      </div>

      <!-- Footer -->
      <div class="hw-footer">
        <a href="#/help" id="hw-goto-help">
          📚 Trung tâm Trợ giúp
        </a>
      </div>
    </div>
  `;
}

function attachWidgetEvents(root) {
  const fab = root.querySelector('#help-fab');
  const overlay = root.querySelector('#help-overlay');
  const panel = root.querySelector('#help-panel');
  const closeBtn = root.querySelector('#hw-close');
  const gotoHelpBtn = root.querySelector('#hw-goto-help');
  const tabs = root.querySelectorAll('.hw-tab');
  const body = root.querySelector('#hw-body');

  const openDrawer = () => {
    isDrawerOpen = true;
    overlay.classList.add('open');
    panel.classList.add('open');
  };

  const closeDrawer = () => {
    isDrawerOpen = false;
    overlay.classList.remove('open');
    panel.classList.remove('open');
  };

  fab.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  gotoHelpBtn.addEventListener('click', closeDrawer);

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab(tab.dataset.tab, body);
    });
  });
}

function renderTab(tab, container) {
  if (tab === 'current') {
    container.innerHTML = currentGuide
      ? `<div class="hw-md">${parseMarkdown(currentGuide.content)}</div>`
      : '<p style="color:var(--text-muted);padding:20px;text-align:center;">Không có hướng dẫn cho trang này.</p>';
  } else if (tab === 'all') {
    container.innerHTML = `<div class="hw-guide-list">${GUIDES.map(g => `
          <div class="hw-guide-item ${currentGuide && g.id === currentGuide.id ? 'active' : ''}" data-guide-id="${g.id}">
            <div>
              <div class="hw-guide-item-title">${g.title}</div>
              <div class="hw-guide-item-summary">${g.shortSummary || ''}</div>
            </div>
          </div>`).join('')}</div>`;

    // Click on guide item to show it
    container.querySelectorAll('.hw-guide-item').forEach(item => {
      item.addEventListener('click', () => {
        const g = GUIDES.find(x => x.id === item.dataset.guideId);
        if (!g) return;
        currentGuide = g;
        _applyGuideToDOM(g);
        // Switch back to current tab
        document.querySelectorAll('.hw-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="current"]')?.classList.add('active');
        renderTab('current', container);
      });
    });
  } else if (tab === 'tips') {
    container.innerHTML = `<div class="hw-md">
          <h2>⚡ 10 Pro Tips từ Chuyên gia</h2>
          <ol>
            <li><strong>Tách Avatar càng nhỏ càng tốt:</strong> "Mẹ bỉm 25-30 tuổi lo da chảy xệ sau sinh" tốt hơn "Phụ nữ" rất nhiều.</li>
            <li><strong>Hook = 80% thành công:</strong> Dành 50% thời gian cho câu đầu tiên. Người đọc quyết định đọc tiếp trong 1 giây.</li>
            <li><strong>Con số > Lời hay:</strong> "Giảm 3.2kg trong 8 tuần" thuyết phục hơn "giảm cân hiệu quả rõ rệt".</li>
            <li><strong>Proof trước CTA:</strong> Luôn đặt bằng chứng (review, số liệu, certification) ngay trước lời kêu gọi hành động.</li>
            <li><strong>Repurpose 1 bài → 5 nền tảng:</strong> Facebook long-form → TikTok script → 5 Stories → Email → Zalo OA. Tiết kiệm 80% thời gian.</li>
            <li><strong>KOC Nano outperform KOL Macro:</strong> KOC 5K follower đúng tệp có thể bán > KOL 1M follower sai tệp.</li>
            <li><strong>Compliance score ≥ 90 trước khi đăng TPCN:</strong> Một bài vi phạm = cả tài khoản bị khóa.</li>
            <li><strong>Batch content theo tuần:</strong> Tạo 20-30 bài một lúc vào thứ Hai, đủ đăng cả tuần. Hiệu quả hơn viết lẻ từng ngày.</li>
            <li><strong>Đọc comment để tìm content ideas:</strong> Comment của khách hàng = nỗi đau thật = ý tưởng bài hay nhất.</li>
            <li><strong>Track UTM cho mỗi bài:</strong> Không track = không biết bài nào bán được = không tối ưu được gì.</li>
          </ol>

          <h2>🔥 Content Hooks Phổ biến nhất 2024</h2>
          <p><strong>Hooks đang viral mạnh:</strong></p>
          <ul>
            <li><em>"POV: Bạn là..."</em> — đưa người đọc vào đúng tình huống</li>
            <li><em>"Ai đã từng... giơ tay lên!"</em> — tạo cộng đồng chung nỗi đau</li>
            <li><em>"Sự thật ít ai biết về..."</em> — kích thích tò mò</li>
            <li><em>"Tôi ước gì biết điều này sớm hơn..."</em> — tạo cảm giác tiếc nuối</li>
            <li><em>"3 dấu hiệu bạn đang [vấn đề]..."</em> — self-diagnosis, ai cũng muốn biết</li>
          </ul>
        </div>`;
  }
}

function _applyGuideToDOM(guide) {
  if (!guide) return;
  currentGuide = guide;

  const labelEl = document.getElementById('hw-page-label');
  const titleEl = document.getElementById('hw-title');
  const summaryEl = document.getElementById('hw-summary');
  const bodyEl = document.getElementById('hw-body');

  if (labelEl) labelEl.textContent = '💡 Trợ giúp theo ngữ cảnh';
  if (titleEl) titleEl.textContent = guide.title;
  if (summaryEl) summaryEl.textContent = guide.shortSummary || '';
  if (bodyEl) {
    // Find and activate the "current page" tab
    document.querySelectorAll('.hw-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="current"]')?.classList.add('active');
    bodyEl.innerHTML = `<div class="hw-md">${parseMarkdown(guide.content)}</div>`;
  }
}

// ─────────────────────────────────────────────
// Markdown Parser
// ─────────────────────────────────────────────
function parseMarkdown(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks first (before other replacements)
  html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Alerts
  html = html.replace(/&gt; \[!TIP\]\n&gt; (.*?)(?=\n\n|\n#|$)/gs,
    (_, txt) => `<div class="hw-alert-tip"><strong>💡 Mẹo:</strong> ${txt.replace(/&gt; /g, '')}</div>`);
  html = html.replace(/&gt; \[!IMPORTANT\]\n&gt; (.*?)(?=\n\n|\n#|$)/gs,
    (_, txt) => `<div class="hw-alert-warn"><strong>🌟 Quan trọng:</strong> ${txt.replace(/&gt; /g, '')}</div>`);
  html = html.replace(/&gt; \[!CAUTION\]\n&gt; (.*?)(?=\n\n|\n#|$)/gs,
    (_, txt) => `<div class="hw-alert-danger"><strong>⚠️ Chú ý:</strong> ${txt.replace(/&gt; /g, '')}</div>`);
  // Generic blockquote
  html = html.replace(/^&gt; (.*?)$/gm, '<p><em>$1</em></p>');

  // Tables
  html = html.replace(/(\|.*\|)\n(\|[-: |]+\|)\n((?:\|.*\|\n?)*)/g, (_, header, sep, body) => {
    const ths = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(row => {
      const tds = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Headers
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h3>$1</h3>');

  // Bold & italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Ordered and unordered lists
  html = html.replace(/^(\d+)\. (.*?)$/gm, '<li data-otype="ol">$2</li>');
  html = html.replace(/^- (.*?)$/gm, '<li data-otype="ul">$2</li>');
  // Wrap consecutive ol/ul
  html = html.replace(/(<li data-otype="ol">.*?<\/li>)\n?(?=<li data-otype="ol">|(?!<li))/gs, '$1');
  html = html.replace(/(<li data-otype="ul">.*?<\/li>)\n?(?=<li data-otype="ul">|(?!<li))/gs, '$1');

  // Paragraphs: lines not starting with HTML tags
  html = html.split('\n').map(line => {
    if (!line.trim()) return '';
    if (/^<[h2-6|li|ul|ol|table|thead|tbody|tr|th|td|div|pre|code]/.test(line)) return line;
    return `<p>${line}</p>`;
  }).join('\n');

  // Unescape HTML entities back for rendered content (safe since we only escaped before)
  html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  return html;
}
