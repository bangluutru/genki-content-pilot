import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveBrand, loadBrand } from '../services/firestore.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { escapeHtml } from '../utils/helpers.js';

export async function renderProductsPage() {
    const app = document.getElementById('app');
    let brand = store.get('brand') || await loadBrand() || {};

    // Data Migration & Initialization
    if (!brand.detailedProducts) {
        brand.detailedProducts = [];
        if (brand.products && Array.isArray(brand.products) && brand.products.length > 0) {
            brand.detailedProducts = brand.products.map(p => ({
                id: p.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: p.name || '',
                category: '',
                price: '',
                ingredients: '',
                benefits: '',
                usp: p.highlight || '',
                usage: ''
            }));
        }
    }

    const items = brand.detailedProducts || [];

    app.innerHTML = `
        ${renderSidebar()}
        <main class="main-content page">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">
                        ${icon('document', 28)} ${t('productsDB.title')}
                    </h1>
                    <p class="text-muted text-sm" style="margin-top: var(--space-1);">
                        ${t('productsDB.subtitle')}
                    </p>
                </div>
                <button type="button" class="btn btn-primary" id="add-product-btn">
                    ${icon('plus', 16)} ${t('productsDB.addBtn')}
                </button>
            </div>

            <div id="products-container" class="flex flex-col gap-3">
                ${renderProductsList(items)}
            </div>
        </main>
    `;

    attachSidebarEvents();
    attachProductsEvents(brand);
}

function renderProductCard(item, expanded = false) {
    const cardId = `product-card-${item.id}`;
    return `
        <div class="product-item" id="${cardId}" data-id="${item.id}" style="border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; background: var(--surface);">
            <!-- Collapsed Header -->
            <div class="product-header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); cursor: pointer; border-left: 3px solid var(--accent);"
                 onclick="this.closest('.product-item').classList.toggle('is-expanded')">
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <span style="font-size: 18px;">📦</span>
                    <div>
                        <p class="item-display-name" style="font-weight: 600; margin: 0;">${escapeHtml(item.name || 'Sản phẩm chưa đặt tên')}</p>
                        ${item.category ? `<p class="text-sm text-muted" style="margin: 0;">${escapeHtml(item.category)}</p>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span class="expand-icon text-muted" style="transition: transform 0.2s;">${icon('chevron', 16)}</span>
                    <button type="button" class="btn btn-ghost btn-icon btn-delete-product" style="color: var(--danger);" onclick="event.stopPropagation()">
                        ${icon('trash', 16)}
                    </button>
                </div>
            </div>

            <!-- Expandable Form Body -->
            <div class="product-body" style="display: none; padding: var(--space-5); border-top: 1px solid var(--border); background: var(--bg-secondary);">
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                    <div class="input-group">
                        <label>${t('productsDB.form.name')}</label>
                        <input type="text" class="input item-name" placeholder="${t('productsDB.form.namePlaceholder')}" value="${escapeHtml(item.name || '')}" required>
                    </div>
                    <div class="input-group">
                        <label>${t('productsDB.form.category')}</label>
                        <input type="text" class="input item-category" placeholder="${t('productsDB.form.categoryPlaceholder')}" value="${escapeHtml(item.category || '')}">
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('productsDB.form.price')}</label>
                        <input type="text" class="input item-price" placeholder="${t('productsDB.form.pricePlaceholder')}" value="${escapeHtml(item.price || '')}">
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('productsDB.form.ingredients')}</label>
                        <textarea class="textarea item-ingredients" rows="2" placeholder="${t('productsDB.form.ingredientsPlaceholder')}">${escapeHtml(item.ingredients || '')}</textarea>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('productsDB.form.benefits')}</label>
                        <textarea class="textarea item-benefits" rows="2" placeholder="${t('productsDB.form.benefitsPlaceholder')}">${escapeHtml(item.benefits || '')}</textarea>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('productsDB.form.usp')}</label>
                        <textarea class="textarea item-usp" rows="2" placeholder="${t('productsDB.form.uspPlaceholder')}">${escapeHtml(item.usp || '')}</textarea>
                    </div>
                    <div class="input-group" style="grid-column: 1 / -1;">
                        <label>${t('productsDB.form.usage')}</label>
                        <textarea class="textarea item-usage" rows="2" placeholder="${t('productsDB.form.usagePlaceholder')}">${escapeHtml(item.usage || '')}</textarea>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: var(--space-4);">
                    <button type="button" class="btn btn-primary btn-save-product" style="gap: 8px;">
                        ${icon('save', 16)} Lưu sản phẩm
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderProductsList(items) {
    if (!items || items.length === 0) {
        return `<div class="card empty-list-placeholder text-muted" style="text-align: center; padding: var(--space-8); border: 1px dashed var(--border);">
            ${t('productsDB.empty')}
        </div>`;
    }
    return items.map(item => renderProductCard(item)).join('');
}

