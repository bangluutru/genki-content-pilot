// campaign-detail.js — Chi tiết chiến dịch với tabs
// Route: #campaign?id=...

import { getCampaign } from '../state.js';
import { createBrief, listBriefVersions, updateBrief, submitBrief, approveBrief, rejectBrief } from '../services/db/briefs.js';
import { renderVocTab } from '../components/voc-tab.js';
import { renderIdeasTab } from '../components/ideas-tab.js';
import { renderAssetsTab } from '../components/assets-tab.js';
import { renderPerformanceTab } from '../components/performance-tab.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { getParam, navigate } from '../router.js';
import { CONFIG } from '../config.js';

let campaignId = null;
let campaign = null;
let briefVersions = [];
let currentBrief = null;
let activeTab = 'brief';

/**
 * Render trang chi tiết chiến dịch
 * @param {HTMLElement} container
 */
export function renderCampaignDetail(container) {
    campaignId = getParam('id');
    if (!campaignId) {
        navigate('campaigns');
        return;
    }

    container.innerHTML = `
        <div class="page-header">
            <div style="display:flex;align-items:center;gap:var(--space-md);">
                <a href="#campaigns" class="btn btn-secondary" style="padding:6px 12px;">← Quay lại</a>
                <div>
                    <h2 id="campaign-title">Đang tải...</h2>
                    <p class="text-secondary" id="campaign-subtitle"></p>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" id="detail-tabs" style="margin-bottom: var(--space-lg);">
            <button class="tab active" data-tab="brief">📋 Brief</button>
            <button class="tab" data-tab="voc">💬 VOC</button>
            <button class="tab" data-tab="ideas">💡 Ideas</button>
            <button class="tab" data-tab="assets">🎨 Assets</button>
            <button class="tab" data-tab="performance">📈 Performance</button>
        </div>

        <!-- Tab content -->
        <div id="tab-content"></div>
    `;

    setupTabEvents();
    loadCampaignData();
}

function setupTabEvents() {
    document.getElementById('detail-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        document.querySelectorAll('#detail-tabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        renderTabContent();
    });
}

async function loadCampaignData() {
    campaign = await getCampaign(campaignId);
    if (!campaign) {
        showToast('Không tìm thấy chiến dịch', 'error');
        navigate('campaigns');
        return;
    }

    document.getElementById('campaign-title').textContent = campaign.name;
    document.getElementById('campaign-subtitle').textContent = campaign.description || '';

    briefVersions = await listBriefVersions(campaignId);
    // Show latest approved, or latest draft
    currentBrief = briefVersions.find(b => b.status === 'approved') || briefVersions[0] || null;

    renderTabContent();
}

function renderTabContent() {
    const container = document.getElementById('tab-content');
    switch (activeTab) {
        case 'brief': renderBriefTab(container); break;
        case 'voc': renderVocTab(container, campaignId); break;
        case 'ideas': renderIdeasTab(container, campaignId); break;
        case 'assets': renderAssetsTab(container, campaignId); break;
        case 'performance': renderPerformanceTab(container, campaignId); break;
    }
}

function renderPlaceholderTab(container, title, description) {
    container.innerHTML = `
        <div class="card" style="text-align:center;padding:var(--space-2xl);">
            <p style="font-size:48px;margin-bottom:var(--space-md);">${title.split(' ')[0]}</p>
            <p class="text-muted" style="font-size:16px;">${description}</p>
        </div>
    `;
}

// ─── Brief Tab ───

