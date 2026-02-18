// app.js — Entry point: khởi tạo app, kết nối tất cả modules
// File này chạy đầu tiên khi app load

import { CONFIG } from './config.js';
import { auth } from './firebase.js';
import { onAuthChange, getCurrentUser, logout } from './auth.js';
import { registerRoute, initRouter, navigate } from './router.js';
import { $ } from './utils/dom.js';

// ─── Import pages ───
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderCreate } from './pages/create.js';
import { renderLibrary } from './pages/library.js';
import { renderBrand } from './pages/brand.js';
import { renderCampaigns } from './pages/campaigns.js';
import { renderCampaignDetail } from './pages/campaign-detail.js';
import { renderApprovals } from './pages/approvals.js';

// ─── Khởi tạo App ───

function init() {
    // 1. Đăng ký routes
    registerRoute('dashboard', renderDashboard);
    registerRoute('create', renderCreate);
    registerRoute('library', renderLibrary);
    registerRoute('brand', renderBrand);
    registerRoute('campaigns', renderCampaigns);
    registerRoute('campaign', renderCampaignDetail);
    registerRoute('approvals', renderApprovals);

    // 2. Lắng nghe auth state
    onAuthChange(handleAuthChange);
}

/**
 * Xử lý khi auth state thay đổi (login/logout)
 * @param {object|null} user
 */
function handleAuthChange(user) {
    const shell = $('#app-shell');
    const loginRoot = $('#login-root');

    if (user) {
        // Đã đăng nhập → hiện app shell
        shell.classList.remove('hidden');
        loginRoot.classList.add('hidden');

        // Render sidebar + header
        renderSidebar();
        renderHeader(user);

        // Khởi tạo router (render trang đầu tiên)
        initRouter($('#app'));
    } else {
        // Chưa đăng nhập → hiện login
        shell.classList.add('hidden');
        loginRoot.classList.remove('hidden');
        renderLogin();
    }
}

/**
 * Render sidebar navigation
 */
function renderSidebar() {
    const sidebar = $('#sidebar');
    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <span style="font-size: 24px;">✨</span>
            <strong>${CONFIG.APP_NAME}</strong>
        </div>
        <nav class="sidebar-nav">
            ${CONFIG.NAV_ITEMS.map(item => `
                <a href="#${item.route}" class="sidebar-link" data-route="${item.route}">
                    ${item.label}
                </a>
            `).join('')}
        </nav>
        <div style="padding: 0 var(--space-lg); margin-top: auto;">
            <button id="btn-logout" class="btn btn-secondary" style="width: 100%;">
                🚪 Đăng xuất
            </button>
        </div>
    `;

    // Logout handler
    $('#btn-logout').addEventListener('click', () => logout());
}

/**
 * Render header với user info
 * @param {object} user - Firebase user
 */
function renderHeader(user) {
    const header = $('#app-header');
    header.innerHTML = `
        <div>
            <h3 id="page-title">Dashboard</h3>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <span class="text-secondary">${user.displayName || user.email}</span>
            <img src="${user.photoURL || ''}" alt="avatar"
                style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border);"
                onerror="this.style.display='none'">
        </div>
    `;
}

// ─── GO! ───
init();
