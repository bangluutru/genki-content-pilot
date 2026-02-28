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
            <span style="display: inline-flex;">${icon('phone', 32)}</span>
            <div>
              <h3 style="margin: 0;">${t('settings.facebookTitle')}</h3>
              <p class="text-sm text-muted">${t('settings.facebookDesc')}</p>
            </div>
          </div>
          <span id="fb-status" class="badge ${fb.pageId ? 'badge-success' : 'badge-warning'}">
            ${fb.pageName ? `${icon('check', 14)} ${fb.pageName}` : icon('cross', 14) + ' ' + t('settings.notConnected')}
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
            <span style="display: inline-flex;">${icon('blog', 32)}</span>
            <div>
              <h3 style="margin: 0;">${t('settings.wordpressTitle')}</h3>
              <p class="text-sm text-muted">${t('settings.wordpressDesc')}</p>
            </div>
          </div>
          <span id="wp-status" class="badge ${wp.siteUrl ? 'badge-success' : 'badge-warning'}">
            ${wp.siteName ? `${icon('check', 14)} ${wp.siteName}` : icon('cross', 14) + ' ' + t('settings.notConnected')}
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
                <span class="text-success">${icon('check', 14)} ${t('settings.testSuccess')}</span><br>
                <span class="text-sm text-muted">Page: <strong>${result.pageName}</strong> · ${result.fanCount?.toLocaleString() || 0} followers</span>
            `;
      document.getElementById('fb-status').className = 'badge badge-success';
      document.getElementById('fb-status').innerHTML = `${icon('check', 14)} ${result.pageName}`;
    } else {
      resultEl.innerHTML = `<span class="text-danger">${icon('cross', 14)} ${result.error}</span>`;
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
      document.getElementById('fb-status').innerHTML = icon('cross', 14) + ' ' + t('settings.notConnected');
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
                <span class="text-success">${icon('check', 14)} ${t('settings.testSuccess')}</span><br>
                <span class="text-sm text-muted">Site: <strong>${result.siteName || siteUrl}</strong> · User: ${result.userName}</span>
            `;
      document.getElementById('wp-status').className = 'badge badge-success';
      document.getElementById('wp-status').innerHTML = `${icon('check', 14)} ${result.siteName || t('settings.connected')}`;
    } else {
      resultEl.innerHTML = `<span class="text-danger">${icon('cross', 14)} ${result.error}</span>`;
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

      showToast(t('toasts.saved') + '!', 'success');
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
      document.getElementById('wp-status').innerHTML = icon('cross', 14) + ' ' + t('settings.notConnected');
      document.getElementById('wp-result')?.classList.add('hidden');
      showToast(t('settings.disconnected'), 'info');
    } catch (error) {
      showToast(t('settings.disconnectError') + ': ' + error.message, 'error');
    }
  });
}
