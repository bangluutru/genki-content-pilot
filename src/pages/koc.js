import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { getCurrentUserRole, currentWorkspaceId } from '../services/firestore.js';
import { loadKocs, saveKoc, deleteKoc } from '../services/db/kocs.js';
import { icon } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { showToast } from '../components/toast.js';

let kocs = [];
let role = 'viewer';

export async function renderKocPage() {
    role = await getCurrentUserRole(currentWorkspaceId());
    kocs = await loadKocs();

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="layout">
            ${renderSidebar()}
            <main class="main-content">
                <header class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="page-title">${icon('team')} ${t('kocPage.title')}</h1>
                        <p class="page-subtitle">${t('kocPage.subtitle')}</p>
                    </div>
                    ${role === 'editor' || role === 'admin' ? `
                        <button class="btn btn-primary" id="btn-add-koc">
                            ${icon('plus')} ${t('kocPage.addKoc')}
                        </button>
                    ` : ''}
                </header>

                <div class="content-body">
                    <!-- Form Modal / Panel (Hidden by default) -->
                    <div id="koc-form-panel" class="card" style="display: none; margin-bottom: var(--space-6);">
                        <div class="card-header">
                            <h3 class="card-title">${t('kocPage.addKoc')}</h3>
                        </div>
                        <div class="card-body">
                            <form id="form-koc">
                                <input type="hidden" id="koc-id">
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
                                    <div class="form-group">
                                        <label class="form-label">${t('kocPage.name')} *</label>
                                        <input type="text" id="koc-name" class="input" required />
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">${t('kocPage.link')}</label>
                                        <input type="url" id="koc-link" class="input" placeholder="https://" />
                                    </div>
                                </div>

                                <div class="form-group" style="margin-bottom: var(--space-4);">
                                    <label class="form-label">${t('kocPage.rating')}</label>
                                    <input type="number" id="koc-rating" class="input" min="1" max="5" value="5" />
                                </div>

                                <div class="form-group" style="margin-bottom: var(--space-4);">
                                    <label class="form-label">${t('kocPage.style')}</label>
                                    <textarea id="koc-style" class="input" rows="3" placeholder="${t('kocPage.stylePlaceholder')}"></textarea>
                                </div>

                                <div style="display: flex; justify-content: flex-end; gap: var(--space-3);">
                                    <button type="button" class="btn btn-ghost" id="btn-cancel-koc">${t('actions.cancel')}</button>
                                    <button type="submit" class="btn btn-primary" id="btn-save-koc">${t('actions.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- KOC List -->
                    <div id="koc-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4);">
                        ${renderKocCards()}
                    </div>
                </div>
            </main>
        </div>
    `;

    attachSidebarEvents();
    attachKocEvents();
}

function renderKocCards() {
    if (kocs.length === 0) {
        return `
            <div class="empty-state" style="grid-column: 1 / -1; margin-top: var(--space-8);">
                <div class="empty-icon">${icon('team', 48)}</div>
                <h3 class="empty-title">${t('kocPage.noKocs')}</h3>
            </div>
        `;
    }

    return kocs.map(koc => `
        <div class="card" style="display: flex; flex-direction: column;">
            <div class="card-header" style="padding-bottom: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <h3 class="card-title" style="margin: 0;">${koc.name}</h3>
                    <div style="color: #fbbf24; display: flex; align-items: center; gap: 2px;">
                        ${koc.rating} ${icon('star', 14)}
                    </div>
                </div>
            </div>
            <div class="card-body" style="flex: 1;">
                ${koc.link ? `<a href="${koc.link}" target="_blank" style="font-size: var(--font-sm); color: var(--primary); display: inline-flex; align-items: center; gap: 4px; margin-bottom: var(--space-3);">${icon('link', 14)} ${new URL(koc.link).hostname}</a>` : ''}
                
                ${koc.style ? `
                    <div style="background: var(--surface); padding: var(--space-3); border-radius: var(--radius-md); font-size: var(--font-sm); color: var(--text-secondary); margin-top: var(--space-2);">
                        <strong>Style:</strong><br/>
                        ${koc.style}
                    </div>
                ` : ''}
            </div>
            ${role === 'editor' || role === 'admin' ? `
            <div class="card-footer" style="padding: var(--space-3); border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: var(--space-2);">
                <button class="btn btn-ghost btn-sm btn-edit-koc" data-id="${koc.id}">${t('actions.edit')}</button>
                <button class="btn btn-ghost btn-sm btn-delete-koc" data-id="${koc.id}" style="color: var(--danger);">${t('actions.delete')}</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

function attachKocEvents() {
    const btnAdd = document.getElementById('btn-add-koc');
    const panel = document.getElementById('koc-form-panel');
    const form = document.getElementById('form-koc');
    const btnCancel = document.getElementById('btn-cancel-koc');
    const btnSave = document.getElementById('btn-save-koc');

    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            form.reset();
            document.getElementById('koc-id').value = '';
            panel.style.display = 'block';
            document.getElementById('koc-name').focus();
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnSave.disabled = true;
            btnSave.innerHTML = icon('spinner');

            try {
                const kocData = {
                    id: document.getElementById('koc-id').value || undefined,
                    name: document.getElementById('koc-name').value,
                    link: document.getElementById('koc-link').value,
                    rating: parseInt(document.getElementById('koc-rating').value) || 5,
                    style: document.getElementById('koc-style').value
                };

                const saved = await saveKoc(kocData);

                // Update local list
                if (kocData.id) {
                    const idx = kocs.findIndex(k => k.id === kocData.id);
                    if (idx !== -1) kocs[idx] = saved;
                } else {
                    kocs.unshift(saved);
                }

                showToast(t('kocPage.saved'), 'success');
                panel.style.display = 'none';
                document.getElementById('koc-list').innerHTML = renderKocCards();
                attachCardEvents(); // Re-attach

            } catch (error) {
                console.error('Error saving KOC:', error);
                showToast(t('common.error'), 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = t('actions.save');
            }
        });
    }

    attachCardEvents();
}

function attachCardEvents() {
    const list = document.getElementById('koc-list');
    const panel = document.getElementById('koc-form-panel');

    list.querySelectorAll('.btn-edit-koc').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const koc = kocs.find(k => k.id === id);
            if (koc) {
                document.getElementById('koc-id').value = koc.id;
                document.getElementById('koc-name').value = koc.name;
                document.getElementById('koc-link').value = koc.link || '';
                document.getElementById('koc-rating').value = koc.rating || 5;
                document.getElementById('koc-style').value = koc.style || '';

                panel.style.display = 'block';
                document.getElementById('koc-name').focus();
            }
        });
    });

    list.querySelectorAll('.btn-delete-koc').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm(t('kocPage.deleteConfirm'))) {
                const id = btn.getAttribute('data-id');
                try {
                    await deleteKoc(id);
                    kocs = kocs.filter(k => k.id !== id);
                    document.getElementById('koc-list').innerHTML = renderKocCards();
                    attachCardEvents();
                    showToast(t('kocPage.deleted'), 'success');
                } catch (error) {
                    showToast(t('common.error'), 'error');
                }
            }
        });
    });
}
