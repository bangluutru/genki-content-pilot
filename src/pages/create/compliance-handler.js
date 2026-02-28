/**
 * Compliance Handlers — Check content compliance and manage disclaimers
 * Extracted from create.js for maintainability
 */
import { showToast } from '../../components/toast.js';
import { checkCompliance, addDisclaimer } from '../../services/compliance.js';
import { icon } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';

/**
 * Run compliance check and show warnings if violations found
 * @param {string} content - Content text to check
 */
export function runComplianceCheck(content) {
  const result = checkCompliance(content);
  const panel = document.getElementById('compliance-panel');
  const violationsEl = document.getElementById('compliance-violations');

  if (!result.isCompliant) {
    // Show violations
    const violationsHTML = result.violations.map(v => `
      <div class="compliance-violation-item" style="margin-bottom: var(--space-3); padding: var(--space-3); background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md);">
        <div class="flex items-start gap-3">
          <span style="display: inline-flex;">${icon('warning', 16)}</span>
          <div style="flex: 1;">
            <p style="margin: 0; color: var(--danger); font-weight: 600;">"${v.word}"</p>
            <p style="margin: var(--space-1) 0 0; font-size: var(--font-sm); color: var(--text-muted);">${v.message}</p>
            ${v.suggestion ? `<p style="margin: var(--space-1) 0 0; font-size: var(--font-sm);"><strong>${t('create.suggestion')}</strong> ${v.suggestion}</p>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    violationsEl.innerHTML = `
      <div style="padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--space-4);">
        <p style="margin: 0;"><strong>${t('create.violationsFound', { count: result.violations.length })}</strong></p>
        <p style="margin: var(--space-1) 0 0; font-size: var(--font-sm); color: var(--text-muted);">
          ${t('create.complianceScore')} <span class="badge badge-danger">${result.score}/100</span>
        </p>
      </div>
      ${violationsHTML}
    `;

    panel.classList.remove('hidden');

    // Setup event handlers (remove old listeners by cloning)
    const closeBtn = document.getElementById('btn-close-compliance');
    const ignoreBtn = document.getElementById('btn-ignore-compliance');
    const disclaimerBtn = document.getElementById('btn-add-disclaimer');

    closeBtn?.replaceWith(closeBtn.cloneNode(true));
    ignoreBtn?.replaceWith(ignoreBtn.cloneNode(true));
    disclaimerBtn?.replaceWith(disclaimerBtn.cloneNode(true));

    document.getElementById('btn-close-compliance')?.addEventListener('click', () => {
      panel.classList.add('hidden');
    });

    document.getElementById('btn-ignore-compliance')?.addEventListener('click', () => {
      panel.classList.add('hidden');
      showToast(t('common.warning') + ': ' + t('create.ignoreCompliance'), 'warning');
    });

    document.getElementById('btn-add-disclaimer')?.addEventListener('click', () => {
      addDisclaimerToContent();
    });
  } else if (result.warnings.length > 0) {
    // Just warnings, show toast
    showToast(`${icon('warning', 14)} ${t('create.violationsFound', { count: result.warnings.length })}`, 'warning');
  }
}

/**
 * Add disclaimer to all content variants
 */
/** @deprecated Currently unused — reserved for future compliance workflow */
export function addDisclaimerToContent() {
  const fbContent = document.getElementById('content-facebook');
  const blogContent = document.getElementById('content-blog');
  const storyContent = document.getElementById('content-story');

  if (fbContent) {
    fbContent.textContent = addDisclaimer(fbContent.textContent, 'tpcn');
  }
  if (blogContent) {
    blogContent.textContent = addDisclaimer(blogContent.textContent, 'tpcn');
  }
  if (storyContent) {
    storyContent.textContent = addDisclaimer(storyContent.textContent, 'tpcn');
  }

  document.getElementById('compliance-panel')?.classList.add('hidden');
  showToast(t('create.addDisclaimer') + '!', 'success');
}
