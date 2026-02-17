/**
 * Header component — Sidebar navigation (desktop) / Bottom nav (mobile)
 */
import { store } from '../utils/state.js';
import { router } from '../utils/router.js';

const NAV_ITEMS = [
  { route: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { route: 'create', icon: '✨', label: 'Tạo bài' },
  { route: 'library', icon: '📚', label: 'Thư viện' },
  { route: 'calendar', icon: '📅', label: 'Lịch' },
  { route: 'templates', icon: '📋', label: 'Templates' },
  { route: 'brand', icon: '🎨', label: 'Brand' },
  { route: 'team', icon: '👥', label: 'Nhóm' },
  { route: 'settings', icon: '⚙️', label: 'Kết nối' },
];

export function renderSidebar() {
  const user = store.get('user');
  if (!user) return '';

  const navItems = NAV_ITEMS.map(item => `
    <a class="nav-item" data-route="${item.route}" href="#/${item.route}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>
  `).join('');

  return `
    <nav class="sidebar" id="sidebar">
      <div class="logo-section" style="margin-bottom: var(--space-8);">
        <div class="flex items-center gap-4" style="padding: var(--space-2) var(--space-4);">
          <span style="font-size: 1.5rem;">✈️</span>
          <span class="logo-text" style="font-size: var(--font-xl);">ContentPilot</span>
        </div>
      </div>

      <div class="nav-section-title" style="padding: var(--space-2) var(--space-4); font-size: var(--font-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">
        Menu
      </div>

      ${navItems}

      <div style="margin-top: auto; border-top: 1px solid var(--border-color); padding-top: var(--space-4);">
        <div class="flex items-center gap-4" style="padding: var(--space-2) var(--space-4);">
          <img src="${user.photoURL || ''}" alt="" 
               style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary);"
               onerror="this.style.display='none'">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: var(--font-sm); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.displayName || 'User'}</div>
            <div style="font-size: var(--font-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email || ''}</div>
          </div>
          <button class="btn btn-ghost btn-icon" id="btn-logout" title="Đăng xuất">🚪</button>
        </div>
      </div>
    </nav>
  `;
}

export function attachSidebarEvents() {
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { signOutUser } = await import('../services/auth.js');
      await signOutUser();
    });
  }
}
