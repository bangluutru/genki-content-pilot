/**
 * Campaign Detail Page — Pillars → Angles → Posts pipeline
 * Click a campaign card → see full detail with pillar/angle management
 */
import { store } from '../utils/state.js';
import { loadCampaigns, updateCampaignPillars, updateCampaignAngles, loadContents } from '../services/firestore.js';
import { loadBrand } from '../services/firestore.js';
import { generatePillars, generateAngles } from '../services/gemini.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { router } from '../utils/router.js';

let currentCampaign = null;
let currentTab = 'pillars';

export async function renderCampaignDetailPage(params) {
  const app = document.getElementById('app');
  const campaignId = params?.id;

  if (!campaignId) {
    router.navigate('campaigns');
    return;
  }

  // Load campaign data
  const campaigns = await loadCampaigns();
  currentCampaign = campaigns.find(c => c.id === campaignId);

  if (!currentCampaign) {
    showToast(t('errors.generic'), 'error');
    router.navigate('campaigns');
    return;
  }

  currentTab = 'pillars';
  renderPage(app);
}

function renderPage(app) {
  const c = currentCampaign;

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <!-- Header -->
      <div class="flex justify-between items-center mb-2">
        <div>
          <button class="btn btn-ghost btn-sm" id="btn-back-campaigns" style="margin-bottom: var(--space-2);">
            ${icon('arrow', 14)} ${t('campaign.title')}
          </button>
          <h1 style="font-size: var(--font-2xl);">${c.name}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">${c.brief || c.goal || ''}</p>
        </div>
        <div class="flex gap-2 items-center">
          <span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-accent'}">${t('status.' + (c.status || 'draft'))}</span>
        </div>
      </div>

      <!-- Step Tabs -->
      <div class="step-tabs" style="margin: var(--space-6) 0;">
        <button class="step-tab ${currentTab === 'pillars' ? 'active' : ''}" data-tab="pillars">
          <span class="step-tab-number">1</span>
          ${t('campaign.wizard.stepPillars')}
          <span class="step-tab-count">${c.pillars?.length || 0}</span>
        </button>
        <button class="step-tab ${currentTab === 'angles' ? 'active' : ''}" data-tab="angles">
          <span class="step-tab-number">2</span>
          ${t('campaign.wizard.stepAngles')}
          <span class="step-tab-count">${c.angles?.length || 0}</span>
        </button>
        <button class="step-tab ${currentTab === 'posts' ? 'active' : ''}" data-tab="posts">
          <span class="step-tab-number">3</span>
          ${t('content.posts')}
        </button>
      </div>

      <!-- Tab Content -->
      <div id="tab-content">
        ${renderTabContent()}
      </div>
    </main>
  `;

  attachSidebarEvents();
  attachDetailEvents();
}

// ===== Tab Content Renderers =====

function renderTabContent() {
  switch (currentTab) {
    case 'pillars': return renderPillarsTab();
    case 'angles': return renderAnglesTab();
    case 'posts': return renderPostsTab();
    default: return '';
  }
}

function renderPillarsTab() {
  const pillars = currentCampaign.pillars || [];

  if (pillars.length === 0) {
    return `
      <div class="card-flat text-center" style="padding: var(--space-10);">
        <div style="margin-bottom: var(--space-4);">${icon('strategy', 48)}</div>
        <h3 style="margin-bottom: var(--space-2);">${t('pillar.title')}</h3>
        <p class="text-muted" style="margin-bottom: var(--space-6);">
          ${t('campaignDetail.pillarsEmpty')}
        </p>
        <div class="flex gap-3 justify-center">
          <button class="btn btn-primary" id="btn-generate-pillars">
            ${icon('sparkle', 16)} ${t('campaign.wizard.generatePillars')}
          </button>
          <button class="btn btn-outline" id="btn-add-pillar-manual">
            ${icon('plus', 16)} ${t('pillar.create')}
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="flex justify-between items-center" style="margin-bottom: var(--space-4);">
      <h3>${icon('strategy', 20)} ${t('pillar.title')} (${pillars.length})</h3>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm" id="btn-generate-pillars">
          ${icon('sparkle', 14)} ${t('campaign.wizard.generatePillars')}
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-add-pillar-manual">
          ${icon('plus', 14)} ${t('pillar.create')}
        </button>
      </div>
    </div>
    <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
      ${pillars.map((p, i) => `
        <div class="card pillar-card" data-index="${i}">
          <div class="flex justify-between items-start">
            <div style="flex: 1;">
              <div class="flex items-center gap-2 mb-2">
                <span class="badge ${getPriorityBadge(p.priority)}" style="font-size: var(--font-xs);">${p.priority || 'medium'}</span>
              </div>
              <h4 style="font-weight: 700; margin-bottom: var(--space-2);">${p.name}</h4>
              <p class="text-sm text-muted" style="margin-bottom: var(--space-3);">${p.description || ''}</p>
              ${p.suggestedCadence ? `<span class="text-xs text-muted">${icon('clock', 12)} ${p.suggestedCadence}</span>` : ''}
            </div>
            <button class="btn btn-ghost btn-icon btn-delete-pillar" data-index="${i}" title="${t('actions.delete')}">
              ${icon('trash', 14)}
            </button>
          </div>
          <div style="margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border-color);">
            <button class="btn btn-outline btn-sm btn-full btn-gen-angles-for-pillar" data-index="${i}">
              ${icon('sparkle', 14)} ${t('campaignDetail.generateAnglesFor')}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAnglesTab() {
  const pillars = currentCampaign.pillars || [];
  const angles = currentCampaign.angles || [];

  if (pillars.length === 0) {
    return `
      <div class="card-flat text-center" style="padding: var(--space-10);">
        <div style="margin-bottom: var(--space-4);">${icon('target', 48)}</div>
        <h3 style="margin-bottom: var(--space-2);">${t('campaignDetail.needPillarsFirst')}</h3>
        <p class="text-muted" style="margin-bottom: var(--space-4);">
          ${t('campaignDetail.pillarsFirstDesc')}
        </p>
        <button class="btn btn-primary" data-tab="pillars" id="btn-go-pillars">
          ${icon('arrow', 14)} ${t('campaign.wizard.stepPillars')}
        </button>
      </div>
    `;
  }

  if (angles.length === 0) {
    return `
      <div class="card-flat text-center" style="padding: var(--space-10);">
        <div style="margin-bottom: var(--space-4);">${icon('target', 48)}</div>
        <h3 style="margin-bottom: var(--space-2);">${t('empty.noAngles.title')}</h3>
        <p class="text-muted" style="margin-bottom: var(--space-6);">
          ${t('empty.noAngles.body')}
        </p>
        <div class="flex gap-3 justify-center">
          <button class="btn btn-primary" id="btn-generate-all-angles">
            ${icon('sparkle', 16)} ${t('campaignDetail.generateAllAngles')}
          </button>
          <button class="btn btn-outline" id="btn-add-angle-manual">
            ${icon('plus', 16)} ${t('angle.create')}
          </button>
        </div>
      </div>
    `;
  }

  // Group angles by pillarId
  return `
    <div class="flex justify-between items-center" style="margin-bottom: var(--space-4);">
      <h3>${icon('target', 20)} ${t('angle.title')} (${angles.length})</h3>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm" id="btn-generate-all-angles">
          ${icon('sparkle', 14)} ${t('campaignDetail.generateAllAngles')}
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-add-angle-manual">
          ${icon('plus', 14)} ${t('angle.create')}
        </button>
      </div>
    </div>
    ${renderAnglesGroupedByPillar(pillars, angles)}
  `;
}

function renderAnglesGroupedByPillar(pillars, angles) {
  return pillars.map(pillar => {
    const pillarAngles = angles.filter(a => a.pillarId === pillar.id);
    if (pillarAngles.length === 0) return '';

    return `
      <div class="pillar-section" style="margin-bottom: var(--space-6);">
        <div class="flex items-center gap-2" style="margin-bottom: var(--space-3);">
          <span class="badge badge-muted">${pillar.name}</span>
          <span class="text-xs text-muted">${pillarAngles.length} angles</span>
        </div>
        <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          ${pillarAngles.map(angle => `
            <div class="card angle-card">
              <div class="flex justify-between items-start">
                <div style="flex: 1;">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="badge badge-info" style="font-size: var(--font-xs);">${angle.type || 'general'}</span>
                    ${angle.suggestedFormat ? `<span class="text-xs text-muted">${angle.suggestedFormat}</span>` : ''}
                  </div>
                  <h4 style="font-weight: 600; margin-bottom: var(--space-2); font-size: var(--font-sm);">${angle.name}</h4>
                </div>
                <button class="btn btn-ghost btn-icon btn-delete-angle" data-id="${angle.id}" title="${t('actions.delete')}">
                  ${icon('trash', 12)}
                </button>
              </div>
              ${angle.hook ? `
                <div style="background: var(--surface-hover); padding: var(--space-2); border-radius: var(--radius-sm); margin-bottom: var(--space-2);">
                  <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">HOOK</span>
                  <p style="font-style: italic; font-size: var(--font-xs); margin-top: 2px;">"${angle.hook}"</p>
                </div>
              ` : ''}
              ${angle.keyMessage ? `
                <p class="text-xs text-muted">${icon('cursor', 10)} ${angle.keyMessage}</p>
              ` : ''}
              <div style="margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border-color);">
                <button class="btn btn-primary btn-sm btn-full btn-create-post-from-angle" data-angle-id="${angle.id}">
                  ✨ Tạo bài viết
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('') || `<p class="text-muted text-center">${t('campaignDetail.noAnglesForPillars')}</p>`;
}

function renderPostsTab() {
  setTimeout(loadAndRenderPosts, 0); // Trigger async render
  return `
    <div id="posts-container" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
      <span class="loading-spinner"></span>
    </div>
  `;
}

async function loadAndRenderPosts() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  try {
    const allContents = await loadContents(100);
    // Filter by campaign
    const campaignPosts = allContents.filter(c => c.campaignId === currentCampaign.id);

    if (campaignPosts.length === 0) {
      container.innerHTML = `
        <div class="card-flat text-center" style="padding: var(--space-10);">
          <div style="margin-bottom: var(--space-4);">${icon('document', 48)}</div>
          <h3 style="margin-bottom: var(--space-2);">${t('campaignDetail.postsEmpty') || 'Chưa có bài viết nào'}</h3>
          <p class="text-muted" style="margin-bottom: var(--space-6);">
            ${t('campaignDetail.postsEmptyDesc') || 'Vui lòng bắt đầu tạo nội dung từ các Angle trong chiến dịch.'}
          </p>
        </div>
      `;
      return;
    }

    // Render list
    container.innerHTML = `
      <div class="flex justify-between items-center" style="margin-bottom: var(--space-4);">
        <h3>${icon('document', 20)} Bài viết thuộc chiến dịch (${campaignPosts.length})</h3>
      </div>
      <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
        ${campaignPosts.map(post => `
          <div class="card flex flex-col justify-between" style="padding: var(--space-4);">
             <div style="margin-bottom: var(--space-2);">
               <div class="flex gap-2 items-center mb-2">
                 <span class="badge ${post.status === 'published' ? 'badge-success' : 'badge-accent'}">${post.status}</span>
                 <span class="text-xs text-muted">${new Date(post.createdAt).toLocaleDateString()}</span>
               </div>
               <h4 style="font-size: var(--font-sm); font-weight: 600; line-height: 1.4; margin-bottom: var(--space-1);">${post.brief || 'Bài viết'}</h4>
               <p class="text-xs text-muted mb-2">Platform: ${post.publishedTo?.join(', ') || 'Draft'}</p>
             </div>
             <p class="text-sm text-muted" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-style: italic;">
               ${(post.facebook || post.blog || post.story || '').substring(0, 100)}...
             </p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<p class="text-danger text-center">Lỗi tải bài viết: ${error.message}</p>`;
  }
}

// ===== Helper =====

function getPriorityBadge(priority) {
  switch (priority) {
    case 'high': return 'badge-success';
    case 'low': return 'badge-muted';
    default: return 'badge-accent';
  }
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ===== Events =====

function attachDetailEvents() {
  const app = document.getElementById('app');

  // Back button
  document.getElementById('btn-back-campaigns')?.addEventListener('click', () => {
    router.navigate('campaigns');
  });

  // Tab switching
  document.querySelectorAll('.step-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab;
      const tabContent = document.getElementById('tab-content');
      if (tabContent) tabContent.innerHTML = renderTabContent();
      // Update active tab styling
      document.querySelectorAll('.step-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      attachTabEvents();
    });
  });

  attachTabEvents();
}

function attachTabEvents() {
  // Generate Pillars
  document.getElementById('btn-generate-pillars')?.addEventListener('click', handleGeneratePillars);

  // Add Pillar manually
  document.getElementById('btn-add-pillar-manual')?.addEventListener('click', handleAddPillarManual);

  // Delete Pillar
  document.querySelectorAll('.btn-delete-pillar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      handleDeletePillar(index);
    });
  });

  // Generate Angles for specific pillar
  document.querySelectorAll('.btn-gen-angles-for-pillar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      handleGenerateAnglesForPillar(index);
    });
  });

  // Generate All Angles
  document.getElementById('btn-generate-all-angles')?.addEventListener('click', handleGenerateAllAngles);

  // Add Angle manually
  document.getElementById('btn-add-angle-manual')?.addEventListener('click', handleAddAngleManual);

  // Delete Angle
  document.querySelectorAll('.btn-delete-angle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      handleDeleteAngle(id);
    });
  });

  // Go to Pillars tab from Angles empty state
  document.getElementById('btn-go-pillars')?.addEventListener('click', () => {
    currentTab = 'pillars';
    renderPage(document.getElementById('app'));
  });

  // Create Post from Angle
  document.querySelectorAll('.btn-create-post-from-angle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const angleId = e.currentTarget.dataset.angleId;
      router.navigate(`create?campaignId=${currentCampaign.id}&angleId=${angleId}`);
    });
  });

  // Go to Create page
  document.getElementById('btn-go-create')?.addEventListener('click', () => {
    router.navigate('create');
  });
}

