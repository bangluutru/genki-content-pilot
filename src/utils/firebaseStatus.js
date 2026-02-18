/**
 * Firebase Status — Config validation helpers
 * Used by app bootstrap to show offline/demo banner
 */

const REQUIRED_KEYS = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
];

/**
 * Kiểm tra Firebase config đã đủ chưa
 * @returns {boolean}
 */
export function hasFirebaseConfig() {
    return REQUIRED_KEYS.every(key => {
        const val = import.meta.env[key];
        return val && val !== '' && !val.startsWith('your_');
    });
}

/**
 * Lấy danh sách keys thiếu
 * @returns {string[]}
 */
export function getFirebaseConfigMissingKeys() {
    return REQUIRED_KEYS.filter(key => {
        const val = import.meta.env[key];
        return !val || val === '' || val.startsWith('your_');
    });
}

/**
 * Render offline/demo banner
 * @param {HTMLElement} container - Element to prepend banner to
 */
export function showOfflineBanner(container) {
    if (hasFirebaseConfig()) return;

    const missing = getFirebaseConfigMissingKeys();
    const banner = document.createElement('div');
    banner.id = 'firebase-offline-banner';
    banner.style.cssText = `
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #fff;
        padding: 12px 20px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    banner.innerHTML = `
        ⚠️ <strong>Offline/Demo mode</strong>: Firebase chưa cấu hình
        (thiếu: ${missing.join(', ')})
        &nbsp;—&nbsp;
        <a href="https://github.com/bangluutru/genki-content-pilot#production-firebase-setup-step-by-step"
           target="_blank"
           style="color:#fff;text-decoration:underline;font-weight:700;">
            📖 Xem hướng dẫn setup
        </a>
        <button onclick="this.parentElement.remove()"
                style="margin-left:12px;background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;padding:2px 8px;border-radius:4px;">
            ✕
        </button>
    `;

    // Push body content down
    document.body.style.paddingTop = '48px';
    document.body.prepend(banner);
}
