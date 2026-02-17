/**
 * Create Content Page — Guided brief form + AI generation + tab preview
 * Core feature of ContentPilot v2
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { generateContent, checkDailyLimit, incrementUsage } from '../services/gemini.js';
import { saveContent } from '../services/firestore.js';
import { copyToClipboard, storage } from '../utils/helpers.js';

let currentContent = null;
let autosaveTimer = null;

export function renderCreatePage() {
    const app = document.getElementById('app');
    const usage = checkDailyLimit();

    // Restore draft from localStorage
    const draft = storage.get('draft_brief', null);

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">✨ Tạo content mới</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            Điền brief → AI viết 3 phiên bản → Review → Copy/Lưu
          </p>
        </div>
        <div class="badge ${usage.remaining < 5 ? 'badge-warning' : 'badge-accent'}">
          ${usage.remaining} bài còn lại hôm nay
        </div>
      </div>

      <!-- Step 1: Guided Brief Form -->
      <div id="step-brief" class="card" style="margin-bottom: var(--space-6);">
        <h3 style="margin-bottom: var(--space-6);">📝 Brief sản phẩm / chủ đề</h3>

        <div class="brief-form flex flex-col gap-6">
          <div class="input-group">
            <label for="brief-type">📋 Loại bài viết</label>
            <select id="brief-type" class="select">
              <option value="product">Giới thiệu sản phẩm</option>
              <option value="promotion">Khuyến mãi / Ưu đãi</option>
              <option value="education">Chia sẻ kiến thức</option>
              <option value="news">Tin tức / Cập nhật</option>
              <option value="testimonial">Feedback khách hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brief-product">📦 Sản phẩm / Chủ đề *</label>
            <input type="text" id="brief-product" class="input" 
                   placeholder="VD: Collagen Nhật Bản, serum vitamin C, dịch vụ thiết kế web..."
                   value="${draft?.product || ''}" required>
          </div>

          <div class="input-group">
            <label for="brief-highlight">⭐ Điểm nổi bật</label>
            <input type="text" id="brief-highlight" class="input" 
                   placeholder="VD: Nhập khẩu chính hãng, top 1 bán chạy, công nghệ độc quyền..."
                   value="${draft?.highlight || ''}">
          </div>

          <div class="input-group">
            <label for="brief-promotion">🎁 Khuyến mãi (nếu có)</label>
            <input type="text" id="brief-promotion" class="input" 
                   placeholder="VD: Giảm 20% combo 3, free ship đơn từ 500K..."
                   value="${draft?.promotion || ''}">
          </div>

          <div class="input-group">
            <label for="brief-cta">👉 Call-to-Action</label>
            <select id="brief-cta" class="select">
              <option value="Mua ngay">Mua ngay</option>
              <option value="Liên hệ tư vấn">Liên hệ tư vấn</option>
              <option value="Inbox để biết thêm chi tiết">Inbox để biết thêm</option>
              <option value="Đăng ký ngay">Đăng ký ngay</option>
              <option value="Xem thêm tại website">Xem thêm tại website</option>
              <option value="">Tự chọn</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brief-notes">📝 Ghi chú thêm (tuỳ chọn)</label>
            <textarea id="brief-notes" class="textarea" rows="3"
                      placeholder="VD: Nhấn mạnh chất lượng Nhật Bản, dùng cho phụ nữ 25-40 tuổi...">${draft?.additionalNotes || ''}</textarea>
          </div>

          <button class="btn btn-primary btn-lg btn-full" id="btn-generate" ${usage.remaining <= 0 ? 'disabled' : ''}>
            ${usage.remaining <= 0 ? '⚠️ Đã hết giới hạn hôm nay' : '✨ AI viết content (≈30s)'}
          </button>
        </div>
      </div>

      <!-- Step 2: AI Loading State -->
      <div id="step-loading" class="hidden">
        <div class="card text-center" style="padding: var(--space-12);">
          <div class="loading-spinner" style="width: 48px; height: 48px; margin: 0 auto var(--space-6);"></div>
          <h3>AI đang viết content...</h3>
          <p class="text-muted" style="margin-top: var(--space-2);">Thường mất 15-30 giây</p>
          <div class="ai-progress" style="margin-top: var(--space-6);">
            <div id="ai-step-1" class="ai-step active">📝 Phân tích brief...</div>
            <div id="ai-step-2" class="ai-step">✍️ Viết Facebook post...</div>
            <div id="ai-step-3" class="ai-step">📰 Viết blog article...</div>
            <div id="ai-step-4" class="ai-step">📱 Viết story caption...</div>
          </div>
        </div>
      </div>

      <!-- Step 3: Preview + Edit (Tab view) -->
      <div id="step-preview" class="hidden">
        <div class="flex justify-between items-center mb-4">
          <h3>🎉 Content đã sẵn sàng!</h3>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="btn-regenerate">🔄 Tạo lại</button>
            <button class="btn btn-primary btn-sm" id="btn-save-content">💾 Lưu</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs mb-4">
          <button class="tab active" data-tab="facebook">📱 Facebook</button>
          <button class="tab" data-tab="blog">📰 Blog</button>
          <button class="tab" data-tab="story">📸 Story</button>
        </div>

        <!-- Tab Content -->
        <div id="tab-facebook" class="tab-content card">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">Facebook Post</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="facebook">📋 Copy</button>
          </div>
          <div id="content-facebook" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-blog" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">Blog Article</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="blog">📋 Copy</button>
          </div>
          <div id="content-blog" class="content-preview" contenteditable="true"></div>
        </div>

        <div id="tab-story" class="tab-content card hidden">
          <div class="flex justify-between items-center mb-4">
            <span class="badge badge-accent">Story Caption</span>
            <button class="btn btn-ghost btn-sm copy-btn" data-target="story">📋 Copy</button>
          </div>
          <div id="content-story" class="content-preview" contenteditable="true"></div>
        </div>
      </div>
    </main>

    <style>
      .content-preview {
        white-space: pre-wrap;
        line-height: 1.8;
        padding: var(--space-4);
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        min-height: 200px;
        outline: none;
        border: 2px solid transparent;
        transition: border-color var(--transition-fast);
      }

      .content-preview:focus {
        border-color: var(--accent);
      }

      .ai-step {
        padding: var(--space-2) 0;
        color: var(--text-muted);
        font-size: var(--font-sm);
        transition: color 0.3s ease;
      }

      .ai-step.active {
        color: var(--accent);
        font-weight: 500;
      }

      .ai-step.done {
        color: var(--success);
      }
    </style>
  `;

    attachSidebarEvents();
    attachCreateEvents();
    startAutosave();
}

function attachCreateEvents() {
    // Generate button
    document.getElementById('btn-generate')?.addEventListener('click', handleGenerate);

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`)?.classList.remove('hidden');
        });
    });

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const target = btn.dataset.target;
            const content = document.getElementById(`content-${target}`)?.textContent;
            if (content) {
                await copyToClipboard(content);
                showToast('Đã copy! Paste lên Facebook nào 📋', 'success');
                btn.textContent = '✅ Đã copy';
                setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
            }
        });
    });

    // Regenerate
    document.getElementById('btn-regenerate')?.addEventListener('click', () => {
        document.getElementById('step-preview').classList.add('hidden');
        document.getElementById('step-brief').classList.remove('hidden');
    });

    // Save
    document.getElementById('btn-save-content')?.addEventListener('click', handleSave);
}

async function handleGenerate() {
    const product = document.getElementById('brief-product')?.value?.trim();
    if (!product) {
        showToast('Vui lòng nhập sản phẩm hoặc chủ đề', 'warning');
        document.getElementById('brief-product')?.focus();
        return;
    }

    const brief = {
        contentType: document.getElementById('brief-type')?.value,
        product,
        highlight: document.getElementById('brief-highlight')?.value?.trim(),
        promotion: document.getElementById('brief-promotion')?.value?.trim(),
        cta: document.getElementById('brief-cta')?.value,
        additionalNotes: document.getElementById('brief-notes')?.value?.trim(),
    };

    // Show loading
    document.getElementById('step-brief').classList.add('hidden');
    document.getElementById('step-loading').classList.remove('hidden');

    // Animate steps
    const steps = ['ai-step-1', 'ai-step-2', 'ai-step-3', 'ai-step-4'];
    let stepIdx = 0;
    const stepTimer = setInterval(() => {
        if (stepIdx > 0) {
            document.getElementById(steps[stepIdx - 1])?.classList.remove('active');
            document.getElementById(steps[stepIdx - 1])?.classList.add('done');
        }
        if (stepIdx < steps.length) {
            document.getElementById(steps[stepIdx])?.classList.add('active');
            stepIdx++;
        }
    }, 3000);

    try {
        const content = await generateContent(brief);
        clearInterval(stepTimer);
        incrementUsage();

        currentContent = { ...content, brief: product, contentType: brief.contentType };

        // Show preview
        document.getElementById('step-loading').classList.add('hidden');
        document.getElementById('step-preview').classList.remove('hidden');

        document.getElementById('content-facebook').textContent = content.facebook;
        document.getElementById('content-blog').textContent = content.blog;
        document.getElementById('content-story').textContent = content.story;

        // Clear draft
        storage.remove('draft_brief');

        showToast('Content đã sẵn sàng! 🎉', 'success');
    } catch (error) {
        clearInterval(stepTimer);
        console.error('Generate error:', error);
        document.getElementById('step-loading').classList.add('hidden');
        document.getElementById('step-brief').classList.remove('hidden');
        showToast(`Lỗi: ${error.message}. Vui lòng thử lại.`, 'error', 5000);
    }
}

async function handleSave() {
    if (!currentContent) return;

    try {
        // Get edited content from contenteditable
        const facebook = document.getElementById('content-facebook')?.textContent || '';
        const blog = document.getElementById('content-blog')?.textContent || '';
        const story = document.getElementById('content-story')?.textContent || '';

        await saveContent({
            ...currentContent,
            facebook,
            blog,
            story,
            status: 'draft',
        });

        showToast('Đã lưu vào thư viện! 📚', 'success');
    } catch (error) {
        console.error('Save error:', error);
        showToast('Lỗi lưu bài. Vui lòng thử lại.', 'error');
    }
}

/** Autosave brief to localStorage every 30s */
function startAutosave() {
    clearInterval(autosaveTimer);
    autosaveTimer = setInterval(() => {
        const product = document.getElementById('brief-product')?.value;
        if (product) {
            storage.set('draft_brief', {
                product,
                highlight: document.getElementById('brief-highlight')?.value || '',
                promotion: document.getElementById('brief-promotion')?.value || '',
                additionalNotes: document.getElementById('brief-notes')?.value || '',
            });
        }
    }, 30000);
}