// ===== Handlers =====

async function handleGeneratePillars() {
  const btn = document.getElementById('btn-generate-pillars');
  if (!btn) return;

  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner-sm"></span> ${t('strategy.generating')}`;

  try {
    const brand = store.get('brand') || await loadBrand();
    const brief = currentCampaign.brief || currentCampaign.name;
    const aiPillars = await generatePillars(brand, brief);

    // Add IDs to pillars and merge with existing
    const existingPillars = currentCampaign.pillars || [];
    const newPillars = aiPillars.map(p => ({
      ...p,
      id: generateId()
    }));

    const allPillars = [...existingPillars, ...newPillars];
    currentCampaign.pillars = allPillars;

    await updateCampaignPillars(currentCampaign.id, allPillars);
    showToast(`${allPillars.length} pillars ${t('toasts.saved')}`, 'success');

    // Re-render
    renderPage(document.getElementById('app'));
  } catch (error) {
    console.error('Generate pillars error:', error);
    showToast(t('errors.generic') + ': ' + error.message, 'error');
    btn.disabled = false;
    btn.innerHTML = `${icon('sparkle', 14)} ${t('campaign.wizard.generatePillars')}`;
  }
}

function handleAddPillarManual() {
  const name = prompt(t('pillar.name') + ':');
  if (!name?.trim()) return;

  const description = prompt(t('campaignDetail.pillarDescPrompt') + ':') || '';

  const pillar = {
    id: generateId(),
    name: name.trim(),
    description: description.trim(),
    priority: 'medium',
    suggestedCadence: ''
  };

  const pillars = [...(currentCampaign.pillars || []), pillar];
  currentCampaign.pillars = pillars;

  updateCampaignPillars(currentCampaign.id, pillars);
  showToast(t('toasts.saved'), 'success');
  renderPage(document.getElementById('app'));
}

