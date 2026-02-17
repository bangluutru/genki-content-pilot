/**
 * Conversion Dashboard Page — Track ROI and conversion from content
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { loadConversions } from '../services/firestore.js';

export async function renderConversionDashboard() {
    const app = document.getElementById('app');

    // Load conversion data (for now, mock data)
    const conversions = store.get('conversions') || await loadConversions() || [];

    // Calculate totals
    const totalClicks = conversions.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const totalOrders = conversions.reduce((sum, c) => sum + (c.orders || 0), 0);
    const totalRevenue = conversions.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const avgConversionRate = conversions.length > 0
        ? (conversions.reduce((sum, c) => sum + ((c.orders || 0) / (c.clicks || 1) * 100), 0) / conversions.length).toFixed(2)
        : 0;

    app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="mb-6">
        <h1 style="font-size: var(--font-2xl);">📈 Conversion Tracking</h1>
        <p class="text-muted text-sm" style="margin-top: var(--space-1);">
          Theo dõi hiệu quả thực tế: Clicks → Orders → Revenue
        </p>
      </div>

      <!-- Stats Overview -->
      <div class="stats-grid" style="margin-bottom: var(--space-6);">
        <div class="stat-card">
          <span class="stat-icon">👆</span>
          <div>
            <div class="stat-value">${totalClicks.toLocaleString()}</div>
            <div class="stat-label">Total Clicks</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🛒</span>
          <div>
            <div class="stat-value">${totalOrders.toLocaleString()}</div>
            <div class="stat-label">Đơn hàng</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💰</span>
          <div>
            <div class="stat-value">${(totalRevenue / 1_000_000).toFixed(1)}M</div>
            <div class="stat-label">Doanh thu</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📊</span>
          <div>
            <div class="stat-value">${avgConversionRate}%</div>
            <div class="stat-label">Conversion Rate</div>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="card" style="margin-bottom: var(--space-6);">
        <div class="flex gap-4 items-center">
          <div style="flex: 1;">
            <input type="date" id="date-from" class="form-input" placeholder="Từ ngày">
          </div>
          <div style="flex: 1;">
            <input type="date" id="date-to" class="form-input" placeholder="Đến ngày">
          </div>
          <div style="flex: 1;">
            <select id="filter-platform" class="select">
              <option value="">Tất cả platform</option>
              <option value="facebook">Facebook</option>
              <option value="blog">Blog</option>
            </select>
          </div>
          <button class="btn btn-primary" id="btn-apply-filter">Lọc</button>
        </div>
      </div>

      <!-- Conversion Table -->
      <div class="card">
        <h3 style="margin-bottom: var(--space-4);">Chi tiết Conversion theo bài</h3>
        
        ${conversions.length === 0 ? `
          <div class="empty-state" style="text-align: center; padding: var(--space-8);">
            <p style="font-size: 3rem; margin-bottom: var(--space-4);">📊</p>
            <h3>Chưa có dữ liệu conversion</h3>
            <p class="text-muted" style="margin-top: var(--space-2);">
              Tích hợp với Haravan/Sapo trong Settings để tracking tự động
            </p>
            <a href="#/settings" class="btn btn-primary" style="margin-top: var(--space-4);">
              Cài đặt tích hợp
            </a>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="conversion-table">
              <thead>
                <tr>
                  <th>Bài viết</th>
                  <th>Platform</th>
                  <th>Ngày đăng</th>
                  <th>Clicks</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>CR %</th>
                  <th>AOV</th>
                </tr>
              </thead>
              <tbody>
                ${conversions.map(c => {
        const cr = ((c.orders || 0) / (c.clicks || 1) * 100).toFixed(1);
        const aov = c.orders > 0 ? (c.revenue / c.orders / 1000).toFixed(0) + 'K' : '-';
        return `
                    <tr>
                      <td><strong>${c.title || c.contentId}</strong></td>
                      <td><span class="badge badge-accent">${c.platform || 'facebook'}</span></td>
                      <td>${new Date(c.date).toLocaleDateString('vi-VN')}</td>
                      <td>${(c.clicks || 0).toLocaleString()}</td>
                      <td>${(c.orders || 0).toLocaleString()}</td>
                      <td>${((c.revenue || 0) / 1000).toFixed(0)}K</td>
                      <td><span class="badge ${cr > 3 ? 'badge-success' : cr > 1 ? 'badge-warning' : 'badge-danger'}">${cr}%</span></td>
                      <td>${aov}</td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- How to Use Guide -->
      <div class="card-flat" style="margin-top: var(--space-6); padding: var(--space-6); background: var(--bg-secondary); border-radius: var(--radius-lg);">
        <h4 style="margin-bottom: var(--space-3);">💡 Cách sử dụng Conversion Tracking</h4>
        <ol class="text-sm text-muted" style="padding-left: var(--space-4); line-height: 1.8;">
          <li><strong>Thêm link sản phẩm:</strong> Khi tạo content, thêm link sản phẩm → Hệ thống tự động append UTM</li>
          <li><strong>Tích hợp E-commerce:</strong> Kết nối Haravan/Sapo API trong Settings</li>
          <li><strong>Theo dõi tự động:</strong> Mỗi khi có đơn hàng từ UTM → Ghi nhận vào bảng</li>
          <li><strong>Phân tích ROI:</strong> So sánh chi phí quảng cáo vs doanh thu từ từng bài</li>
        </ol>
      </div>
    </main>
  `;

    attachSidebarEvents();
    attachConversionEvents();
}

function attachConversionEvents() {
    document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
        const fromDate = document.getElementById('date-from')?.value;
        const toDate = document.getElementById('date-to')?.value;
        const platform = document.getElementById('filter-platform')?.value;

        showToast(`Lọc: ${fromDate || 'Tất cả'} → ${toDate || 'Hiện tại'}, Platform: ${platform || 'Tất cả'}`, 'info');
        // TODO: Implement actual filtering logic
    });
}
