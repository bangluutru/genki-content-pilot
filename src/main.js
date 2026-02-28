/**
 * ContentPilot v2 — Main Entry Point
 * Initializes Firebase, router, auth listener, and renders pages
 */
import './styles/index.css';
import { router } from './utils/router.js';
import { store } from './utils/state.js';
import { initAuthListener, authGuard } from './services/auth.js';
import { initHelpWidget, updateHelpContext } from './components/help-widget.js';
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
    case 'campaign-detail': {
      const { renderCampaignDetailPage } = await import('./pages/campaign-detail.js');
      return renderCampaignDetailPage;
    }
    case 'koc': {
      const { renderKocPage } = await import('./pages/koc.js');
      return renderKocPage;
    }
    case 'designer': {
      const { renderDesignerPage } = await import('./pages/designer.js');
      return renderDesignerPage;
    }
    case 'help': {
      const { renderHelpPage } = await import('./pages/help.js');
      return renderHelpPage;
    }
    default:
      return null;
  }
}

// Helper: re-inject help widget after each page render (page renders wipe the DOM)
function afterPageRender(routeId) {
  // Only show widget for authenticated pages (not login)
  if (routeId === 'login') return;
  const user = store.get('user');
  if (!user) return;
  // Small delay to let page settle
  setTimeout(() => {
    initHelpWidget();
    updateHelpContext(routeId);
  }, 50);
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
    afterPageRender('dashboard');
  })
  .on('create', async (params) => {
    const render = await loadPage('create');
    await render?.(params);
    afterPageRender('create');
  })
  .on('brand', async () => {
    const render = await loadPage('brand');
    await render?.();
    afterPageRender('brand');
  })
  .on('library', async () => {
    const render = await loadPage('library');
    await render?.();
    afterPageRender('library');
  })
  .on('settings', async () => {
    const render = await loadPage('settings');
    await render?.();
    afterPageRender('settings');
  })
  .on('calendar', async () => {
    const render = await loadPage('calendar');
    await render?.();
    afterPageRender('calendar');
  })
  .on('templates', async () => {
    const render = await loadPage('templates');
    await render?.();
    afterPageRender('templates');
  })
  .on('team', async () => {
    const render = await loadPage('team');
    await render?.();
    afterPageRender('team');
  })
  .on('conversions', async () => {
    const render = await loadPage('conversions');
    await render?.();
    afterPageRender('conversions');
  })
  .on('campaigns', async () => {
    const render = await loadPage('campaigns');
    await render?.();
    afterPageRender('campaigns');
  })
  .on('approvals', async () => {
    const render = await loadPage('approvals');
    await render?.();
    afterPageRender('approvals');
  })
  .on('strategy', async () => {
    const render = await loadPage('strategy');
    await render?.();
    afterPageRender('strategy');
  })
  .on('campaign-detail', async (params) => {
    const render = await loadPage('campaign-detail');
    await render?.(params);
    afterPageRender('campaign-detail');
  })
  .on('koc', async () => {
    const render = await loadPage('koc');
    await render?.();
    afterPageRender('koc');
  })
  .on('designer', async () => {
    const render = await loadPage('designer');
    await render?.();
    afterPageRender('designer');
  })
  .on('help', async () => {
    const render = await loadPage('help');
    await render?.();
    // No widget on help page itself — it IS the help page
  });

// Initialize app
async function init() {


  // Show offline banner if Firebase not configured
  showOfflineBanner(document.body);

  try {
    // Wait for auth state with timeout (Firebase may not have config in dev)
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    const user = await Promise.race([initAuthListener(), timeout]);


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

  // Initialize Smart Help Widget
  initHelpWidget();
  window.addEventListener('hashchange', () => {
    const route = location.hash.replace('#/', '').split('?')[0] || 'home';
    updateHelpContext(route);
  });
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
