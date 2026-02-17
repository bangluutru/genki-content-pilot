/**
 * Templates Page — Save and reuse brief templates
 */
import { store } from '../utils/state.js';
import { loadTemplates, saveTemplate, deleteTemplate } from '../services/firestore.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';

const DEFAULT_TEMPLATES = [
    { id: '_default_1', name: '📦 Giới thiệu sản phẩm', desc: 'Bài review sản phẩm mới', isDefault: true, fields: { contentType: 'product', product: '', highlight: '', promotion: '', cta: 'Mua ngay', additionalNotes: 'Nhấn mạnh USP, có CTA rõ ràng' } },
    { id: '_default_2', name: '🎁 Flash Sale', desc: 'Bài khuyến mãi giới hạn thời gian', isDefault: true, fields: { contentType: 'promotion', product: '', highlight: '', promotion: '', cta: 'Đặt hàng ngay', additionalNotes: 'Urgency: có deadline, số lượng giới hạn' } },
    { id: '_default_3', name: '💡 Chia sẻ mẹo', desc: 'Tips & tricks hữu ích', isDefault: true, fields: { contentType: 'education', product: '', highlight: '', promotion: '', cta: 'Lưu bài viết', additionalNotes: 'Tone thân thiện, dạng listicle 3-5 tips' } },
    { id: '_default_4', name: '🎬 Behind the Scenes', desc: 'Hậu trường sản xuất / team', isDefault: true, fields: { contentType: 'other', product: '', highlight: '', promotion: '', cta: 'Theo dõi page', additionalNotes: 'Tone gần gũi, authentic, storytelling' } },
    { id: '_default_5', name: '⭐ Feedback khách hàng', desc: 'Đăng lại review của khách', isDefault: true, fields: { contentType: 'testimonial', product: '', highlight: '', promotion: '', cta: 'Inbox để tư vấn', additionalNotes: 'Trích dẫn feedback thật, thêm cảm xúc' } },
    { id: '_default_6', name: '📢 Tin tức cập nhật', desc: 'Thông báo, ra mắt, event', isDefault: true, fields: { contentType: 'news', product: '', highlight: '', promotion: '', cta: 'Đăng ký ngay', additionalNotes: 'Tone chuyên nghiệp, thông tin chính xác' } },
];