function renderBriefTab(container) {
    const user = getCurrentUser();
    const brief = currentBrief;
    const hasVersions = briefVersions.length > 0;
    const statusBadge = brief ? getBriefStatusBadge(brief.status) : '';

    container.innerHTML = `
        <!-- Version selector + actions -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm);">
            <div style="display:flex;align-items:center;gap:var(--space-sm);">
                ${hasVersions ? `
                    <select id="version-select" class="form-select" style="width:auto;min-width:160px;">
                        ${briefVersions.map(b => `
                            <option value="${b.id}" ${b.id === brief?.id ? 'selected' : ''}>
                                v${b.version} — ${getBriefStatusLabel(b.status)}
                            </option>
                        `).join('')}
                    </select>
                ` : ''}
                ${statusBadge}
            </div>
            <div style="display:flex;gap:var(--space-sm);">
                <button id="btn-new-version" class="btn btn-primary">📝 Tạo version mới</button>
                ${brief && brief.status === 'draft' ? '<button id="btn-submit-review" class="btn btn-secondary">📤 Gửi duyệt</button>' : ''}
                ${brief && brief.status === 'in_review' ? `
                    <button id="btn-approve-brief" class="btn btn-primary">✅ Duyệt</button>
                    <button id="btn-reject-brief" class="btn btn-danger">❌ Từ chối</button>
                ` : ''}
            </div>
        </div>

        <!-- Brief form -->
        <form id="brief-form">
            <div class="card">
                <div class="card-title">🎯 Mục tiêu & KPI</div>
                <div class="form-group">
                    <label class="form-label">Loại mục tiêu</label>
                    <select id="brief-goalType" class="form-select">
                        <option value="awareness">🔔 Awareness — Nhận diện thương hiệu</option>
                        <option value="engagement">💬 Engagement — Tương tác</option>
                        <option value="conversion">🛒 Conversion — Chuyển đổi</option>
                        <option value="retention">🔄 Retention — Giữ chân</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">KPI mục tiêu (JSON)</label>
                    <textarea id="brief-kpiTargets" class="form-textarea" rows="3"
                        placeholder='{"reach": 50000, "engagement_rate": "5%", "conversions": 200}'></textarea>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-md);">
                <div class="card-title">👤 ICP & Insight</div>
                <div class="form-group">
                    <label class="form-label">Ideal Customer Profile</label>
                    <textarea id="brief-icpPersona" class="form-textarea" rows="3"
                        placeholder='{"age":"25-45","gender":"Nữ","interest":"Sức khoẻ, làm đẹp","pain":"Da sạm, thiếu collagen"}'></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Consumer Insight</label>
                    <textarea id="brief-insight" class="form-textarea" rows="2"
                        placeholder="Phụ nữ Việt ngày càng quan tâm collagen nhưng lo ngại hàng không rõ nguồn gốc..."></textarea>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-md);">
                <div class="card-title">📣 Strategy & Messaging</div>
                <div class="form-group">
                    <label class="form-label">SMP (Single-Minded Proposition)</label>
                    <input type="text" id="brief-smp" class="form-input"
                        placeholder="Collagen Nhật #1 được chứng nhận JIS — đẹp da từ bên trong">
                </div>
                <div class="form-group">
                    <label class="form-label">Offer</label>
                    <input type="text" id="brief-offer" class="form-input"
                        placeholder="Combo 3 hộp giảm 20%, free ship toàn quốc">
                </div>
                <div class="form-group">
                    <label class="form-label">RTB (Reasons to Believe)</label>
                    <textarea id="brief-rtb" class="form-textarea" rows="3"
                        placeholder="Mỗi dòng 1 RTB:\nChứng nhận JIS Nhật Bản\n100% nguyên liệu tự nhiên\n50,000+ khách hàng tin dùng"></textarea>
                </div>
            </div>

            <div class="card" style="margin-top:var(--space-md);">
                <div class="card-title">📡 Channels & CTA</div>
                <div class="form-group">
                    <label class="form-label">Channels (JSON)</label>
                    <textarea id="brief-channels" class="form-textarea" rows="2"
                        placeholder='{"facebook": true, "blog": true, "story": true}'></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">CTA</label>
                    <input type="text" id="brief-cta" class="form-input"
                        placeholder="Inbox ngay để nhận ưu đãi | Đặt hàng tại link bio">
                </div>
                <div class="form-group">
                    <label class="form-label">Compliance Notes</label>
                    <textarea id="brief-complianceNotes" class="form-textarea" rows="2"
                        placeholder="Không claim chữa bệnh, tuân thủ NĐ 15/2018, kèm disclaimer TPCN"></textarea>
                </div>
            </div>

            ${brief && brief.status === 'draft' ? `
                <div style="margin-top:var(--space-lg);">
                    <button type="submit" class="btn btn-primary btn-lg">💾 Lưu brief</button>
                </div>
            ` : ''}
        </form>
    `;

    // Fill form if brief exists
    if (brief) fillBriefForm(brief);

    // Disable form if not draft
    if (brief && brief.status !== 'draft') {
        document.querySelectorAll('#brief-form input, #brief-form textarea, #brief-form select').forEach(el => {
            el.disabled = true;
        });
    }

    setupBriefEvents();
}

function fillBriefForm(brief) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) {
            el.value = typeof val === 'object' ? JSON.stringify(val, null, 2) : val;
        }
    };
    setVal('brief-goalType', brief.goalType);
    setVal('brief-kpiTargets', brief.kpiTargets);
    setVal('brief-icpPersona', brief.icpPersona);
    setVal('brief-insight', brief.insight);
    setVal('brief-smp', brief.smp);
    setVal('brief-offer', brief.offer);
    setVal('brief-rtb', Array.isArray(brief.rtb) ? brief.rtb.join('\n') : brief.rtb);
    setVal('brief-channels', brief.channels);
    setVal('brief-cta', brief.cta);
    setVal('brief-complianceNotes', brief.complianceNotes);
}

