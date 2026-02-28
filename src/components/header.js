/**
 * Header component — Enhanced sidebar with i18n, theme switching, and brand logo
 * Uses Duotone SVG icons for professional aesthetic.
 */
import { store } from '../utils/state.js';
import { router } from '../utils/router.js';
import { t, getLocale, getLocaleFlag, setLocale } from '../utils/i18n.js';
import { getTheme, getThemeIcon, toggleTheme } from '../utils/theme.js';
import { icon } from '../utils/icons.js';

// Navigation items (will be translated dynamically)
const NAV_ITEMS = [
  { route: 'dashboard', iconName: 'dashboard', labelKey: 'nav.dashboard' },
  { route: 'strategy', iconName: 'strategy', labelKey: 'strategy.title' },
  { route: 'campaigns', iconName: 'campaigns', labelKey: 'nav.campaigns' },
  { route: 'create', iconName: 'create', labelKey: 'content.draftStudio' },
  { route: 'designer', iconName: 'image', labelKey: 'nav.designer' },
  { route: 'library', iconName: 'library', labelKey: 'nav.library' },
  { route: 'koc', iconName: 'team', labelKey: 'nav.koc' },
  { route: 'calendar', iconName: 'calendar', labelKey: 'nav.calendar' },
  { route: 'conversions', iconName: 'conversions', labelKey: 'nav.conversions' },
  { route: 'approvals', iconName: 'approvals', labelKey: 'nav.approvals' },
  { route: 'templates', iconName: 'templates', labelKey: 'nav.templates' },
  { route: 'brand', iconName: 'brand', labelKey: 'brand.title' },
  { route: 'team', iconName: 'team', labelKey: 'nav.team' },
  { route: 'settings', iconName: 'settings', labelKey: 'nav.connections' },
  { route: 'help', iconName: 'info', labelKey: 'nav.help' },
];

export function renderSidebar() {
  const user = store.get('user');
  if (!user) return '';

  // Get brand settings (logo, name)
  const brand = store.get('brand') || {};
  const brandLogo = brand.logoUrl || '';
  const brandName = brand.name || 'Content Ops Copilot';

  const currentLocale = getLocale();
  const currentTheme = getTheme();

  // Render nav items with translations
  const navItems = NAV_ITEMS.map(item => `
    <a class="nav-item" data-route="${item.route}" href="#/${item.route}">
      <span class="nav-icon">${icon(item.iconName)}</span>
      <span class="nav-label">${t(item.labelKey)}</span>
    </a>
  `).join('');

  return `
    <nav class="sidebar" id="sidebar">
      <!-- Brand Logo & Name -->
      <div class="logo-section" style="margin-bottom: var(--space-8);">
        <div class="flex items-center gap-4" style="padding: var(--space-2) var(--space-4);">
          ${brandLogo
      ? `<img src="${brandLogo}" alt="${brandName}" style="max-height: 36px; max-width: 140px; object-fit: contain; border-radius: 6px; flex-shrink: 0;" />`
      : `<span class="nav-icon">${icon('plane', 28)}</span>`
    }
          <span class="logo-text" style="font-size: var(--font-xl); font-weight: 700;">${brandName}</span>
        </div>
      </div>

      <!-- Section Title -->
      <div class="nav-section-title" style="padding: var(--space-2) var(--space-4); font-size: var(--font-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">
        ${t('common.view')}
      </div>

      <!-- Navigation Items -->
      ${navItems}

      <!-- User Menu (bottom) -->
      <div style="margin-top: auto; border-top: 1px solid var(--border); padding-top: var(--space-4);">
        <!-- Language & Theme Switches -->
        <div style="display: flex; gap: var(--space-2); padding: var(--space-2) var(--space-4); margin-bottom: var(--space-2);">
          <button class="btn btn-ghost btn-sm" id="btn-locale-toggle" title="${t('common.language')}" style="flex: 1; font-size: var(--font-sm);">
            ${getLocaleFlag()} ${currentLocale.toUpperCase()}
          </button>
          <button class="btn btn-ghost btn-sm" id="btn-theme-toggle" title="${t('common.theme')}" style="flex: 1;">
            ${getThemeIcon()}
          </button>
        </div>

        <!-- User Info -->
        <div class="flex items-center gap-4" style="padding: var(--space-2) var(--space-4);">
          <img src="${user.photoURL || ''}" alt="" 
               style="width: 32px; height: 32px; border-radius: 50%; background: var(--surface);"
               onerror="this.style.display='none'">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: var(--font-sm); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.displayName || 'User'}</div>
            <div style="font-size: var(--font-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email || ''}</div>
          </div>
          <button class="btn btn-ghost btn-icon" id="btn-logout" title="${t('auth.signOut')}">${icon('logout', 18)}</button>
        </div>
      </div>
    </nav>

    <!-- Bottom Nav (Mobile) -->
    <nav class="bottom-nav" id="bottom-nav">
      <a href="#/dashboard" class="nav-item-mobile" data-route="dashboard">
        <span class="nav-icon">${icon('dashboard', 22)}</span>
        <span class="nav-label">${t('nav.dashboard')}</span>
      </a>
      <a href="#/calendar" class="nav-item-mobile" data-route="calendar">
        <span class="nav-icon">${icon('calendar', 22)}</span>
        <span class="nav-label">${t('nav.calendar')}</span>
      </a>
      <a href="#/create" class="nav-item-mobile star-btn" data-route="create">
        <span class="nav-icon">${icon('create', 22)}</span>
      </a>
      <a href="#/library" class="nav-item-mobile" data-route="library">
        <span class="nav-icon">${icon('library', 22)}</span>
        <span class="nav-label">${t('nav.library')}</span>
      </a>
      <a href="#/settings" class="nav-item-mobile" data-route="settings">
        <span class="nav-icon">${icon('settings', 22)}</span>
        <span class="nav-label">${t('nav.settings')}</span>
      </a>
    </nav>
  `;
}

export function attachSidebarEvents() {
  const user = store.get('user');

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { signOutUser } = await import('../services/auth.js');
      await signOutUser();
    });
  }

  // Language toggle
  const localeBtn = document.getElementById('btn-locale-toggle');
  if (localeBtn) {
    localeBtn.addEventListener('click', async () => {
      localeBtn.disabled = true;
      const current = getLocale();
      const next = current === 'vi' ? 'en' : 'vi';
      await setLocale(next, user);
      router.resolve();
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', async () => {
      themeBtn.disabled = true;
      await toggleTheme(user);
      router.resolve();
    });
  }
}
