/**
 * Team Page — Workspace management, members, roles, activity log
 */
import { store } from '../utils/state.js';
import { loadWorkspace, saveWorkspace, loadTeamActivity } from '../services/firestore.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { timeAgo } from '../utils/helpers.js';
import { t } from '../utils/i18n.js';

const ROLE_LABELS = {
  admin: { label: t('roles.admin'), badge: 'badge-accent', icon: '👑' },
  editor: { label: t('roles.editor'), badge: 'badge-success', icon: '✏️' },
  viewer: { label: t('roles.viewer'), badge: 'badge-warning', icon: '👁️' },
};

export async function renderTeamPage() {
  const app = document.getElementById('app');
  const user = store.get('user');

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">👥 ${t('team.title')}</h1>
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
          <button class="btn btn-ghost btn-sm" id="btn-edit-workspace">✏️ ${t('actions.edit')}</button>
        </div>
      </div>

      <!-- Members Grid -->
      <h3 style="margin-bottom: var(--space-4);">👤 ${t('team.members')}</h3>
      <div class="team-members" id="team-members">
        <div class="skeleton" style="height: 80px; margin-bottom: var(--space-3);"></div>
      </div>

      <!-- Activity Log -->
      <h3 style="margin-top: var(--space-8); margin-bottom: var(--space-4);">📋${t('team.recentActivity')}</h3>
      <div class="activity-log" id="activity-log">
        <div class="skeleton" style="height: 60px; margin-bottom: var(--space-2);"></div>
      </div>

      <!-- Invite Modal -->
      <div class="modal-overlay hidden" id="invite-modal">
        <div class="card" style="max-width: 440px; width: 90%; padding: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">✉️ ${t('team.inviteTitle')}</h3>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('team.email')} *</label>
            <input type="email" class="form-input" id="invite-email" placeholder="email@example.com">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${t('team.role')}</label>
            <select class="form-input" id="invite-role">
              <option value="editor">✏️ ${t('roles.editor')} — ${t('team.editorDesc')}</option>
              <option value="viewer">👁️ ${t('roles.viewer')} — ${t('team.viewerDesc')}</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-primary" id="btn-send-invite" style="flex: 1;">📩 ${t('team.sendInvite')}</button>
            <button class="btn btn-ghost" id="btn-close-invite">${t('actions.cancel')}</button>
          </div>
        </div>
      </div>

      <!-- Edit Workspace Modal -->
      <div class="modal-overlay hidden" id="workspace-modal">
        <div class="card" style="max-width: 440px; width: 90%; padding: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">✏️ ${t('team.editWorkspace')}</h3>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">${t('team.workspaceName')}</label>
            <input type="text" class="form-input" id="ws-name" placeholder="${t('team.workspaceNamePlaceholder')}">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${t('team.workspaceDesc')}</label>
            <textarea class="form-input" id="ws-desc" rows="2" placeholder="${t('team.workspaceDescPlaceholder')}"></textarea>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-primary" id="btn-save-workspace" style="flex: 1;">💾 ${t('actions.save')}</button>
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
  const user = store.get('user');
  try {
    let workspace = await loadWorkspace();

    // Auto-create workspace for new users
    if (!workspace) {
      workspace = {
        name: `${user?.displayName || 'My'} Workspace`,
        description: t('team.defaultWorkspaceDesc'),
        members: [{
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'admin',
          joinedAt: new Date().toISOString(),
        }],
      };
      await saveWorkspace(workspace);
    }

    store.set('workspace', workspace);

    // Render workspace info
    document.getElementById('workspace-name').textContent = workspace.name || 'Workspace';
    document.getElementById('workspace-desc').textContent = workspace.description || t('team.noDescription');

    // Render members
    renderMembers(workspace.members || []);

    // Load activity
    try {
      const activity = await loadTeamActivity();
      renderActivity(activity);
    } catch { renderActivity([]); }

    return workspace;
  } catch {
    document.getElementById('workspace-name').textContent = 'Workspace';
    document.getElementById('workspace-desc').textContent = t('team.notSetup');
    renderMembers([]);
    renderActivity([]);
  }
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
    const isMe = m.uid === currentUser?.uid;
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
            </div>
            <div class="text-sm text-muted">${m.email || ''}</div>
          </div>
          <span class="badge ${r.badge}">${r.icon} ${r.label}</span>
          ${!isMe && members.find(x => x.uid === currentUser?.uid)?.role === 'admin' ? `
            <select class="form-input" style="width: auto; padding: var(--space-1) var(--space-2); font-size: var(--font-xs);" 
                    data-uid="${m.uid}" onchange="this.dispatchEvent(new CustomEvent('role-change', {bubbles:true, detail:{uid:'${m.uid}',role:this.value}}))">
              <option value="editor" ${m.role === 'editor' ? 'selected' : ''}>${t('roles.editor')}</option>
              <option value="viewer" ${m.role === 'viewer' ? 'selected' : ''}>${t('roles.viewer')}</option>
              <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>${t('roles.admin')}</option>
            </select>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Role change events
  container.addEventListener('role-change', async (e) => {
    const { uid: memberUid, role } = e.detail;
    try {
      const workspace = store.get('workspace');
      const member = workspace.members.find(m => m.uid === memberUid);
      if (member) {
        member.role = role;
        await saveWorkspace(workspace);
        showToast(t('team.roleUpdated'), 'success');
      }
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
        <span style="font-size: 2rem;">📋</span>
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
    const workspace = store.get('workspace') || {};
    const members = workspace.members || [];

    // Check if already a member
    if (members.find(m => m.email === email)) {
      showToast(t('team.emailAlreadyMember'), 'error');
      return;
    }

    members.push({
      email,
      role,
      displayName: email.split('@')[0],
      photoURL: '',
      uid: `invited_${Date.now()}`,
      joinedAt: new Date().toISOString(),
      status: 'invited',
    });

    workspace.members = members;
    await saveWorkspace(workspace);

    showToast(t('team.inviteSent', { email, role }), 'success');
    document.getElementById('invite-modal')?.classList.add('hidden');
    renderMembers(members);
  } catch (err) {
    showToast(t('common.error') + ': ' + err.message, 'error');
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
