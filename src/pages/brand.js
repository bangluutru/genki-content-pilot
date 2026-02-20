/**
 * Brand Profile Page — Setup brand voice, tone, products + onboarding wizard
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveBrand, loadBrand } from '../services/firestore.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';

export async function renderBrandPage() {
  const app = document.getElementById('app');
  const brand = store.get('brand') || await loadBrand() || {};
  const isNew = !brand.name;

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('brand', 28)} ${t('brand.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('brand.subtitle')}
          </p>
        </div>
      </div>

      ${isNew ? renderOnboardingBanner() : ''}

      <form id="brand-form" class="card">
        <div class="flex flex-col gap-6">
          <!-- Basic Info -->
          <h4>${icon('pin', 18)} ${t('brand.basicInfo')}</h4>

          <div class="input-group">
            <label for="brand-name">${t('brand.brandName')} *</label>
            <input type="text" id="brand-name" class="input" 
                   placeholder="${t('brand.brandNamePlaceholder')}"
                   value="${brand.name || ''}" required>
          </div>

          <!-- Logo Upload -->
          <div class="input-group">
            <label for="brand-logo">${t('brand.logo')}</label>
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              ${brand.logoUrl ? `
                <div style="position: relative; width: 120px; height: 120px; border-radius: var(--radius-md); overflow: hidden; border: 2px solid var(--border);">
                  <img id="logo-preview" src="${brand.logoUrl}" alt="Brand Logo" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
              ` : `
                <div id="logo-preview-placeholder" style="width: 120px; height: 120px; border-radius: var(--radius-md); background: var(--surface-hover); border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                  ${icon('brand', 48)}
                </div>
              `}
              <div style="display: flex; gap: var(--space-2); align-items: center;">
                <input type="file" id="brand-logo" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display: none;">
                <button type="button" class="btn btn-secondary" id="upload-logo-btn">
                  ${icon('upload', 16)} ${brand.logoUrl ? t('brand.changeLogo') : t('brand.uploadLogo')}
                </button>
                ${brand.logoUrl ? `<button type="button" class="btn btn-ghost" id="remove-logo-btn">${icon('trash', 16)} ${t('brand.removeLogo')}</button>` : ''}
              </div>
              <p class="text-sm text-muted">${t('brand.logoHint')}</p>
            </div>
          </div>

          <div class="input-group">
            <label for="brand-industry">${t('brand.industry')}</label>
            <select id="brand-industry" class="select">
              <option value="">-- ${t('brand.selectIndustry')} --</option>
              <option value="tpcn" ${brand.industry === 'tpcn' ? 'selected' : ''}>${t('brand.industryTPCN')}</option>
              <option value="cosmetics" ${brand.industry === 'cosmetics' ? 'selected' : ''}>${t('brand.industryCosmetics')}</option>
              <option value="fashion" ${brand.industry === 'fashion' ? 'selected' : ''}>${t('brand.industryFashion')}</option>
              <option value="food" ${brand.industry === 'food' ? 'selected' : ''}>${t('brand.industryFood')}</option>
              <option value="tech" ${brand.industry === 'tech' ? 'selected' : ''}>${t('brand.industryTech')}</option>
              <option value="education" ${brand.industry === 'education' ? 'selected' : ''}>${t('brand.industryEducation')}</option>
              <option value="service" ${brand.industry === 'service' ? 'selected' : ''}>${t('brand.industryService')}</option>
              <option value="other" ${brand.industry === 'other' ? 'selected' : ''}>${t('brand.industryOther')}</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brand-target">${t('brand.targetAudience')}</label>
            <input type="text" id="brand-target" class="input"
                   placeholder="${t('brand.targetAudiencePlaceholder')}"
                   value="${brand.targetAudience || ''}">
          </div>

          <!-- Tone & Style -->
          <h4 style="margin-top: var(--space-4);">${icon('mic', 18)} ${t('brand.toneAndStyle')}</h4>

          <div class="input-group">
            <label for="brand-tone">${t('brand.toneOfVoice')}</label>
            <select id="brand-tone" class="select">
              <option value="friendly" ${brand.tone === 'friendly' ? 'selected' : ''}>${t('brand.toneFriendly')}</option>
              <option value="professional" ${brand.tone === 'professional' ? 'selected' : ''}>${t('brand.toneProfessional')}</option>
              <option value="playful" ${brand.tone === 'playful' ? 'selected' : ''}>${t('brand.tonePlayful')}</option>
              <option value="luxury" ${brand.tone === 'luxury' ? 'selected' : ''}>${t('brand.toneLuxury')}</option>
              <option value="educational" ${brand.tone === 'educational' ? 'selected' : ''}>${t('brand.toneEducational')}</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brand-products">${t('brand.products')}</label>
            <textarea id="brand-products" class="textarea" rows="3"
                      placeholder="${t('brand.productsPlaceholder')}">${brand.products || ''}</textarea>
          </div>

          <div class="input-group">
            <label for="brand-hashtags">${t('brand.defaultHashtags')}</label>
            <input type="text" id="brand-hashtags" class="input"
                   placeholder="${t('brand.hashtagsPlaceholder')}"
                   value="${brand.defaultHashtags || ''}">
          </div>

          <!-- Strategy & Identity -->
          <h4 style="margin-top: var(--space-4);">${icon('strategy', 18)} ${t('brand.strategyIdentity')}</h4>

          <div class="input-group">
            <label for="brand-archetype">${t('brand.archetype')}</label>
            <select id="brand-archetype" class="select">
              <option value="">-- ${t('brand.selectArchetype')} --</option>
              <option value="hero" ${brand.archetype === 'hero' ? 'selected' : ''}>${t('brand.archetypeHero')}</option>
              <option value="sage" ${brand.archetype === 'sage' ? 'selected' : ''}>${t('brand.archetypeSage')}</option>
              <option value="magician" ${brand.archetype === 'magician' ? 'selected' : ''}>${t('brand.archetypeMagician')}</option>
              <option value="ruler" ${brand.archetype === 'ruler' ? 'selected' : ''}>${t('brand.archetypeRuler')}</option>
              <option value="creator" ${brand.archetype === 'creator' ? 'selected' : ''}>${t('brand.archetypeCreator')}</option>
              <option value="caregiver" ${brand.archetype === 'caregiver' ? 'selected' : ''}>${t('brand.archetypeCaregiver')}</option>
              <option value="jester" ${brand.archetype === 'jester' ? 'selected' : ''}>${t('brand.archetypeJester')}</option>
              <option value="lover" ${brand.archetype === 'lover' ? 'selected' : ''}>${t('brand.archetypeLover')}</option>
              <option value="explorer" ${brand.archetype === 'explorer' ? 'selected' : ''}>${t('brand.archetypeExplorer')}</option>
              <option value="outlaw" ${brand.archetype === 'outlaw' ? 'selected' : ''}>${t('brand.archetypeOutlaw')}</option>
              <option value="innocent" ${brand.archetype === 'innocent' ? 'selected' : ''}>${t('brand.archetypeInnocent')}</option>
              <option value="everyman" ${brand.archetype === 'everyman' ? 'selected' : ''}>${t('brand.archetypeEveryman')}</option>
            </select>
            <p class="text-xs text-muted" style="margin-top: 4px;">${t('brand.archetypeHint')}</p>
          </div>

          <div class="input-group">
            <label for="brand-voice">${t('brand.voiceGuidelines')}</label>
            <textarea id="brand-voice" class="textarea" rows="3"
                      placeholder="${t('brand.voiceGuidelinesPlaceholder')}">${brand.voice || ''}</textarea>
          </div>

          <div class="input-group">
            <label for="brand-avatars">${t('brand.customerAvatars')}</label>
            <textarea id="brand-avatars" class="textarea" rows="3"
                      placeholder="${t('brand.customerAvatarsPlaceholder')}">${brand.avatars || ''}</textarea>
          </div>

          <!-- Legal -->
          <h4 style="margin-top: var(--space-4);">${icon('shield', 18)} ${t('brand.legalSection')}</h4>

          <div class="input-group">
            <label for="brand-disclaimer">${t('brand.disclaimer')}</label>
            <textarea id="brand-disclaimer" class="textarea" rows="2"
                      placeholder="${t('brand.disclaimerPlaceholder')}">${brand.disclaimer || ''}</textarea>
          </div>

          <div id="tpcn-warning" class="${brand.industry === 'tpcn' ? '' : 'hidden'}" 
               style="padding: var(--space-4); background: var(--warning-light); border-radius: var(--radius-md); border-left: 3px solid var(--warning);">
            <strong>${icon('warning', 16)} ${t('brand.tpcnWarningTitle')}:</strong> ${t('brand.tpcnWarningDesc')}
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-full" style="margin-top: var(--space-4);">
            ${icon('save', 18)} ${t('brand.saveBrand')}
          </button>
        </div>
      </form>
    </main>
  `;

  attachSidebarEvents();

  // Logo upload handling
  let uploadedLogoUrl = brand.logoUrl || null;

  document.getElementById('upload-logo-btn')?.addEventListener('click', () => {
    document.getElementById('brand-logo')?.click();
  });

  document.getElementById('brand-logo')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast(t('brand.logoTooLarge'), 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast(t('brand.logoInvalidType'), 'error');
      return;
    }

    try {
      showToast(t('brand.uploadingLogo'), 'info');

      // Import Firebase Storage functions
      const { storage } = await import('../config/firebase.js');
      if (!storage) throw new Error("Firebase Storage not initialized");

      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

      const user = store.get('user');
      const fileName = `brand-logos/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      uploadedLogoUrl = await getDownloadURL(storageRef);

      // Update preview
      const placeholder = document.getElementById('logo-preview-placeholder');
      if (placeholder) {
        placeholder.outerHTML = `
          <div style="position: relative; width: 120px; height: 120px; border-radius: var(--radius-md); overflow: hidden; border: 2px solid var(--border);">
            <img id="logo-preview" src="${uploadedLogoUrl}" alt="Brand Logo" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        `;
      } else {
        document.getElementById('logo-preview').src = uploadedLogoUrl;
      }

      // Update button text and add remove button if not exists
      const uploadBtn = document.getElementById('upload-logo-btn');
      uploadBtn.innerHTML = `${icon('upload', 16)} ${t('brand.changeLogo')}`;

      if (!document.getElementById('remove-logo-btn')) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-ghost';
        removeBtn.id = 'remove-logo-btn';
        removeBtn.innerHTML = `${icon('trash', 16)} ${t('brand.removeLogo')}`;
        uploadBtn.parentElement.appendChild(removeBtn);

        // Add remove handler
        removeBtn.addEventListener('click', () => {
          uploadedLogoUrl = null;
          const logoPreviewEl = document.querySelector('#logo-preview');
          if (logoPreviewEl && logoPreviewEl.parentElement) {
            logoPreviewEl.parentElement.outerHTML = `
              <div id="logo-preview-placeholder" style="width: 120px; height: 120px; border-radius: var(--radius-md); background: var(--surface-hover); border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                ${icon('brand', 32)}
              </div>
            `;
          }
          uploadBtn.innerHTML = `${icon('upload', 16)} ${t('brand.uploadLogo')}`;
          removeBtn.remove();
        });
      }

      showToast(t('brand.logoUploaded'), 'success');
    } catch (error) {
      console.error('Logo upload error:', error);
      showToast(t('brand.logoUploadError'), 'error');
    }
  });

  // Remove logo button (if exists on load)
  document.getElementById('remove-logo-btn')?.addEventListener('click', () => {
    uploadedLogoUrl = null;
    const uploadBtn = document.getElementById('upload-logo-btn');
    const logoPreviewEl = document.querySelector('#logo-preview');
    if (logoPreviewEl && logoPreviewEl.parentElement) {
      logoPreviewEl.parentElement.outerHTML = `
        <div id="logo-preview-placeholder" style="width: 120px; height: 120px; border-radius: var(--radius-md); background: var(--surface-hover); border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
          ${icon('brand', 32)}
        </div>
      `;
    }
    uploadBtn.innerHTML = `${icon('upload', 16)} ${t('brand.uploadLogo')}`;
    document.getElementById('remove-logo-btn')?.remove();
  });

  // Show TPCN warning when industry changes
  document.getElementById('brand-industry')?.addEventListener('change', (e) => {
    const warning = document.getElementById('tpcn-warning');
    const disclaimer = document.getElementById('brand-disclaimer');
    if (e.target.value === 'tpcn') {
      warning?.classList.remove('hidden');
      if (!disclaimer.value) {
        disclaimer.value = t('brand.tpcnDefaultDisclaimer');
      }
    } else {
      warning?.classList.add('hidden');
    }
  });

  // Save form
  document.getElementById('brand-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('brand-name')?.value?.trim();
    if (!name) {
      showToast(t('brand.nameRequired'), 'warning');
      return;
    }

    try {
      await saveBrand({
        name,
        logoUrl: uploadedLogoUrl,
        industry: document.getElementById('brand-industry')?.value,
        targetAudience: document.getElementById('brand-target')?.value?.trim(),
        tone: document.getElementById('brand-tone')?.value,
        products: document.getElementById('brand-products')?.value?.trim(),
        defaultHashtags: document.getElementById('brand-hashtags')?.value?.trim(),
        archetype: document.getElementById('brand-archetype')?.value,
        voice: document.getElementById('brand-voice')?.value?.trim(),
        avatars: document.getElementById('brand-avatars')?.value?.trim(),
        disclaimer: document.getElementById('brand-disclaimer')?.value?.trim(),
      });

      showToast(t('toasts.brandSaved'), 'success');
    } catch (error) {
      console.error('Save brand error:', error);
      showToast(t('brand.saveError'), 'error');
    }
  });
}

function renderOnboardingBanner() {
  return `
    <div class="card" style="margin-bottom: var(--space-6); border-left: 3px solid var(--accent); background: var(--accent-light);">
      <div class="flex items-center gap-4">
        <span style="display: inline-flex;">${icon('hand', 32)}</span>
        <div>
          <strong>${t('brand.welcomeTitle')}</strong>
          <p class="text-sm text-muted" style="margin-top: var(--space-1);">
            ${t('brand.welcomeDesc')}
          </p>
        </div>
      </div>
    </div>
  `;
}