async function handleDeletePillar(index) {
  if (!confirm(t('common.confirm'))) return;

  const pillars = [...(currentCampaign.pillars || [])];
  const removedPillar = pillars[index];
  pillars.splice(index, 1);
  currentCampaign.pillars = pillars;

  // Also remove angles associated with this pillar
  if (removedPillar) {
    const angles = (currentCampaign.angles || []).filter(a => a.pillarId !== removedPillar.id);
    currentCampaign.angles = angles;
    await updateCampaignAngles(currentCampaign.id, angles);
  }

  await updateCampaignPillars(currentCampaign.id, pillars);
  showToast(t('toasts.deleted'), 'success');
  renderPage(document.getElementById('app'));
}

async function handleGenerateAnglesForPillar(pillarIndex) {
  const pillar = currentCampaign.pillars?.[pillarIndex];
  if (!pillar) return;

  const btn = document.querySelector(`.btn-gen-angles-for-pillar[data-index="${pillarIndex}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner-sm"></span> ${t('strategy.generating')}`;
  }

  try {
    const brand = store.get('brand') || await loadBrand();
    const brief = currentCampaign.brief || currentCampaign.name;
    const aiAngles = await generateAngles(brand, pillar, brief);

    const newAngles = aiAngles.map(a => ({
      ...a,
      id: generateId(),
      pillarId: pillar.id
    }));

    const allAngles = [...(currentCampaign.angles || []), ...newAngles];
    currentCampaign.angles = allAngles;

    await updateCampaignAngles(currentCampaign.id, allAngles);
    showToast(`${newAngles.length} angles ${t('toasts.created')}`, 'success');

    // Switch to angles tab
    currentTab = 'angles';
    renderPage(document.getElementById('app'));
  } catch (error) {
    console.error('Generate angles error:', error);
    showToast(t('errors.generic') + ': ' + error.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `${icon('sparkle', 14)} ${t('campaignDetail.generateAnglesFor')}`;
    }
  }
}

