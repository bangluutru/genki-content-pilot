// create.js — Trang tạo bài mới: brief → AI → preview → publish
// Route: #create — Trang phức tạp nhất

import { generateContent } from '../services/gemini.js';
import { getBrand, createContent, updateContent, getSettings } from '../state.js';
import { getApprovedBrief } from '../services/db/briefs.js';
import { getCurrentUser } from '../auth.js';
import { showToast } from '../components/toast.js';
import { getParam } from '../router.js';

// State cục bộ cho trang create
let currentContent = null;
let currentContentId = null;

/**
 * Render trang tạo bài mới
 * @param {HTMLElement} container - Element #app
 */
export function renderCreate(container) {
    currentContent = null;
    currentContentId = null;

    container.innerHTML = `
        <div class="page-header">
            <h2>✨ Tạo bài mới</h2>
            <p class="text-secondary">Nhập brief → AI tạo content → Review → Publish</p>
        </div>

        <!-- Step 1: Nhập brief -->
        <div class="card" id="step-brief">
            <div class="card-title">Bước 1 — Brief</div>
            <div class="form-group">
                <label class="form-label">Mô tả bài viết</label>
                <textarea id="brief-input" class="form-textarea" rows="4"
                    placeholder="Ví dụ: Ra mắt collagen Nhật mới, giá 890K, combo 3 giảm 20%. Nhấn mạnh thành phần tự nhiên và chứng nhận JIS."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Loại bài viết</label>
                <select id="content-type" class="form-select">
                    <option value="product">🛍️ Giới thiệu sản phẩm</option>
                    <option value="promo">🏷️ Khuyến mãi</option>
                    <option value="education">📖 Kiến thức sức khoẻ</option>
                    <option value="testimonial">💬 Đánh giá khách hàng</option>
                    <option value="announcement">📢 Thông báo</option>
                </select>
            </div>
            <button id="btn-generate" class="btn btn-primary btn-lg">
                🤖 Tạo content bằng AI
            </button>
        </div>

        <!-- Loading -->
        <div class="card hidden" id="step-loading">
            <div class="loading">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <span style="margin-left: 12px;">AI đang viết bài...</span>
            </div>
        </div>

        <!-- Step 2: Preview 3 phiên bản -->
        <div class="hidden" id="step-preview">
            <div class="card">
                <div class="card-title">Bước 2 — Preview & Edit</div>
                <div class="tabs" id="preview-tabs">
                    <button class="tab active" data-tab="facebook">📱 Facebook</button>
                    <button class="tab" data-tab="blog">📝 Blog</button>
                    <button class="tab" data-tab="caption">📸 Caption</button>
                </div>
                <div id="tab-facebook" class="tab-content">
                    <textarea id="edit-facebook" class="form-textarea" rows="10"></textarea>
                </div>
                <div id="tab-blog" class="tab-content hidden">
                    <textarea id="edit-blog" class="form-textarea" rows="15"></textarea>
                </div>
                <div id="tab-caption" class="tab-content hidden">
                    <textarea id="edit-caption" class="form-textarea" rows="4"></textarea>
                </div>
            </div>

            <!-- Actions -->
            <div class="create-actions">
                <button id="btn-regenerate" class="btn btn-secondary">🔄 Tạo lại</button>
                <button id="btn-save-draft" class="btn btn-secondary">💾 Lưu nháp</button>
                <button id="btn-copy-fb" class="btn btn-secondary">📋 Copy FB</button>
                <button id="btn-copy-blog" class="btn btn-secondary">📋 Copy Blog</button>
            </div>
        </div>
    `;

    setupCreateEvents();
}

function setupCreateEvents() {
    // Generate button
    document.getElementById('btn-generate').addEventListener('click', handleGenerate);

    // Tab switching
    document.querySelectorAll('#preview-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Bỏ active tất cả tabs
            document.querySelectorAll('#preview-tabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Ẩn tất cả tab contents
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
        });
    });
}

async function handleGenerate() {
    const brief = document.getElementById('brief-input').value.trim();
    if (!brief) {
        showToast('Vui lòng nhập mô tả bài viết', 'error');
        return;
    }

    const contentType = document.getElementById('content-type').value;
    const user = getCurrentUser();

    // Hiện loading
    document.getElementById('step-loading').classList.remove('hidden');
    document.getElementById('step-preview').classList.add('hidden');
    document.getElementById('btn-generate').disabled = true;

    try {
        // Lấy brand profile + settings
        const brand = await getBrand(user.uid);
        const settings = await getSettings(user.uid);
        const apiKey = settings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            showToast('Chưa cấu hình Gemini API key. Vào 🏢 Thương hiệu để setup.', 'error');
            return;
        }

        // Gọi AI — truyền campaign brief nếu có
        let campaignBrief = null;
        const campaignId = getParam('campaignId');
        if (campaignId) {
            campaignBrief = await getApprovedBrief(campaignId);
        }
        const content = await generateContent(brief, brand, apiKey, contentType, campaignBrief);
        currentContent = content;

        // Fill vào editors
        document.getElementById('edit-facebook').value = content.fbPost;
        document.getElementById('edit-blog').value = content.blog;
        document.getElementById('edit-caption').value = content.caption;

        // Hiện preview, ẩn loading
        document.getElementById('step-loading').classList.add('hidden');
        document.getElementById('step-preview').classList.remove('hidden');

        // Lưu draft vào Firestore
        const contentId = await createContent({
            brief,
            contentType,
            facebookPost: content.fbPost,
            blogArticle: content.blog,
            shortCaption: content.caption,
            brandId: brand?.id || null,
            createdBy: user.uid,
        });
        currentContentId = contentId;

        showToast('AI đã tạo xong! Review và chỉnh sửa bên dưới 👇', 'success');

        // Setup action buttons
        setupActionButtons(brief, contentType);

    } catch (error) {
        console.error('Generate error:', error);
        showToast(`Lỗi: ${error.message}`, 'error');
        document.getElementById('step-loading').classList.add('hidden');
    } finally {
        document.getElementById('btn-generate').disabled = false;
    }
}

function setupActionButtons(brief, contentType) {
    // Regenerate
    document.getElementById('btn-regenerate').addEventListener('click', () => {
        document.getElementById('step-preview').classList.add('hidden');
        handleGenerate();
    });

    // Save draft (cập nhật nội dung đã edit)
    document.getElementById('btn-save-draft').addEventListener('click', async () => {
        if (!currentContentId) return;
        try {
            await updateContent(currentContentId, {
                facebookPost: document.getElementById('edit-facebook').value,
                blogArticle: document.getElementById('edit-blog').value,
                shortCaption: document.getElementById('edit-caption').value,
            });
            showToast('Đã lưu nháp! ✅', 'success');
        } catch (e) {
            showToast('Lỗi lưu nháp', 'error');
        }
    });

    // Copy FB
    document.getElementById('btn-copy-fb').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('edit-facebook').value);
        showToast('Đã copy bài Facebook! 📋', 'info');
    });

    // Copy Blog
    document.getElementById('btn-copy-blog').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('edit-blog').value);
        showToast('Đã copy bài Blog! 📋', 'info');
    });
}
