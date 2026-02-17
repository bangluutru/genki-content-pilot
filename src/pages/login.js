/**
 * Login Page — Google Sign-in with premium design
 */
import { signInWithGoogle } from '../services/auth.js';
import { store } from '../utils/state.js';

export function renderLoginPage() {
    const app = document.getElementById('app');
    const isLoading = store.get('isLoading');

    app.innerHTML = `
    <div class="login-page">
      <div class="login-bg"></div>
      <div class="login-container">
        <div class="login-card card">
          <div class="login-header text-center">
            <div class="login-logo">
              <span style="font-size: 3rem;">✈️</span>
            </div>
            <h1 style="font-size: var(--font-3xl); margin-top: var(--space-4);">
              <span class="logo-text">ContentPilot</span>
            </h1>
            <p style="margin-top: var(--space-2); color: var(--text-secondary);">
              AI tạo content cho Facebook & Website trong 5 phút
            </p>
          </div>

          <div class="login-features" style="margin: var(--space-8) 0;">
            <div class="feature-item">
              <span class="feature-icon">✨</span>
              <div>
                <strong>AI viết bài tiếng Việt</strong>
                <span class="text-muted text-sm"> — Brief ngắn, 3 phiên bản content</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎨</span>
              <div>
                <strong>Brand Voice</strong>
                <span class="text-muted text-sm"> — AI nhớ tone thương hiệu</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📋</span>
              <div>
                <strong>Copy & Publish</strong>
                <span class="text-muted text-sm"> — 1-click copy cho Facebook</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="btn-google-login" ${isLoading ? 'disabled' : ''}>
            ${isLoading
            ? '<span class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></span> Đang đăng nhập...'
            : '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg> Đăng nhập bằng Google'
        }
          </button>

          <p class="text-center text-sm text-muted" style="margin-top: var(--space-4);">
            Miễn phí cho team nhỏ • Bảo mật bởi Firebase
          </p>
        </div>
      </div>
    </div>

    <style>
      .login-page {
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }

      .login-bg {
        position: absolute;
        inset: 0;
        background: 
          radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(34, 197, 94, 0.08) 0%, transparent 50%);
      }

      .login-container {
        width: 100%;
        max-width: 440px;
        padding: var(--space-4);
        position: relative;
        z-index: 1;
      }

      .login-card {
        padding: var(--space-10);
      }

      .login-logo {
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) 0;
      }

      .feature-icon {
        font-size: var(--font-xl);
        width: 32px;
        text-align: center;
      }

      #btn-google-login svg {
        flex-shrink: 0;
      }
    </style>
  `;

    // Attach event
    document.getElementById('btn-google-login')?.addEventListener('click', signInWithGoogle);
}
