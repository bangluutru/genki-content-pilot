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

function renderCustomerCard(item, expanded = false) {
    const typeBadge = item.type === 'b2b'
        ? `<span style="font-size: 11px; padding: 2px 8px; border-radius: 100px; background: rgba(99,102,241,0.15); color: #6366f1; font-weight: 600;">B2B</span>`
        : `<span style="font-size: 11px; padding: 2px 8px; border-radius: 100px; background: rgba(16,185,129,0.15); color: #10b981; font-weight: 600;">B2C</span>`;

    return `
        <div class="customer-item" data-id="${item.id}" style="border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; background: var(--surface);">
            <!-- Collapsed Header -->
            <div class="customer-header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); cursor: pointer; border-left: 3px solid #6366f1;"
                 onclick="this.closest('.customer-item').classList.toggle('is-expanded')">
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <span style="font-size: 18px;">👤</span>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <p class="item-display-name" style="font-weight: 600; margin: 0;">${escapeHtml(item.name || 'Khách hàng chưa đặt tên')}</p>
                            ${typeBadge}
                        </div>
                        ${item.demographics ? `<p class="text-sm text-muted" style="margin: 0;">${escapeHtml(item.demographics)}</p>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span class="expand-icon text-muted" style="transition: transform 0.2s;">${icon('chevron', 16)}</span>
                    <button type="button" class="btn btn-ghost btn-icon btn-delete-customer" style="color: var(--danger);" onclick="event.stopPropagation()">
                        ${icon('trash', 16)}
                    </button>
                </div>
            </div>

            <!-- Expandable Form Body -->
            <div class="customer-body" style="display: none; padding: var(--space-5); border-top: 1px solid var(--border); background: var(--bg-secondary);">
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
                    <button type="button" class="btn btn-primary btn-save-customer" style="gap: 8px;">
                        ${icon('save', 16)} Lưu khách hàng
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderCustomersList(items) {
    if (!items || items.length === 0) {
        return `<div class="card empty-list-placeholder text-muted" style="text-align: center; padding: var(--space-8); border: 1px dashed var(--border);">
            ${t('customersDB.empty')}
        </div>`;
    }
    return items.map(item => renderCustomerCard(item)).join('');
}

function attachCustomersEvents(brand) {
    const container = document.getElementById('customers-container');

    // Inject accordion CSS (shared with products)
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

    // Add new customer
    document.getElementById('add-customer-btn')?.addEventListener('click', () => {
        const placeholder = container.querySelector('.empty-list-placeholder');
        if (placeholder) placeholder.remove();

        const newItem = { id: Date.now().toString(), name: '', type: 'b2c', demographics: '', jtbd: '', painPoints: '', painRelievers: '', interests: '' };
        container.querySelectorAll('.customer-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));

        container.insertAdjacentHTML('beforeend', renderCustomerCard(newItem));
        const newCard = container.lastElementChild;
        newCard.classList.add('is-expanded');
        newCard.querySelector('.item-name')?.focus();
        newCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    container.addEventListener('click', async (e) => {
        // Expand/collapse header
        const header = e.target.closest('.customer-header');
        if (header && !e.target.closest('.btn-delete-customer')) {
            const card = header.closest('.customer-item');
            const isExpanded = card.classList.contains('is-expanded');
            container.querySelectorAll('.customer-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));
            if (!isExpanded) card.classList.add('is-expanded');
            return;
        }

        // Delete
        const deleteBtn = e.target.closest('.btn-delete-customer');
        if (deleteBtn) {
            const card = deleteBtn.closest('.customer-item');
            if (confirm(t('brand.deleteItemConfirm'))) {
                card.remove();
                await persistAllCustomers(container, brand);
                if (container.children.length === 0) container.innerHTML = renderCustomersList([]);
            }
            return;
        }

        // Save per item
        const saveBtn = e.target.closest('.btn-save-customer');
        if (saveBtn) {
            const card = saveBtn.closest('.customer-item');
            const originalHtml = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.textContent = 'Đang lưu...';
            try {
                const name = card.querySelector('.item-name').value.trim();
                const demographics = card.querySelector('.item-demographics').value.trim();
                card.querySelector('.item-display-name').textContent = name || 'Khách hàng chưa đặt tên';
                const demEl = card.querySelector('.customer-header .text-sm');
                if (demEl) demEl.textContent = demographics;

                await persistAllCustomers(container, brand);
                showToast(t('toasts.brandSaved'), 'success');
                card.classList.remove('is-expanded');
            } catch (err) {
                showToast(t('brand.saveError'), 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
            }
        }
    });
}

async function persistAllCustomers(container, brand) {
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
    store.set('brand', brand);
    await saveBrand(brand);
}
