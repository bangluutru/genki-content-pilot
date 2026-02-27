import { renderSidebar } from '../components/header.js';
import { icon } from '../utils/icons.js';
import { GUIDES } from '../data/guides.js';

export function renderHelpPage(params = {}) {
    const app = document.getElementById('app');

    // Custom simple markdown parser for the guides
    const parseMarkdown = (md) => {
        if (!md) return '';
        let html = md;

        // Headers
        html = html.replace(/### (.*?)$/gm, '<h3 style="margin-top:24px; margin-bottom:12px; font-weight:600; font-size: 1.25rem;">$1</h3>');
        html = html.replace(/## (.*?)$/gm, '<h2 style="margin-top:32px; margin-bottom:16px; font-weight:700; font-size: 1.5rem;">$1</h2>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Blockquotes/Alerts
        html = html.replace(/> \[!TIP\]\n> (.*?)\n/gs, '<div class="alert alert-info" style="margin: 16px 0;"><strong>💡 Mẹo:</strong> $1</div>');
        html = html.replace(/> \[!IMPORTANT\]\n> (.*?)\n/gs, '<div class="alert alert-warning" style="margin: 16px 0;"><strong>🌟 Quan trọng:</strong> $1</div>');
        html = html.replace(/> \[!CAUTION\]\n> (.*?)\n/gs, '<div class="alert alert-error" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--color-danger); padding: 12px; margin: 16px 0;"><strong>⚠️ Chú ý:</strong> $1</div>');
        html = html.replace(/> (.*?)\n/gm, '<blockquote style="border-left: 4px solid var(--border); padding-left: 12px; margin: 16px 0; color: var(--text-muted);">$1</blockquote>');

        // Lists
        html = html.replace(/^- (.*?)$/gm, '<li style="margin-bottom: 8px; margin-left: 20px; list-style-type: disc;">$1</li>');
        html = html.replace(/^(\d+)\. (.*?)$/gm, '<li style="margin-bottom: 8px; margin-left: 20px; list-style-type: decimal;">$2</li>');

        // Paragraphs (naive)
        html = html.replace(/^(?!<h|<ul|<ol|<li|<div|<blockquote)(.*)$/gm, '<p style="margin-bottom: 12px; line-height: 1.6;">$1</p>');

        // Clean up empty paragraphs
        html = html.replace(/<p style="margin-bottom: 12px; line-height: 1.6;">\s*<\/p>/g, '');

        return html;
    };

    const navItemsHTML = GUIDES.map((guide, idx) => `
    <button class="nav-item ${idx === 0 ? 'active' : ''} help-nav-btn" data-id="${guide.id}" style="text-align: left; width: 100%; border: none; background: transparent; padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-radius: var(--radius); cursor: pointer; color: var(--text-primary);">
      ${icon(guide.icon || 'document', 20)}
      <span style="font-weight: 500;">${guide.title}</span>
    </button>
  `).join('');

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">
            ${icon('info', 28)} Trung tâm Trợ giúp
          </h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            Bí kíp thực chiến & Hướng dẫn sử dụng hệ thống ContentPilot
          </p>
        </div>
      </div>

      <div class="flex gap-6" style="min-height: calc(100vh - 160px);">
        <!-- Sidebar Navigation for Documentation -->
        <div class="card" style="width: 300px; flex-shrink: 0; padding: var(--space-4); height: fit-content; position: sticky; top: 24px;">
          <h3 class="text-sm text-muted" style="margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.5px;">Danh mục Hướng dẫn</h3>
          <nav class="flex flex-col gap-1">
            ${navItemsHTML}
          </nav>
        </div>

        <!-- Documentation Content Area -->
        <div class="card" style="flex: 1; padding: var(--space-8);">
          <div id="help-content-area">
            <!-- Content injected here -->
          </div>
        </div>
      </div>
    </main>
  `;

    // Interaction Logic
    const navBtns = document.querySelectorAll('.help-nav-btn');
    const contentArea = document.getElementById('help-content-area');

    const renderGuideContent = (guide) => {
        contentArea.innerHTML = `
      <div style="border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 2rem; margin-bottom: 8px; display: flex; align-items: center; gap: 12px;">
          ${icon(guide.icon || 'document', 32)} ${guide.title}
        </h1>
        <div class="badge badge-accent">Route: #/${guide.route}</div>
      </div>
      <div class="markdown-body" style="color: var(--text-secondary);">
        ${parseMarkdown(guide.content)}
      </div>
    `;
    };

    // Initial render
    if (GUIDES.length > 0) {
        renderGuideContent(GUIDES[0]);
    }

    // Click handlers
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const guideId = btn.dataset.id;
            const guide = GUIDES.find(g => g.id === guideId);
            if (guide) {
                renderGuideContent(guide);
            }
        });
    });
}
