// performance-tab.js — Performance Tab: Metrics + Learning Logs + Experiments
// Component cho campaign-detail Performance tab

import { addMetric, addMetrics, listMetrics, deleteMetric, addLearningLog, listLearningLogs, createExperiment, listExperiments, updateExperiment } from '../services/db/performance.js';
import { createAsset } from '../services/db/assets.js';
import { generateExperimentVariants } from '../services/gemini-experiments.js';
import { getBrand, getSettings } from '../state.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from './toast.js';

let metrics = [];
let learningLogs = [];
let experiments = [];

/**
 * Render Performance tab
 * @param {HTMLElement} container
 * @param {string} campaignId
 */
export async function renderPerformanceTab(container, campaignId) {
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm);">
            <h3 style="margin:0;">📈 Performance</h3>
            <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
                <button id="btn-add-metric" class="btn btn-primary">➕ Nhập số liệu</button>
                <label class="btn btn-secondary" style="cursor:pointer;">
                    📁 Import CSV
                    <input type="file" id="perf-csv-import" accept=".csv,.txt" style="display:none;">
                </label>
                <button id="btn-new-experiment" class="btn btn-secondary">🧪 Tạo Experiment</button>
                <button id="btn-add-log" class="btn btn-secondary">📝 Learning Log</button>
            </div>
        </div>

        <!-- Add metric modal -->
        ${renderMetricModal()}

        <!-- Experiment modal -->
        ${renderExperimentModal()}

        <!-- Learning log modal -->
        ${renderLogModal()}

        <!-- Top assets -->
        <div id="perf-top-assets" style="margin-bottom:var(--space-lg);"></div>

        <!-- Metrics table -->
        <div id="perf-metrics-table" style="margin-bottom:var(--space-lg);"></div>

        <!-- Experiments -->
        <div id="perf-experiments" style="margin-bottom:var(--space-lg);"></div>

        <!-- Learning logs -->
        <div id="perf-learning-logs"></div>
    `;

    const user = getCurrentUser();
    metrics = await listMetrics(campaignId);
    learningLogs = await listLearningLogs(campaignId);
    experiments = await listExperiments(campaignId);

    renderTopAssets();
    renderMetricsTable();
    renderExperiments();
    renderLearningLogs();
    setupPerfEvents(campaignId, user);
}

// ─── Top Assets ───

function renderTopAssets() {
    if (metrics.length === 0) {
        document.getElementById('perf-top-assets').innerHTML = '';
        return;
    }

    // Aggregate by assetId
    const byAsset = {};
    metrics.forEach(m => {
        const key = m.assetId || 'no_asset';
        if (!byAsset[key]) byAsset[key] = { views: 0, ctr: 0, cpa: 0, retention3s: 0, count: 0 };
        byAsset[key].views += m.views;
        byAsset[key].ctr += m.ctr;
        byAsset[key].cpa += m.cpa;
        byAsset[key].retention3s += m.retention3s;
        byAsset[key].count++;
    });
    const aggregated = Object.entries(byAsset).map(([id, d]) => ({
        id,
        views: d.views,
        avgCtr: (d.ctr / d.count).toFixed(2),
        avgCpa: (d.cpa / d.count).toFixed(0),
        avgRetention: (d.retention3s / d.count).toFixed(1),
    }));

    const topCtr = [...aggregated].sort((a, b) => b.avgCtr - a.avgCtr).slice(0, 3);
    const topCpa = [...aggregated].sort((a, b) => a.avgCpa - b.avgCpa).filter(a => Number(a.avgCpa) > 0).slice(0, 3);
    const topRetention = [...aggregated].sort((a, b) => b.avgRetention - a.avgRetention).slice(0, 3);

    document.getElementById('perf-top-assets').innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-md);">
            <div class="card" style="padding:var(--space-md);">
                <div class="card-title" style="font-size:14px;">🎯 Top CTR</div>
                ${topCtr.map((a, i) => `<div style="font-size:13px;padding:4px 0;">${i + 1}. ${shortId(a.id)} — <strong>${a.avgCtr}%</strong></div>`).join('') || '<p class="text-muted">N/A</p>'}
            </div>
            <div class="card" style="padding:var(--space-md);">
                <div class="card-title" style="font-size:14px;">💰 Best CPA</div>
                ${topCpa.map((a, i) => `<div style="font-size:13px;padding:4px 0;">${i + 1}. ${shortId(a.id)} — <strong>₫${a.avgCpa}</strong></div>`).join('') || '<p class="text-muted">N/A</p>'}
            </div>
            <div class="card" style="padding:var(--space-md);">
                <div class="card-title" style="font-size:14px;">⏱️ Top Retention 3s</div>
                ${topRetention.map((a, i) => `<div style="font-size:13px;padding:4px 0;">${i + 1}. ${shortId(a.id)} — <strong>${a.avgRetention}%</strong></div>`).join('') || '<p class="text-muted">N/A</p>'}
            </div>
        </div>
    `;
}

