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

    if (!brand.detailedCustomers) {
        brand.detailedCustomers = [];
        if (brand.avatars && Array.isArray(brand.avatars) && brand.avatars.length > 0) {
            brand.detailedCustomers = brand.avatars.map(a => ({
                id: a.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: a.name || '',
                type: 'b2c',
                demographics: '',
                jtbd: '',
                painPoints: a.description || '',
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

            <div id="customers-container" class="flex flex-col gap-3">
                ${renderCustomersList(items)}
            </div>
        </main>
    `;

    attachSidebarEvents();
    attachCustomersEvents(brand);
}

function getTypeBadge(type) {
    return type === 'b2b'
        ? `<span style="font-size: 11px; padding: 2px 8px; border-radius: 100px; background: rgba(99,102,241,0.15); color: #6366f1; font-weight: 600; flex-shrink: 0;">B2B</span>`
        : `<span style="font-size: 11px; padding: 2px 8px; border-radius: 100px; background: rgba(16,185,129,0.15); color: #10b981; font-weight: 600; flex-shrink: 0;">B2C</span>`;
}

function renderCustomerCard(item) {
    return `
        <div class="customer-item" data-id="${item.id}" style="border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; background: var(--surface);">
            <div class="customer-header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); cursor: pointer; border-left: 3px solid #6366f1; user-select: none;">
                <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 0;">
                    <span style="font-size: 18px; flex-shrink: 0;">👤</span>
                    <div style="min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <p class="item-display-name" style="font-weight: 600; margin: 0;">${escapeHtml(item.name || 'Chưa đặt tên')}</p>
                            ${getTypeBadge(item.type || 'b2c')}
                        </div>
                        <p class="item-display-demographics text-sm text-muted" style="margin: 0;">${escapeHtml(item.demographics || '')}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0;">
                    <span class="expand-icon text-muted" style="transition: transform 0.2s; display: flex;">${icon('chevron', 16)}</span>
                    <button type="button" class="btn btn-ghost btn-icon btn-delete-customer" style="color: var(--danger);">
                        ${icon('trash', 16)}
                    </button>
                </div>
            </div>

            <div class="customer-body" style="display: none; padding: var(--space-5); border-top: 1px solid var(--border); background: var(--bg-secondary);">
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                    <div class="input-group">
                        <label>${t('customersDB.form.name')}</label>
                        <input type="text" class="input item-name" placeholder="${t('customersDB.form.namePlaceholder')}" value="${escapeHtml(item.name || '')}" required>
                    </div>
                    <div class="input-group">
                        <label>${t('customersDB.form.type')}</label>
                        <select class="select item-type">
                            <option value="b2c" ${(item.type || 'b2c') === 'b2c' ? 'selected' : ''}>${t('customersDB.form.typeB2C')}</option>
                            <option value="b2b" ${item.type === 'b2b' ? 'selected' : ''}>${t('customersDB.form.typeB2B')}</option>
                        </select>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('customersDB.form.demographics')}</label>
                        <input type="text" class="input item-demographics" placeholder="${t('customersDB.form.demographicsPlaceholder')}" value="${escapeHtml(item.demographics || '')}">
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('customersDB.form.jtbd')}</label>
                        <textarea class="textarea item-jtbd" rows="2" placeholder="${t('customersDB.form.jtbdPlaceholder')}">${escapeHtml(item.jtbd || '')}</textarea>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('customersDB.form.painPoints')}</label>
                        <textarea class="textarea item-painPoints" rows="2" placeholder="${t('customersDB.form.painPointsPlaceholder')}">${escapeHtml(item.painPoints || '')}</textarea>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('customersDB.form.painRelievers')}</label>
                        <textarea class="textarea item-painRelievers" rows="2" placeholder="${t('customersDB.form.painRelieversPlaceholder')}">${escapeHtml(item.painRelievers || '')}</textarea>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('customersDB.form.interests')}</label>
                        <textarea class="textarea item-interests" rows="2" placeholder="${t('customersDB.form.interestsPlaceholder')}">${escapeHtml(item.interests || '')}</textarea>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: var(--space-4);">
                    <button type="button" class="btn btn-primary btn-save-customer">
                        ${icon('save', 16)} Lưu khách hàng
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderCustomersList(items) {
    if (!items || items.length === 0) {
        return `<div class="empty-list-placeholder text-muted" style="text-align: center; padding: var(--space-8); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
            ${t('customersDB.empty')}
        </div>`;
    }
    return items.map(item => renderCustomerCard(item)).join('');
}

