// ideas-tab.js — Ideas Tab: Kanban + Scoring + Content Pack
// Component cho campaign-detail Ideas tab

import { createIdea, listIdeas, updateIdea, deleteIdea, saveIdeaScore, getIdeaScores } from '../services/db/ideas.js';
import { getApprovedBrief } from '../services/db/briefs.js';
import { loadHookBank } from '../services/db/voc.js';
import { createContent, getBrand, getSettings } from '../state.js';
import { generateContentPack } from '../services/gemini-ideas.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from './toast.js';
import { CONFIG } from '../config.js';

let allIdeas = [];
let ideaScoresMap = {}; // ideaId → latest score

const COLUMNS = [
    { key: 'backlog', label: '📥 Backlog', color: 'var(--text-muted)' },
    { key: 'shortlisted', label: '⭐ Shortlisted', color: 'var(--warning)' },
    { key: 'in_production', label: '🔨 In Production', color: 'var(--primary)' },
    { key: 'published', label: '🚀 Published', color: 'var(--success)' },
    { key: 'archived', label: '🗄️ Archived', color: 'var(--text-secondary)' },
];

const FUNNEL_LABELS = { TOF: '🔝 TOF', MOF: '🔄 MOF', BOF: '🎯 BOF' };

/**
 * Render Ideas tab
 * @param {HTMLElement} container
 * @param {string} campaignId
 */
