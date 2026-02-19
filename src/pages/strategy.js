/**
 * Strategy Hub — Ideation Center
 * Input Business Goal -> AI generates Campaign Strategy
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { generateStrategy } from '../services/gemini.js';
import { loadBrand } from '../services/firestore.js';
import { t } from '../utils/i18n.js';
import { router } from '../utils/router.js';
import { icon } from '../utils/icons.js';

export async function renderStrategyPage() {
  const app = document.getElementById('app');
  const brand = store.get('brand') || await loadBrand();

  if (!brand || !brand.name) {
    showToast(t('dashboard.brandSetupTip'), 'warning');
    router.navigate('brand');
    return;
  }

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('strategy', 28)} ${t('strategy.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('strategy.subtitle')}
          </p>
        </div>
      </div>

      <!-- Business Goal Input -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <label style="font-weight: 600; display: block; margin-bottom: var(--space-2);">
          ${icon('target', 18)} ${t('strategy.businessGoal')}
        </label>
        <div class="flex gap-4">
          <input type="text" id="business-goal" class="input" 
                 placeholder="${t('strategy.goalPlaceholder')}" 
                 style="flex: 1; padding: var(--space-3);" >
          <button class="btn btn-primary" id="btn-generate-ideas" style="min-width: 200px;">
            ${t('strategy.generateIdeas')}
          </button>
        </div>
      </div>

      <!-- Results Section -->
      <div id="strategy-results" class="hidden">
        <h3 style="margin-bottom: var(--space-4);">${t('strategy.ideasTitle')}</h3>
        <div id="ideas-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4);">
          <!-- Ideas will be rendered here -->
        </div>
      </div>

      <!-- Loading State -->
      <div id="strategy-loading" class="hidden" style="text-align: center; padding: var(--space-12);">
        <div class="loading-spinner" style="margin: 0 auto;"></div>
        <p style="margin-top: var(--space-4);" class="text-muted">${t('strategy.generating')}</p>
      </div>

    </main>
  `;

  attachSidebarEvents();
  attachStrategyEvents(brand);
}

function attachStrategyEvents(brand) {
  const btnGenerate = document.getElementById('btn-generate-ideas');
  const inputGoal = document.getElementById('business-goal');
  const resultsDiv = document.getElementById('strategy-results');
  const loadingDiv = document.getElementById('strategy-loading');
  const ideasGrid = document.getElementById('ideas-grid');

  btnGenerate?.addEventListener('click', async () => {
    const goal = inputGoal.value.trim();
    if (!goal) {
      showToast(t('validation.required'), 'warning');
      return;
    }

    // UI state: Loading
    btnGenerate.disabled = true;
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
      const ideas = await generateStrategy(brand, goal);
      renderIdeas(ideas);

      loadingDiv.classList.add('hidden');
      resultsDiv.classList.remove('hidden');
    } catch (error) {
      console.error('Strategy error:', error);
      showToast(t('errors.generic') + ': ' + error.message, 'error');
      loadingDiv.classList.add('hidden');
    } finally {
      btnGenerate.disabled = false;
    }
  });
}

function renderIdeas(ideas) {
  const grid = document.getElementById('ideas-grid');
  if (!grid) return;

  if (!ideas || ideas.length === 0) {
    grid.innerHTML = `<p>${t('strategy.noIdeas')}</p>`;
    return;
  }

  grid.innerHTML = ideas.map(idea => `
    <div class="card strategy-card" style="display: flex; flex-direction: column; height: 100%;">
      <div style="margin-bottom: var(--space-4);">
        <span class="badge badge-info" style="margin-bottom: var(--space-2); display: inline-block;">
          ${idea.angle || 'Angle'}
        </span>
        <h4 style="font-size: var(--font-lg); font-weight: 700;">${idea.name}</h4>
      </div>
      
      <p style="color: var(--text-muted); font-size: var(--font-sm); flex: 1; margin-bottom: var(--space-4);">
        ${idea.description}
      </p>

      <div style="background: var(--surface-hover); padding: var(--space-3); border-radius: var(--radius-sm); margin-bottom: var(--space-4);">
        <span style="font-size: var(--font-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">HOOK</span>
        <p style="font-style: italic; margin-top: 4px;">"${idea.hook}"</p>
      </div>

      <button class="btn btn-outline btn-full btn-use-strategy" data-json='${JSON.stringify(idea).replace(/'/g, "&#39;")}'>
        ${icon('publish', 16)} ${t('strategy.createCampaign')}
      </button>
    </div>
  `).join('');

  // Attach events to new buttons
  document.querySelectorAll('.btn-use-strategy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idea = JSON.parse(e.target.dataset.json);
      useStrategy(idea);
    });
  });
}

function useStrategy(idea) {
  // Store idea in session to pre-fill campaign modal
  // We can use query params or store, but store is cleaner for complex objects
  // For MVP, allow copying name/desc to clipboard or redirecting

  // Navigate to Campaigns page with query params
  const params = new URLSearchParams({
    action: 'create',
    name: idea.name,
    brief: idea.description
  });

  window.location.hash = `#/campaigns?${params.toString()}`;
}
