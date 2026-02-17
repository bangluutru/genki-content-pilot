/**
 * Modal component — Reusable dialog
 */

/**
 * Show a modal dialog
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.content - HTML content
 * @param {Array} options.actions - [{label, class, onClick}]
 * @returns {Function} close function
 */
export function showModal({ title, content, actions = [] }) {
    const container = document.getElementById('modal-container');
    if (!container) return () => { };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const actionsHtml = actions.map((a, i) =>
        `<button class="btn ${a.class || 'btn-secondary'}" data-action="${i}">${a.label}</button>`
    ).join('');

    overlay.innerHTML = `
    <div class="modal">
      <h3 class="modal-title">${title}</h3>
      <div class="modal-body">${content}</div>
      ${actionsHtml ? `<div class="flex gap-4 mt-6 justify-end">${actionsHtml}</div>` : ''}
    </div>
  `;

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    // Close on Escape
    const handleEsc = (e) => {
        if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleEsc);

    // Action buttons
    overlay.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.action);
            if (actions[idx]?.onClick) actions[idx].onClick(close);
        });
    });

    container.appendChild(overlay);

    function close() {
        document.removeEventListener('keydown', handleEsc);
        overlay.style.animation = 'fadeOut 0.2s ease forwards';
        setTimeout(() => overlay.remove(), 200);
    }

    return close;
}

/**
 * Show a confirm dialog
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>}
 */
export function confirm(message) {
    return new Promise(resolve => {
        showModal({
            title: 'Xác nhận',
            content: `<p>${message}</p>`,
            actions: [
                { label: 'Huỷ', class: 'btn-secondary', onClick: (close) => { close(); resolve(false); } },
                { label: 'Đồng ý', class: 'btn-primary', onClick: (close) => { close(); resolve(true); } },
            ]
        });
    });
}
