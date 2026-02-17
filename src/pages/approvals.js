/**
 * Approvals Page — Approval queue for content review
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { loadContents, approveContent, rejectContent } from '../services/firestore.js';

export async function renderApprovalsPage() {
    const app = document.getElementById('app');
    const allContents = store.get('contents') || await loadContents() || [];

    // Filter by status
    const pending = allContents.filter(c => c.status === 'pending');
    const approved = allContents.filter(c => c.status === 'approved');
    const rejected = allContents.filter(c => c.status === 'rejected');

    const user = store.get('user');
    const isAdmin = user?.role === 'admin' || user?.email?.includes('admin'); // Simple check

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="mb-6">
        <h1 style="font-size: var(--font-2xl);">✅ Approval Queue</h1>
        <p class="text-muted text-sm" style="margin-top: var(--space-1);">
          Duyệt nội dung trước khi đăng bài
        </p>
      </div>

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom: var(--space-6);">
        <button class="tab-btn active" data-tab="pending">Chờ duyệt (${pending.length})</button>
        <button class="tab-btn" data-tab="approved">Đã duyệt (${approved.length})</button>
        <button class="tab-btn" data-tab="rejected">Từ chối (${rejected.length})</button>
      </div>

      <!-- Pending Tab -->
      <div class="tab-content active" id="tab-pending">
        ${pending.length === 0 ? `
          <div class="empty-state card">
            <p style="font-size: 2rem;">✅</p>
            <p class="text-muted">Không có bài nào chờ duyệt</p>
          </div>
        ` : pending.map(c => renderApprovalCard(c, isAdmin)).join('')}
      </div>

      <!-- Approved Tab -->
      <div class="tab-content hidden" id="tab-approved">
        ${approved.length === 0 ? `
          <div class="empty-state card">
            <p style="font-size: 2rem;">📝</p>
            <p class="text-muted">Chưa có bài nào được duyệt</p>
          </div>
        ` : approved.map(c => renderApprovalCard(c, false)).join('')}
      </div>

      <!-- Rejected Tab -->
      <div class="tab-content hidden" id="tab-rejected">
        ${rejected.length === 0 ? `
          <div class="empty-state card">
            <p style="font-size: 2rem;">❌</p>
            <p class="text-muted">Chưa có bài nào bị từ chối</p>
          </div>
        ` : rejected.map(c => renderApprovalCard(c, false)).join('')}
      </div>
    </main>
  `;

    attachSidebarEvents();
    attachApprovalEvents();
}

function renderApprovalCard(content, isAdmin) {
    const statusBadge = {
        pending: '<span class="badge badge-warning">Chờ duyệt</span>',
        approved: '<span class="badge badge-success">Đã duyệt</span>',
        rejected: '<span class="badge badge-danger">Từ chối</span>',
    }[content.status] || '';

    return `
    <div class="card" style="margin-bottom: var(--space-4);">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h4 style="margin: 0 0 var(--space-2) 0;">${content.brief || 'Untitled'}</h4>
          ${statusBadge}
        </div>
        <small class="text-muted">${new Date(content.createdAt).toLocaleDateString()}</small>
      </div>
      <div class="content-preview" style="max-height: 150px; overflow: auto; padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--space-3);">
        <p style="white-space: pre-wrap;">${content.facebook || ''}</p>
      </div>
      ${isAdmin && content.status === 'pending' ? `
        <div class="flex gap-2">
          <button class="btn btn-success btn-sm btn-approve" data-id="${content.id}">✅ Duyệt</button>
          <button class="btn btn-danger btn-sm btn-reject" data-id="${content.id}">❌ Từ chối</button>
        </div>
      ` : ''}
      ${content.rejectionReason ? `
        <div style="margin-top: var(--space-3); padding: var(--space-3); background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md);">
          <strong>Lý do từ chối:</strong> ${content.rejectionReason}
        </div>
      ` : ''}
    </div>
  `;
}

function attachApprovalEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

            btn.classList.add('active');
            document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
        });
    });

    // Approve buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            try {
                await approveContent(id);
                showToast('Đã duyệt bài!', 'success');
                await renderApprovalsPage();
            } catch (err) {
                showToast('Lỗi: ' + err.message, 'error');
            }
        });
    });

    // Reject buttons
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const reason = prompt('Lý do từ chối:');
            if (!reason) return;

            try {
                await rejectContent(id, reason);
                showToast('Đã từ chối bài', 'info');
                await renderApprovalsPage();
            } catch (err) {
                showToast('Lỗi: ' + err.message, 'error');
            }
        });
    });
}
