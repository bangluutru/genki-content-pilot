/**
 * Settings Page — Manage Facebook & WordPress connections
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveConnections, loadConnections, deleteConnection } from '../services/firestore.js';
import { testFacebookConnection } from '../services/facebook.js';
import { testWordPressConnection } from '../services/wordpress.js';

export async function renderSettingsPage() {
    const app = document.getElementById('app');
    const connections = store.get('connections') || await loadConnections() || {};

    const fb = connections.facebook || {};
    const wp = connections.wordpress || {};

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="mb-6">
        <h1 style="font-size: var(--font-2xl);">⚙️ Kết nối Platform</h1>
        <p class="text-muted text-sm" style="margin-top: var(--space-1);">
          Cấu hình Facebook Page và WordPress để đăng bài tự động
        </p>
      </div>

      <!-- Facebook Connection -->
      <div class="card connection-card" style="margin-bottom: var(--space-6);">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-4">
            <span style="font-size: 2rem;">📱</span>
            <div>
              <h3 style="margin: 0;">Facebook Page</h3>
              <p class="text-sm text-muted">Đăng bài trực tiếp lên Facebook Page</p>
            </div>
          </div>
          <span id="fb-status" class="badge ${fb.pageId ? 'badge-success' : 'badge-warning'}">
            ${fb.pageName ? `✅ ${fb.pageName}` : '❌ Chưa kết nối'}
          </span>
        </div>

        <div class="connection-form flex flex-col gap-4" id="fb-form">
          <div class="input-group">
            <label for="fb-page-id">Page ID</label>
            <input type="text" id="fb-page-id" class="input" 
                   placeholder="VD: 123456789012345" 
                   value="${fb.pageId || ''}">
            <small class="text-muted">Tìm Page ID tại: Settings → About → Page ID</small>
          </div>

          <div class="input-group">
            <label for="fb-token">Page Access Token</label>
            <input type="password" id="fb-token" class="input" 
                   placeholder="Paste access token từ Facebook Developer..."
                   value="${fb.accessToken || ''}">
            <small class="text-muted">
              Lấy token tại <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener">Graph API Explorer</a> 
              → chọn Page → quyền pages_manage_posts
            </small>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="btn-test-fb">🔍 Test kết nối</button>
            <button class="btn btn-primary btn-sm" id="btn-save-fb">💾 Lưu</button>
            ${fb.pageId ? '<button class="btn btn-ghost btn-sm" id="btn-disconnect-fb" style="color: var(--danger);">Ngắt kết nối</button>' : ''}
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
              <h3 style="margin: 0;">WordPress</h3>
              <p class="text-sm text-muted">Đăng blog article lên WordPress site</p>
            </div>
          </div>
          <span id="wp-status" class="badge ${wp.siteUrl ? 'badge-success' : 'badge-warning'}">
            ${wp.siteName ? `✅ ${wp.siteName}` : '❌ Chưa kết nối'}
          </span>
        </div>

        <div class="connection-form flex flex-col gap-4" id="wp-form">
          <div class="input-group">
            <label for="wp-url">WordPress Site URL</label>
            <input type="url" id="wp-url" class="input" 
                   placeholder="VD: https://yourblog.com"
                   value="${wp.siteUrl || ''}">
          </div>

          <div class="input-group">
            <label for="wp-user">Username</label>
            <input type="text" id="wp-user" class="input" 
                   placeholder="WordPress admin username"
                   value="${wp.username || ''}">
          </div>

          <div class="input-group">
            <label for="wp-password">Application Password</label>
            <input type="password" id="wp-password" class="input" 
                   placeholder="Paste Application Password..."
                   value="${wp.appPassword || ''}">
            <small class="text-muted">
              Tạo tại WordPress → Users → Profile → Application Passwords
            </small>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="btn-test-wp">🔍 Test kết nối</button>
            <button class="btn btn-primary btn-sm" id="btn-save-wp">💾 Lưu</button>
            ${wp.siteUrl ? '<button class="btn btn-ghost btn-sm" id="btn-disconnect-wp" style="color: var(--danger);">Ngắt kết nối</button>' : ''}
          </div>

          <div id="wp-result" class="hidden connection-result"></div>
        </div>
      </div>

      <!-- Help Section -->
      <div class="card-flat" style="padding: var(--space-6); background: var(--bg-secondary); border-radius: var(--radius-lg);">
        <h4 style="margin-bottom: var(--space-3);">💡 Hướng dẫn nhanh</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
          <div>
            <strong>Facebook Page</strong>
            <ol class="text-sm text-muted" style="padding-left: var(--space-4); margin-top: var(--space-2); line-height: 1.8;">
              <li>Tạo App tại <a href="https://developers.facebook.com" target="_blank">developers.facebook.com</a></li>
              <li>Vào Graph API Explorer</li>
              <li>Chọn Page, thêm quyền <code>pages_manage_posts</code></li>
              <li>Generate Access Token → Copy Page ID + Token</li>
            </ol>
          </div>
          <div>
            <strong>WordPress</strong>
            <ol class="text-sm text-muted" style="padding-left: var(--space-4); margin-top: var(--space-2); line-height: 1.8;">
              <li>Đăng nhập WordPress Admin</li>
              <li>Users → Profile → Application Passwords</li>
              <li>Nhập tên app "ContentPilot" → Generate</li>
              <li>Copy password (chỉ hiện 1 lần!)</li>
            </ol>
          </div>
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
            showToast('Vui lòng nhập Page ID và Access Token', 'warning');
            return;
        }

        resultEl.classList.remove('hidden');
        resultEl.innerHTML = '<span class="text-muted">🔄 Đang test kết nối...</span>';

        const result = await testFacebookConnection(pageId, token);

        if (result.success) {
            resultEl.innerHTML = `
                <span class="text-success">✅ Kết nối thành công!</span><br>
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
            showToast('Vui lòng nhập Page ID và Access Token', 'warning');
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
            showToast('Đã lưu kết nối Facebook! ✅', 'success');
        } catch (error) {
            showToast('Lỗi lưu: ' + error.message, 'error');
        }
    });

    // Facebook - Disconnect
    document.getElementById('btn-disconnect-fb')?.addEventListener('click', async () => {
        try {
            await deleteConnection('facebook');
            document.getElementById('fb-page-id').value = '';
            document.getElementById('fb-token').value = '';
            document.getElementById('fb-status').className = 'badge badge-warning';
            document.getElementById('fb-status').textContent = '❌ Chưa kết nối';
            document.getElementById('fb-result')?.classList.add('hidden');
            showToast('Đã ngắt kết nối Facebook', 'info');
        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
        }
    });

    // WordPress - Test Connection
    document.getElementById('btn-test-wp')?.addEventListener('click', async () => {
        const siteUrl = document.getElementById('wp-url')?.value?.trim();
        const username = document.getElementById('wp-user')?.value?.trim();
        const appPassword = document.getElementById('wp-password')?.value?.trim();
        const resultEl = document.getElementById('wp-result');

        if (!siteUrl || !username || !appPassword) {
            showToast('Vui lòng nhập đầy đủ thông tin WordPress', 'warning');
            return;
        }

        resultEl.classList.remove('hidden');
        resultEl.innerHTML = '<span class="text-muted">🔄 Đang test kết nối...</span>';

        const result = await testWordPressConnection(siteUrl, username, appPassword);

        if (result.success) {
            resultEl.innerHTML = `
                <span class="text-success">✅ Kết nối thành công!</span><br>
                <span class="text-sm text-muted">Site: <strong>${result.siteName || siteUrl}</strong> · User: ${result.userName}</span>
            `;
            document.getElementById('wp-status').className = 'badge badge-success';
            document.getElementById('wp-status').textContent = `✅ ${result.siteName || 'Connected'}`;
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
            showToast('Vui lòng nhập đầy đủ thông tin', 'warning');
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
            showToast('Đã lưu kết nối WordPress! ✅', 'success');
        } catch (error) {
            showToast('Lỗi lưu: ' + error.message, 'error');
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
            document.getElementById('wp-status').textContent = '❌ Chưa kết nối';
            document.getElementById('wp-result')?.classList.add('hidden');
            showToast('Đã ngắt kết nối WordPress', 'info');
        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
        }
    });
}