export async function renderIdeasTab(container, campaignId) {
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm);">
            <h3 style="margin:0;">💡 Ideas</h3>
            <div style="display:flex;gap:var(--space-sm);">
                <button id="btn-add-idea" class="btn btn-primary">➕ Thêm idea</button>
                <button id="btn-ranking" class="btn btn-secondary">🏆 Ranking</button>
            </div>
        </div>

        <!-- Add idea modal -->
        <div id="idea-add-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:520px;width:90%;">
                <div class="card-title">Thêm Idea mới</div>
                <div class="form-group">
                    <label class="form-label">Tiêu đề *</label>
                    <input type="text" id="idea-title" class="form-input" placeholder="Ví dụ: Collagen x Tết — quà tặng sức khoẻ">
                </div>
                <div class="form-group">
                    <label class="form-label">Góc tiếp cận (Angle)</label>
                    <input type="text" id="idea-angle" class="form-input" placeholder="Ví dụ: Testimonial từ KOL, Fear-of-missing-out">
                </div>
                <div class="form-group">
                    <label class="form-label">Funnel Stage *</label>
                    <select id="idea-funnel" class="form-select">
                        <option value="TOF">🔝 TOF — Top of Funnel (Nhận biết)</option>
                        <option value="MOF">🔄 MOF — Middle of Funnel (Cân nhắc)</option>
                        <option value="BOF">🎯 BOF — Bottom of Funnel (Chuyển đổi)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Ghi chú</label>
                    <textarea id="idea-notes" class="form-textarea" rows="2" placeholder="Ghi chú thêm..."></textarea>
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-idea" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-idea" class="btn btn-primary">💾 Lưu</button>
                </div>
            </div>
        </div>

        <!-- Scoring modal -->
        <div id="score-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:420px;width:90%;">
                <div class="card-title">📊 Chấm điểm Idea</div>
                <p id="score-idea-name" class="text-secondary" style="margin-bottom:var(--space-md);"></p>
                <div class="form-group">
                    <label class="form-label">😣 Pain Level <span id="sl-pain-val">3</span>/5</label>
                    <input type="range" id="sl-pain" min="1" max="5" value="3" style="width:100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">📝 Proof Potential <span id="sl-proof-val">3</span>/5</label>
                    <input type="range" id="sl-proof" min="1" max="5" value="3" style="width:100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">🔧 Production Fit <span id="sl-prod-val">3</span>/5</label>
                    <input type="range" id="sl-prod" min="1" max="5" value="3" style="width:100%;">
                </div>
                <div class="form-group">
                    <label class="form-label">🛒 Conversion Fit <span id="sl-conv-val">3</span>/5</label>
                    <input type="range" id="sl-conv" min="1" max="5" value="3" style="width:100%;">
                </div>
                <div style="text-align:center;margin:var(--space-md) 0;font-size:24px;font-weight:bold;">
                    Tổng: <span id="score-total">12</span>/20
                </div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;">
                    <button id="btn-cancel-score" class="btn btn-secondary">Huỷ</button>
                    <button id="btn-save-score" class="btn btn-primary">💾 Lưu điểm</button>
                </div>
            </div>
        </div>

        <!-- Content Pack modal -->
        <div id="pack-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;overflow-y:auto;">
            <div class="card" style="max-width:720px;width:95%;max-height:90vh;overflow-y:auto;margin:20px;">
                <div class="card-title">📦 Content Pack</div>
                <div id="pack-content"></div>
                <div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-md);">
                    <button id="btn-close-pack" class="btn btn-secondary">Đóng</button>
                    <button id="btn-save-pack" class="btn btn-primary">💾 Lưu vào Library</button>
                </div>
            </div>
        </div>

        <!-- Ranking modal -->
        <div id="ranking-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;">
            <div class="card" style="max-width:600px;width:95%;max-height:80vh;overflow-y:auto;">
                <div class="card-title">🏆 Ranking by Score</div>
                <div id="ranking-list"></div>
                <div style="text-align:right;margin-top:var(--space-md);">
                    <button id="btn-close-ranking" class="btn btn-secondary">Đóng</button>
                </div>
            </div>
        </div>

        <!-- Kanban board -->
        <div id="kanban-board" style="display:flex;gap:var(--space-md);overflow-x:auto;padding-bottom:var(--space-md);"></div>
    `;

    const user = getCurrentUser();
    allIdeas = await listIdeas(campaignId);

    // Load scores for all ideas
    ideaScoresMap = {};
    for (const idea of allIdeas) {
        const scores = await getIdeaScores(idea.id);
        if (scores.length > 0) ideaScoresMap[idea.id] = scores[0];
    }

    renderKanban();
    setupIdeasEvents(campaignId, user);
}

function renderKanban() {
    const board = document.getElementById('kanban-board');
    board.innerHTML = COLUMNS.map(col => {
        const items = allIdeas.filter(i => i.status === col.key);
        return `
            <div class="card" style="min-width:220px;flex:1;padding:var(--space-md);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm);">
                    <strong>${col.label}</strong>
                    <span class="badge" style="background:${col.color};color:#fff;">${items.length}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--space-sm);min-height:60px;">
                    ${items.map(idea => renderIdeaCard(idea)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderIdeaCard(idea) {
    const score = ideaScoresMap[idea.id];
    const scoreLabel = score ? `${score.total}/20` : '—';
    const funnelBadge = FUNNEL_LABELS[idea.funnelStage] || idea.funnelStage;
    const colIdx = COLUMNS.findIndex(c => c.key === idea.status);
    const canMoveLeft = colIdx > 0;
    const canMoveRight = colIdx < COLUMNS.length - 1;

    return `
        <div class="card" style="padding:var(--space-sm);margin:0;border-left:3px solid ${COLUMNS[colIdx].color};">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:4px;">
                <strong style="font-size:13px;flex:1;">${escapeHtml(idea.title)}</strong>
                <span class="badge" style="font-size:10px;background:var(--surface);white-space:nowrap;">${funnelBadge}</span>
            </div>
            ${idea.angle ? `<small class="text-secondary" style="display:block;margin-top:2px;">↳ ${escapeHtml(idea.angle)}</small>` : ''}
            <div style="display:flex;align-items:center;gap:4px;margin-top:var(--space-xs);font-size:11px;">
                <span class="text-muted">Score: ${scoreLabel}</span>
            </div>
            <div style="display:flex;gap:4px;margin-top:var(--space-xs);flex-wrap:wrap;">
                ${canMoveLeft ? `<button class="btn btn-secondary btn-move-idea" data-id="${idea.id}" data-dir="left" style="padding:2px 6px;font-size:11px;">◀</button>` : ''}
                ${canMoveRight ? `<button class="btn btn-secondary btn-move-idea" data-id="${idea.id}" data-dir="right" style="padding:2px 6px;font-size:11px;">▶</button>` : ''}
                <button class="btn btn-secondary btn-score-idea" data-id="${idea.id}" style="padding:2px 6px;font-size:11px;">📊</button>
                <button class="btn btn-primary btn-gen-pack" data-id="${idea.id}" style="padding:2px 6px;font-size:11px;">📦</button>
                <button class="btn btn-danger btn-del-idea" data-id="${idea.id}" style="padding:2px 6px;font-size:11px;">🗑️</button>
            </div>
        </div>
    `;
}

function setupIdeasEvents(campaignId, user) {
    // Add idea modal
    document.getElementById('btn-add-idea').addEventListener('click', () => {
        document.getElementById('idea-add-modal').classList.remove('hidden');
        document.getElementById('idea-title').value = '';
        document.getElementById('idea-angle').value = '';
        document.getElementById('idea-notes').value = '';
        document.getElementById('idea-title').focus();
    });
    document.getElementById('btn-cancel-idea').addEventListener('click', () => {
        document.getElementById('idea-add-modal').classList.add('hidden');
    });
    document.getElementById('btn-save-idea').addEventListener('click', async () => {
        const title = document.getElementById('idea-title').value.trim();
        if (!title) { showToast('Nhập tiêu đề', 'error'); return; }
        try {
            await createIdea({
                campaignId,
                userId: user.uid,
                title,
                angle: document.getElementById('idea-angle').value.trim(),
                funnelStage: document.getElementById('idea-funnel').value,
                notes: document.getElementById('idea-notes').value.trim(),
            });
            document.getElementById('idea-add-modal').classList.add('hidden');
            allIdeas = await listIdeas(campaignId);
            renderKanban();
            showToast('Đã thêm idea! 💡', 'success');
        } catch (error) {
            showToast('Lỗi thêm idea', 'error');
        }
    });

    // Score sliders
    ['pain', 'proof', 'prod', 'conv'].forEach(key => {
        const slider = document.getElementById(`sl-${key}`);
        slider.addEventListener('input', () => {
            document.getElementById(`sl-${key}-val`).textContent = slider.value;
            updateScoreTotal();
        });
    });
    function updateScoreTotal() {
        const total = ['pain', 'proof', 'prod', 'conv'].reduce((sum, k) =>
            sum + parseInt(document.getElementById(`sl-${k}`).value), 0);
        document.getElementById('score-total').textContent = total;
    }

    document.getElementById('btn-cancel-score').addEventListener('click', () => {
        document.getElementById('score-modal').classList.add('hidden');
    });

    // Close modals
    document.getElementById('btn-close-pack').addEventListener('click', () => {
        document.getElementById('pack-modal').classList.add('hidden');
    });
    document.getElementById('btn-close-ranking').addEventListener('click', () => {
        document.getElementById('ranking-modal').classList.add('hidden');
    });

    // Ranking button
    document.getElementById('btn-ranking').addEventListener('click', () => {
        const scored = allIdeas
            .filter(i => ideaScoresMap[i.id])
            .sort((a, b) => (ideaScoresMap[b.id]?.total || 0) - (ideaScoresMap[a.id]?.total || 0));

        document.getElementById('ranking-list').innerHTML = scored.length === 0
            ? '<p class="text-muted">Chưa có idea nào được chấm điểm</p>'
            : `<table style="width:100%;border-collapse:collapse;">
                <thead><tr style="border-bottom:2px solid var(--border);text-align:left;">
                    <th style="padding:8px;">#</th>
                    <th style="padding:8px;">Idea</th>
                    <th style="padding:8px;">Funnel</th>
                    <th style="padding:8px;">Score</th>
                </tr></thead>
                <tbody>${scored.map((idea, idx) => {
                const s = ideaScoresMap[idea.id];
                return `<tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:8px;font-weight:bold;">${idx + 1}</td>
                        <td style="padding:8px;">${escapeHtml(idea.title)}</td>
                        <td style="padding:8px;"><span class="badge badge-draft">${FUNNEL_LABELS[idea.funnelStage] || idea.funnelStage}</span></td>
                        <td style="padding:8px;font-weight:bold;">${s.total}/20</td>
                    </tr>`;
            }).join('')}</tbody>
            </table>`;

        document.getElementById('ranking-modal').classList.remove('hidden');
    });

    // Kanban event delegation
    let currentScoreIdeaId = null;
    let currentPackData = null;
    let currentPackIdeaId = null;

    document.getElementById('kanban-board').addEventListener('click', async (e) => {
        // Move
        const moveBtn = e.target.closest('.btn-move-idea');
        if (moveBtn) {
            const id = moveBtn.dataset.id;
            const dir = moveBtn.dataset.dir;
            const idea = allIdeas.find(i => i.id === id);
            if (!idea) return;
            const colIdx = COLUMNS.findIndex(c => c.key === idea.status);
            const newIdx = dir === 'left' ? colIdx - 1 : colIdx + 1;
            if (newIdx < 0 || newIdx >= COLUMNS.length) return;
            try {
                await updateIdea(id, { status: COLUMNS[newIdx].key });
                idea.status = COLUMNS[newIdx].key;
                renderKanban();
                setupKanbanDelegation();
            } catch (error) {
                showToast('Lỗi di chuyển idea', 'error');
            }
            return;
        }

        // Score
        const scoreBtn = e.target.closest('.btn-score-idea');
        if (scoreBtn) {
            currentScoreIdeaId = scoreBtn.dataset.id;
            const idea = allIdeas.find(i => i.id === currentScoreIdeaId);
            document.getElementById('score-idea-name').textContent = idea?.title || '';
            const existing = ideaScoresMap[currentScoreIdeaId];
            if (existing) {
                document.getElementById('sl-pain').value = existing.painLevel;
                document.getElementById('sl-proof').value = existing.proofPotential;
                document.getElementById('sl-prod').value = existing.productionFit;
                document.getElementById('sl-conv').value = existing.conversionFit;
            } else {
                ['pain', 'proof', 'prod', 'conv'].forEach(k => {
                    document.getElementById(`sl-${k}`).value = 3;
                });
            }
            ['pain', 'proof', 'prod', 'conv'].forEach(k => {
                document.getElementById(`sl-${k}-val`).textContent = document.getElementById(`sl-${k}`).value;
            });
            updateScoreTotal();
            document.getElementById('score-modal').classList.remove('hidden');
            return;
        }

        // Generate Content Pack
        const packBtn = e.target.closest('.btn-gen-pack');
        if (packBtn) {
            currentPackIdeaId = packBtn.dataset.id;
            const idea = allIdeas.find(i => i.id === currentPackIdeaId);
            if (!idea) return;

            const settings = await getSettings(user.uid);
            const apiKey = settings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey || apiKey === 'your_gemini_api_key_here') {
                showToast('Chưa cấu hình Gemini API key', 'error');
                return;
            }

            packBtn.disabled = true;
            packBtn.textContent = '⏳';
            try {
                const brief = await getApprovedBrief(campaignId);
                const hookBank = await loadHookBank(campaignId);
                const brand = await getBrand(user.uid);
                currentPackData = await generateContentPack(idea, brief, hookBank, brand, apiKey);

                const packContent = document.getElementById('pack-content');
                const assetLabels = {
                    tiktok: '🎬 TikTok Script 45s',
                    fbPost: '📱 Facebook Post',
                    carousel: '🖼️ Carousel 7 Slides',
                    email: '📧 Email Marketing',
                    landing: '🎯 Landing Bullets',
                };
                packContent.innerHTML = Object.entries(assetLabels).map(([key, label]) => `
                    <div class="card" style="margin-bottom:var(--space-sm);">
                        <div class="card-title">${label}</div>
                        <pre style="white-space:pre-wrap;font-size:13px;line-height:1.6;margin:0;">${escapeHtml(currentPackData[key] || 'N/A')}</pre>
                    </div>
                `).join('');

                document.getElementById('pack-modal').classList.remove('hidden');
            } catch (error) {
                console.error('Content pack error:', error);
                showToast(`Lỗi tạo Content Pack: ${error.message}`, 'error');
            } finally {
                packBtn.disabled = false;
                packBtn.textContent = '📦';
            }
            return;
        }

        // Delete
        const delBtn = e.target.closest('.btn-del-idea');
        if (delBtn) {
            const id = delBtn.dataset.id;
            if (!confirm('Xoá idea này?')) return;
            try {
                await deleteIdea(id);
                allIdeas = allIdeas.filter(i => i.id !== id);
                renderKanban();
                setupKanbanDelegation();
                showToast('Đã xoá idea', 'info');
            } catch (error) {
                showToast('Lỗi xoá idea', 'error');
            }
        }
    });

    function setupKanbanDelegation() {
        // Re-attach is not needed since we use delegation on kanban-board
    }

    // Save score
    document.getElementById('btn-save-score').addEventListener('click', async () => {
        if (!currentScoreIdeaId) return;
        try {
            const scoreData = {
                ideaId: currentScoreIdeaId,
                userId: user.uid,
                painLevel: parseInt(document.getElementById('sl-pain').value),
                proofPotential: parseInt(document.getElementById('sl-proof').value),
                productionFit: parseInt(document.getElementById('sl-prod').value),
                conversionFit: parseInt(document.getElementById('sl-conv').value),
            };
            await saveIdeaScore(scoreData);
            const total = scoreData.painLevel + scoreData.proofPotential + scoreData.productionFit + scoreData.conversionFit;
            ideaScoresMap[currentScoreIdeaId] = { ...scoreData, total };
            document.getElementById('score-modal').classList.add('hidden');
            renderKanban();
            showToast('Đã lưu điểm! 📊', 'success');
        } catch (error) {
            showToast('Lỗi lưu điểm', 'error');
        }
    });

    // Save content pack to library
    document.getElementById('btn-save-pack').addEventListener('click', async () => {
        if (!currentPackData || !currentPackIdeaId) return;
        const idea = allIdeas.find(i => i.id === currentPackIdeaId);
        try {
            const assetTypes = {
                tiktok: 'TikTok Script',
                fbPost: 'Facebook Post',
                carousel: 'Carousel Outline',
                email: 'Email Marketing',
                landing: 'Landing Bullets',
            };
            for (const [key, label] of Object.entries(assetTypes)) {
                if (currentPackData[key]) {
                    await createContent({
                        userId: user.uid,
                        campaignId,
                        title: `${label} — ${idea?.title || 'Untitled'}`,
                        content: currentPackData[key],
                        contentType: key,
                        status: 'draft',
                    });
                }
            }
            document.getElementById('pack-modal').classList.add('hidden');
            showToast('Đã lưu 5 assets vào Library! 📚', 'success');
        } catch (error) {
            showToast('Lỗi lưu content pack', 'error');
        }
    });
}

// ─── Helpers ───

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