function attachProductsEvents(brand) {
    const container = document.getElementById('products-container');

    // Inject accordion CSS
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

    // Add new product
    document.getElementById('add-product-btn')?.addEventListener('click', () => {
        const placeholder = container.querySelector('.empty-list-placeholder');
        if (placeholder) placeholder.remove();

        const newItem = { id: Date.now().toString(), name: '', category: '', price: '', ingredients: '', benefits: '', usp: '', usage: '' };
        // Close all open items first
        container.querySelectorAll('.product-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));

        container.insertAdjacentHTML('beforeend', renderProductCard(newItem));
        const newCard = container.lastElementChild;
        newCard.classList.add('is-expanded');
        newCard.querySelector('.item-name')?.focus();
        newCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Event delegation for expand, delete, save
    container.addEventListener('click', async (e) => {
        // Handle header click (expand/collapse) — single expand mode
        const header = e.target.closest('.product-header');
        if (header && !e.target.closest('.btn-delete-product')) {
            const card = header.closest('.product-item');
            const isExpanded = card.classList.contains('is-expanded');
            // Close all
            container.querySelectorAll('.product-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));
            if (!isExpanded) card.classList.add('is-expanded');
            return;
        }

        // Handle delete
        const deleteBtn = e.target.closest('.btn-delete-product');
        if (deleteBtn) {
            const card = deleteBtn.closest('.product-item');
            if (confirm(t('brand.deleteItemConfirm'))) {
                card.remove();
                // Persist deletion
                await persistAllProducts(container, brand);
                if (container.children.length === 0) container.innerHTML = renderProductsList([]);
            }
            return;
        }

        // Handle save per item
        const saveBtn = e.target.closest('.btn-save-product');
        if (saveBtn) {
            const card = saveBtn.closest('.product-item');
            const originalHtml = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.textContent = 'Đang lưu...';
            try {
                // Update display name
                const name = card.querySelector('.item-name').value.trim();
                const category = card.querySelector('.item-category').value.trim();
                card.querySelector('.item-display-name').textContent = name || 'Sản phẩm chưa đặt tên';
                const catEl = card.querySelector('.product-header .text-sm');
                if (catEl) catEl.textContent = category;

                await persistAllProducts(container, brand);
                showToast(t('toasts.brandSaved'), 'success');
                // Collapse after saving
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

async function persistAllProducts(container, brand) {
    const items = Array.from(container.querySelectorAll('.product-item')).map(el => ({
        id: el.dataset.id,
        name: el.querySelector('.item-name').value.trim(),
        category: el.querySelector('.item-category').value.trim(),
        price: el.querySelector('.item-price').value.trim(),
        ingredients: el.querySelector('.item-ingredients').value.trim(),
        benefits: el.querySelector('.item-benefits').value.trim(),
        usp: el.querySelector('.item-usp').value.trim(),
        usage: el.querySelector('.item-usage').value.trim()
    })).filter(p => p.name);

    brand.detailedProducts = items;
    store.set('brand', brand);
    await saveBrand(brand);
}
