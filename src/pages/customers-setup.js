import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveBrand, loadBrand } from '../services/firestore.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { escapeHtml } from '../utils/helpers.js';

export async function renderCustomersPage() {
    const app = document.getElementById('app');
    let brand = store.get('brand') || await loadBrand() || {};

    // Data Migration & Initialization
    if (!brand.detailedCustomers) {
        brand.detailedCustomers = [];
        // Migrate old avatars if they exist
        if (brand.avatars && Array.isArray(brand.avatars) && brand.avatars.length > 0) {
            brand.detailedCustomers = brand.avatars.map(a => ({
                id: a.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: a.name || '',
                type: 'b2c', // Default
                demographics: '',
                jtbd: '',
                painPoints: a.description || '', // old 'description' maps best to 'painPoints'
                painRelievers: '',
                interests: ''
            }));
        }
    }

    const items = brand.detailedCustomers || [];

    app.innerHTML = `
        ${renderSidebar()}
        <main class="main-content page">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">
                        ${icon('team', 28)} ${t('customersDB.title')}
                    </h1>
                    <p class="text-muted text-sm" style="margin-top: var(--space-1);">
                        ${t('customersDB.subtitle')}
                    </p>
                </div>
                <button type="button" class="btn btn-primary" id="add-customer-btn">
                    ${icon('plus', 16)} ${t('customersDB.addBtn')}
                </button>
            </div>

            <form id="customers-form">
                <div id="customers-container" class="flex flex-col gap-6">
                    ${renderCustomersList(items)}
                </div>
                
                <div class="card" style="margin-top: var(--space-6); background: var(--surface); position: sticky; bottom: var(--space-4); z-index: 10; border: 1px solid var(--border); box-shadow: var(--shadow-md);">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-muted">Bấm Lưu để áp dụng thay đổi</p>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            ${icon('save', 18)} ${t('brand.saveBrand')}
                        </button>
                    </div>
                </div>
            </form>
        </main>
    `;

    attachSidebarEvents();
    attachCustomersEvents(brand);
}

function renderCustomersList(items) {
    if (!items || items.length === 0) {
        return `<div class="card empty-list-placeholder text-muted" style="text-align: center; padding: var(--space-8); border: 1px dashed var(--border);">
            ${t('customersDB.empty')}
        </div>`;
    }

    return items.map(item => `
        <div class="card customer-item" data-id="${item.id || Date.now()}" style="padding: var(--space-5); border: 1px solid var(--border); border-left: 3px solid var(--accent); position: relative;">
            <button type="button" class="btn btn-ghost btn-icon btn-delete-item" style="position: absolute; top: var(--space-2); right: var(--space-2); color: var(--danger);">
                ${icon('trash', 16)}
            </button>
            
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                <div class="input-group">
                    <label>${t('customersDB.form.name')}</label>
                    <input type="text" class="input item-name" placeholder="${t('customersDB.form.namePlaceholder')}" value="${escapeHtml(item.name || '')}" required>
                </div>
                <div class="input-group">
                    <label>${t('customersDB.form.type')}</label>
                    <select class="select item-type">
                        <option value="b2c" ${item.type === 'b2c' ? 'selected' : ''}>${t('customersDB.form.typeB2C')}</option>
                        <option value="b2b" ${item.type === 'b2b' ? 'selected' : ''}>${t('customersDB.form.typeB2B')}</option>
                    </select>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('customersDB.form.demographics')}</label>
                    <input type="text" class="input item-demographics" placeholder="${t('customersDB.form.demographicsPlaceholder')}" value="${escapeHtml(item.demographics || '')}">
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('customersDB.form.jtbd')}</label>
                    <textarea class="textarea item-jtbd" rows="2" placeholder="${t('customersDB.form.jtbdPlaceholder')}" required>${escapeHtml(item.jtbd || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('customersDB.form.painPoints')}</label>
                    <textarea class="textarea item-painPoints" rows="2" placeholder="${t('customersDB.form.painPointsPlaceholder')}" required>${escapeHtml(item.painPoints || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('customersDB.form.painRelievers')}</label>
                    <textarea class="textarea item-painRelievers" rows="2" placeholder="${t('customersDB.form.painRelieversPlaceholder')}" required>${escapeHtml(item.painRelievers || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('customersDB.form.interests')}</label>
                    <textarea class="textarea item-interests" rows="2" placeholder="${t('customersDB.form.interestsPlaceholder')}">${escapeHtml(item.interests || '')}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

function attachCustomersEvents(brand) {
    const container = document.getElementById('customers-container');
    const form = document.getElementById('customers-form');

    // Add new customer
    document.getElementById('add-customer-btn')?.addEventListener('click', () => {
        const newItemHtml = renderCustomersList([{ id: Date.now().toString(), type: 'b2c' }]);

        // Remove empty placeholder if it exists
        const placeholder = container.querySelector('.empty-list-placeholder');
        if (placeholder) placeholder.remove();

        container.insertAdjacentHTML('afterbegin', newItemHtml);

        container.querySelector('.customer-item .item-name')?.focus();
    });

    // Delete item
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-item');
        if (btn) {
            if (confirm(t('brand.deleteItemConfirm'))) {
                btn.closest('.customer-item').remove();
                if (container.children.length === 0) {
                    container.innerHTML = renderCustomersList([]);
                }
            }
        }
    });

    // Save form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Đang lưu...';
        btn.disabled = true;

        try {
            const items = Array.from(container.querySelectorAll('.customer-item')).map(el => ({
                id: el.dataset.id,
                name: el.querySelector('.item-name').value.trim(),
                type: el.querySelector('.item-type').value,
                demographics: el.querySelector('.item-demographics').value.trim(),
                jtbd: el.querySelector('.item-jtbd').value.trim(),
                painPoints: el.querySelector('.item-painPoints').value.trim(),
                painRelievers: el.querySelector('.item-painRelievers').value.trim(),
                interests: el.querySelector('.item-interests').value.trim()
            })).filter(c => c.name);

            brand.detailedCustomers = items;

            await saveBrand(brand);
            showToast(t('toasts.brandSaved'), 'success');
        } catch (error) {
            console.error('Save error:', error);
            showToast(t('brand.saveError'), 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}
