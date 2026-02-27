/**
 * Team Page — Workspace management, members, roles, activity log, task overview
 */
import { store } from '../utils/state.js';
import { loadWorkspace, saveWorkspace, loadTeamActivity, currentWorkspaceId, loadContents } from '../services/firestore.js';
import { loadWorkspaceMembers, addWorkspaceMember, inviteMember, updateMemberRole, removeMember } from '../services/firestore.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { timeAgo } from '../utils/helpers.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';

const ROLE_LABELS = {
  admin: { label: t('roles.admin'), badge: 'badge-accent', iconName: 'crown' },
  editor: { label: t('roles.editor'), badge: 'badge-success', iconName: 'pencil' },
  viewer: { label: t('roles.viewer'), badge: 'badge-warning', iconName: 'eye' },
};

export async function renderTeamPage() {
  const app = document.getElementById('app');
  const user = store.get('user');

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('team', 28)} ${t('team.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">${t('team.subtitle')}</p>
        </div>
        <button class="btn btn-primary" id="btn-invite">+ ${t('team.invite')}</button>
      </div>

      <!-- Workspace Info -->
      <div class="card" style="margin-bottom: var(--space-6); padding: var(--space-5);">
        <div class="flex justify-between items-center">
          <div>
            <h3 id="workspace-name" style="margin-bottom: var(--space-1);">Workspace</h3>
            <p class="text-sm text-muted" id="workspace-desc">${t('common.loading')}</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-edit-workspace">${icon('edit', 16)} ${t('actions.edit')}</button>
        </div>
      </div>

      <!-- Task Overview (Manager Visibility) -->
      <h3 style="margin-bottom: var(--space-4);">${icon('chart', 20)} ${t('team.taskOverview')}</h3>
      <div id="task-overview" style="margin-bottom: var(--space-6);">
        <div class="skeleton" style="height: 120px;"></div>
      </div>

      <!-- Members Grid -->
      <h3 style="margin-bottom: var(--space-4);">${icon('team', 20)} ${t('team.members')}</h3>
      <div class="team-members" id="team-members">
        <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
      </div>

      <!-- Activity Log -->
      <h3 style="margin-top: var(--space-8); margin-bottom: var(--space-4);">${icon('templates', 20)}${t('team.recentActivity')}</h3>
      <div class="activity-log" id="activity-log">
        <div class="skeleton" style="height: 60px; margin-bottom: var(--space-2);"></div>
      </div>

      <!-- Invite Modal -->
      <div class="modal-overlay hidden" id="invite-modal">
        <div class="card" style="max-width: 440px; width: 90%; padding: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">${icon('publish', 20)} ${t('team.inviteTitle')}</h3>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('team.email')} *</label>
            <input type="email" class="form-input" id="invite-email" placeholder="email@example.com">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${t('team.role')}</label>
            <select class="form-input" id="invite-role">
              <option value="editor">${t('roles.editor')} — ${t('team.editorDesc')}</option>
              <option value="viewer">${t('roles.viewer')} — ${t('team.viewerDesc')}</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-primary" id="btn-send-invite" style="flex: 1;">${icon('publish', 16)} ${t('team.sendInvite')}</button>
            <button class="btn btn-ghost" id="btn-close-invite">${t('actions.cancel')}</button>
          </div>
        </div>
      </div>

      <!-- Edit Workspace Modal -->
      <div class="modal-overlay hidden" id="workspace-modal">
        <div class="card" style="max-width: 440px; width: 90%; padding: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">${icon('edit', 20)} ${t('team.editWorkspace')}</h3>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('team.workspaceName')}</label>
            <input type="text" class="form-input" id="ws-name" placeholder="${t('team.workspaceNamePlaceholder')}">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${t('team.workspaceDesc')}</label>
            <textarea class="form-input" id="ws-desc" rows="2" placeholder="${t('team.workspaceDescPlaceholder')}"></textarea>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-primary" id="btn-save-workspace" style="flex: 1;">${icon('save', 16)} ${t('actions.save')}</button>
            <button class="btn btn-ghost" id="btn-close-ws-modal">${t('actions.cancel')}</button>
          </div>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();

  // Load workspace data
  const workspace = await loadWorkspaceData();

  // Events
  document.getElementById('btn-invite')?.addEventListener('click', () => {
    document.getElementById('invite-modal')?.classList.remove('hidden');
  });

  document.getElementById('btn-close-invite')?.addEventListener('click', () => {
    document.getElementById('invite-modal')?.classList.add('hidden');
  });

  document.getElementById('invite-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'invite-modal') e.target.classList.add('hidden');
  });

  document.getElementById('btn-send-invite')?.addEventListener('click', handleInvite);

  document.getElementById('btn-edit-workspace')?.addEventListener('click', () => {
    const ws = store.get('workspace') || {};
    document.getElementById('ws-name').value = ws.name || '';
    document.getElementById('ws-desc').value = ws.description || '';
    document.getElementById('workspace-modal')?.classList.remove('hidden');
  });

  document.getElementById('btn-close-ws-modal')?.addEventListener('click', () => {
    document.getElementById('workspace-modal')?.classList.add('hidden');
  });

  document.getElementById('workspace-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'workspace-modal') e.target.classList.add('hidden');
  });

  document.getElementById('btn-save-workspace')?.addEventListener('click', handleSaveWorkspace);
}

