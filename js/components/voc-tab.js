// voc-tab.js — VOC Tab component cho campaign-detail
// Hiển thị entries, add/import, AI cluster, hook bank

import { addVocEntry, addVocEntries, listVocEntries, deleteVocEntry, saveClusters, loadClusters, saveHookBank, loadHookBank } from '../services/db/voc.js';
import { clusterVocEntries, generateHookBank } from '../services/gemini-voc.js';
import { getBrand, getSettings } from '../state.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from './toast.js';

let vocEntries = [];
let vocClusters = null;
let hookBank = null;

/**
 * Render VOC tab
 * @param {HTMLElement} container
 * @param {string} campaignId
 */
export async function renderVocTab(container, campaignId) {
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm);">
            <h3 style="margin:0;">💬 Voice of Customer</h3>
            <div style="display:flex;gap:var(--space-sm);">
                <button id="btn-add-voc" class="btn btn-primary">➕ Thêm mới</button>
                <label class="btn btn-secondary" style="cursor:pointer;">
                    📁 Import CSV
                    <input type="file" id="csv-import" accept=".csv,.txt" style="display:none;">
                </label>
                <button id="btn-ai-cluster" class="btn btn-secondary">🤖 AI Cluster</button>
            </div>
        </div>

        <!-- Add entry modal -->
        <div id="voc-add-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:520px;width:90%;">
                <div class="card-title">Thêm VOC Entry</div>
                <div class="form-group">
                    <label class="form-label">Nguồn</label>
                    <select id="voc-source" class="form-select">
                        <option value="comment">💬 Comment</option>
                        <option value="review">⭐ Review</option>
                        <option value="dm">📩 DM / Inbox</option>
                        <option value="survey">📋 Khảo sát</option>
                        <option value="interview">🎤 Phỏng vấn</option>
                        <option value="other">📝 Khác</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Nội dung</label>
                    <textarea id="voc-content" class="form-textarea" rows="4"
                        placeholder="Paste nguyên văn comment/review/feedback của khách hàng..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Tags (cách nhau bằng dấu phẩy)</label>
                    <input type="text" id="voc-tags" class="form-input"
                        placeholder="collagen, da đẹp, giá rẻ, lo ngại">
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-voc" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-voc" class="btn btn-primary">💾 Lưu</button>
                </div>
            </div>
        </div>

        <!-- Entries list -->
        <div id="voc-entries-list"></div>

        <!-- Clusters -->
        <div id="voc-clusters-section" style="margin-top:var(--space-lg);"></div>

        <!-- Hook Bank -->
        <div id="voc-hookbank-section" style="margin-top:var(--space-lg);"></div>
    `;

    // Load data
    const user = getCurrentUser();
    vocEntries = await listVocEntries(campaignId);
    vocClusters = await loadClusters(campaignId);
    hookBank = await loadHookBank(campaignId);

    renderEntriesList();
    renderClustersSection();
    renderHookBankSection();
    setupVocEvents(campaignId, user);
}

function renderEntriesList() {
    const container = document.getElementById('voc-entries-list');
    if (vocEntries.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align:center;padding:var(--space-xl);">
                <p class="text-muted">Chưa có VOC entry nào</p>
                <p class="text-secondary">Thêm thủ công hoặc import CSV</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="card">
            <div class="card-title">${vocEntries.length} entries</div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--border);text-align:left;">
                            <th style="padding:8px;">Nguồn</th>
                            <th style="padding:8px;">Nội dung</th>
                            <th style="padding:8px;">Tags</th>
                            <th style="padding:8px;width:60px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vocEntries.map(e => `
                            <tr style="border-bottom:1px solid var(--border);">
                                <td style="padding:8px;">
                                    <span class="badge badge-draft">${getSourceLabel(e.sourceType)}</span>
                                </td>
                                <td style="padding:8px;max-width:400px;">
                                    <span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(e.content)}</span>
                                </td>
                                <td style="padding:8px;">
                                    ${(e.tags || []).map(t => `<span class="badge" style="background:var(--primary);color:#fff;margin:2px;font-size:11px;">${escapeHtml(t)}</span>`).join('')}
                                </td>
                                <td style="padding:8px;">
                                    <button class="btn btn-danger btn-delete-voc" data-id="${e.id}" style="padding:4px 8px;font-size:12px;">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderClustersSection() {
    const container = document.getElementById('voc-clusters-section');
    if (!vocClusters || !vocClusters.clusters || vocClusters.clusters.length === 0) {
        container.innerHTML = '';
        return;
    }

    const typeEmoji = { pain: '😣', desire: '✨', objection: '🤔', trigger: '⚡' };
    const typeLabel = { pain: 'Nỗi đau', desire: 'Mong muốn', objection: 'Phản đối', trigger: 'Động lực' };

    container.innerHTML = `
        <h3>🧩 AI Clusters</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-md);">
            ${vocClusters.clusters.map(c => `
                <div class="card">
                    <div class="card-title">${typeEmoji[c.type] || '📌'} ${typeLabel[c.type] || c.type}</div>
                    <strong>${escapeHtml(c.name)}</strong>
                    <p class="text-secondary" style="margin-top:var(--space-xs);">${escapeHtml(c.summary)}</p>
                    ${c.entryNumbers ? `<small class="text-muted">Entries: ${c.entryNumbers.join(', ')}</small>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderHookBankSection() {
    const container = document.getElementById('voc-hookbank-section');
    if (!hookBank || (!hookBank.hooks?.length && !hookBank.objections?.length)) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <h3>🎣 Hook Bank</h3>
        ${hookBank.hooks?.length ? `
            <div class="card" style="margin-bottom:var(--space-md);">
                <div class="card-title">🪝 ${hookBank.hooks.length} Hooks</div>
                <ol style="margin:0;padding-left:20px;line-height:1.8;">
                    ${hookBank.hooks.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
                </ol>
            </div>
        ` : ''}
        ${hookBank.objections?.length ? `
            <div class="card">
                <div class="card-title">🛡️ ${hookBank.objections.length} Xử lý phản đối</div>
                <ol style="margin:0;padding-left:20px;line-height:1.8;">
                    ${hookBank.objections.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
                </ol>
            </div>
        ` : ''}
    `;
}

function setupVocEvents(campaignId, user) {
    // Show add modal
    document.getElementById('btn-add-voc').addEventListener('click', () => {
        document.getElementById('voc-add-modal').classList.remove('hidden');
        document.getElementById('voc-content').value = '';
        document.getElementById('voc-tags').value = '';
        document.getElementById('voc-content').focus();
    });

    // Cancel add
    document.getElementById('btn-cancel-voc').addEventListener('click', () => {
        document.getElementById('voc-add-modal').classList.add('hidden');
    });

    // Save entry
    document.getElementById('btn-save-voc').addEventListener('click', async () => {
        const content = document.getElementById('voc-content').value.trim();
        if (!content) { showToast('Nhập nội dung VOC', 'error'); return; }

        try {
            await addVocEntry({
                campaignId,
                userId: user.uid,
                sourceType: document.getElementById('voc-source').value,
                content,
                tags: document.getElementById('voc-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            });
            document.getElementById('voc-add-modal').classList.add('hidden');
            vocEntries = await listVocEntries(campaignId);
            renderEntriesList();
            showToast('Đã thêm VOC entry! ✅', 'success');
        } catch (error) {
            showToast('Lỗi thêm entry', 'error');
        }
    });

    // CSV import
    document.getElementById('csv-import').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

            // Skip header if looks like one
            const startIdx = (lines[0] && /^(source|nguồn|content|nội dung)/i.test(lines[0])) ? 1 : 0;

            const entries = [];
            for (let i = startIdx; i < lines.length; i++) {
                const parts = parseCSVLine(lines[i]);
                if (parts.length >= 1 && parts[0]) {
                    entries.push({
                        campaignId,
                        userId: user.uid,
                        sourceType: parts.length >= 2 ? parts[0].trim() : 'csv',
                        content: parts.length >= 2 ? parts[1].trim() : parts[0].trim(),
                        tags: parts.length >= 3 ? parts[2].split(';').map(t => t.trim()).filter(Boolean) : [],
                    });
                }
            }

            if (entries.length === 0) {
                showToast('File CSV trống hoặc sai format', 'error');
                return;
            }

            const count = await addVocEntries(entries);
            vocEntries = await listVocEntries(campaignId);
            renderEntriesList();
            showToast(`Đã import ${count} entries! 📁`, 'success');
        } catch (error) {
            showToast('Lỗi import CSV', 'error');
            console.error('CSV import error:', error);
        }
        e.target.value = ''; // reset file input
    });

    // Delete entry (delegation)
    document.getElementById('voc-entries-list').addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.btn-delete-voc');
        if (!deleteBtn) return;
        const id = deleteBtn.dataset.id;
        try {
            await deleteVocEntry(id);
            vocEntries = vocEntries.filter(entry => entry.id !== id);
            renderEntriesList();
            showToast('Đã xoá entry', 'info');
        } catch (error) {
            showToast('Lỗi xoá entry', 'error');
        }
    });

    // AI Cluster
    document.getElementById('btn-ai-cluster').addEventListener('click', async () => {
        if (vocEntries.length === 0) {
            showToast('Thêm VOC entries trước khi cluster', 'error');
            return;
        }

        const settings = await getSettings(user.uid);
        const apiKey = settings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            showToast('Chưa cấu hình Gemini API key', 'error');
            return;
        }

        const btn = document.getElementById('btn-ai-cluster');
        btn.disabled = true;
        btn.textContent = '🤖 Đang phân tích...';

        try {
            // Step 1: Cluster
            const clusterResult = await clusterVocEntries(vocEntries, apiKey);
            await saveClusters(campaignId, user.uid, clusterResult.clusters || []);
            vocClusters = { clusters: clusterResult.clusters || [] };
            renderClustersSection();
            showToast('Đã phân cụm VOC! 🧩', 'success');

            // Step 2: Generate hook bank
            btn.textContent = '🤖 Đang tạo hooks...';
            const brand = await getBrand(user.uid);
            const hookResult = await generateHookBank(clusterResult.clusters || [], brand, apiKey);
            await saveHookBank(campaignId, user.uid, hookResult);
            hookBank = hookResult;
            renderHookBankSection();
            showToast('Đã tạo Hook Bank! 🎣', 'success');
        } catch (error) {
            console.error('AI Cluster error:', error);
            showToast(`Lỗi AI: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '🤖 AI Cluster';
        }
    });
}

// ─── Helpers ───

function getSourceLabel(type) {
    const labels = { comment: '💬', review: '⭐', dm: '📩', survey: '📋', interview: '🎤', csv: '📁', other: '📝', manual: '✍️' };
    return labels[type] || '📝';
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Simple CSV line parser (handles quoted fields)
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}
