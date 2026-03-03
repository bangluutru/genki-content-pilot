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
        // Migrate old products if they exist
        if (brand.products && Array.isArray(brand.products) && brand.products.length > 0) {
            brand.detailedProducts = brand.products.map(p => ({
                id: p.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: p.name || '',
                category: '',
                price: '',
                ingredients: '',
                benefits: '',
                usp: p.highlight || '', // old 'highlight' maps best to 'usp' or 'benefits'
                usage: ''
            }));
            // We can optionally clear out the old brand.products so we don't migrate twice
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

            <form id="products-form">
                <div id="products-container" class="flex flex-col gap-6">
                    ${renderProductsList(items)}
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
    attachProductsEvents(brand);
}

function renderProductsList(items) {
    if (!items || items.length === 0) {
        return `<div class="card empty-list-placeholder text-muted" style="text-align: center; padding: var(--space-8); border: 1px dashed var(--border);">
            ${t('productsDB.empty')}
        </div>`;
    }

    return items.map(item => `
        <div class="card product-item" data-id="${item.id || Date.now()}" style="padding: var(--space-5); border: 1px solid var(--border); border-left: 3px solid var(--accent); position: relative;">
            <button type="button" class="btn btn-ghost btn-icon btn-delete-item" style="position: absolute; top: var(--space-2); right: var(--space-2); color: var(--danger);">
                ${icon('trash', 16)}
            </button>
            
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
                    <textarea class="textarea item-ingredients" rows="2" placeholder="${t('productsDB.form.ingredientsPlaceholder')}" required>${escapeHtml(item.ingredients || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('productsDB.form.benefits')}</label>
                    <textarea class="textarea item-benefits" rows="2" placeholder="${t('productsDB.form.benefitsPlaceholder')}" required>${escapeHtml(item.benefits || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('productsDB.form.usp')}</label>
                    <textarea class="textarea item-usp" rows="2" placeholder="${t('productsDB.form.uspPlaceholder')}" required>${escapeHtml(item.usp || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('productsDB.form.usage')}</label>
                    <textarea class="textarea item-usage" rows="2" placeholder="${t('productsDB.form.usagePlaceholder')}">${escapeHtml(item.usage || '')}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

function attachProductsEvents(brand) {
    const container = document.getElementById('products-container');
    const form = document.getElementById('products-form');

    // Add new product
    document.getElementById('add-product-btn')?.addEventListener('click', () => {
        const newItemHtml = renderProductsList([{ id: Date.now().toString() }]);

        // Remove empty placeholder if it exists
        const placeholder = container.querySelector('.empty-list-placeholder');
        if (placeholder) placeholder.remove();

        container.insertAdjacentHTML('afterbegin', newItemHtml);

        // Focus the first input of the new item
        container.querySelector('.product-item .item-name')?.focus();
    });

    // Delete item
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-item');
        if (btn) {
            if (confirm(t('brand.deleteItemConfirm'))) {
                btn.closest('.product-item').remove();
                if (container.children.length === 0) {
                    container.innerHTML = renderProductsList([]);
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
            const items = Array.from(container.querySelectorAll('.product-item')).map(el => ({
                id: el.dataset.id,
                name: el.querySelector('.item-name').value.trim(),
                category: el.querySelector('.item-category').value.trim(),
                price: el.querySelector('.item-price').value.trim(),
                ingredients: el.querySelector('.item-ingredients').value.trim(),
                benefits: el.querySelector('.item-benefits').value.trim(),
                usp: el.querySelector('.item-usp').value.trim(),
                usage: el.querySelector('.item-usage').value.trim()
            })).filter(p => p.name); // Require at least a name

            // Overwrite existing data
            brand.detailedProducts = items;

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
