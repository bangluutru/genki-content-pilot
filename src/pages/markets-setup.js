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

            <div id="markets-container" class="flex flex-col gap-3">
                ${renderMarketsList(items)}
            </div>
        </main>
    `;

    attachSidebarEvents();
    attachMarketsEvents(brand);
}

function renderMarketCard(item) {
    return `
        <div class="market-item" data-id="${item.id}" style="border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; background: var(--surface);">
            <!-- Collapsed Header -->
            <div class="market-header" style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); cursor: pointer; border-left: 3px solid #f59e0b;"
                 onclick="this.closest('.market-item').classList.toggle('is-expanded')">
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <span style="font-size: 18px;">🌍</span>
                    <div>
                        <p class="item-display-name" style="font-weight: 600; margin: 0;">${escapeHtml(item.name || 'Phân khúc chưa đặt tên')}</p>
                        ${item.size ? `<p class="text-sm text-muted" style="margin: 0;">Quy mô: ${escapeHtml(item.size)}</p>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span class="expand-icon text-muted" style="transition: transform 0.2s;">${icon('chevron', 16)}</span>
                    <button type="button" class="btn btn-ghost btn-icon btn-delete-market" style="color: var(--danger);" onclick="event.stopPropagation()">
                        ${icon('trash', 16)}
                    </button>
                </div>
            </div>

            <!-- Expandable Form Body -->
            <div class="market-body" style="display: none; padding: var(--space-5); border-top: 1px solid var(--border); background: var(--bg-secondary);">
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
                <div style="display: flex; justify-content: flex-end; margin-top: var(--space-4);">
                    <button type="button" class="btn btn-primary btn-save-market" style="gap: 8px;">
                        ${icon('save', 16)} Lưu phân khúc
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderMarketsList(items) {
    if (!items || items.length === 0) {
        return `<div class="card empty-list-placeholder text-muted" style="text-align: center; padding: var(--space-8); border: 1px dashed var(--border);">
            ${t('marketsDB.empty')}
        </div>`;
    }
    return items.map(item => renderMarketCard(item)).join('');
}

function attachMarketsEvents(brand) {
    const container = document.getElementById('markets-container');

    // Inject accordion CSS (shared)
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

    // Add new market
    document.getElementById('add-market-btn')?.addEventListener('click', () => {
        const placeholder = container.querySelector('.empty-list-placeholder');
        if (placeholder) placeholder.remove();

        const newItem = { id: Date.now().toString(), name: '', size: '', trends: '', concerns: '', competitors: '', channels: '' };
        container.querySelectorAll('.market-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));

        container.insertAdjacentHTML('beforeend', renderMarketCard(newItem));
        const newCard = container.lastElementChild;
        newCard.classList.add('is-expanded');
        newCard.querySelector('.item-name')?.focus();
        newCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    container.addEventListener('click', async (e) => {
        // Expand/collapse header
        const header = e.target.closest('.market-header');
        if (header && !e.target.closest('.btn-delete-market')) {
            const card = header.closest('.market-item');
            const isExpanded = card.classList.contains('is-expanded');
            container.querySelectorAll('.market-item.is-expanded').forEach(el => el.classList.remove('is-expanded'));
            if (!isExpanded) card.classList.add('is-expanded');
            return;
        }

        // Delete
        const deleteBtn = e.target.closest('.btn-delete-market');
        if (deleteBtn) {
            const card = deleteBtn.closest('.market-item');
            if (confirm(t('brand.deleteItemConfirm'))) {
                card.remove();
                await persistAllMarkets(container, brand);
                if (container.children.length === 0) container.innerHTML = renderMarketsList([]);
            }
            return;
        }

        // Save per item
        const saveBtn = e.target.closest('.btn-save-market');
        if (saveBtn) {
            const card = saveBtn.closest('.market-item');
            const originalHtml = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.textContent = 'Đang lưu...';
            try {
                const name = card.querySelector('.item-name').value.trim();
                const size = card.querySelector('.item-size').value.trim();
                card.querySelector('.item-display-name').textContent = name || 'Phân khúc chưa đặt tên';
                const sizeEl = card.querySelector('.market-header .text-sm');
                if (sizeEl) sizeEl.textContent = size ? `Quy mô: ${size}` : '';

                await persistAllMarkets(container, brand);
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

async function persistAllMarkets(container, brand) {
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
    store.set('brand', brand);
    await saveBrand(brand);
}