async function handleGenerateAllAngles() {
  const pillars = currentCampaign.pillars || [];
  if (pillars.length === 0) {
    showToast(t('campaignDetail.needPillarsFirst'), 'warning');
    return;
  }

  const btn = document.getElementById('btn-generate-all-angles');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner-sm"></span> ${t('strategy.generating')}`;
  }

  try {
    const brand = store.get('brand') || await loadBrand();
    const brief = currentCampaign.brief || currentCampaign.name;
    let allNewAngles = [];

    for (const pillar of pillars) {
      const aiAngles = await generateAngles(brand, pillar, brief);
      const tagged = aiAngles.map(a => ({
        ...a,
        id: generateId(),
        pillarId: pillar.id
      }));
      allNewAngles = [...allNewAngles, ...tagged];
    }

    const allAngles = [...(currentCampaign.angles || []), ...allNewAngles];
    currentCampaign.angles = allAngles;

    await updateCampaignAngles(currentCampaign.id, allAngles);
    showToast(`${allNewAngles.length} angles ${t('toasts.created')}`, 'success');

    renderPage(document.getElementById('app'));
  } catch (error) {
    console.error('Generate all angles error:', error);
    showToast(t('errors.generic') + ': ' + error.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `${icon('sparkle', 14)} ${t('campaignDetail.generateAllAngles')}`;
    }
  }
}

