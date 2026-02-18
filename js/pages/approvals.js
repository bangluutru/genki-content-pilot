// approvals.js — Trang duyệt bài viết
// Route: #approvals — Liệt kê bài pending, approve/reject

import { getContents, updateContentStatus } from '../state.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { CONFIG } from '../config.js';

let pendingContents = [];

/**
 * Render trang duyệt bài
 * @param {HTMLElement} container
 */
export function renderApprovals(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>✅ Duyệt bài viết</h2>
            <p class="text-secondary">Xem và duyệt các bài viết chờ phê duyệt</p>
        </div>

        <div id="approval-list">
            <div class="loading">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>

        <!-- Rejection modal -->
        <div id="reject-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:480px;width:90%;">
                <div class="card-title">Lý do từ chối</div>
                <div class="form-group">
                    <textarea id="rejection-reason" class="form-textarea" rows="3"
                        placeholder="Nhập lý do từ chối bài viết..."></textarea>
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-reject" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-confirm-reject" class="btn btn-danger">Từ chối</button>
                </div>
            </div>
        </div>
    `;

    loadPendingContents();
    setupApprovalEvents();
}

async function loadPendingContents() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Load all contents, filter for pending_approval
        const all = await getContents(user.uid);
        pendingContents = all.filter(c => c.status === CONFIG.STATUS.PENDING_APPROVAL);
        renderApprovalList(pendingContents);
    } catch (error) {
        console.error('Load approvals error:', error);
    }
}

function setupApprovalEvents() {
    const user = getCurrentUser();
    let rejectingId = null;

    // Event delegation for approve/reject buttons
    document.getElementById('approval-list').addEventListener('click', async (e) => {
        const approveBtn = e.target.closest('.btn-approve');
        if (approveBtn) {
            const id = approveBtn.dataset.id;
            try {
                await updateContentStatus(id, {
                    status: CONFIG.STATUS.APPROVED,
                    approvedBy: user.uid,
                });
                pendingContents = pendingContents.filter(c => c.id !== id);
                renderApprovalList(pendingContents);
                showToast('Đã duyệt bài viết! ✅', 'success');
            } catch (error) {
                showToast('Lỗi duyệt bài', 'error');
            }
            return;
        }

        const rejectBtn = e.target.closest('.btn-reject');
        if (rejectBtn) {
            rejectingId = rejectBtn.dataset.id;
            document.getElementById('reject-modal').classList.remove('hidden');
            document.getElementById('rejection-reason').value = '';
            document.getElementById('rejection-reason').focus();
        }
    });

    // Cancel rejection
    document.getElementById('btn-cancel-reject').addEventListener('click', () => {
        document.getElementById('reject-modal').classList.add('hidden');
        rejectingId = null;
    });

    // Confirm rejection
    document.getElementById('btn-confirm-reject').addEventListener('click', async () => {
        if (!rejectingId) return;
        const reason = document.getElementById('rejection-reason').value.trim();

        try {
            await updateContentStatus(rejectingId, {
                status: CONFIG.STATUS.REJECTED,
                approvedBy: user.uid,
                rejectionReason: reason || 'Không đạt yêu cầu',
            });
            pendingContents = pendingContents.filter(c => c.id !== rejectingId);
            renderApprovalList(pendingContents);
            document.getElementById('reject-modal').classList.add('hidden');
            rejectingId = null;
            showToast('Đã từ chối bài viết', 'info');
        } catch (error) {
            showToast('Lỗi từ chối bài', 'error');
        }
    });
}

function renderApprovalList(contents) {
    const container = document.getElementById('approval-list');

    if (contents.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: var(--space-2xl);">
                <p style="font-size: 48px; margin-bottom: var(--space-md);">🎉</p>
                <p class="text-muted" style="font-size: 16px;">Không có bài viết nào chờ duyệt</p>
                <p class="text-secondary">Tất cả bài viết đã được xử lý</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <p class="text-secondary" style="margin-bottom: var(--space-md);">
            <strong>${contents.length}</strong> bài viết chờ duyệt
        </p>
        ${contents.map(c => renderApprovalCard(c)).join('')}
    `;
}

function renderApprovalCard(content) {
    const brief = truncate(content.brief || '', 80);
    const preview = truncate(content.facebookPost || '', 150);

    return `
        <div class="card content-card" data-id="${content.id}" style="margin-bottom: var(--space-md);">
            <div class="content-card-header">
                <div>
                    <strong>${brief}</strong>
                    <small class="text-muted">${formatDate(content.createdAt)}</small>
                </div>
                <span class="badge" style="background: var(--warning); color: #000;">⏳ Chờ duyệt</span>
            </div>
            ${preview ? `<p class="text-secondary" style="margin: var(--space-sm) 0;">${escapeHtml(preview)}</p>` : ''}
            <div class="content-card-footer">
                <span class="text-muted">${content.contentType || ''}</span>
                <div class="content-card-actions">
                    <button class="btn btn-primary btn-approve" data-id="${content.id}">✅ Duyệt</button>
                    <button class="btn btn-danger btn-reject" data-id="${content.id}">❌ Từ chối</button>
                </div>
            </div>
        </div>
    `;
}

// ─── Helpers ───

function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