async function loadWorkspaceData() {
  try {
    const workspace = await loadWorkspace();

    // Render workspace info
    document.getElementById('workspace-name').textContent = workspace.name || 'Workspace';
    document.getElementById('workspace-desc').textContent = workspace.description || t('team.noDescription');

    // Load members from workspace_members collection
    const workspaceId = currentWorkspaceId();
    const members = await loadWorkspaceMembers(workspaceId);
    renderMembers(members);

    // Load task overview for manager visibility
    try {
      let allContents = store.get('contents') || [];
      if (allContents.length === 0) {
        allContents = await loadContents() || [];
        store.set('contents', allContents);
      }
      renderTaskOverview(allContents, members);
    } catch { renderTaskOverview([], []); }

    // Load activity
    try {
      const activity = await loadTeamActivity();
      renderActivity(activity);
    } catch { renderActivity([]); }

    return workspace;
  } catch {
    document.getElementById('workspace-name').textContent = 'Workspace';
    document.getElementById('workspace-desc').textContent = t('team.notSetup');
    renderTaskOverview([], []);
    renderMembers([]);
    renderActivity([]);
  }
}

/** Render task overview — shows content count by status for each team member */
function renderTaskOverview(contents, members) {
  const container = document.getElementById('task-overview');
  if (!container) return;

  // Count by status
  const statusCounts = {
    draft: contents.filter(c => !c.status || c.status === 'draft').length,
    pending: contents.filter(c => c.status === 'pending').length,
    approved: contents.filter(c => c.status === 'approved').length,
    published: contents.filter(c => c.status === 'published').length,
    design: contents.filter(c => c.visualStatus && c.visualStatus !== 'done').length,
  };
  const total = contents.length;

  if (total === 0) {
    container.innerHTML = `
      <div class="card-flat text-center" style="padding: var(--space-6); background: var(--surface); border-radius: var(--radius-lg);">
        <span style="color: var(--text-muted);">${icon('chart', 40)}</span>
        <p class="text-sm text-muted" style="margin-top: var(--space-2);">${t('team.noTasks')}</p>
      </div>
    `;
    return;
  }

  // Status config
  const statuses = [
    { key: 'draft', label: t('team.taskDrafts'), color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.15)' },
    { key: 'pending', label: t('team.taskPending'), color: 'var(--color-warning)', bg: 'rgba(251,191,36,0.15)' },
    { key: 'approved', label: t('team.taskApproved'), color: 'var(--color-info)', bg: 'rgba(59,130,246,0.15)' },
    { key: 'published', label: t('team.taskPublished'), color: 'var(--color-success)', bg: 'rgba(34,197,94,0.15)' },
    { key: 'design', label: t('team.taskDesign'), color: 'var(--color-primary)', bg: 'rgba(139,92,246,0.15)' },
  ];

  // Summary cards (top row)
  const summaryHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-4);">
      <div class="card" style="padding: var(--space-3); text-align: center; border-top: 3px solid var(--color-primary);">
        <div style="font-size: var(--font-2xl); font-weight: 700;">${total}</div>
        <div class="text-xs text-muted">${t('team.totalContent')}</div>
      </div>
      ${statuses.map(s => `
        <div class="card" style="padding: var(--space-3); text-align: center; border-top: 3px solid ${s.color};">
          <div style="font-size: var(--font-2xl); font-weight: 700;">${statusCounts[s.key]}</div>
          <div class="text-xs text-muted">${s.label}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Progress bar showing distribution
  const barSegments = statuses
    .filter(s => statusCounts[s.key] > 0)
    .map(s => {
      const pct = Math.max(((statusCounts[s.key] / total) * 100), 2);
      return `<div title="${s.label}: ${statusCounts[s.key]}" style="width: ${pct}%; background: ${s.color}; height: 8px; border-radius: 4px; transition: width 0.3s;"></div>`;
    }).join('');

  const progressHtml = `
    <div class="card" style="padding: var(--space-4);">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm" style="font-weight: 600;">Pipeline</span>
        <span class="text-xs text-muted">${total} ${t('dashboard.posts')}</span>
      </div>
      <div style="display: flex; gap: 2px; border-radius: 4px; overflow: hidden; background: var(--bg-tertiary);">${barSegments}</div>
      <div class="flex gap-4 mt-3" style="flex-wrap: wrap;">
        ${statuses.filter(s => statusCounts[s.key] > 0).map(s => `
          <span class="text-xs flex items-center gap-1">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${s.color}; display: inline-block;"></span>
            ${s.label} (${statusCounts[s.key]})
          </span>
        `).join('')}
      </div>
    </div>
  `;

  // Per-member breakdown (if there are members)
  let memberHtml = '';
  if (members.length > 0) {
    const currentUser = store.get('user');
    const memberRows = members.map(m => {
      const memberContents = contents.filter(c =>
        c.userId === m.userId || c.assignee === m.userId || c.assignee === m.email
      );
      const mc = {
        draft: memberContents.filter(c => !c.status || c.status === 'draft').length,
        pending: memberContents.filter(c => c.status === 'pending').length,
        approved: memberContents.filter(c => c.status === 'approved').length,
        published: memberContents.filter(c => c.status === 'published').length,
      };
      const memberTotal = memberContents.length;
      const isMe = m.userId === currentUser?.uid;

      return `
        <tr>
          <td style="padding: var(--space-2) var(--space-3); white-space: nowrap;">
            <div class="flex items-center gap-2">
              <img src="${m.photoURL || ''}" alt="" style="width: 24px; height: 24px; border-radius: 50%; background: var(--bg-tertiary);" onerror="this.style.display='none'">
              <span style="font-weight: 500;">${m.displayName || m.email || 'User'}</span>
              ${isMe ? '<span class="text-xs text-muted">(You)</span>' : ''}
            </div>
          </td>
          <td style="padding: var(--space-2) var(--space-3); text-align: center;">${memberTotal}</td>
          <td style="padding: var(--space-2) var(--space-3); text-align: center;">
            ${mc.draft > 0 ? `<span class="badge" style="background: rgba(148,163,184,0.15); color: var(--text-muted); font-size: 11px;">${mc.draft}</span>` : '<span class="text-muted text-xs">-</span>'}
          </td>
          <td style="padding: var(--space-2) var(--space-3); text-align: center;">
            ${mc.pending > 0 ? `<span class="badge badge-warning" style="font-size: 11px;">${mc.pending}</span>` : '<span class="text-muted text-xs">-</span>'}
          </td>
          <td style="padding: var(--space-2) var(--space-3); text-align: center;">
            ${mc.approved > 0 ? `<span class="badge badge-info" style="font-size: 11px;">${mc.approved}</span>` : '<span class="text-muted text-xs">-</span>'}
          </td>
          <td style="padding: var(--space-2) var(--space-3); text-align: center;">
            ${mc.published > 0 ? `<span class="badge badge-success" style="font-size: 11px;">${mc.published}</span>` : '<span class="text-muted text-xs">-</span>'}
          </td>
        </tr>
      `;
    }).join('');

    memberHtml = `
      <div class="card" style="margin-top: var(--space-4); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: var(--font-sm);">
          <thead>
            <tr style="border-bottom: 1px solid var(--border);">
              <th style="padding: var(--space-2) var(--space-3); text-align: left; font-weight: 600;">${t('team.members')}</th>
              <th style="padding: var(--space-2) var(--space-3); text-align: center; font-weight: 600;">${t('team.totalContent')}</th>
              <th style="padding: var(--space-2) var(--space-3); text-align: center; font-weight: 600;">${t('team.taskDrafts')}</th>
              <th style="padding: var(--space-2) var(--space-3); text-align: center; font-weight: 600;">${t('team.taskPending')}</th>
              <th style="padding: var(--space-2) var(--space-3); text-align: center; font-weight: 600;">${t('team.taskApproved')}</th>
              <th style="padding: var(--space-2) var(--space-3); text-align: center; font-weight: 600;">${t('team.taskPublished')}</th>
            </tr>
          </thead>
          <tbody>${memberRows}</tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = summaryHtml + progressHtml + memberHtml;
}

function renderMembers(members) {
  const container = document.getElementById('team-members');
  if (!container) return;

  if (!members.length) {
    container.innerHTML = `<p class="text-muted text-sm">${t('team.noMembers')}</p>`;
    return;
  }

  const currentUser = store.get('user');

  container.innerHTML = members.map(m => {
    const r = ROLE_LABELS[m.role] || ROLE_LABELS.viewer;
    const isMe = m.userId === currentUser?.uid;
    return `
      <div class="member-card card" style="padding: var(--space-4); margin-bottom: var(--space-3);">
        <div class="flex items-center gap-4">
          <img src="${m.photoURL || ''}" alt="" 
               style="width: 44px; height: 44px; border-radius: 50%; background: var(--bg-tertiary);"
               onerror="this.style.display='none'">
          <div style="flex: 1; min-width: 0;">
            <div class="flex items-center gap-2">
              <strong>${m.displayName || m.email || 'Unknown'}</strong>
              ${isMe ? `<span class="text-xs text-muted">(${t('team.you')})</span>` : ''}
              ${m.status === 'invited' ? `<span class="badge badge-warning">Invited</span>` : ''}
            </div>
            <div class="text-sm text-muted">${m.email || ''}</div>
          </div>
          <span class="badge ${r.badge}">${icon(r.iconName, 14)} ${r.label}</span>
          ${!isMe && members.find(x => x.userId === currentUser?.uid)?.role === 'admin' ? `
            <select class="form-input" style="width: auto; padding: var(--space-1) var(--space-2); font-size: var(--font-xs);" 
                    data-member-id="${m.id}" onchange="this.dispatchEvent(new CustomEvent('role-change', {bubbles:true, detail:{memberId:'${m.id}',role:this.value}}))">
              <option value="editor" ${m.role === 'editor' ? 'selected' : ''}>${t('roles.editor')}</option>
              <option value="viewer" ${m.role === 'viewer' ? 'selected' : ''}>${t('roles.viewer')}</option>
              <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>${t('roles.admin')}</option>
            </select>
            <button class="btn btn-ghost btn-sm" style="color: var(--danger); padding: var(--space-1);" 
                    title="${t('team.removeMember') || 'Xóa thành viên'}"
                    onclick="this.dispatchEvent(new CustomEvent('remove-member', {bubbles:true, detail:{memberId:'${m.id}', memberName:'${(m.displayName || m.email || '').replace(/'/g, '\\&#39;')}'}}))"
            >${icon('trash', 16)}</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Role change events
  container.addEventListener('role-change', async (e) => {
    const { memberId, role } = e.detail;
    try {
      await updateMemberRole(memberId, role);
      showToast(t('team.roleUpdated'), 'success');
    } catch (err) {
      showToast(t('common.error') + ': ' + err.message, 'error');
    }
  });

  // Remove member events
  container.addEventListener('remove-member', async (e) => {
    const { memberId, memberName } = e.detail;
    const confirmed = confirm(t('team.confirmRemove', { name: memberName }) || `Bạn có chắc muốn xóa ${memberName} khỏi workspace?`);
    if (!confirmed) return;

    try {
      await removeMember(memberId);
      showToast(t('team.memberRemoved') || 'Đã xóa thành viên', 'success');
      // Refresh member list
      const workspaceId = currentWorkspaceId();
      const updatedMembers = await loadWorkspaceMembers(workspaceId);
      renderMembers(updatedMembers);
    } catch (err) {
      showToast(t('common.error') + ': ' + err.message, 'error');
    }
  });
}

function renderActivity(activities) {
  const container = document.getElementById('activity-log');
  if (!container) return;

  if (!activities.length) {
    container.innerHTML = `
      <div class="card-flat text-center" style="padding: var(--space-6);">
        <span style="color: var(--text-muted);">${icon('templates', 40)}</span>
        <p class="text-sm text-muted" style="margin-top: var(--space-2);">${t('team.noActivity')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activities.slice(0, 20).map(a => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div class="activity-content">
        <span class="text-sm"><strong>${a.userName || 'User'}</strong> ${a.action || ''}</span>
        <span class="text-xs text-muted">${a.createdAt ? timeAgo(a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : ''}</span>
      </div>
    </div>
  `).join('');
}

async function handleInvite() {
  const email = document.getElementById('invite-email')?.value?.trim();
  const role = document.getElementById('invite-role')?.value || 'viewer';

  if (!email) {
    showToast(t('team.emailRequired'), 'error');
    return;
  }

  try {
    const user = store.get('user');
    const workspaceId = currentWorkspaceId();

    await inviteMember(workspaceId, email, role);

    showToast(t('team.inviteSent', { email, role }), 'success');
    document.getElementById('invite-modal')?.classList.add('hidden');

    // Refresh member list
    const members = await loadWorkspaceMembers(workspaceId);
    renderMembers(members);
  } catch (err) {
    showToast(err.message || t('common.error'), 'error');
  }
}

async function handleSaveWorkspace() {
  const name = document.getElementById('ws-name')?.value?.trim();
  if (!name) {
    showToast(t('team.workspaceNameRequired'), 'error');
    return;
  }

  try {
    const workspace = store.get('workspace') || {};
    workspace.name = name;
    workspace.description = document.getElementById('ws-desc')?.value?.trim() || '';
    await saveWorkspace(workspace);
    store.set('workspace', workspace);

    document.getElementById('workspace-name').textContent = name;
    document.getElementById('workspace-desc').textContent = workspace.description || t('team.noDescription');
    document.getElementById('workspace-modal')?.classList.add('hidden');
    showToast(t('team.workspaceUpdated'), 'success');
  } catch (err) {
    showToast(t('common.error') + ': ' + err.message, 'error');
  }
}