function attachCustomersEvents(brand) {
    const container = document.getElementById('customers-container');

    if (!document.getElementById('accordion-style')) {
        const style = document.createElement('style');
        style.id = 'accordion-style';
        style.textContent = `
            .product-item.is-expanded .product-body,
            .customer-item.is-expanded .customer-body,
            .market-item.is-expanded .market-body { display: block !important; }
            .product-item.is-expanded .expand-icon,
            .customer-item.is-expanded .expand-icon,
            .market-item.is-expanded .expand-icon { transform: rotate(180deg); }
        `;
        document.head.appendChild(style);
    }

    document.getElementById('add-customer-btn')?.addEventListener('click', () => {
        const placeholder = container.querySelector('.empty-list-placeholder');
        if (placeholder) placeholder.remove();

        const newItem = { id: Date.now().toString(), name: '', type: 'b2c', demographics: '', jtbd: '', painPoints: '', painRelievers: '', interests: '' };
        container.insertAdjacentHTML('beforeend', renderCustomerCard(newItem));
        const newCard = container.lastElementChild;
        container.querySelectorAll('.customer-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));
        newCard.classList.add('is-expanded');
        newCard.querySelector('.item-name')?.focus();
        newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    container.addEventListener('click', async (e) => {
        const card = e.target.closest('.customer-item');
        if (!card) return;

        // Delete
        if (e.target.closest('.btn-delete-customer')) {
            if (confirm(t('brand.deleteItemConfirm'))) {
                card.remove();
                await persistAllCustomers(container, brand);
                if (container.querySelectorAll('.customer-item').length === 0) {
                    container.innerHTML = renderCustomersList([]);
                }
            }
            return;
        }

        // Save
        if (e.target.closest('.btn-save-customer')) {
            const saveBtn = e.target.closest('.btn-save-customer');
            const originalHtml = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.textContent = 'Đang lưu...';
            try {
                const name = card.querySelector('.item-name').value.trim();
                const demographics = card.querySelector('.item-demographics').value.trim();
                const type = card.querySelector('.item-type').value;
                card.querySelector('.item-display-name').textContent = name || 'Chưa đặt tên';
                card.querySelector('.item-display-demographics').textContent = demographics;
                // Update badge
                const badgeEl = card.querySelector('.customer-header [style*="border-radius: 100px"]');
                if (badgeEl) badgeEl.outerHTML = getTypeBadge(type);
                await persistAllCustomers(container, brand);
                showToast(t('toasts.brandSaved'), 'success');
                card.classList.remove('is-expanded');
            } catch (err) {
                console.error(err);
                showToast(t('brand.saveError'), 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
            }
            return;
        }

        // Header click — expand/collapse
        if (e.target.closest('.customer-header')) {
            const isExpanded = card.classList.contains('is-expanded');
            container.querySelectorAll('.customer-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));
            if (!isExpanded) card.classList.add('is-expanded');
        }
    });
}

async function persistAllCustomers(container, brand) {
    const items = Array.from(container.querySelectorAll('.customer-item')).map(el => ({
        id: el.dataset.id,
        name: el.querySelector('.item-name')?.value.trim() || '',
        type: el.querySelector('.item-type')?.value || 'b2c',
        demographics: el.querySelector('.item-demographics')?.value.trim() || '',
        jtbd: el.querySelector('.item-jtbd')?.value.trim() || '',
        painPoints: el.querySelector('.item-painPoints')?.value.trim() || '',
        painRelievers: el.querySelector('.item-painRelievers')?.value.trim() || '',
        interests: el.querySelector('.item-interests')?.value.trim() || ''
    })).filter(c => c.name);

    brand.detailedCustomers = items;
    store.set('brand', brand);
    await saveBrand(brand);
}
