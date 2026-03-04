/**
 * Header component — Enhanced sidebar with collapsible nav groups,
 * i18n, theme switching, and brand logo.
 * Uses Duotone SVG icons for professional aesthetic.
 */
import { store } from '../utils/state.js';
import { router } from '../utils/router.js';
import { t, getLocale, getLocaleFlag, setLocale } from '../utils/i18n.js';
import { getTheme, getThemeIcon, toggleTheme } from '../utils/theme.js';
import { icon } from '../utils/icons.js';

// Navigation groups with collapsible sections
const NAV_GROUPS = [
  {
    id: 'overview',
    labelKey: 'nav.group.overview',
    icon: 'dashboard',
    items: [
      { route: 'dashboard', iconName: 'dashboard', labelKey: 'nav.dashboard' },
      { route: 'strategy', iconName: 'strategy', labelKey: 'strategy.title' },
    ]
  },
  {
    id: 'content',
    labelKey: 'nav.group.content',
    icon: 'create',
    items: [
      { route: 'create', iconName: 'create', labelKey: 'content.draftStudio' },
      { route: 'designer', iconName: 'image', labelKey: 'nav.designer' },
      { route: 'library', iconName: 'library', labelKey: 'nav.library' },
      { route: 'templates', iconName: 'templates', labelKey: 'nav.templates' },
    ]
  },
  {
    id: 'campaigns',
    labelKey: 'nav.group.campaigns',
    icon: 'campaigns',
    items: [
      { route: 'campaigns', iconName: 'campaigns', labelKey: 'nav.campaigns' },
      { route: 'calendar', iconName: 'calendar', labelKey: 'nav.calendar' },
      { route: 'approvals', iconName: 'approvals', labelKey: 'nav.approvals' },
      { route: 'conversions', iconName: 'conversions', labelKey: 'nav.conversions' },
      { route: 'koc', iconName: 'team', labelKey: 'nav.koc' },
    ]
  },
  {
    id: 'settings',
    labelKey: 'nav.group.settings',
    icon: 'settings',
    items: [
      { route: 'brand', iconName: 'brand', labelKey: 'brand.title' },
      { route: 'products', iconName: 'document', labelKey: 'nav.products' },
      { route: 'customers', iconName: 'team', labelKey: 'nav.customers' },
      { route: 'markets', iconName: 'dashboard', labelKey: 'nav.markets' },
      { route: 'team', iconName: 'team', labelKey: 'nav.team' },
      { route: 'settings', iconName: 'settings', labelKey: 'nav.connections' },
      { route: 'help', iconName: 'info', labelKey: 'nav.help' },
    ]
  }
];

/** Get which group the current route belongs to */
function getActiveGroup(currentRoute) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.route === currentRoute) return group.id;
    }
  }
  return 'overview';
}

/** Get collapsed state from localStorage */
function getCollapsedGroups() {
  try {
    const stored = localStorage.getItem('cp_sidebar_collapsed');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/** Save collapsed state to localStorage */
function saveCollapsedGroups(state) {
  try {
    localStorage.setItem('cp_sidebar_collapsed', JSON.stringify(state));
  } catch { /* ignore */ }
}

export function renderSidebar() {
  const user = store.get('user');
  if (!user) return '';

  // Get brand settings (logo, name)
  const brand = store.get('brand') || {};
  const brandLogo = brand.logoUrl || '';
  const brandName = brand.name || 'Content Ops Copilot';

  const currentLocale = getLocale();
  const currentTheme = getTheme();

  // Determine active route from hash
  const currentRoute = location.hash.replace('#/', '').split('?')[0] || 'dashboard';
  const activeGroupId = getActiveGroup(currentRoute);
  const collapsedState = getCollapsedGroups();

  // Render nav groups
  const navGroupsHTML = NAV_GROUPS.map(group => {
    const isActive = group.id === activeGroupId;
    // If explicitly collapsed in storage, use that; otherwise expand the active group
    const isCollapsed = collapsedState[group.id] !== undefined
      ? collapsedState[group.id]
      : !isActive;

    const itemsHTML = group.items.map(item => `
      <a class="nav-item${item.route === currentRoute ? ' active' : ''}" data-route="${item.route}" href="#/${item.route}">
        <span class="nav-icon">${icon(item.iconName)}</span>
        <span class="nav-label">${t(item.labelKey)}</span>
      </a>
    `).join('');

    return `
      <div class="nav-group${isCollapsed ? ' collapsed' : ''}" data-group="${group.id}">
        <button class="nav-group-header" data-group-toggle="${group.id}" type="button">
          <span class="nav-group-icon">${icon(group.icon, 16)}</span>
          <span class="nav-group-label">${t(group.labelKey)}</span>
          <span class="nav-group-chevron">${icon('chevronDown', 14)}</span>
        </button>
        <div class="nav-group-items">
          ${itemsHTML}
        </div>
      </div>
    `;
  }).join('');

  return `
    <nav class="sidebar" id="sidebar">
      <!-- Brand Logo & Name -->
      <div class="logo-section" style="margin-bottom: var(--space-4);">
        <div class="flex items-center gap-4" style="padding: var(--space-2) var(--space-4);">
          ${brandLogo
      ? `<img src="${brandLogo}" alt="${brandName}" style="max-height: 36px; max-width: 140px; object-fit: contain; border-radius: 6px; flex-shrink: 0;" />`
      : `<span class="nav-icon">${icon('plane', 28)}</span>`
    }
        </div>
      </div>

      <!-- Navigation Groups -->
      ${navGroupsHTML}

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
      <a href="#/create" class="nav-item-mobile fab-btn" data-route="create">
        <span class="nav-icon">${icon('plus', 24)}</span>
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

  // --- Collapsible group toggle ---
  document.querySelectorAll('.nav-group-header[data-group-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const groupId = btn.dataset.groupToggle;
      const groupEl = btn.closest('.nav-group');
      if (!groupEl) return;

      const isNowCollapsed = !groupEl.classList.contains('collapsed');
      groupEl.classList.toggle('collapsed');

      // Persist state
      const state = getCollapsedGroups();
      state[groupId] = isNowCollapsed;
      saveCollapsedGroups(state);
    });
  });

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
