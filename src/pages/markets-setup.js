import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveBrand, loadBrand } from '../services/firestore.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { escapeHtml } from '../utils/helpers.js';

export async function renderMarketsPage() {
    const app = document.getElementById('app');
    let brand = store.get('brand') || await loadBrand() || {};

    if (!brand.detailedMarkets) {
        brand.detailedMarkets = [];
    }

    const items = brand.detailedMarkets || [];

    app.innerHTML = `
        ${renderSidebar()}
        <main class="main-content page">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">
                        ${icon('dashboard', 28)} ${t('marketsDB.title')}
                    </h1>
                    <p class="text-muted text-sm" style="margin-top: var(--space-1);">
                        ${t('marketsDB.subtitle')}
                    </p>
                </div>
                <button type="button" class="btn btn-primary" id="add-market-btn">
                    ${icon('plus', 16)} ${t('marketsDB.addBtn')}
                </button>
            </div>

            <form id="markets-form">
                <div id="markets-container" class="flex flex-col gap-6">
                    ${renderMarketsList(items)}
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
    attachMarketsEvents(brand);
}

function renderMarketsList(items) {
    if (!items || items.length === 0) {
        return `<div class="card empty-list-placeholder text-muted" style="text-align: center; padding: var(--space-8); border: 1px dashed var(--border);">
            ${t('marketsDB.empty')}
        </div>`;
    }

    return items.map(item => `
        <div class="card market-item" data-id="${item.id || Date.now()}" style="padding: var(--space-5); border: 1px solid var(--border); border-left: 3px solid var(--accent); position: relative;">
            <button type="button" class="btn btn-ghost btn-icon btn-delete-item" style="position: absolute; top: var(--space-2); right: var(--space-2); color: var(--danger);">
                ${icon('trash', 16)}
            </button>
            
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('marketsDB.form.name')}</label>
                    <input type="text" class="input item-name" placeholder="${t('marketsDB.form.namePlaceholder')}" value="${escapeHtml(item.name || '')}" required>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('marketsDB.form.size')}</label>
                    <textarea class="textarea item-size" rows="2" placeholder="${t('marketsDB.form.sizePlaceholder')}">${escapeHtml(item.size || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('marketsDB.form.trends')}</label>
                    <textarea class="textarea item-trends" rows="2" placeholder="${t('marketsDB.form.trendsPlaceholder')}">${escapeHtml(item.trends || '')}</textarea>
                </div>
                <div class="input-group">
                    <label>${t('marketsDB.form.concerns')}</label>
                    <textarea class="textarea item-concerns" rows="2" placeholder="${t('marketsDB.form.concernsPlaceholder')}">${escapeHtml(item.concerns || '')}</textarea>
                </div>
                <div class="input-group">
                    <label>${t('marketsDB.form.competitors')}</label>
                    <textarea class="textarea item-competitors" rows="2" placeholder="${t('marketsDB.form.competitorsPlaceholder')}">${escapeHtml(item.competitors || '')}</textarea>
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                    <label>${t('marketsDB.form.channels')}</label>
                    <textarea class="textarea item-channels" rows="2" placeholder="${t('marketsDB.form.channelsPlaceholder')}">${escapeHtml(item.channels || '')}</textarea>
                </div>
            </div>
        </div>
    `).join('');
}

function attachMarketsEvents(brand) {
    const container = document.getElementById('markets-container');
    const form = document.getElementById('markets-form');

    // Add new market segment
    document.getElementById('add-market-btn')?.addEventListener('click', () => {
        const newItemHtml = renderMarketsList([{ id: Date.now().toString() }]);

        // Remove empty placeholder if it exists
        const placeholder = container.querySelector('.empty-list-placeholder');
        if (placeholder) placeholder.remove();

        container.insertAdjacentHTML('afterbegin', newItemHtml);

        container.querySelector('.market-item .item-name')?.focus();
    });

    // Delete item
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-item');
        if (btn) {
            if (confirm(t('brand.deleteItemConfirm'))) {
                btn.closest('.market-item').remove();
                if (container.children.length === 0) {
                    container.innerHTML = renderMarketsList([]);
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
            const items = Array.from(container.querySelectorAll('.market-item')).map(el => ({
                id: el.dataset.id,
                name: el.querySelector('.item-name').value.trim(),
                size: el.querySelector('.item-size').value.trim(),
                trends: el.querySelector('.item-trends').value.trim(),
                concerns: el.querySelector('.item-concerns').value.trim(),
                competitors: el.querySelector('.item-competitors').value.trim(),
                channels: el.querySelector('.item-channels').value.trim()
            })).filter(m => m.name);

            brand.detailedMarkets = items;

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
