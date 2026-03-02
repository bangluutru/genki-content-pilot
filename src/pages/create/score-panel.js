/**
 * Content Score Panel
 * Visual score card with Hook/Proof/CTA progress bars + AI auto-improve
 */
import { icon } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';
import { showToast } from '../../components/toast.js';
import { analyzeConversionProbability } from '../../services/predictive.js';
import { improveContentArea } from '../../services/gemini.js';

/**
 * Render the content score panel
 * @param {string} content - The generated content text
 */
export function renderScorePanel(content) {
    const panel = document.getElementById('score-panel');
    if (!panel || !content) return;

    const result = analyzeConversionProbability(content);
    const { score, breakdown, suggestions } = result;

    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const scoreLabel = score >= 70 ? t('score.excellent') : score >= 40 ? t('score.average') : t('score.needsWork');

    panel.classList.remove('hidden');
    panel.innerHTML = `
    <div class="card" style="padding: var(--space-5); margin-top: var(--space-4);">
      <h3 style="margin-bottom: var(--space-4);">${icon('chart', 18)} ${t('score.title')}</h3>

      <!-- Main Score Ring -->
      <div style="display: flex; align-items: center; gap: var(--space-5); margin-bottom: var(--space-4);">
        <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0;">
          <svg viewBox="0 0 36 36" style="width: 80px; height: 80px; transform: rotate(-90deg);">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="var(--bg-tertiary)" stroke-width="3"/>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="${scoreColor}" stroke-width="3"
              stroke-dasharray="${score}, 100" stroke-linecap="round"
              style="transition: stroke-dasharray 1s ease;"/>
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="font-size: var(--font-xl); font-weight: 800; color: ${scoreColor};">${score}</div>
          </div>
        </div>
        <div>
          <div style="font-weight: 700; color: ${scoreColor};">${scoreLabel}</div>
          <div class="text-sm text-muted">${t('score.predictiveScore')}</div>
        </div>
      </div>

      <!-- Breakdown Bars -->
      <div style="margin-bottom: var(--space-4);">
        ${renderProgressBar('🪝 Hook', breakdown.hook)}
        ${renderProgressBar('📊 Proof', breakdown.proof)}
        ${renderProgressBar('🎯 CTA', breakdown.cta)}
      </div>

      <!-- Suggestions -->
      ${suggestions.length > 0 ? `
        <div style="border-top: 1px solid var(--border); padding-top: var(--space-3);">
          <div style="font-size: var(--font-sm); font-weight: 600; margin-bottom: var(--space-2);">${icon('tip', 14)} ${t('score.suggestions')}</div>
          ${suggestions.map((s, i) => `
            <div style="display: flex; align-items: flex-start; gap: var(--space-2); padding: var(--space-2) 0; font-size: var(--font-sm);">
              <span style="color: var(--warning);">⚠️</span>
              <span style="flex: 1;">${s}</span>
              <button class="btn btn-ghost btn-xs improve-btn" data-area="${i === 0 ? 'hook' : i === 1 ? 'proof' : 'cta'}" data-suggestion="${encodeURIComponent(s)}">
                ${icon('sparkle', 12)} ${t('score.improve')}
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

    // Attach improve button handlers
    panel.querySelectorAll('.improve-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const area = btn.dataset.area;
            const suggestion = decodeURIComponent(btn.dataset.suggestion);
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-small"></span>`;

            try {
                const improved = await improveContentArea(content, area, suggestion);
                // Update the content preview
                const previewEl = document.querySelector('.step-preview .content-text');
                if (previewEl) previewEl.textContent = improved;
                showToast(t('score.improved'), 'success');
                // Re-render score panel with improved content
                renderScorePanel(improved);
            } catch (err) {
                showToast(t('errors.generic') + ': ' + err.message, 'error');
                btn.disabled = false;
                btn.innerHTML = `${icon('sparkle', 12)} ${t('score.improve')}`;
            }
        });
    });
}

function renderProgressBar(label, pct) {
    const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    return `
    <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
      <span style="font-size: var(--font-sm); width: 70px;">${label}</span>
      <div style="flex: 1; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
        <div style="width: ${pct}%; height: 100%; background: ${color}; border-radius: 4px; transition: width 0.6s ease;"></div>
      </div>
      <span style="font-size: var(--font-xs); width: 35px; text-align: right; font-weight: 600; color: ${color};">${pct}%</span>
    </div>
  `;
}
