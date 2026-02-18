// router.js — SPA routing (hash-based) + query param utilities
// Điều hướng giữa các trang: #dashboard, #create?id=xxx, #library?status=draft

import { CONFIG } from './config.js';
import { $ } from './utils/dom.js';

// Registry: route name → render function
const routes = {};

/**
 * Đăng ký route
 * @param {string} name - Route name (ví dụ: 'dashboard')
 * @param {function} renderFn - Hàm render trang, nhận container element
 */
export function registerRoute(name, renderFn) {
    routes[name] = renderFn;
}

/**
 * Chuyển đến route
 * @param {string} name - Route name
 */
export function navigate(name) {
    window.location.hash = `#${name}`;
}

/**
 * Lấy route hiện tại (bỏ query params)
 * @returns {string} Route name
 */
export function getCurrentRoute() {
    const hash = window.location.hash.slice(1); // bỏ #
    const route = hash.split('?')[0]; // bỏ query params
    return route || CONFIG.DEFAULT_ROUTE;
}

// ─── Query Param Utilities ───

/**
 * Lấy tất cả query params từ hash URL
 * Ví dụ: #library?status=draft&search=hello → { status: 'draft', search: 'hello' }
 * @returns {object} Key-value object
 */
export function getQueryParams() {
    const hash = window.location.hash.slice(1);
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return {};

    const searchStr = hash.slice(queryIndex + 1);
    const params = new URLSearchParams(searchStr);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Lấy 1 query param theo tên
 * @param {string} name - Tên param
 * @param {string} [defaultValue=''] - Giá trị mặc định
 * @returns {string}
 */
export function getParam(name, defaultValue = '') {
    const params = getQueryParams();
    return params[name] !== undefined ? params[name] : defaultValue;
}

/**
 * Set/update 1 query param trong hash URL (không trigger reload)
 * @param {string} name - Tên param
 * @param {string|null} value - Giá trị (null → xoá param)
 */
export function setParam(name, value) {
    const hash = window.location.hash.slice(1);
    const route = hash.split('?')[0];
    const queryIndex = hash.indexOf('?');
    const searchStr = queryIndex === -1 ? '' : hash.slice(queryIndex + 1);
    const params = new URLSearchParams(searchStr);

    if (value === null || value === undefined) {
        params.delete(name);
    } else {
        params.set(name, value);
    }

    const paramStr = params.toString();
    const newHash = paramStr ? `${route}?${paramStr}` : route;

    // replaceState to avoid triggering hashchange for param-only updates
    history.replaceState(null, '', `#${newHash}`);
}

/**
 * Khởi tạo router — lắng nghe hashchange, render trang đầu
 * @param {HTMLElement} container - Element #app để render vào
 */
export function initRouter(container) {
    // Render route hiện tại
    function handleRoute() {
        const route = getCurrentRoute();
        const renderFn = routes[route];

        if (renderFn) {
            // Clear container + render trang mới
            container.innerHTML = '';
            renderFn(container);

            // Cập nhật active sidebar link
            const links = document.querySelectorAll('.sidebar-link');
            links.forEach(link => {
                link.classList.toggle('active', link.dataset.route === route);
            });

            // Cập nhật page title ở header
            const pageTitle = $('#page-title');
            const navItem = CONFIG.NAV_ITEMS.find(item => item.route === route);
            if (pageTitle && navItem) {
                pageTitle.textContent = navItem.label;
            }
        } else {
            // Route không tồn tại → redirect về dashboard
            navigate(CONFIG.DEFAULT_ROUTE);
        }
    }

    // Lắng nghe hash change
    window.addEventListener('hashchange', handleRoute);

    // Render trang đầu tiên
    handleRoute();
}
