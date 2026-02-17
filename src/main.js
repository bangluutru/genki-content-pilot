/**
 * ContentPilot v2 — Main Entry Point
 * Initializes Firebase, router, auth listener, and renders pages
 */
import './styles/index.css';
import { router } from './utils/router.js';
import { store } from './utils/state.js';
import { initAuthListener, authGuard } from './services/auth.js';

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
  });

// Initialize app
async function init() {
  console.log('🚀 ContentPilot v2 initializing...');

  try {
    // Wait for auth state with timeout (Firebase may not have config in dev)
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    const user = await Promise.race([initAuthListener(), timeout]);
    console.log('Auth state:', user ? `Logged in as ${user.displayName}` : 'Not logged in');
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
