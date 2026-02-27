import { icon } from '../utils/icons.js';
import { getGuideByRoute } from '../data/guides.js';

let isDrawerOpen = false;
let currentGuide = null;
let currentRouteId = 'home';

export function initHelpWidget() {
    const body = document.body;

    // Render Widget HTML
    const widgetHTML = `
    <!-- Floating Button -->
    <button id="help-floating-btn" class="btn btn-primary" style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    " title="Trợ giúp theo ngữ cảnh">
      ${icon('info', 28)}
    </button>

    <!-- Side Drawer Overlay -->
    <div id="help-drawer-overlay" style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.4);
      z-index: 9998;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    "></div>

    <!-- Side Drawer Panel -->
    <div id="help-drawer-panel" class="card" style="
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      max-width: 90vw;
      height: 100vh;
      margin: 0;
      border-radius: 0;
      z-index: 10000;
      box-shadow: -4px 0 24px rgba(0,0,0,0.1);
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    ">
      <!-- Drawer Header -->
      <div style="
        display: flex; justify-content: space-between; align-items: center; 
        padding: 20px 24px; border-bottom: 1px solid var(--border);
        background: var(--bg-secondary);
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div id="help-drawer-icon" style="color: var(--color-primary)">${icon('sparkle', 24)}</div>
          <h2 id="help-drawer-title" style="font-size: 1.25rem; font-weight: 600; margin: 0;">Trợ giúp</h2>
        </div>
        <button id="help-close-btn" class="btn btn-icon" style="margin: -8px;">${icon('close', 20)}</button>
      </div>

      <!-- Drawer Content -->
      <div id="help-drawer-content" class="markdown-body" style="
        flex: 1; overflow-y: auto; padding: 24px; color: var(--text-secondary);
      ">
        <!-- Content injected here -->
      </div>
      
      <!-- Drawer Footer -->
      <div style="padding: 16px 24px; border-top: 1px solid var(--border); background: var(--bg-secondary);">
        <a href="#/help" id="help-goto-center" class="btn btn-outline btn-full" style="display: flex; justify-content: center; gap: 8px;">
          ${icon('document', 18)} Đi đến Trung tâm Trợ giúp
        </a>
      </div>
    </div>
  `;

    // Append to body if not already there
    if (!document.getElementById('help-floating-btn')) {
        body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    // Elements
    const fab = document.getElementById('help-floating-btn');
    const overlay = document.getElementById('help-drawer-overlay');
    const panel = document.getElementById('help-drawer-panel');
    const closeBtn = document.getElementById('help-close-btn');
    const gotoCenterBtn = document.getElementById('help-goto-center');

    // Hover effect for FAB
    fab.addEventListener('mouseenter', () => {
        fab.style.transform = 'scale(1.05)';
        fab.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });
    fab.addEventListener('mouseleave', () => {
        fab.style.transform = 'scale(1)';
        fab.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    // Toggle Logic
    const openDrawer = () => {
        isDrawerOpen = true;
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        panel.style.right = '0';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeDrawer = () => {
        isDrawerOpen = false;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        panel.style.right = '-400px';
        document.body.style.overflow = '';
    };

    fab.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    gotoCenterBtn.addEventListener('click', closeDrawer);

    // Initialize with initial route
    updateHelpContext(location.hash.replace('#/', '') || 'home');
}

/**
 * Cập nhật ngữ cảnh cho Help Widget dựa trên route hiện tại
 */
export function updateHelpContext(routeId) {
    currentRouteId = routeId;
    const guide = getGuideByRoute(routeId);

    // If no guide found (or we are deeply nested), fallback to dashboard or hide
    currentGuide = guide || getGuideByRoute('dashboard');

    const titleEl = document.getElementById('help-drawer-title');
    const contentEl = document.getElementById('help-drawer-content');
    const iconEl = document.getElementById('help-drawer-icon');

    if (titleEl && contentEl && currentGuide) {
        titleEl.textContent = currentGuide.title;
        iconEl.innerHTML = icon(currentGuide.icon || 'info', 24);
        contentEl.innerHTML = parseMarkdown(currentGuide.content);
    }
}

// Reuse a lightweight markdown parser
function parseMarkdown(md) {
    if (!md) return '';
    let html = md;

    html = html.replace(/### (.*?)$/gm, '<h3 style="margin-top:20px; margin-bottom:12px; font-weight:600; font-size: 1.15rem; color: var(--text-primary);">$1</h3>');
    html = html.replace(/## (.*?)$/gm, '<h2 style="margin-top:28px; margin-bottom:16px; font-weight:700; font-size: 1.3rem; color: var(--text-primary);">$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/> \[!TIP\]\n> (.*?)\n/gs, '<div class="alert alert-info" style="margin: 16px 0; font-size: 0.95rem;"><strong>💡 Mẹo:</strong> $1</div>');
    html = html.replace(/> \[!IMPORTANT\]\n> (.*?)\n/gs, '<div class="alert alert-warning" style="margin: 16px 0; font-size: 0.95rem;"><strong>🌟 Quan trọng:</strong> $1</div>');
    html = html.replace(/> \[!CAUTION\]\n> (.*?)\n/gs, '<div class="alert alert-error" style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--color-danger); padding: 12px; margin: 16px 0; font-size: 0.95rem; color: var(--text-primary);"><strong>⚠️ Chú ý:</strong> $1</div>');
    html = html.replace(/> (.*?)\n/gm, '<blockquote style="border-left: 4px solid var(--border); padding-left: 12px; margin: 16px 0; color: var(--text-muted);">$1</blockquote>');
    html = html.replace(/^- (.*?)$/gm, '<li style="margin-bottom: 8px; margin-left: 20px; list-style-type: disc;">$1</li>');
    html = html.replace(/^(\d+)\. (.*?)$/gm, '<li style="margin-bottom: 8px; margin-left: 20px; list-style-type: decimal;">$2</li>');
    html = html.replace(/^(?!<h|<ul|<ol|<li|<div|<blockquote)(.*)$/gm, '<p style="margin-bottom: 12px; line-height: 1.6;">$1</p>');
    html = html.replace(/<p style="margin-bottom: 12px; line-height: 1.6;">\s*<\/p>/g, '');

    return html;
}
