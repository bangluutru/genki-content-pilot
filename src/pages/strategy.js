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

  const products = Array.isArray(brand.products) ? brand.products : [];
  const avatars = Array.isArray(brand.avatars) ? brand.avatars : [];

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
        <div class="flex flex-col gap-4">
          <!-- Products Dropdown -->
          <div class="input-group">
            <label for="strategy-product-select">${icon('gift', 16)} ${t('brand.productsList')} *</label>
            <select id="strategy-product-select" class="select" required>
              <option value="">-- Chọn Sản phẩm / Dịch vụ --</option>
              ${products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
              <option value="custom" ${products.length === 0 ? 'selected' : ''}>+ Nhập thủ công (Custom)</option>
            </select>
          </div>
          <div class="input-group ${products.length === 0 ? '' : 'hidden'}" id="strategy-product-custom-group">
            <label for="strategy-product">${t('create.productLabel')}</label>
            <input type="text" id="strategy-product" class="input" placeholder="${t('create.productPlaceholder')}">
          </div>

          <!-- Avatars Dropdown -->
          <div class="input-group">
            <label for="strategy-avatars-select">👥 ${t('brand.avatarsList')}</label>
            <select id="strategy-avatars-select" class="select">
              <option value="">-- Mặc định theo sản phẩm / thương hiệu --</option>
              ${avatars.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}
              <option value="custom" ${avatars.length === 0 ? 'selected' : ''}>+ Nhập thủ công (Custom)</option>
            </select>
          </div>
          <div class="input-group ${avatars.length === 0 ? '' : 'hidden'}" id="strategy-avatars-custom-group">
            <label for="strategy-avatars">Đối tượng Khách hàng (Tùy chỉnh)</label>
            <input type="text" id="strategy-avatars" class="input" placeholder="VD: Mẹ bỉm sửa nửa đêm, Dân văn phòng đau lưng (cách nhau bằng dấu phẩy)">
          </div>

          <!-- Goal Input -->
          <div>
            <label style="font-weight: 600; display: block; margin-bottom: var(--space-2);">
              ${icon('target', 18)} ${t('strategy.businessGoal')} *
            </label>
            <div class="flex gap-4">
              <input type="text" id="business-goal" class="input" 
                     placeholder="${t('strategy.goalPlaceholder')}" 
                     style="flex: 1; padding: var(--space-3);" required>
              <button class="btn btn-primary" id="btn-generate-ideas" style="min-width: 200px;">
                ${t('strategy.generateIdeas')}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Quick Strategy Templates -->
        <div style="margin-top: var(--space-3);">
          <span class="text-xs text-muted" style="display: block; margin-bottom: var(--space-2);">${t('strategy.quickTemplates')}:</span>
          <div class="flex gap-2" style="flex-wrap: wrap;">
            <button class="btn btn-ghost btn-sm strategy-preset" data-goal="${t('strategy.templateSales')}" style="border: 1px solid var(--border); border-radius: 20px; font-size: 12px; padding: 4px 14px; transition: all 0.2s;">
              📈 ${t('strategy.templateSales')}
            </button>
            <button class="btn btn-ghost btn-sm strategy-preset" data-goal="${t('strategy.templateAwareness')}" style="border: 1px solid var(--border); border-radius: 20px; font-size: 12px; padding: 4px 14px; transition: all 0.2s;">
              🎯 ${t('strategy.templateAwareness')}
            </button>
            <button class="btn btn-ghost btn-sm strategy-preset" data-goal="${t('strategy.templateLeadGen')}" style="border: 1px solid var(--border); border-radius: 20px; font-size: 12px; padding: 4px 14px; transition: all 0.2s;">
              🧲 ${t('strategy.templateLeadGen')}
            </button>
            <button class="btn btn-ghost btn-sm strategy-preset" data-goal="${t('strategy.templateLaunch')}" style="border: 1px solid var(--border); border-radius: 20px; font-size: 12px; padding: 4px 14px; transition: all 0.2s;">
              🚀 ${t('strategy.templateLaunch')}
            </button>
            <button class="btn btn-ghost btn-sm strategy-preset" data-goal="${t('strategy.templateClearance')}" style="border: 1px solid var(--border); border-radius: 20px; font-size: 12px; padding: 4px 14px; transition: all 0.2s;">
              🏷️ ${t('strategy.templateClearance')}
            </button>
          </div>
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
  // Context Library Select toggles
  document.getElementById('strategy-product-select')?.addEventListener('change', (e) => {
    const customGroup = document.getElementById('strategy-product-custom-group');
    if (customGroup) customGroup.classList.toggle('hidden', e.target.value !== 'custom');
    if (e.target.value === 'custom') document.getElementById('strategy-product')?.focus();
  });

  document.getElementById('strategy-avatars-select')?.addEventListener('change', (e) => {
    const customGroup = document.getElementById('strategy-avatars-custom-group');
    if (customGroup) customGroup.classList.toggle('hidden', e.target.value !== 'custom');
    if (e.target.value === 'custom') document.getElementById('strategy-avatars')?.focus();
  });

  // Trigger initial state
  document.getElementById('strategy-product-select')?.dispatchEvent(new Event('change'));
  document.getElementById('strategy-avatars-select')?.dispatchEvent(new Event('change'));

  const btnGenerate = document.getElementById('btn-generate-ideas');
  const inputGoal = document.getElementById('business-goal');
  const resultsDiv = document.getElementById('strategy-results');
  const loadingDiv = document.getElementById('strategy-loading');
  const ideasGrid = document.getElementById('ideas-grid');

  btnGenerate?.addEventListener('click', async () => {
    const goal = inputGoal.value.trim();
    if (!goal) {
      showToast(t('validation.required'), 'warning');
      inputGoal.focus();
      return;
    }

    // Handle Context Extraciton
    const productSelect = document.getElementById('strategy-product-select')?.value;
    let productStr = '';
    if (productSelect === 'custom') {
      productStr = document.getElementById('strategy-product')?.value?.trim();
    } else if (productSelect) {
      const pObj = (brand.products || []).find(p => p.id === productSelect);
      if (pObj) productStr = `${pObj.name} - ${pObj.highlight}`;
    } else {
      productStr = document.getElementById('strategy-product')?.value?.trim();
    }

    if (!productStr) {
      showToast(t('create.productRequired'), 'warning');
      document.getElementById('strategy-product-select')?.focus();
      return;
    }

    const avatarSelect = document.getElementById('strategy-avatars-select')?.value;
    let avatarsStr = '';
    if (avatarSelect === 'custom') {
      avatarsStr = document.getElementById('strategy-avatars')?.value?.trim();
    } else if (avatarSelect) {
      const aObj = (brand.avatars || []).find(a => a.id === avatarSelect);
      if (aObj) avatarsStr = `${aObj.name} (${aObj.description})`;
    } else {
      avatarsStr = document.getElementById('strategy-avatars')?.value?.trim();
    }

    const strategyContext = {
      goal: goal,
      product: productStr,
      avatars: avatarsStr
    };

    // UI state: Loading
    btnGenerate.disabled = true;
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
      const ideas = await generateStrategy(brand, strategyContext);
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

  // Quick templates — click to auto-fill goal input
  document.querySelectorAll('.strategy-preset').forEach(chip => {
    chip.addEventListener('click', () => {
      const goal = chip.dataset.goal;
      inputGoal.value = goal;
      inputGoal.focus();

      // Highlight active chip
      document.querySelectorAll('.strategy-preset').forEach(c => {
        c.style.background = '';
        c.style.borderColor = 'var(--border)';
        c.style.color = '';
      });
      chip.style.background = 'var(--color-primary)';
      chip.style.borderColor = 'var(--color-primary)';
      chip.style.color = '#fff';
    });
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
