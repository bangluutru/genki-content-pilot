// assets-tab.js — Assets Tab: Pipeline + QA + Repurpose + Calendar + Brand Assets
// Component cho campaign-detail Assets tab

import { createAsset, listAssets, updateAsset, deleteAsset, getChildAssets, scheduleAsset, createBrandAsset, listBrandAssets, deleteBrandAsset } from '../services/db/assets.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from './toast.js';

let allAssets = [];
let brandAssetsList = [];

const PIPELINE = [
    { key: 'draft', label: '📝 Draft', color: 'var(--text-muted)' },
    { key: 'needs_qa', label: '🔍 Needs QA', color: 'var(--warning)' },
    { key: 'approved', label: '✅ Approved', color: 'var(--success)' },
    { key: 'scheduled', label: '📅 Scheduled', color: 'var(--primary)' },
    { key: 'published', label: '🚀 Published', color: '#10b981' },
];

const CHANNELS = [
    { key: 'facebook', label: '📱 Facebook' },
    { key: 'tiktok', label: '🎬 TikTok' },
    { key: 'instagram', label: '📷 Instagram' },
    { key: 'email', label: '📧 Email' },
    { key: 'blog', label: '📝 Blog' },
    { key: 'zalo', label: '💬 Zalo' },
];

const BRAND_ASSET_TYPES = [
    { key: 'proof', label: '📊 Social Proof' },
    { key: 'review', label: '⭐ Review' },
    { key: 'certificate', label: '📜 Certificate' },
    { key: 'case', label: '📋 Case Study' },
    { key: 'brandkit', label: '🎨 Brand Kit' },
];

/**
 * Render Assets tab
 * @param {HTMLElement} container
 * @param {string} campaignId
 */
