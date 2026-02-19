/**
 * ContentPilot v2 — Main Entry Point
 * Initializes Firebase, router, auth listener, and renders pages
 */
import './styles/index.css';
import { router } from './utils/router.js';
import { store } from './utils/state.js';
import { initAuthListener, authGuard } from './services/auth.js';
import { showOfflineBanner } from './utils/firebaseStatus.js';

// Pages (lazy-loaded)
async function loadPage(name) {
  switch (name) {
    case 'login': {
      const { renderLoginPage } = await import('./pages/login.js');
      return renderLoginPage;
    }
    case 'dashboard': {
      const { renderDashboard } = await import('./pages/dashboard.js');
      return renderDashboard;
    }
    case 'create': {
      const { renderCreatePage } = await import('./pages/create.js');
      return renderCreatePage;
    }
    case 'brand': {
      const { renderBrandPage } = await import('./pages/brand.js');
      return renderBrandPage;
    }
    case 'library': {
      const { renderLibraryPage } = await import('./pages/library.js');
      return renderLibraryPage;
    }
    case 'settings': {
      const { renderSettingsPage } = await import('./pages/settings.js');
      return renderSettingsPage;
    }
    case 'calendar': {
      const { renderCalendarPage } = await import('./pages/calendar.js');
      return renderCalendarPage;
    }
    case 'templates': {
      const { renderTemplatesPage } = await import('./pages/templates.js');
      return renderTemplatesPage;
    }
    case 'team': {
      const { renderTeamPage } = await import('./pages/team.js');
      return renderTeamPage;
    }
    case 'conversions': {
      const { renderConversionDashboard } = await import('./pages/conversion-dashboard.js');
      return renderConversionDashboard;
    }
    case 'campaigns': {
      const { renderCampaignsPage } = await import('./pages/campaigns.js');
      return renderCampaignsPage;
    }
    case 'approvals': {
      const { renderApprovalsPage } = await import('./pages/approvals.js');
      return renderApprovalsPage;
    }
    case 'strategy': {
      const { renderStrategyPage } = await import('./pages/strategy.js');
      return renderStrategyPage;
    }
    default:
      return null;
  }
}

// Setup routes
router
  .before(authGuard)
  .on('login', async () => {
    const render = await loadPage('login');
    render?.();
  })
  .on('dashboard', async () => {
    const render = await loadPage('dashboard');
    await render?.();
  })
  .on('create', async () => {
    const render = await loadPage('create');
    render?.();
  })
  .on('brand', async () => {
    const render = await loadPage('brand');
    await render?.();
  })
  .on('library', async () => {
    const render = await loadPage('library');
    await render?.();
  })
  .on('settings', async () => {
    const render = await loadPage('settings');
    await render?.();
  })
  .on('calendar', async () => {
    const render = await loadPage('calendar');
    await render?.();
  })
  .on('templates', async () => {
    const render = await loadPage('templates');
    await render?.();
  })
  .on('team', async () => {
    const render = await loadPage('team');
    await render?.();
  })
  .on('conversions', async () => {
    const render = await loadPage('conversions');
    await render?.();
  })
  .on('campaigns', async () => {
    const render = await loadPage('campaigns');
    await render?.();
  })
  .on('approvals', async () => {
    const render = await loadPage('approvals');
    await render?.();
  })
  .on('strategy', async () => {
    const render = await loadPage('strategy');
    await render?.();
  });

// Initialize app
async function init() {
  console.log('🚀 ContentPilot v2 initializing...');

  // Show offline banner if Firebase not configured
  showOfflineBanner(document.body);

  try {
    // Wait for auth state with timeout (Firebase may not have config in dev)
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    const user = await Promise.race([initAuthListener(), timeout]);
    console.log('Auth state:', user ? `Logged in as ${user.displayName}` : 'Not logged in');

    // Initialize i18n and theme systems
    const { initI18n } = await import('./utils/i18n.js');
    const { initTheme } = await import('./utils/theme.js');

    await Promise.all([
      initI18n(user),
      initTheme(user)
    ]);
  } catch (error) {
    console.error('Init error:', error);
  }

  // Always start router (even if Firebase fails)
  router.start();
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
