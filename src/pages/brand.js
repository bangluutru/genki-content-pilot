/**
 * Brand Profile Page — Setup brand voice, tone, products + onboarding wizard
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveBrand, loadBrand } from '../services/firestore.js';

export async function renderBrandPage() {
    const app = document.getElementById('app');
    const brand = store.get('brand') || await loadBrand() || {};
    const isNew = !brand.name;

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl);">🎨 Brand Profile</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            AI sẽ tham chiếu thông tin này mỗi khi viết bài
          </p>
        </div>
      </div>

      ${isNew ? renderOnboardingBanner() : ''}

      <form id="brand-form" class="card">
        <div class="flex flex-col gap-6">
          <!-- Basic Info -->
          <h4>📌 Thông tin cơ bản</h4>

          <div class="input-group">
            <label for="brand-name">Tên thương hiệu *</label>
            <input type="text" id="brand-name" class="input" 
                   placeholder="VD: Shop Mỹ Phẩm Hà, Sakura Health..."
                   value="${brand.name || ''}" required>
          </div>

          <div class="input-group">
            <label for="brand-industry">Ngành nghề</label>
            <select id="brand-industry" class="select">
              <option value="">-- Chọn ngành --</option>
              <option value="tpcn" ${brand.industry === 'tpcn' ? 'selected' : ''}>Thực phẩm chức năng</option>
              <option value="cosmetics" ${brand.industry === 'cosmetics' ? 'selected' : ''}>Mỹ phẩm / Skincare</option>
              <option value="fashion" ${brand.industry === 'fashion' ? 'selected' : ''}>Thời trang</option>
              <option value="food" ${brand.industry === 'food' ? 'selected' : ''}>F&B / Thực phẩm</option>
              <option value="tech" ${brand.industry === 'tech' ? 'selected' : ''}>Công nghệ / SaaS</option>
              <option value="education" ${brand.industry === 'education' ? 'selected' : ''}>Giáo dục</option>
              <option value="service" ${brand.industry === 'service' ? 'selected' : ''}>Dịch vụ</option>
              <option value="other" ${brand.industry === 'other' ? 'selected' : ''}>Khác</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brand-target">Đối tượng khách hàng</label>
            <input type="text" id="brand-target" class="input"
                   placeholder="VD: Phụ nữ 25-45 tuổi, quan tâm đến sức khoẻ..."
                   value="${brand.targetAudience || ''}">
          </div>

          <!-- Tone & Style -->
          <h4 style="margin-top: var(--space-4);">🗣️ Tone & Style</h4>

          <div class="input-group">
            <label for="brand-tone">Tone of voice</label>
            <select id="brand-tone" class="select">
              <option value="friendly" ${brand.tone === 'friendly' ? 'selected' : ''}>Thân thiện, gần gũi</option>
              <option value="professional" ${brand.tone === 'professional' ? 'selected' : ''}>Chuyên nghiệp, uy tín</option>
              <option value="playful" ${brand.tone === 'playful' ? 'selected' : ''}>Vui vẻ, năng động</option>
              <option value="luxury" ${brand.tone === 'luxury' ? 'selected' : ''}>Sang trọng, cao cấp</option>
              <option value="educational" ${brand.tone === 'educational' ? 'selected' : ''}>Giáo dục, chia sẻ kiến thức</option>
            </select>
          </div>

          <div class="input-group">
            <label for="brand-products">Sản phẩm / Dịch vụ chính</label>
            <textarea id="brand-products" class="textarea" rows="3"
                      placeholder="Liệt kê sản phẩm chính, mỗi dòng 1 sản phẩm...">${brand.products || ''}</textarea>
          </div>

          <div class="input-group">
            <label for="brand-hashtags">Hashtag mặc định</label>
            <input type="text" id="brand-hashtags" class="input"
                   placeholder="VD: #SakuraHealth #CollagenNhat #LamDepTuNhien"
                   value="${brand.defaultHashtags || ''}">
          </div>

          <!-- Legal -->
          <h4 style="margin-top: var(--space-4);">⚖️ Pháp lý & Disclaimer</h4>

          <div class="input-group">
            <label for="brand-disclaimer">Disclaimer (tự động thêm vào cuối bài)</label>
            <textarea id="brand-disclaimer" class="textarea" rows="2"
                      placeholder="VD: Sản phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh.">${brand.disclaimer || ''}</textarea>
          </div>

          <div id="tpcn-warning" class="${brand.industry === 'tpcn' ? '' : 'hidden'}" 
               style="padding: var(--space-4); background: var(--warning-light); border-radius: var(--radius-md); border-left: 3px solid var(--warning);">
            <strong>⚠️ Ngành TPCN:</strong> AI sẽ tự động tránh dùng từ "chữa bệnh", "điều trị" và kèm disclaimer theo Nghị định 15/2018/NĐ-CP.
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-full" style="margin-top: var(--space-4);">
            💾 Lưu Brand Profile
          </button>
        </div>
      </form>
    </main>
  `;

    attachSidebarEvents();

    // Show TPCN warning when industry changes
    document.getElementById('brand-industry')?.addEventListener('change', (e) => {
        const warning = document.getElementById('tpcn-warning');
        const disclaimer = document.getElementById('brand-disclaimer');
        if (e.target.value === 'tpcn') {
            warning?.classList.remove('hidden');
            if (!disclaimer.value) {
                disclaimer.value = 'Sản phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh.';
            }
        } else {
            warning?.classList.add('hidden');
        }
    });

    // Save form
    document.getElementById('brand-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('brand-name')?.value?.trim();
        if (!name) {
            showToast('Vui lòng nhập tên thương hiệu', 'warning');
            return;
        }

        try {
            await saveBrand({
                name,
                industry: document.getElementById('brand-industry')?.value,
                targetAudience: document.getElementById('brand-target')?.value?.trim(),
                tone: document.getElementById('brand-tone')?.value,
                products: document.getElementById('brand-products')?.value?.trim(),
                defaultHashtags: document.getElementById('brand-hashtags')?.value?.trim(),
                disclaimer: document.getElementById('brand-disclaimer')?.value?.trim(),
            });

            showToast('Brand Profile đã lưu! AI sẽ dùng thông tin này khi viết bài ✅', 'success');
        } catch (error) {
            console.error('Save brand error:', error);
            showToast('Lỗi lưu brand. Vui lòng thử lại.', 'error');
        }
    });
}

function renderOnboardingBanner() {
    return `
    <div class="card" style="margin-bottom: var(--space-6); border-left: 3px solid var(--accent); background: var(--accent-light);">
      <div class="flex items-center gap-4">
        <span style="font-size: 2rem;">👋</span>
        <div>
          <strong>Chào mừng bạn đến ContentPilot!</strong>
          <p class="text-sm text-muted" style="margin-top: var(--space-1);">
            Hãy điền thông tin brand để AI viết content chuẩn tone thương hiệu của bạn.
            Chỉ mất 2 phút!
          </p>
        </div>
      </div>
    </div>
  `;
}
