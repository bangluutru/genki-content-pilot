// content-card.js — Card hiển thị 1 bài content
// Dùng trong: dashboard.js, library.js

/**
 * Render 1 content card
 * @param {object} content - Content data từ Firestore
 * @returns {string} HTML string
 */
export function renderContentCard(content) {
    const statusBadge = getStatusBadge(content.status);

    const channels = (content.publishedTo || [])
        .map(ch => ch === 'facebook' ? '📱 FB' : '📝 WP')
        .join(' · ');

    const campaignBadge = content.campaignId
        ? '<span class="badge" style="background: var(--primary); color: #fff; margin-left: 4px;">📋 Chiến dịch</span>'
        : '';

    return `
        <div class="card content-card" data-id="${content.id}">
            <div class="content-card-header">
                <div>
                    <strong>${truncate(content.brief, 60)}</strong>
                    <small class="text-muted">${formatDate(content.createdAt)}</small>
                </div>
                <div style="display:flex;gap:4px;align-items:center;">
                    ${statusBadge}${campaignBadge}
                </div>
            </div>
            <p class="text-secondary">${truncate(content.facebookPost || '', 120)}</p>
            <div class="content-card-footer">
                <span class="text-muted">${channels || 'Chưa đăng'}</span>
                <div class="content-card-actions">
                    <button class="btn btn-secondary btn-edit" data-id="${content.id}">✏️ Sửa</button>
                    <button class="btn btn-danger btn-delete" data-id="${content.id}">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

// ─── Helpers (internal) ───

function getStatusBadge(status) {
    switch (status) {
        case 'published':
            return '<span class="badge badge-published">✅ Đã đăng</span>';
        case 'approved':
            return '<span class="badge badge-published">👍 Đã duyệt</span>';
        case 'pending_approval':
            return '<span class="badge" style="background: var(--warning); color: #000;">⏳ Chờ duyệt</span>';
        case 'rejected':
            return '<span class="badge" style="background: var(--danger); color: #fff;">❌ Từ chối</span>';
        case 'draft':
        default:
            return '<span class="badge badge-draft">📝 Nháp</span>';
    }
}

function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}
