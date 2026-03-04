/**
 * Workspace Selector Page
 * Shown when user belongs to multiple workspaces.
 * Allows choosing which workspace to enter.
 * Super admins can also create new workspaces from here.
 */
import { store } from '../utils/state.js';
import { showToast } from '../components/toast.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { switchWorkspace } from '../services/firestore.js';
import { isSuperAdmin } from '../config/superadmin.js';

export async function renderWorkspaceSelector() {
    const app = document.getElementById('app');
    const user = store.get('user') || {};
    const workspaces = store.get('userWorkspaces') || [];

    const showCreateBtn = isSuperAdmin(user.uid);

    const workspaceCards = workspaces.length > 0 ? workspaces.map(ws => `
        <button class="workspace-card" data-ws-id="${ws.id}" style="
            display: flex; align-items: center; gap: 16px;
            width: 100%; padding: 16px 20px;
            background: var(--glass-bg); border: 1px solid var(--glass-border);
            border-radius: 12px; cursor: pointer; text-align: left;
            transition: all 0.2s ease; color: var(--text);
        ">
            <span style="
                width: 44px; height: 44px; border-radius: 10px;
                background: var(--primary-alpha); display: flex;
                align-items: center; justify-content: center; flex-shrink: 0;
            ">${icon('folder', 22)}</span>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: var(--font-base);">${ws.name || ws.id}</div>
                <div class="text-sm text-muted" style="margin-top: 2px;">
                    ${t('workspace.role')}: ${t('roles.' + (ws.role || 'viewer'))}
                    ${ws.ownerId === user.uid ? ' · Owner' : ''}
                </div>
            </div>
            <span style="color: var(--primary); font-size: 20px;">→</span>
        </button>
    `).join('') : `
        <div style="text-align: center; padding: 24px; color: var(--text-muted);">
            <p style="font-size: var(--font-lg); margin-bottom: 8px;">${t('workspace.noWorkspace')}</p>
            <p class="text-sm">${t('workspace.noWorkspaceDesc')}</p>
        </div>
    `;

    app.innerHTML = `
    <main style="
        min-height: 100vh; display: flex; align-items: center; justify-content: center;
        padding: 24px; background: var(--bg);
    ">
        <div style="
            width: 100%; max-width: 480px;
            background: var(--surface); border: 1px solid var(--glass-border);
            border-radius: 16px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        ">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 32px; margin-bottom: 8px;">🏢</div>
                <h2 style="margin: 0; font-size: var(--font-xl);">${t('workspace.switchTo')}</h2>
                <p class="text-sm text-muted" style="margin-top: 4px;">
                    ${user.displayName || user.email}
                </p>
            </div>

            <!-- Workspace List -->
            <div id="workspace-selector-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                ${workspaceCards}
            </div>

            <!-- Create New Workspace (super admin only) -->
            ${showCreateBtn ? `
            <div id="create-workspace-section">
                <button id="btn-show-create-ws" class="btn btn-ghost" style="
                    width: 100%; display: flex; align-items: center; justify-content: center;
                    gap: 8px; padding: 12px; border: 2px dashed var(--glass-border);
                    border-radius: 12px; color: var(--text-muted);
                ">
                    ${icon('plus', 18)} ${t('workspace.create')}
                </button>
                <div id="create-ws-form" style="display: none; margin-top: 12px;">
                    <div class="input-group" style="margin-bottom: 12px;">
                        <label for="new-ws-name">${t('workspace.nameLabel')}</label>
                        <input type="text" id="new-ws-name" class="input"
                               placeholder="${t('workspace.namePlaceholder')}"
                               style="font-size: 16px;">
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button id="btn-create-ws" class="btn btn-primary" style="flex: 1;">
                            ${icon('check', 16)} ${t('workspace.createBtn')}
                        </button>
                        <button id="btn-cancel-create-ws" class="btn btn-ghost">
                            ${t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Sign out -->
            <div style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--glass-border);">
                <button id="btn-ws-logout" class="btn btn-ghost btn-sm" style="color: var(--danger);">
                    ${icon('logout', 14)} ${t('auth.signOut')}
                </button>
            </div>
        </div>
    </main>
    `;

    attachWorkspaceSelectorEvents();
}

function attachWorkspaceSelectorEvents() {
    // Workspace selection
    document.querySelectorAll('.workspace-card').forEach(card => {
        // Hover effect
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--primary)';
            card.style.background = 'var(--surface)';
            card.style.transform = 'translateY(-1px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'var(--glass-border)';
            card.style.background = 'var(--glass-bg)';
            card.style.transform = 'translateY(0)';
        });
        // Click to enter
        card.addEventListener('click', async () => {
            const wsId = card.dataset.wsId;
            const result = await switchWorkspace(wsId);
            if (result) {
                showToast(`${t('workspace.switchSuccess')}: ${result.name}`, 'success');
                router.navigate('dashboard');
            }
        });
    });

    // Show create form
    const showBtn = document.getElementById('btn-show-create-ws');
    const form = document.getElementById('create-ws-form');
    if (showBtn && form) {
        showBtn.addEventListener('click', () => {
            showBtn.style.display = 'none';
            form.style.display = 'block';
            document.getElementById('new-ws-name')?.focus();
        });
    }

    // Cancel create
    const cancelBtn = document.getElementById('btn-cancel-create-ws');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            form.style.display = 'none';
            showBtn.style.display = 'flex';
        });
    }

    // Create workspace
    const createBtn = document.getElementById('btn-create-ws');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('new-ws-name');
            const name = nameInput?.value?.trim();
            if (!name) {
                showToast(t('workspace.nameRequired'), 'warning');
                return;
            }

            createBtn.disabled = true;
            createBtn.textContent = '...';

            try {
                const { createNewWorkspace } = await import('../services/firestore.js');
                const workspace = await createNewWorkspace(name);
                if (workspace) {
                    showToast(`${t('workspace.created')}: ${name}`, 'success');
                    router.navigate('dashboard');
                }
            } catch (err) {
                console.error('Create workspace error:', err);
                showToast(t('errors.generic'), 'error');
            } finally {
                createBtn.disabled = false;
                createBtn.textContent = t('workspace.createBtn');
            }
        });
    }

    // Sign out
    const logoutBtn = document.getElementById('btn-ws-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { signOutUser } = await import('../services/auth.js');
            await signOutUser();
        });
    }
}
