/**
 * Settings Page — Manage Facebook & WordPress connections
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveConnections, loadConnections, deleteConnection } from '../services/firestore.js';
import { testFacebookConnection } from '../services/facebook.js';
import { testWordPressConnection } from '../services/wordpress.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';

export async function renderSettingsPage() {
  const app = document.getElementById('app');
  const connections = store.get('connections') || await loadConnections() || {};

  const fb = connections.facebook || {};
  const wp = connections.wordpress || {};

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="mb-6">
        <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('settings', 28)} ${t('settings.title')}</h1>
        <p class="text-muted text-sm" style="margin-top: var(--space-1);">
          ${t('settings.subtitle')}
        </p>
      </div>

      <!-- Facebook Connection -->
      <div class="card connection-card" style="margin-bottom: var(--space-6);">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-4">
            <span style="font-size: 2rem;">📱</span>
            <div>
              <h3 style="margin: 0;">${t('settings.facebookTitle')}</h3>
              <p class="text-sm text-muted">${t('settings.facebookDesc')}</p>
            </div>
          </div>
          <span id="fb-status" class="badge ${fb.pageId ? 'badge-success' : 'badge-warning'}">
            ${fb.pageName ? `✅ ${fb.pageName}` : '❌ ' + t('settings.notConnected')}
          </span>
        </div>

        <div class="connection-form flex flex-col gap-4" id="fb-form">
          <div class="input-group">
            <label for="fb-page-id">${t('settings.pageId')}</label>
            <input type="text" id="fb-page-id" class="input" 
                   placeholder="${t('settings.pageIdPlaceholder')}" 
                   value="${fb.pageId || ''}">
            <small class="text-muted">${t('settings.pageIdHelp')}</small>
          </div>

          <div class="input-group">
            <label for="fb-token">${t('settings.accessToken')}</label>
            <input type="password" id="fb-token" class="input" 
                   placeholder="${t('settings.accessTokenPlaceholder')}"
                   value="${fb.accessToken || ''}">
            <small class="text-muted">
              ${t('settings.accessTokenHelp')} 
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener">Graph API Explorer</a>
            </small>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="btn-test-fb">${icon('target', 16)} ${t('settings.testConnection')}</button>
            <button class="btn btn-primary btn-sm" id="btn-save-fb">${icon('save', 16)} ${t('settings.saveConnection')}</button>
            ${fb.pageId ? `<button class="btn btn-ghost btn-sm" id="btn-disconnect-fb" style="color: var(--danger);">${t('settings.disconnect')}</button>` : ''}
          </div>

          <div id="fb-result" class="hidden connection-result"></div>
        </div>
      </div>

      <!-- WordPress Connection -->
      <div class="card connection-card" style="margin-bottom: var(--space-6);">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-4">
            <span style="font-size: 2rem;">📝</span>
            <div>
              <h3 style="margin: 0;">${t('settings.wordpressTitle')}</h3>
              <p class="text-sm text-muted">${t('settings.wordpressDesc')}</p>
            </div>
          </div>
          <span id="wp-status" class="badge ${wp.siteUrl ? 'badge-success' : 'badge-warning'}">
            ${wp.siteName ? `✅ ${wp.siteName}` : '❌ ' + t('settings.notConnected')}
          </span>
        </div>

        <div class="connection-form flex flex-col gap-4" id="wp-form">
          <div class="input-group">
            <label for="wp-url">${t('settings.siteUrl')}</label>
            <input type="url" id="wp-url" class="input" 
                   placeholder="${t('settings.siteUrlPlaceholder')}"
                   value="${wp.siteUrl || ''}">
          </div>

          <div class="input-group">
            <label for="wp-user">${t('settings.username')}</label>
            <input type="text" id="wp-user" class="input" 
                   placeholder="${t('settings.usernamePlaceholder')}"
                   value="${wp.username || ''}">
          </div>

          <div class="input-group">
            <label for="wp-password">${t('settings.appPassword')}</label>
            <input type="password" id="wp-password" class="input" 
                   placeholder="${t('settings.appPasswordPlaceholder')}"
                   value="${wp.appPassword || ''}">
            <small class="text-muted">${t('settings.appPasswordHelp')}</small>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="btn-test-wp">${icon('target', 16)} ${t('settings.testConnection')}</button>
            <button class="btn btn-primary btn-sm" id="btn-save-wp">${icon('save', 16)} ${t('settings.saveConnection')}</button>
            ${wp.siteUrl ? `<button class="btn btn-ghost btn-sm" id="btn-disconnect-wp" style="color: var(--danger);">${t('settings.disconnect')}</button>` : ''}
          </div>

          <div id="wp-result" class="hidden connection-result"></div>
        </div>

        <!-- WordPress Setup Guide -->
        <div class="mt-6 p-4" style="background: var(--bg-tertiary); border-radius: var(--radius-md);">
          <p class="text-sm" style="margin-bottom: var(--space-2);"><strong>${icon('tip', 16)} ${t('settings.appPasswordHelp')}</strong></p>
          <ol class="text-sm text-muted" style="margin: 0; padding-left: var(--space-5);">
            <li>${t('login.title')} WordPress Admin</li>
            <li>Users → Profile → Application Passwords</li>
            <li>${t('create.notesLabel')} "ContentPilot" → Generate</li>
            <li>Copy password (${t('common.notes')}!)</li>
          </ol>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();
  attachSettingsEvents();
}

function attachSettingsEvents() {
  // Facebook - Test Connection
  document.getElementById('btn-test-fb')?.addEventListener('click', async () => {
    const pageId = document.getElementById('fb-page-id')?.value?.trim();
    const token = document.getElementById('fb-token')?.value?.trim();
    const resultEl = document.getElementById('fb-result');

    if (!pageId || !token) {
      showToast(t('settings.fillAllFields'), 'warning');
      return;
    }

    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `<span class="text-muted">${icon('refresh', 16)} ${t('settings.testing')}</span>`;

    const result = await testFacebookConnection(pageId, token);

    if (result.success) {
      resultEl.innerHTML = `
                <span class="text-success">✅ ${t('settings.testSuccess')}</span><br>
                <span class="text-sm text-muted">Page: <strong>${result.pageName}</strong> · ${result.fanCount?.toLocaleString() || 0} followers</span>
            `;
      document.getElementById('fb-status').className = 'badge badge-success';
      document.getElementById('fb-status').textContent = `✅ ${result.pageName}`;
    } else {
      resultEl.innerHTML = `<span class="text-danger">❌ ${result.error}</span>`;
    }
  });

  // Facebook - Save
  document.getElementById('btn-save-fb')?.addEventListener('click', async () => {
    const pageId = document.getElementById('fb-page-id')?.value?.trim();
    const token = document.getElementById('fb-token')?.value?.trim();

    if (!pageId || !token) {
      showToast(t('settings.fillAllFields'), 'warning');
      return;
    }

    try {
      // Test first
      const test = await testFacebookConnection(pageId, token);
      const connections = store.get('connections') || {};
      connections.facebook = {
        pageId,
        accessToken: token,
        pageName: test.success ? test.pageName : '',
        connectedAt: new Date().toISOString(),
      };
      await saveConnections(connections);
      showToast(t('settings.connectionSaved'), 'success');
    } catch (error) {
      showToast(t('settings.saveConnectionError') + ': ' + error.message, 'error');
    }
  });

  // Facebook - Disconnect
  document.getElementById('btn-disconnect-fb')?.addEventListener('click', async () => {
    try {
      await deleteConnection('facebook');
      document.getElementById('fb-page-id').value = '';
      document.getElementById('fb-token').value = '';
      document.getElementById('fb-status').className = 'badge badge-warning';
      document.getElementById('fb-status').textContent = '❌ ' + t('settings.notConnected');
      document.getElementById('fb-result')?.classList.add('hidden');
      showToast(t('settings.disconnected'), 'info');
    } catch (error) {
      showToast(t('settings.disconnectError') + ': ' + error.message, 'error');
    }
  });

  // WordPress - Test Connection
  document.getElementById('btn-test-wp')?.addEventListener('click', async () => {
    const siteUrl = document.getElementById('wp-url')?.value?.trim();
    const username = document.getElementById('wp-user')?.value?.trim();
    const appPassword = document.getElementById('wp-password')?.value?.trim();
    const resultEl = document.getElementById('wp-result');

    if (!siteUrl || !username || !appPassword) {
      showToast(t('settings.fillAllFields'), 'warning');
      return;
    }

    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `<span class="text-muted">${icon('refresh', 16)} ${t('settings.testing')}</span>`;

    const result = await testWordPressConnection(siteUrl, username, appPassword);

    if (result.success) {
      resultEl.innerHTML = `
                <span class="text-success">✅ ${t('settings.testSuccess')}</span><br>
                <span class="text-sm text-muted">Site: <strong>${result.siteName || siteUrl}</strong> · User: ${result.userName}</span>
            `;
      document.getElementById('wp-status').className = 'badge badge-success';
      document.getElementById('wp-status').textContent = `✅ ${result.siteName || t('settings.connected')}`;
    } else {
      resultEl.innerHTML = `<span class="text-danger">❌ ${result.error}</span>`;
    }
  });

  // WordPress - Save
  document.getElementById('btn-save-wp')?.addEventListener('click', async () => {
    const siteUrl = document.getElementById('wp-url')?.value?.trim();
    const username = document.getElementById('wp-user')?.value?.trim();
    const appPassword = document.getElementById('wp-password')?.value?.trim();

    if (!siteUrl || !username || !appPassword) {
      showToast(t('settings.fillAllFields'), 'warning');
      return;
    }

    try {
      const test = await testWordPressConnection(siteUrl, username, appPassword);
      const connections = store.get('connections') || {};
      connections.wordpress = {
        siteUrl,
        username,
        appPassword,
        siteName: test.success ? test.siteName : '',
        connectedAt: new Date().toISOString(),
      };
      await saveConnections(connections);
      showToast(t('settings.connectionSaved'), 'success');
    } catch (error) {
      showToast(t('settings.saveConnectionError') + ': ' + error.message, 'error');
    }
  });

  // Export Data
  document.getElementById('btn-export-data')?.addEventListener('click', () => {
    try {
      const data = {
        contents: store.get('contents') || [],
        schedules: store.get('schedules') || [],
        templates: store.get('templates') || [],
        workspaces: store.get('workspaces') || [],
        connections: store.get('connections') || {},
        exportedAt: new Date().toISOString(),
        version: '2.0.0'
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "contentpilot_backup_" + new Date().toISOString().slice(0, 10) + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      showToast(t('toasts.saved') + '! 💾', 'success');
    } catch (err) {
      showToast(t('common.error') + ': ' + err.message, 'error');
    }
  });

  // WordPress - Disconnect
  document.getElementById('btn-disconnect-wp')?.addEventListener('click', async () => {
    try {
      await deleteConnection('wordpress');
      document.getElementById('wp-url').value = '';
      document.getElementById('wp-user').value = '';
      document.getElementById('wp-password').value = '';
      document.getElementById('wp-status').className = 'badge badge-warning';
      document.getElementById('wp-status').textContent = '❌ ' + t('settings.notConnected');
      document.getElementById('wp-result')?.classList.add('hidden');
      showToast(t('settings.disconnected'), 'info');
    } catch (error) {
      showToast(t('settings.disconnectError') + ': ' + error.message, 'error');
    }
  });

  // === Brand Settings ===

  // Logo file preview
  document.getElementById('brand-logo')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      showToast(t('validation.fileTypeNotAllowed') + ': PNG, JPG, SVG', 'warning');
      e.target.value = '';
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast(t('validation.fileTooLarge', { maxSize: '2MB' }), 'warning');
      e.target.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewEl = document.getElementById('logo-preview');
      previewEl.outerHTML = `
        <img src="${event.target.result}" id="logo-preview" alt="Brand Logo Preview" 
             style="width: 64px; height: 64px; object-fit: contain; border-radius: var(--radius-md); border: 1px solid var(--border); background: white; padding: var(--space-2);" />
      `;
    };
    reader.readAsDataURL(file);
  });

  // Save Brand
  document.getElementById('btn-save-brand')?.addEventListener('click', async () => {
    const brandName = document.getElementById('brand-name')?.value?.trim();
    const logoFile = document.getElementById('brand-logo')?.files?.[0];

    if (!brandName) {
      showToast(t('brand.nameRequired'), 'warning');
      return;
    }

    try {
      const user = store.get('user');
      if (!user) {
        showToast(t('errors.unauthorized'), 'error');
        return;
      }

      let logoUrl = store.get('brand')?.logoUrl || '';

      // Upload logo if new file selected
      if (logoFile) {
        showToast(t('common.loading') + '...', 'info');

        const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage');
        const storage = getStorage();

        // Delete old logo if exists
        if (logoUrl) {
          try {
            const oldRef = ref(storage, `brands/${user.uid}/logo`);
            await deleteObject(oldRef);
          } catch (err) {
            console.warn('Old logo deletion failed:', err);
          }
        }

        // Upload new logo
        const fileExt = logoFile.name.split('.').pop();
        const logoRef = ref(storage, `brands/${user.uid}/logo.${fileExt}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Save to Firestore
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const brandData = {
        name: brandName,
        logoUrl,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'preferences', 'brand'), brandData);

      // Update state
      store.set('brand', brandData);

      showToast(t('toasts.saved') + '! ✅', 'success');

      // Re-render to update header
      setTimeout(async () => {
        const { router } = await import('../utils/router.js');
        router.resolve();
      }, 500);
    } catch (error) {
      console.error('Brand save error:', error);
      showToast(t('common.error') + ': ' + error.message, 'error');
    }
  });

  // Remove Logo
  document.getElementById('btn-remove-logo')?.addEventListener('click', async () => {
    try {
      const user = store.get('user');
      if (!user) return;

      const { getStorage, ref, deleteObject } = await import('firebase/storage');
      const storage = getStorage();

      // Delete from Firebase Storage
      try {
        const logoRef = ref(storage, `brands/${user.uid}/logo`);
        await deleteObject(logoRef);
      } catch (err) {
        console.warn('Logo deletion from storage failed:', err);
      }

      // Update Firestore
      const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
      const db = getFirestore();
      await updateDoc(doc(db, 'users', user.uid, 'preferences', 'brand'), {
        logoUrl: '',
        updatedAt: new Date().toISOString()
      });

      // Update state
      const currentBrand = store.get('brand') || {};
      currentBrand.logoUrl = '';
      store.set('brand', currentBrand);

      // Reset preview
      document.getElementById('logo-preview').outerHTML = `
        <div id="logo-preview" style="width: 64px; height: 64px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">${icon('plane', 32)}</div>
      `;
      document.getElementById('brand-logo').value = '';

      showToast(t('toasts.deleted'), 'info');

      // Re-render header
      const { router } = await import('../utils/router.js');
      setTimeout(() => router.resolve(), 500);
    } catch (error) {
      showToast(t('common.error') + ': ' + error.message, 'error');
    }
  });
}