export async function renderAssetsTab(container, campaignId) {
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm);">
            <h3 style="margin:0;">🎨 Content Assets</h3>
            <div style="display:flex;gap:var(--space-sm);">
                <button id="btn-add-asset" class="btn btn-primary">➕ Thêm asset</button>
                <button id="btn-calendar-view" class="btn btn-secondary">📅 Lịch</button>
                <button id="btn-brand-assets" class="btn btn-secondary">🏷️ Brand Assets</button>
            </div>
        </div>

        <!-- Add asset modal -->
        ${renderAddAssetModal()}

        <!-- Asset editor modal -->
        ${renderEditorModal()}

        <!-- QA modal -->
        ${renderQAModal()}

        <!-- Repurpose modal -->
        ${renderRepurposeModal()}

        <!-- Schedule modal -->
        ${renderScheduleModal()}

        <!-- Brand asset modal -->
        ${renderBrandAssetModal()}

        <!-- Calendar modal -->
        ${renderCalendarModal()}

        <!-- Pipeline view -->
        <div id="asset-pipeline" style="display:flex;gap:var(--space-sm);overflow-x:auto;padding-bottom:var(--space-md);"></div>

        <!-- Brand assets section (hidden by default) -->
        <div id="brand-assets-section" class="hidden" style="margin-top:var(--space-lg);"></div>
    `;

    const user = getCurrentUser();
    allAssets = await listAssets(campaignId);
    brandAssetsList = await listBrandAssets(campaignId);

    renderPipeline();
    setupAssetsEvents(campaignId, user);
}

// ─── Pipeline ───

function renderPipeline() {
    const board = document.getElementById('asset-pipeline');
    board.innerHTML = PIPELINE.map(col => {
        const items = allAssets.filter(a => a.status === col.key);
        return `
            <div class="card" style="min-width:200px;flex:1;padding:var(--space-sm);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm);">
                    <strong style="font-size:13px;">${col.label}</strong>
                    <span class="badge" style="background:${col.color};color:#fff;font-size:11px;">${items.length}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--space-xs);min-height:50px;">
                    ${items.map(a => renderAssetCard(a)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderAssetCard(asset) {
    const colIdx = PIPELINE.findIndex(c => c.key === asset.status);
    const channelLabel = CHANNELS.find(c => c.key === asset.channel)?.label || asset.channel;
    const hasChildren = allAssets.some(a => a.parentAssetId === asset.id);
    const isChild = !!asset.parentAssetId;
    const canMoveRight = colIdx < PIPELINE.length - 1;

    return `
        <div class="card" style="padding:var(--space-xs);margin:0;border-left:3px solid ${PIPELINE[colIdx].color};font-size:12px;">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:4px;">
                <strong style="flex:1;font-size:12px;">${escapeHtml(asset.type)}</strong>
                <span style="font-size:10px;white-space:nowrap;">${channelLabel}</span>
            </div>
            <small class="text-secondary" style="display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">
                ${escapeHtml((asset.content || '').substring(0, 60))}
            </small>
            ${isChild ? '<small class="text-muted">↳ repurposed</small>' : ''}
            ${hasChildren ? '<small style="color:var(--primary);">🔗 has children</small>' : ''}
            ${asset.scheduledAt ? `<small class="text-muted">📅 ${asset.scheduledAt}</small>` : ''}
            <div style="display:flex;gap:3px;margin-top:var(--space-xs);flex-wrap:wrap;">
                <button class="btn btn-secondary btn-edit-asset" data-id="${asset.id}" style="padding:2px 5px;font-size:10px;">✏️</button>
                ${asset.status === 'draft' ? `<button class="btn btn-secondary btn-to-qa" data-id="${asset.id}" style="padding:2px 5px;font-size:10px;">🔍 QA</button>` : ''}
                ${asset.status === 'needs_qa' ? `<button class="btn btn-secondary btn-qa-check" data-id="${asset.id}" style="padding:2px 5px;font-size:10px;">✅ QA</button>` : ''}
                ${asset.status === 'approved' ? `<button class="btn btn-secondary btn-schedule" data-id="${asset.id}" style="padding:2px 5px;font-size:10px;">📅</button>` : ''}
                ${canMoveRight && asset.status !== 'draft' ? `<button class="btn btn-secondary btn-advance" data-id="${asset.id}" style="padding:2px 5px;font-size:10px;">▶</button>` : ''}
                <button class="btn btn-secondary btn-repurpose" data-id="${asset.id}" style="padding:2px 5px;font-size:10px;">🔄</button>
                <button class="btn btn-danger btn-del-asset" data-id="${asset.id}" style="padding:2px 5px;font-size:10px;">🗑️</button>
            </div>
        </div>
    `;
}

// ─── Modals ───

function renderAddAssetModal() {
    return `
        <div id="asset-add-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:520px;width:90%;">
                <div class="card-title">Thêm Asset mới</div>
                <div class="form-group">
                    <label class="form-label">Loại</label>
                    <select id="new-asset-type" class="form-select">
                        <option value="post">📝 Post</option>
                        <option value="script">🎬 Script</option>
                        <option value="carousel">🖼️ Carousel</option>
                        <option value="email">📧 Email</option>
                        <option value="landing">🎯 Landing</option>
                        <option value="story">📱 Story/Reel</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Channel</label>
                    <select id="new-asset-channel" class="form-select">
                        ${CHANNELS.map(c => `<option value="${c.key}">${c.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Nội dung</label>
                    <textarea id="new-asset-content" class="form-textarea" rows="5" placeholder="Nội dung asset..."></textarea>
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-add-asset" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-add-asset" class="btn btn-primary">💾 Lưu</button>
                </div>
            </div>
        </div>
    `;
}

function renderEditorModal() {
    return `
        <div id="asset-editor-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:640px;width:95%;max-height:85vh;overflow-y:auto;">
                <div class="card-title">✏️ Chỉnh sửa Asset</div>
                <div class="form-group">
                    <label class="form-label">Nội dung</label>
                    <textarea id="edit-content" class="form-textarea" rows="8"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Attachments (URLs, cách nhau bằng dấu xuống dòng)</label>
                    <textarea id="edit-attachments" class="form-textarea" rows="3" placeholder="https://..."></textarea>
                </div>
                <div id="repurpose-graph" style="margin-top:var(--space-sm);"></div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-md);">
                    <button id="btn-cancel-edit" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-edit" class="btn btn-primary">💾 Lưu</button>
                </div>
            </div>
        </div>
    `;
}

function renderQAModal() {
    return `
        <div id="qa-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:480px;width:90%;">
                <div class="card-title">🔍 QA Checklist</div>
                <div id="qa-checklist-items"></div>
                <div class="form-group" style="margin-top:var(--space-md);">
                    <label class="form-label">Ghi chú QA</label>
                    <textarea id="qa-notes" class="form-textarea" rows="2" placeholder="Ghi chú thêm..."></textarea>
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-qa" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-qa" class="btn btn-primary">✅ Duyệt QA</button>
                </div>
            </div>
        </div>
    `;
}

function renderRepurposeModal() {
    return `
        <div id="repurpose-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:480px;width:90%;">
                <div class="card-title">🔄 Repurpose Asset</div>
                <p class="text-secondary">Chọn channels để tạo bản repurpose:</p>
                <div id="repurpose-channels" style="display:flex;flex-direction:column;gap:var(--space-xs);margin:var(--space-md) 0;">
                    ${CHANNELS.map(c => `
                        <label style="display:flex;align-items:center;gap:var(--space-sm);cursor:pointer;">
                            <input type="checkbox" class="repurpose-ch" value="${c.key}">
                            ${c.label}
                        </label>
                    `).join('')}
                </div>
                <div id="repurpose-parent-info" class="text-muted" style="margin-bottom:var(--space-sm);"></div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-repurpose" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-do-repurpose" class="btn btn-primary">🔄 Tạo</button>
                </div>
            </div>
        </div>
    `;
}

function renderScheduleModal() {
    return `
        <div id="schedule-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:360px;width:90%;">
                <div class="card-title">📅 Chọn ngày đăng</div>
                <div class="form-group">
                    <input type="date" id="schedule-date" class="form-input">
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-schedule" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-schedule" class="btn btn-primary">📅 Lên lịch</button>
                </div>
            </div>
        </div>
    `;
}

function renderBrandAssetModal() {
    return `
        <div id="brand-asset-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:480px;width:90%;">
                <div class="card-title">🏷️ Thêm Brand Asset</div>
                <div class="form-group">
                    <label class="form-label">Loại</label>
                    <select id="ba-type" class="form-select">
                        ${BRAND_ASSET_TYPES.map(t => `<option value="${t.key}">${t.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Tiêu đề</label>
                    <input type="text" id="ba-title" class="form-input" placeholder="Ví dụ: Giấy chứng nhận FDA">
                </div>
                <div class="form-group">
                    <label class="form-label">URL file</label>
                    <input type="text" id="ba-url" class="form-input" placeholder="https://drive.google.com/...">
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-ba" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-ba" class="btn btn-primary">💾 Lưu</button>
                </div>
            </div>
        </div>
    `;
}

function renderCalendarModal() {
    return `
        <div id="calendar-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:700px;width:95%;max-height:85vh;overflow-y:auto;">
                <div class="card-title">📅 Content Calendar</div>
                <div id="calendar-nav" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);">
                    <button id="cal-prev" class="btn btn-secondary">◀</button>
                    <strong id="cal-title"></strong>
                    <button id="cal-next" class="btn btn-secondary">▶</button>
                </div>
                <div id="calendar-grid"></div>
                <div style="text-align:right;margin-top:var(--space-md);">
                    <button id="btn-close-calendar" class="btn btn-secondary">Đóng</button>
                </div>
            </div>
        </div>
    `;
}

// ─── Events ───

function setupAssetsEvents(campaignId, user) {
    let editingAssetId = null;
    let schedulingAssetId = null;
    let repurposeAssetId = null;
    let calendarMonth = new Date().getMonth();
    let calendarYear = new Date().getFullYear();

    // Add asset
    document.getElementById('btn-add-asset').addEventListener('click', () => {
        document.getElementById('asset-add-modal').classList.remove('hidden');
        document.getElementById('new-asset-content').value = '';
    });
    document.getElementById('btn-cancel-add-asset').addEventListener('click', () => {
        document.getElementById('asset-add-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-add-asset').addEventListener('click', async () => {
        const content = document.getElementById('new-asset-content').value.trim();
        if (!content) { showToast('Nhập nội dung asset', 'error'); return; }
        try {
            await createAsset({
                campaignId,
                userId: user.uid,
                type: document.getElementById('new-asset-type').value,
                channel: document.getElementById('new-asset-channel').value,
                content,
            });
            document.getElementById('asset-add-modal').classList.add('hidden');
            allAssets = await listAssets(campaignId);
            renderPipeline();
            showToast('Đã thêm asset! 🎨', 'success');
        } catch (err) { showToast('Lỗi thêm asset', 'error'); }
    });

    // Editor
    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
        document.getElementById('asset-editor-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-edit').addEventListener('click', async () => {
        if (!editingAssetId) return;
        try {
            const attachments = document.getElementById('edit-attachments').value
                .split('\n').map(s => s.trim()).filter(Boolean);
            await updateAsset(editingAssetId, {
                content: document.getElementById('edit-content').value,
                attachments,
            });
            allAssets = await listAssets(campaignId);
            renderPipeline();
            document.getElementById('asset-editor-modal').classList.add('hidden');
            showToast('Đã lưu asset! ✏️', 'success');
        } catch (err) { showToast('Lỗi lưu asset', 'error'); }
    });

    // QA
    document.getElementById('btn-cancel-qa').addEventListener('click', () => {
        document.getElementById('qa-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-qa').addEventListener('click', async () => {
        if (!editingAssetId) return;
        const checkboxes = document.querySelectorAll('#qa-checklist-items input[type=checkbox]');
        const allPassed = [...checkboxes].every(cb => cb.checked);
        if (!allPassed) { showToast('Phải pass tất cả QA items', 'error'); return; }
        try {
            const checklist = [...checkboxes].map(cb => ({
                key: cb.dataset.key,
                label: cb.dataset.label,
                passed: cb.checked,
            }));
            await updateAsset(editingAssetId, {
                qaChecklist: checklist,
                qaStatus: 'passed',
                qaNotes: document.getElementById('qa-notes').value,
                status: 'approved',
            });
            allAssets = await listAssets(campaignId);
            renderPipeline();
            document.getElementById('qa-modal').classList.add('hidden');
            showToast('QA passed → Approved! ✅', 'success');
        } catch (err) { showToast('Lỗi QA', 'error'); }
    });

    // Schedule
    document.getElementById('btn-cancel-schedule').addEventListener('click', () => {
        document.getElementById('schedule-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-schedule').addEventListener('click', async () => {
        if (!schedulingAssetId) return;
        const date = document.getElementById('schedule-date').value;
        if (!date) { showToast('Chọn ngày', 'error'); return; }
        try {
            await scheduleAsset(schedulingAssetId, date);
            allAssets = await listAssets(campaignId);
            renderPipeline();
            document.getElementById('schedule-modal').classList.add('hidden');
            showToast('Đã lên lịch! 📅', 'success');
        } catch (err) { showToast('Lỗi lên lịch', 'error'); }
    });

    // Repurpose
    document.getElementById('btn-cancel-repurpose').addEventListener('click', () => {
        document.getElementById('repurpose-modal').classList.add('hidden');
    });
    document.getElementById('btn-do-repurpose').addEventListener('click', async () => {
        if (!repurposeAssetId) return;
        const parent = allAssets.find(a => a.id === repurposeAssetId);
        if (!parent) return;
        const checked = [...document.querySelectorAll('.repurpose-ch:checked')].map(cb => cb.value);
        if (checked.length === 0) { showToast('Chọn ít nhất 1 channel', 'error'); return; }
        try {
            for (const channel of checked) {
                await createAsset({
                    campaignId,
                    userId: user.uid,
                    parentAssetId: parent.id,
                    type: parent.type,
                    channel,
                    content: repurposeTemplate(parent, channel),
                });
            }
            allAssets = await listAssets(campaignId);
            renderPipeline();
            document.getElementById('repurpose-modal').classList.add('hidden');
            showToast(`Đã tạo ${checked.length} bản repurpose! 🔄`, 'success');
        } catch (err) { showToast('Lỗi repurpose', 'error'); }
    });

    // Brand assets toggle
    document.getElementById('btn-brand-assets').addEventListener('click', () => {
        const section = document.getElementById('brand-assets-section');
        section.classList.toggle('hidden');
        if (!section.classList.contains('hidden')) renderBrandAssetsSection();
    });
    document.getElementById('btn-cancel-ba').addEventListener('click', () => {
        document.getElementById('brand-asset-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-ba').addEventListener('click', async () => {
        const title = document.getElementById('ba-title').value.trim();
        if (!title) { showToast('Nhập tiêu đề', 'error'); return; }
        try {
            await createBrandAsset({
                campaignId,
                userId: user.uid,
                type: document.getElementById('ba-type').value,
                title,
                fileUrl: document.getElementById('ba-url').value.trim(),
            });
            brandAssetsList = await listBrandAssets(campaignId);
            renderBrandAssetsSection();
            document.getElementById('brand-asset-modal').classList.add('hidden');
            showToast('Đã thêm brand asset! 🏷️', 'success');
        } catch (err) { showToast('Lỗi thêm brand asset', 'error'); }
    });

    // Calendar
    document.getElementById('btn-calendar-view').addEventListener('click', () => {
        renderCalendar();
        document.getElementById('calendar-modal').classList.remove('hidden');
    });
    document.getElementById('btn-close-calendar').addEventListener('click', () => {
        document.getElementById('calendar-modal').classList.add('hidden');
    });
    document.getElementById('cal-prev').addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
        renderCalendar();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
        renderCalendar();
    });

    function renderCalendar() {
        const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        document.getElementById('cal-title').textContent = `${months[calendarMonth]} ${calendarYear}`;

        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const today = new Date().toISOString().split('T')[0];

        const scheduled = allAssets.filter(a => a.scheduledAt);
        const byDate = {};
        scheduled.forEach(a => {
            const d = a.scheduledAt.substring(0, 10);
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push(a);
        });

        let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">';
        ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].forEach(d => {
            html += `<div style="text-align:center;font-weight:bold;padding:4px;font-size:11px;">${d}</div>`;
        });
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const assets = byDate[dateStr] || [];
            html += `
                <div style="border:1px solid var(--border);border-radius:4px;padding:4px;min-height:50px;
                    ${isToday ? 'background:var(--primary-light,rgba(79,70,229,0.1));' : ''}font-size:11px;">
                    <div style="font-weight:${isToday ? 'bold' : 'normal'};">${d}</div>
                    ${assets.map(a => `<div style="background:${PIPELINE.find(p => p.key === a.status)?.color || 'var(--primary)'};color:#fff;border-radius:3px;padding:1px 4px;margin-top:2px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.type}</div>`).join('')}
                </div>
            `;
        }
        html += '</div>';
        document.getElementById('calendar-grid').innerHTML = html;
    }

    function renderBrandAssetsSection() {
        const section = document.getElementById('brand-assets-section');
        section.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm);">
                <h3 style="margin:0;">🏷️ Brand Assets</h3>
                <button id="btn-add-ba" class="btn btn-primary" style="font-size:13px;">➕ Thêm</button>
            </div>
            ${brandAssetsList.length === 0 ? '<p class="text-muted">Chưa có brand asset</p>' : `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:var(--space-sm);">
                    ${brandAssetsList.map(ba => `
                        <div class="card" style="padding:var(--space-sm);">
                            <div style="display:flex;justify-content:space-between;">
                                <strong style="font-size:13px;">${escapeHtml(ba.title)}</strong>
                                <button class="btn btn-danger btn-del-ba" data-id="${ba.id}" style="padding:2px 6px;font-size:10px;">🗑️</button>
                            </div>
                            <span class="badge badge-draft" style="margin-top:4px;">${BRAND_ASSET_TYPES.find(t => t.key === ba.type)?.label || ba.type}</span>
                            ${ba.fileUrl ? `<a href="${escapeHtml(ba.fileUrl)}" target="_blank" style="display:block;margin-top:4px;font-size:12px;">🔗 Xem file</a>` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        `;
        document.getElementById('btn-add-ba')?.addEventListener('click', () => {
            document.getElementById('ba-title').value = '';
            document.getElementById('ba-url').value = '';
            document.getElementById('brand-asset-modal').classList.remove('hidden');
        });
        section.addEventListener('click', async (e) => {
            const del = e.target.closest('.btn-del-ba');
            if (!del) return;
            try {
                await deleteBrandAsset(del.dataset.id);
                brandAssetsList = brandAssetsList.filter(b => b.id !== del.dataset.id);
                renderBrandAssetsSection();
                showToast('Đã xoá brand asset', 'info');
            } catch (err) { showToast('Lỗi xoá', 'error'); }
        });
    }

    // Pipeline event delegation
    document.getElementById('asset-pipeline').addEventListener('click', async (e) => {
        // Edit
        const editBtn = e.target.closest('.btn-edit-asset');
        if (editBtn) {
            editingAssetId = editBtn.dataset.id;
            const asset = allAssets.find(a => a.id === editingAssetId);
            if (!asset) return;
            document.getElementById('edit-content').value = asset.content || '';
            document.getElementById('edit-attachments').value = (asset.attachments || []).join('\n');
            // Repurpose graph
            const children = allAssets.filter(a => a.parentAssetId === editingAssetId);
            const parent = asset.parentAssetId ? allAssets.find(a => a.id === asset.parentAssetId) : null;
            let graphHtml = '';
            if (parent || children.length) {
                graphHtml = '<div class="card" style="padding:var(--space-sm);margin-top:var(--space-sm);"><strong style="font-size:12px;">🔗 Repurpose Graph</strong>';
                if (parent) graphHtml += `<div style="margin-top:4px;font-size:12px;">⬆ Parent: <em>${escapeHtml(parent.type)} (${parent.channel})</em></div>`;
                if (children.length) graphHtml += `<div style="margin-top:4px;font-size:12px;">⬇ Children: ${children.map(c => `<span class="badge" style="background:var(--primary);color:#fff;font-size:10px;margin:2px;">${c.channel}</span>`).join('')}</div>`;
                graphHtml += '</div>';
            }
            document.getElementById('repurpose-graph').innerHTML = graphHtml;
            document.getElementById('asset-editor-modal').classList.remove('hidden');
            return;
        }

        // Send to QA
        const toQaBtn = e.target.closest('.btn-to-qa');
        if (toQaBtn) {
            try {
                await updateAsset(toQaBtn.dataset.id, { status: 'needs_qa' });
                allAssets = await listAssets(campaignId);
                renderPipeline();
                showToast('Đã gửi QA! 🔍', 'success');
            } catch (err) { showToast('Lỗi', 'error'); }
            return;
        }

        // QA check
        const qaBtn = e.target.closest('.btn-qa-check');
        if (qaBtn) {
            editingAssetId = qaBtn.dataset.id;
            const asset = allAssets.find(a => a.id === editingAssetId);
            if (!asset) return;
            const checklist = asset.qaChecklist || [];
            document.getElementById('qa-checklist-items').innerHTML = checklist.map(item => `
                <label style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-xs) 0;cursor:pointer;border-bottom:1px solid var(--border);">
                    <input type="checkbox" data-key="${item.key}" data-label="${escapeHtml(item.label)}" ${item.passed ? 'checked' : ''}>
                    <span>${escapeHtml(item.label)}</span>
                </label>
            `).join('');
            document.getElementById('qa-notes').value = asset.qaNotes || '';
            document.getElementById('qa-modal').classList.remove('hidden');
            return;
        }

        // Schedule
        const schedBtn = e.target.closest('.btn-schedule');
        if (schedBtn) {
            schedulingAssetId = schedBtn.dataset.id;
            document.getElementById('schedule-date').value = '';
            document.getElementById('schedule-modal').classList.remove('hidden');
            return;
        }

        // Advance (generic next status)
        const advBtn = e.target.closest('.btn-advance');
        if (advBtn) {
            const id = advBtn.dataset.id;
            const asset = allAssets.find(a => a.id === id);
            if (!asset) return;
            const colIdx = PIPELINE.findIndex(c => c.key === asset.status);
            if (colIdx >= PIPELINE.length - 1) return;
            // QA gate: cannot skip needs_qa → approved without QA
            if (asset.status === 'needs_qa') {
                showToast('Phải pass QA trước', 'error');
                return;
            }
            try {
                await updateAsset(id, { status: PIPELINE[colIdx + 1].key });
                allAssets = await listAssets(campaignId);
                renderPipeline();
            } catch (err) { showToast('Lỗi', 'error'); }
            return;
        }

        // Repurpose
        const repBtn = e.target.closest('.btn-repurpose');
        if (repBtn) {
            repurposeAssetId = repBtn.dataset.id;
            const asset = allAssets.find(a => a.id === repurposeAssetId);
            document.querySelectorAll('.repurpose-ch').forEach(cb => {
                cb.checked = false;
                cb.disabled = cb.value === asset?.channel;
            });
            const children = allAssets.filter(a => a.parentAssetId === repurposeAssetId);
            document.getElementById('repurpose-parent-info').innerHTML = children.length
                ? `Đã có ${children.length} bản repurpose: ${children.map(c => c.channel).join(', ')}`
                : '';
            document.getElementById('repurpose-modal').classList.remove('hidden');
            return;
        }

        // Delete
        const delBtn = e.target.closest('.btn-del-asset');
        if (delBtn) {
            if (!confirm('Xoá asset này?')) return;
            try {
                await deleteAsset(delBtn.dataset.id);
                allAssets = allAssets.filter(a => a.id !== delBtn.dataset.id);
                renderPipeline();
                showToast('Đã xoá asset', 'info');
            } catch (err) { showToast('Lỗi xoá', 'error'); }
        }
    });
}

// ─── Helpers ───

function repurposeTemplate(parent, targetChannel) {
    const templates = {
        tiktok: `[REPURPOSE → TikTok]\nOriginal: ${parent.type} (${parent.channel})\n\n[HOOK 0-3s]\n[NỘI DUNG 3-35s]\n[CTA 35-45s]\n\n--- Nội dung gốc ---\n${parent.content || ''}`,
        instagram: `[REPURPOSE → Instagram]\nOriginal: ${parent.type} (${parent.channel})\n\n${parent.content || ''}\n\n#hashtag1 #hashtag2`,
        email: `[REPURPOSE → Email]\nSubject: \nPreview: \n\n${parent.content || ''}`,
        blog: `[REPURPOSE → Blog]\n\n# Tiêu đề\n\n${parent.content || ''}`,
        zalo: `[REPURPOSE → Zalo]\n\n${parent.content || ''}`,
        facebook: `[REPURPOSE → Facebook]\n\n${parent.content || ''}`,
    };
    return templates[targetChannel] || `[REPURPOSE → ${targetChannel}]\n\n${parent.content || ''}`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