function handleAddAngleManual() {
  const pillars = currentCampaign.pillars || [];
  if (pillars.length === 0) {
    showToast(t('campaignDetail.needPillarsFirst'), 'warning');
    return;
  }

  // Simple prompt flow for manual angle creation
  let pillarIndex = 0;
  if (pillars.length > 1) {
    const pillarList = pillars.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const choice = prompt(`${t('campaignDetail.selectPillar')}:\n${pillarList}`);
    pillarIndex = parseInt(choice) - 1;
    if (isNaN(pillarIndex) || pillarIndex < 0 || pillarIndex >= pillars.length) return;
  }

  const name = prompt(t('angle.type') + ':');
  if (!name?.trim()) return;

  const hook = prompt('Hook:') || '';

  const angle = {
    id: generateId(),
    pillarId: pillars[pillarIndex].id,
    name: name.trim(),
    type: 'general',
    hook: hook.trim(),
    keyMessage: '',
    suggestedFormat: 'Facebook Post'
  };

  const angles = [...(currentCampaign.angles || []), angle];
  currentCampaign.angles = angles;

  updateCampaignAngles(currentCampaign.id, angles);
  showToast(t('toasts.created'), 'success');
  renderPage(document.getElementById('app'));
}

async function handleDeleteAngle(angleId) {
  if (!confirm(t('common.confirm'))) return;

  const angles = (currentCampaign.angles || []).filter(a => a.id !== angleId);
  currentCampaign.angles = angles;

  await updateCampaignAngles(currentCampaign.id, angles);
  showToast(t('toasts.deleted'), 'success');
  renderPage(document.getElementById('app'));
}
