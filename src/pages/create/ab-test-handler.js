/**
 * A/B Content Testing Handler
 * Generates a Version B alternative and shows side-by-side comparison with predictive scores
 */
import { showToast } from '../../components/toast.js';
import { icon } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';
import { generateVariantB } from '../../services/gemini.js';
import { analyzeConversionProbability } from '../../services/predictive.js';

/**
 * Show the A/B test panel with a side-by-side comparison
 * @param {string} originalContent - The original AI-generated content
 * @param {Object} brief - The original brief used for generation
 */
export async function showABTestPanel(originalContent, brief) {
    const panel = document.getElementById('ab-test-panel');
    if (!panel) return;

    panel.classList.remove('hidden');
    panel.innerHTML = `
    <div class="card" style="padding: var(--space-5); margin-top: var(--space-4);">
      <h3 style="margin-bottom: var(--space-4);">${icon('sparkle', 18)} ${t('abtest.title')}</h3>
      <div style="text-align: center; padding: var(--space-6); color: var(--text-muted);">
        <div class="spinner"></div>
        <p style="margin-top: var(--space-3);">${t('abtest.generating')}</p>
      </div>
    </div>
  `;

    try {
        const variantB = await generateVariantB(originalContent, brief);
        const scoreA = analyzeConversionProbability(originalContent);
        const scoreB = analyzeConversionProbability(variantB);

        panel.innerHTML = `
      <div class="card" style="padding: var(--space-5); margin-top: var(--space-4);">
        <h3 style="margin-bottom: var(--space-4);">${icon('sparkle', 18)} ${t('abtest.title')}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          ${renderVersion('A', originalContent, scoreA, true)}
          ${renderVersion('B', variantB, scoreB, false)}
        </div>
      </div>
    `;

        // Attach select handlers
        panel.querySelectorAll('.ab-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const version = btn.dataset.version;
                const selectedContent = version === 'A' ? originalContent : variantB;
                // Update the current content preview
                const previewEl = document.querySelector('.step-preview .content-text');
                if (previewEl) previewEl.textContent = selectedContent;
                showToast(`${t('abtest.selected')} ${version}`, 'success');
                panel.classList.add('hidden');
            });
        });
    } catch (err) {
        panel.innerHTML = `
      <div class="card" style="padding: var(--space-5); margin-top: var(--space-4);">
        <p class="text-muted">${t('abtest.error')}: ${err.message}</p>
      </div>
    `;
    }
}

/**
 * Render a version column with score visualization
 */
function renderVersion(label, content, score, isOriginal) {
    const scoreColor = score.score >= 70 ? 'var(--success, #10b981)'
        : score.score >= 40 ? 'var(--warning, #f59e0b)'
            : 'var(--danger, #ef4444)';

    const truncated = content.length > 300 ? content.slice(0, 300) + '...' : content;

    return `
    <div style="border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
        <span class="badge ${isOriginal ? 'badge-accent' : 'badge-success'}" style="font-size: var(--font-sm);">
          ${t('abtest.version')} ${label} ${isOriginal ? '(' + t('abtest.original') + ')' : '(' + t('abtest.alternative') + ')'}
        </span>
        <span style="font-size: var(--font-xl); font-weight: 800; color: ${scoreColor};">${score.score}</span>
      </div>

      <!-- Score Bars -->
      <div style="margin-bottom: var(--space-3);">
        ${renderBar('Hook', score.breakdown.hook)}
        ${renderBar('Proof', score.breakdown.proof)}
        ${renderBar('CTA', score.breakdown.cta)}
      </div>

      <!-- Content Preview -->
      <div style="font-size: var(--font-sm); color: var(--text-secondary); max-height: 200px; overflow-y: auto; margin-bottom: var(--space-3); white-space: pre-wrap;">
        ${truncated}
      </div>

      <button class="btn ${isOriginal ? 'btn-secondary' : 'btn-primary'} btn-sm ab-select-btn" data-version="${label}" style="width: 100%;">
        ${icon('check', 14)} ${t('abtest.select')} ${label}
      </button>
    </div>
  `;
}

function renderBar(label, pct) {
    const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    return `
    <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: 4px;">
      <span style="font-size: 11px; width: 40px; color: var(--text-muted);">${label}</span>
      <div style="flex: 1; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
        <div style="width: ${pct}%; height: 100%; background: ${color}; border-radius: 3px; transition: width 0.5s ease;"></div>
      </div>
      <span style="font-size: 11px; width: 30px; text-align: right; color: var(--text-muted);">${pct}%</span>
    </div>
  `;
}