// ─── Metrics Table ───

function renderMetricsTable() {
    const container = document.getElementById('perf-metrics-table');
    if (metrics.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center;padding:var(--space-xl);"><p class="text-muted">Chưa có dữ liệu hiệu quả</p></div>`;
        return;
    }

    container.innerHTML = `
        <div class="card">
            <div class="card-title">📊 ${metrics.length} metric records</div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--border);text-align:left;">
                            <th style="padding:6px;">Date</th>
                            <th style="padding:6px;">Asset</th>
                            <th style="padding:6px;">Views</th>
                            <th style="padding:6px;">CTR%</th>
                            <th style="padding:6px;">Ret 3s%</th>
                            <th style="padding:6px;">Leads</th>
                            <th style="padding:6px;">Sales</th>
                            <th style="padding:6px;">Spend</th>
                            <th style="padding:6px;">CPA</th>
                            <th style="padding:6px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metrics.map(m => `
                            <tr style="border-bottom:1px solid var(--border);">
                                <td style="padding:6px;">${m.date || '—'}</td>
                                <td style="padding:6px;">${shortId(m.assetId)}</td>
                                <td style="padding:6px;">${fmt(m.views)}</td>
                                <td style="padding:6px;">${m.ctr}%</td>
                                <td style="padding:6px;">${m.retention3s}%</td>
                                <td style="padding:6px;">${fmt(m.leads)}</td>
                                <td style="padding:6px;">${fmt(m.sales)}</td>
                                <td style="padding:6px;">₫${fmt(m.spend)}</td>
                                <td style="padding:6px;">₫${fmt(m.cpa)}</td>
                                <td style="padding:6px;"><button class="btn btn-danger btn-del-metric" data-id="${m.id}" style="padding:2px 6px;font-size:10px;">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ─── Experiments ───

function renderExperiments() {
    const container = document.getElementById('perf-experiments');
    if (experiments.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <h3>🧪 Experiments</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
            ${experiments.map(exp => `
                <div class="card" style="padding:var(--space-md);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>${typeLabel(exp.type)}</strong>
                        <span class="badge ${exp.status === 'running' ? 'badge-draft' : ''}" style="${exp.status === 'completed' ? 'background:var(--success);color:#fff;' : ''}">${exp.status}</span>
                    </div>
                    <div style="margin-top:var(--space-sm);">
                        ${(exp.variants || []).map((v, i) => `
                            <div style="display:flex;align-items:center;gap:var(--space-sm);padding:4px 0;border-bottom:1px solid var(--border);font-size:13px;">
                                <span style="font-weight:bold;min-width:20px;">${String.fromCharCode(65 + i)}</span>
                                <span style="flex:1;">${escapeHtml(v)}</span>
                                ${exp.status === 'running' ? `<button class="btn btn-primary btn-pick-winner" data-exp="${exp.id}" data-idx="${i}" style="padding:2px 8px;font-size:11px;">🏆 Winner</button>` : ''}
                                ${exp.winner === i ? '<span style="color:var(--success);font-weight:bold;">🏆</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ─── Learning Logs ───

function renderLearningLogs() {
    const container = document.getElementById('perf-learning-logs');
    if (learningLogs.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <h3>📝 Learning Logs</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
            ${learningLogs.map(log => `
                <div class="card" style="padding:var(--space-sm);">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xs);font-size:13px;">
                        <div><strong>Giả thuyết:</strong> ${escapeHtml(log.hypothesis)}</div>
                        <div><strong>Kết quả:</strong> ${escapeHtml(log.result)}</div>
                        <div><strong>Insight:</strong> ${escapeHtml(log.insight)}</div>
                        <div><strong>Next action:</strong> ${escapeHtml(log.nextAction)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ─── Modals ───

function renderMetricModal() {
    return `
        <div id="metric-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:520px;width:90%;max-height:85vh;overflow-y:auto;">
                <div class="card-title">Nhập số liệu</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm);">
                    <div class="form-group">
                        <label class="form-label">Ngày</label>
                        <input type="date" id="m-date" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Asset ID (tuỳ chọn)</label>
                        <input type="text" id="m-asset-id" class="form-input" placeholder="ID asset">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Views</label>
                        <input type="number" id="m-views" class="form-input" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Watch Time (s)</label>
                        <input type="number" id="m-watch" class="form-input" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Retention 3s %</label>
                        <input type="number" id="m-ret3s" class="form-input" step="0.1" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">CTR %</label>
                        <input type="number" id="m-ctr" class="form-input" step="0.01" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Leads</label>
                        <input type="number" id="m-leads" class="form-input" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Sales</label>
                        <input type="number" id="m-sales" class="form-input" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Spend (₫)</label>
                        <input type="number" id="m-spend" class="form-input" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">CPA (₫)</label>
                        <input type="number" id="m-cpa" class="form-input" value="0">
                    </div>
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-md);">
                    <button id="btn-cancel-metric" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-metric" class="btn btn-primary">💾 Lưu</button>
                </div>
            </div>
        </div>
    `;
}

function renderExperimentModal() {
    return `
        <div id="experiment-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:520px;width:90%;">
                <div class="card-title">🧪 Tạo Experiment</div>
                <div class="form-group">
                    <label class="form-label">Loại test</label>
                    <select id="exp-type" class="form-select">
                        <option value="hook_ab">🪝 Hook A/B</option>
                        <option value="thumbnail_ab">🖼️ Thumbnail A/B</option>
                        <option value="cta_ab">🎯 CTA A/B</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Hook / Content gốc</label>
                    <textarea id="exp-original" class="form-textarea" rows="3" placeholder="Paste hook hoặc content gốc để AI tạo 3 biến thể..."></textarea>
                </div>
                <div id="exp-variants-preview" class="hidden" style="margin:var(--space-md) 0;"></div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-exp" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-gen-variants" class="btn btn-primary">🤖 Tạo 3 variants</button>
                    <button id="btn-save-exp" class="btn btn-primary hidden">💾 Lưu experiment</button>
                </div>
            </div>
        </div>
    `;
}

function renderLogModal() {
    return `
        <div id="log-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:520px;width:90%;">
                <div class="card-title">📝 Learning Log</div>
                <div class="form-group">
                    <label class="form-label">Giả thuyết</label>
                    <textarea id="log-hypothesis" class="form-textarea" rows="2" placeholder="Chúng tôi nghĩ rằng nếu..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Kết quả</label>
                    <textarea id="log-result" class="form-textarea" rows="2" placeholder="Kết quả thực tế..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Insight</label>
                    <textarea id="log-insight" class="form-textarea" rows="2" placeholder="Bài học rút ra..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Next action</label>
                    <textarea id="log-next" class="form-textarea" rows="2" placeholder="Hành động tiếp theo..."></textarea>
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-log" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-log" class="btn btn-primary">💾 Lưu</button>
                </div>
            </div>
        </div>
    `;
}

// ─── Events ───

function setupPerfEvents(campaignId, user) {
    let generatedVariants = [];

    // Add metric
    document.getElementById('btn-add-metric').addEventListener('click', () => {
        document.getElementById('m-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('metric-modal').classList.remove('hidden');
    });
    document.getElementById('btn-cancel-metric').addEventListener('click', () => {
        document.getElementById('metric-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-metric').addEventListener('click', async () => {
        try {
            await addMetric({
                campaignId,
                userId: user.uid,
                assetId: document.getElementById('m-asset-id').value.trim() || null,
                date: document.getElementById('m-date').value,
                views: document.getElementById('m-views').value,
                watchTime: document.getElementById('m-watch').value,
                retention3s: document.getElementById('m-ret3s').value,
                ctr: document.getElementById('m-ctr').value,
                leads: document.getElementById('m-leads').value,
                sales: document.getElementById('m-sales').value,
                spend: document.getElementById('m-spend').value,
                cpa: document.getElementById('m-cpa').value,
            });
            document.getElementById('metric-modal').classList.add('hidden');
            metrics = await listMetrics(campaignId);
            renderTopAssets();
            renderMetricsTable();
            showToast('Đã lưu số liệu! 📊', 'success');
        } catch (err) { showToast('Lỗi lưu số liệu', 'error'); }
    });

    // CSV import
    document.getElementById('perf-csv-import').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            const startIdx = (lines[0] && /^(date|ngày|asset)/i.test(lines[0])) ? 1 : 0;
            const rows = [];
            for (let i = startIdx; i < lines.length; i++) {
                const p = lines[i].split(',').map(s => s.trim());
                if (p.length >= 3) {
                    rows.push({
                        campaignId, userId: user.uid,
                        date: p[0] || new Date().toISOString().split('T')[0],
                        assetId: p[1] || null,
                        views: p[2] || 0, watchTime: p[3] || 0,
                        retention3s: p[4] || 0, ctr: p[5] || 0,
                        leads: p[6] || 0, sales: p[7] || 0,
                        spend: p[8] || 0, cpa: p[9] || 0,
                    });
                }
            }
            if (rows.length === 0) { showToast('File CSV trống', 'error'); return; }
            await addMetrics(rows);
            metrics = await listMetrics(campaignId);
            renderTopAssets();
            renderMetricsTable();
            showToast(`Đã import ${rows.length} records! 📁`, 'success');
        } catch (err) {
            showToast('Lỗi import CSV', 'error');
            console.error('CSV import error:', err);
        }
        e.target.value = '';
    });

    // Delete metric
    document.getElementById('perf-metrics-table').addEventListener('click', async (e) => {
        const del = e.target.closest('.btn-del-metric');
        if (!del) return;
        try {
            await deleteMetric(del.dataset.id);
            metrics = metrics.filter(m => m.id !== del.dataset.id);
            renderTopAssets();
            renderMetricsTable();
            showToast('Đã xoá', 'info');
        } catch (err) { showToast('Lỗi xoá', 'error'); }
    });

    // Experiment
    document.getElementById('btn-new-experiment').addEventListener('click', () => {
        generatedVariants = [];
        document.getElementById('exp-original').value = '';
        document.getElementById('exp-variants-preview').classList.add('hidden');
        document.getElementById('btn-save-exp').classList.add('hidden');
        document.getElementById('btn-gen-variants').classList.remove('hidden');
        document.getElementById('experiment-modal').classList.remove('hidden');
    });
    document.getElementById('btn-cancel-exp').addEventListener('click', () => {
        document.getElementById('experiment-modal').classList.add('hidden');
    });

    // Generate variants
    document.getElementById('btn-gen-variants').addEventListener('click', async () => {
        const original = document.getElementById('exp-original').value.trim();
        if (!original) { showToast('Nhập hook/content gốc', 'error'); return; }

        const settings = await getSettings(user.uid);
        const apiKey = settings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            showToast('Chưa cấu hình Gemini API key', 'error');
            return;
        }

        const btn = document.getElementById('btn-gen-variants');
        btn.disabled = true;
        btn.textContent = '🤖 Đang tạo...';
        try {
            const brand = await getBrand(user.uid);
            const expType = document.getElementById('exp-type').value;
            const result = await generateExperimentVariants(original, brand, expType, apiKey);
            generatedVariants = result.variants || [];

            document.getElementById('exp-variants-preview').classList.remove('hidden');
            document.getElementById('exp-variants-preview').innerHTML = `
                <div class="card" style="padding:var(--space-sm);">
                    <strong style="font-size:13px;">Preview 3 variants:</strong>
                    ${generatedVariants.map((v, i) => `
                        <div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
                            <strong>${String.fromCharCode(65 + i)}.</strong> ${escapeHtml(v)}
                        </div>
                    `).join('')}
                </div>
            `;
            document.getElementById('btn-save-exp').classList.remove('hidden');
            btn.classList.add('hidden');
        } catch (err) {
            showToast(`Lỗi AI: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '🤖 Tạo 3 variants';
        }
    });

    // Save experiment + create draft assets
    document.getElementById('btn-save-exp').addEventListener('click', async () => {
        if (generatedVariants.length === 0) return;
        try {
            const expType = document.getElementById('exp-type').value;
            await createExperiment({
                campaignId,
                userId: user.uid,
                type: expType,
                variants: generatedVariants,
            });
            // Create draft assets for each variant
            for (const variant of generatedVariants) {
                await createAsset({
                    campaignId,
                    userId: user.uid,
                    type: 'experiment',
                    channel: 'facebook',
                    content: variant,
                });
            }
            experiments = await listExperiments(campaignId);
            renderExperiments();
            document.getElementById('experiment-modal').classList.add('hidden');
            showToast(`Đã tạo experiment + ${generatedVariants.length} draft assets! 🧪`, 'success');
        } catch (err) { showToast('Lỗi tạo experiment', 'error'); }
    });

    // Pick winner
    document.getElementById('perf-experiments').addEventListener('click', async (e) => {
        const winBtn = e.target.closest('.btn-pick-winner');
        if (!winBtn) return;
        const expId = winBtn.dataset.exp;
        const idx = parseInt(winBtn.dataset.idx);
        try {
            await updateExperiment(expId, { winner: idx, status: 'completed' });
            experiments = await listExperiments(campaignId);
            renderExperiments();
            showToast('Đã chọn winner! 🏆', 'success');
        } catch (err) { showToast('Lỗi', 'error'); }
    });

    // Learning log
    document.getElementById('btn-add-log').addEventListener('click', () => {
        ['hypothesis', 'result', 'insight', 'next'].forEach(k => {
            document.getElementById(`log-${k}`).value = '';
        });
        document.getElementById('log-modal').classList.remove('hidden');
    });
    document.getElementById('btn-cancel-log').addEventListener('click', () => {
        document.getElementById('log-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-log').addEventListener('click', async () => {
        const hypothesis = document.getElementById('log-hypothesis').value.trim();
        if (!hypothesis) { showToast('Nhập giả thuyết', 'error'); return; }
        try {
            await addLearningLog({
                campaignId,
                userId: user.uid,
                hypothesis,
                result: document.getElementById('log-result').value.trim(),
                insight: document.getElementById('log-insight').value.trim(),
                nextAction: document.getElementById('log-next').value.trim(),
            });
            learningLogs = await listLearningLogs(campaignId);
            renderLearningLogs();
            document.getElementById('log-modal').classList.add('hidden');
            showToast('Đã lưu learning log! 📝', 'success');
        } catch (err) { showToast('Lỗi lưu log', 'error'); }
    });
}

// ─── Helpers ───

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function shortId(id) {
    if (!id || id === 'no_asset') return '(chung)';
    return id.substring(0, 6) + '…';
}

function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
}

function typeLabel(type) {
    const labels = { hook_ab: '🪝 Hook A/B', thumbnail_ab: '🖼️ Thumbnail A/B', cta_ab: '🎯 CTA A/B' };
    return labels[type] || type;
}
