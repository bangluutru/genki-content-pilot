import { icon } from '../utils/icons.js';

let toastId = 0;

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Auto-dismiss in ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = `toast-${++toastId}`;
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;

    const icons = {
        success: icon('check', 16),
        error: icon('cross', 16),
        warning: icon('warning', 16),
        info: icon('strategy', 16)
    };

    toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);

    return id;
}