function collectBriefData() {
    const tryParseJSON = (val) => {
        try { return JSON.parse(val); } catch { return val; }
    };
    return {
        goalType: document.getElementById('brief-goalType').value,
        kpiTargets: tryParseJSON(document.getElementById('brief-kpiTargets').value),
        icpPersona: tryParseJSON(document.getElementById('brief-icpPersona').value),
        insight: document.getElementById('brief-insight').value.trim(),
        smp: document.getElementById('brief-smp').value.trim(),
        offer: document.getElementById('brief-offer').value.trim(),
        rtb: document.getElementById('brief-rtb').value.trim().split('\n').filter(Boolean),
        channels: tryParseJSON(document.getElementById('brief-channels').value),
        cta: document.getElementById('brief-cta').value.trim(),
        complianceNotes: document.getElementById('brief-complianceNotes').value.trim(),
    };
}

function setupBriefEvents() {
    const user = getCurrentUser();

    // Version selector
    const versionSelect = document.getElementById('version-select');
    if (versionSelect) {
        versionSelect.addEventListener('change', () => {
            currentBrief = briefVersions.find(b => b.id === versionSelect.value) || null;
            renderTabContent();
        });
    }

    // Save draft
    const form = document.getElementById('brief-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentBrief || currentBrief.status !== 'draft') return;
        try {
            await updateBrief(currentBrief.id, collectBriefData());
            showToast('Đã lưu brief! ✅', 'success');
        } catch (error) {
            showToast('Lỗi lưu brief', 'error');
        }
    });

    // New version
    document.getElementById('btn-new-version').addEventListener('click', async () => {
        const latestVersion = briefVersions.length > 0 ? Math.max(...briefVersions.map(b => b.version)) : 0;
        const cloneData = currentBrief ? collectBriefData() : {};
        try {
            await createBrief({
                ...cloneData,
                campaignId,
                userId: user.uid,
                version: latestVersion + 1,
            });
            showToast(`Đã tạo Brief v${latestVersion + 1}! 📝`, 'success');
            // Reload
            briefVersions = await listBriefVersions(campaignId);
            currentBrief = briefVersions[0];
            renderTabContent();
        } catch (error) {
            showToast('Lỗi tạo version', 'error');
        }
    });

    // Submit for review
    const submitBtn = document.getElementById('btn-submit-review');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            try {
                // Save first
                await updateBrief(currentBrief.id, collectBriefData());
                await submitBrief(currentBrief.id);
                currentBrief.status = 'in_review';
                showToast('Đã gửi brief để duyệt! 📤', 'success');
                renderTabContent();
            } catch (error) {
                showToast('Lỗi gửi duyệt', 'error');
            }
        });
    }

    // Approve
    const approveBtn = document.getElementById('btn-approve-brief');
    if (approveBtn) {
        approveBtn.addEventListener('click', async () => {
            try {
                await approveBrief(currentBrief.id, user.uid);
                currentBrief.status = 'approved';
                showToast('Đã duyệt brief! ✅', 'success');
                renderTabContent();
            } catch (error) {
                showToast('Lỗi duyệt brief', 'error');
            }
        });
    }

    // Reject
    const rejectBtn = document.getElementById('btn-reject-brief');
    if (rejectBtn) {
        rejectBtn.addEventListener('click', async () => {
            const reason = prompt('Lý do từ chối:');
            if (reason === null) return; // cancelled
            try {
                await rejectBrief(currentBrief.id, user.uid, reason);
                currentBrief.status = 'rejected';
                showToast('Đã từ chối brief', 'info');
                renderTabContent();
            } catch (error) {
                showToast('Lỗi từ chối brief', 'error');
            }
        });
    }
}

// ─── Helpers ───

function getBriefStatusBadge(status) {
    switch (status) {
        case 'approved': return '<span class="badge badge-published">✅ Đã duyệt</span>';
        case 'in_review': return '<span class="badge" style="background:var(--warning);color:#000;">📤 Đang duyệt</span>';
        case 'rejected': return '<span class="badge" style="background:var(--danger);color:#fff;">❌ Từ chối</span>';
        case 'draft': default: return '<span class="badge badge-draft">📝 Nháp</span>';
    }
}

function getBriefStatusLabel(status) {
    switch (status) {
        case 'approved': return 'Đã duyệt';
        case 'in_review': return 'Đang duyệt';
        case 'rejected': return 'Từ chối';
        case 'draft': default: return 'Nháp';
    }
}