export async function renderTemplatesPage() {
    const app = document.getElementById('app');

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">📋 Templates</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">Templates brief để tái sử dụng nhanh</p>
        </div>
        <button class="btn btn-primary" id="btn-new-template">+ Tạo template</button>
      </div>

      <!-- Default Templates -->
      <h3 style="margin-bottom: var(--space-4);">🎯 Templates mặc định</h3>
      <div class="templates-grid" id="default-templates">
        ${DEFAULT_TEMPLATES.map(t => renderTemplateCard(t)).join('')}
      </div>

      <!-- User Templates -->
      <h3 style="margin-top: var(--space-8); margin-bottom: var(--space-4);">💾 Templates của bạn</h3>
      <div class="templates-grid" id="user-templates">
        <div class="skeleton" style="height: 120px;"></div>
      </div>

      <!-- Create Template Modal -->
      <div class="modal-overlay hidden" id="template-modal">
        <div class="card" style="max-width: 520px; width: 90%; padding: var(--space-6);">
          <h3 style="margin-bottom: var(--space-4);">📋 Tạo template mới</h3>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">Tên template *</label>
            <input type="text" class="form-input" id="tmpl-name" placeholder="VD: Bài review TPCN">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">Mô tả</label>
            <input type="text" class="form-input" id="tmpl-desc" placeholder="Mô tả ngắn về template">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">Loại bài viết</label>
            <select class="form-input" id="tmpl-type">
              <option value="product">Giới thiệu sản phẩm</option>
              <option value="promotion">Khuyến mãi / Ưu đãi</option>
              <option value="education">Chia sẻ kiến thức</option>
              <option value="news">Tin tức / Cập nhật</option>
              <option value="testimonial">Feedback khách hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-3);">
            <label class="form-label">CTA mặc định</label>
            <input type="text" class="form-input" id="tmpl-cta" placeholder="VD: Mua ngay, Inbox để tư vấn">
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">Ghi chú cho AI</label>
            <textarea class="form-input" id="tmpl-notes" rows="3" placeholder="Hướng dẫn riêng cho AI khi dùng template này"></textarea>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-primary" id="btn-save-template" style="flex: 1;">💾 Lưu template</button>
            <button class="btn btn-ghost" id="btn-close-tmpl-modal">Huỷ</button>
          </div>
        </div>
      </div>
    </main>
  `;

    attachSidebarEvents();

    // Load user templates
    try {
        const templates = await loadTemplates();
        renderUserTemplates(templates);
    } catch {
        renderUserTemplates([]);
    }

    // Events
    document.getElementById('btn-new-template')?.addEventListener('click', () => {
        document.getElementById('template-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-tmpl-modal')?.addEventListener('click', () => {
        document.getElementById('template-modal')?.classList.add('hidden');
    });

    document.getElementById('template-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'template-modal') {
            document.getElementById('template-modal')?.classList.add('hidden');
        }
    });

    document.getElementById('btn-save-template')?.addEventListener('click', handleSaveTemplate);

    // Use template buttons (defaults)
    document.querySelectorAll('.use-template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const template = DEFAULT_TEMPLATES.find(t => t.id === id);
            if (template) useTemplate(template);
        });
    });
}

function renderTemplateCard(t) {
    return `
    <div class="template-card card">
      <div class="flex justify-between items-center" style="margin-bottom: var(--space-2);">
        <strong style="font-size: var(--font-base);">${t.name}</strong>
        ${t.isDefault ? '<span class="badge badge-accent" style="font-size: 10px;">Mặc định</span>' : `<button class="btn btn-ghost btn-sm delete-tmpl-btn" data-id="${t.id}" title="Xoá">🗑️</button>`}
      </div>
      <p class="text-sm text-muted" style="margin-bottom: var(--space-3);">${t.desc || ''}</p>
      <button class="btn btn-primary btn-sm use-template-btn" data-id="${t.id}" style="width: 100%;">
        ✨ Dùng template
      </button>
    </div>
  `;
}

function renderUserTemplates(templates) {
    const container = document.getElementById('user-templates');
    if (!container) return;

    if (!templates.length) {
        container.innerHTML = `
      <div class="card-flat text-center" style="padding: var(--space-8); grid-column: 1 / -1;">
        <span style="font-size: 2rem;">📋</span>
        <p class="text-sm text-muted" style="margin-top: var(--space-2);">Chưa có template nào. Tạo template để dùng lại brief nhanh hơn!</p>
      </div>
    `;
        return;
    }

    container.innerHTML = templates.map(t => renderTemplateCard(t)).join('');

    // Attach use & delete events
    container.querySelectorAll('.use-template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tmpl = templates.find(t => t.id === btn.dataset.id);
            if (tmpl) useTemplate(tmpl);
        });
    });

    container.querySelectorAll('.delete-tmpl-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Xoá template này?')) return;
            try {
                await deleteTemplate(btn.dataset.id);
                showToast('Đã xoá template', 'success');
                const updated = await loadTemplates();
                renderUserTemplates(updated);
            } catch (err) {
                showToast('Lỗi: ' + err.message, 'error');
            }
        });
    });
}

async function handleSaveTemplate() {
    const name = document.getElementById('tmpl-name')?.value?.trim();
    if (!name) {
        showToast('Vui lòng nhập tên template', 'error');
        return;
    }

    const template = {
        name,
        desc: document.getElementById('tmpl-desc')?.value?.trim() || '',
        fields: {
            contentType: document.getElementById('tmpl-type')?.value || 'product',
            cta: document.getElementById('tmpl-cta')?.value?.trim() || '',
            additionalNotes: document.getElementById('tmpl-notes')?.value?.trim() || '',
            product: '',
            highlight: '',
            promotion: '',
        },
    };

    try {
        await saveTemplate(template);
        showToast('Đã lưu template! 📋', 'success');
        document.getElementById('template-modal')?.classList.add('hidden');
        const updated = await loadTemplates();
        renderUserTemplates(updated);
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
}

function useTemplate(template) {
    // Store template in sessionStorage and navigate to create page
    sessionStorage.setItem('cp_active_template', JSON.stringify(template.fields));
    sessionStorage.setItem('cp_template_name', template.name);
    window.location.hash = '#/create';
    showToast(`Đang dùng template: ${template.name}`, 'success');
}
