/**
 * Approvals Page — Approval queue for content review
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { loadContents, approveContent, rejectContent } from '../services/firestore.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { checkCompliance, highlightViolations } from '../services/compliance.js';

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
        <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('check', 28)} ${t('approval.title')}</h1>
        <p class="text-muted text-sm" style="margin-top: var(--space-1);">
          ${t('approval.queue')}
        </p>
      </div>

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom: var(--space-6);">
        <button class="tab-btn active" data-tab="pending">${t('approval.pending')} (${pending.length})</button>
        <button class="tab-btn" data-tab="approved">${t('approval.approvedTab')} (${approved.length})</button>
        <button class="tab-btn" data-tab="rejected">${t('approval.rejectedTab')} (${rejected.length})</button>
      </div>

      <!-- Pending Tab -->
      <div class="tab-content active" id="tab-pending">
        ${pending.length === 0 ? `
          <div class="empty-state card">
            <p style="display: inline-flex;">${icon('check', 32)}</p>
            <p class="text-muted">${t('approval.noPending')}</p>
          </div>
        ` : pending.map(c => renderApprovalCard(c, isAdmin)).join('')}
      </div>

      <!-- Approved Tab -->
      <div class="tab-content hidden" id="tab-approved">
        ${approved.length === 0 ? `
          <div class="empty-state card">
            <p style="display: inline-flex;">${icon('edit', 32)}</p>
            <p class="text-muted">${t('approval.noApproved')}</p>
          </div>
        ` : approved.map(c => renderApprovalCard(c, false)).join('')}
      </div>

      <!-- Rejected Tab -->
      <div class="tab-content hidden" id="tab-rejected">
        ${rejected.length === 0 ? `
          <div class="empty-state card">
            <p style="display: inline-flex;">${icon('cross', 32)}</p>
            <p class="text-muted">${t('approval.noRejected')}</p>
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
    pending: `<span class="badge badge-warning">${t('approval.pending')}</span>`,
    approved: `<span class="badge badge-success">${t('status.approved')}</span>`,
    rejected: `<span class="badge badge-danger">${t('approval.rejected')}</span>`,
  }[content.status] || '';

  const fullText = [content.facebook, content.blog, content.story].filter(Boolean).join('\n\n');
  const compliance = checkCompliance(fullText);
  const isSafe = compliance.score >= 90;
  const highlightedText = highlightViolations(content.facebook || '', compliance.violations);

  const complianceBadge = isSafe
    ? `<span class="badge badge-success" style="margin-left:8px;" title="An toàn">🛡️ ${compliance.score}/100</span>`
    : `<span class="badge badge-danger" style="margin-left:8px;" title="Vi phạm từ khóa cấm!">⚠️ ${compliance.score}/100</span>`;

  return `
    <div class="card" style="margin-bottom: var(--space-4);">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h4 style="margin: 0 0 var(--space-2) 0;">${content.brief || t('approval.untitled')}</h4>
          ${statusBadge} ${complianceBadge}
        </div>
        <small class="text-muted">${new Date(content.createdAt).toLocaleDateString()}</small>
      </div>
      <div class="content-preview" style="max-height: 150px; overflow: auto; padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--space-3);">
        <p style="white-space: pre-wrap;">${highlightedText}</p>
      </div>
      ${isAdmin && content.status === 'pending' ? `
        <div class="flex gap-2 mb-3">
          <button class="btn btn-success btn-sm btn-approve" data-id="${content.id}" ${!isSafe ? 'disabled title="Bài viết chứa từ khóa vi phạm, không thể duyệt"' : ''}>${icon('check', 14)} ${t('actions.approve')}</button>
          <button class="btn btn-danger btn-sm btn-reject" data-id="${content.id}">${icon('cross', 14)} ${t('actions.reject')}</button>
          <button class="btn btn-ghost btn-sm btn-toggle-comment" data-id="${content.id}" style="margin-left: auto;">${icon('edit', 14)} ${t('approval.addComment')}</button>
        </div>
        <div class="approval-comment-box hidden" id="comment-box-${content.id}" style="overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 0; opacity: 0;">
          <textarea class="form-input" id="comment-${content.id}" rows="2" placeholder="${t('approval.commentPlaceholder')}" style="margin-bottom: var(--space-2); font-size: var(--font-sm);"></textarea>
          <div class="flex gap-2">
            <button class="btn btn-success btn-sm btn-approve-note" data-id="${content.id}" ${!isSafe ? 'disabled' : ''}>${icon('check', 14)} ${t('approval.approveWithNote')}</button>
            <button class="btn btn-danger btn-sm btn-reject-note" data-id="${content.id}">${icon('cross', 14)} ${t('approval.rejectWithNote')}</button>
          </div>
        </div>
      ` : ''}
      ${content.rejectionReason ? `
        <div style="margin-top: var(--space-3); padding: var(--space-3); background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md);">
          <strong>${t('approval.rejectionReason')}:</strong> ${content.rejectionReason}
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

  // Toggle comment box
  document.querySelectorAll('.btn-toggle-comment').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const box = document.getElementById(`comment-box-${id}`);
      if (!box) return;

      const isHidden = box.classList.contains('hidden');
      if (isHidden) {
        box.classList.remove('hidden');
        requestAnimationFrame(() => {
          box.style.maxHeight = '200px';
          box.style.opacity = '1';
        });
        box.querySelector('textarea')?.focus();
      } else {
        box.style.maxHeight = '0';
        box.style.opacity = '0';
        setTimeout(() => box.classList.add('hidden'), 300);
      }
    });
  });

  // Quick approve (no comment needed)
  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await approveContent(id);
        showToast(t('toasts.approved'), 'success');
        await renderApprovalsPage();
      } catch (err) {
        showToast(t('common.error') + ': ' + err.message, 'error');
      }
    });
  });

  // Quick reject (opens comment box instead of prompt)
  document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const box = document.getElementById(`comment-box-${id}`);
      if (!box) return;

      box.classList.remove('hidden');
      requestAnimationFrame(() => {
        box.style.maxHeight = '200px';
        box.style.opacity = '1';
      });
      box.querySelector('textarea')?.focus();
    });
  });

  // Approve with note
  document.querySelectorAll('.btn-approve-note').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const comment = document.getElementById(`comment-${id}`)?.value?.trim();
      try {
        await approveContent(id, comment);
        showToast(t('toasts.approved') + (comment ? ` — ${comment}` : ''), 'success');
        await renderApprovalsPage();
      } catch (err) {
        showToast(t('common.error') + ': ' + err.message, 'error');
      }
    });
  });

  // Reject with note
  document.querySelectorAll('.btn-reject-note').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const reason = document.getElementById(`comment-${id}`)?.value?.trim();
      if (!reason) {
        showToast(t('approval.rejectionReasonPrompt'), 'warning');
        document.getElementById(`comment-${id}`)?.focus();
        return;
      }
      try {
        await rejectContent(id, reason);
        showToast(t('approval.rejectedToast'), 'info');
        await renderApprovalsPage();
      } catch (err) {
        showToast(t('common.error') + ': ' + err.message, 'error');
      }
    });
  });
}
