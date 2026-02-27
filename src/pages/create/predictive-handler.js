/**
 * Predictive Handler
 * Manages the UI for the Conversion Probability Score
 */
import { analyzeConversionProbability } from '../../services/predictive.js';
import { icon } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';

export function runPredictionCheck(contentHtml) {
    if (!contentHtml) return;

    // Convert HTML to plain text for analysis
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    const result = analyzeConversionProbability(plainText);
    renderPredictionPanel(result);
}

function renderPredictionPanel(result) {
    let panel = document.getElementById('prediction-panel');

    // Inject panel if it doesn't exist
    if (!panel) {
        const publishPanel = document.getElementById('publish-panel');
        if (!publishPanel) return;

        panel = document.createElement('div');
        panel.id = 'prediction-panel';
        panel.className = 'card';
        panel.style.marginTop = 'var(--space-6)';
        panel.style.borderLeft = '4px solid var(--primary)';

        publishPanel.parentNode.insertBefore(panel, publishPanel);
    }

    panel.classList.remove('hidden');

    let scoreColor = 'var(--danger)';
    if (result.score >= 80) scoreColor = 'var(--success)';
    else if (result.score >= 50) scoreColor = 'var(--warning)';

    const suggestionsHtml = result.suggestions.length > 0
        ? `<div style="margin-top: var(--space-4);">
             <strong>${icon('idea', 16)} Gợi ý tối ưu:</strong>
             <ul style="margin-top: var(--space-2); padding-left: var(--space-4); color: var(--text-secondary); font-size: var(--font-sm);">
                ${result.suggestions.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
             </ul>
           </div>`
        : `<div style="margin-top: var(--space-4); color: var(--success); font-size: var(--font-sm);">
             ${icon('check', 16)} Tuyệt vời! Cấu trúc bài viết đã được tối ưu rất tốt.
           </div>`;

    panel.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h4 style="margin: 0; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                ${icon('chart', 18)} Dự đoán hiệu năng (Pre-flight Score)
            </h4>
            <div style="font-size: 24px; font-weight: bold; color: ${scoreColor};">
                ${result.score}/100
            </div>
        </div>
        
        <p class="text-sm text-muted mb-4">Khả năng chuyển đổi dựa trên cấu trúc (Hook, Proof, CTA).</p>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-4);">
            <div style="text-align: center; background: var(--bg-secondary); padding: var(--space-2); border-radius: var(--radius-sm);">
                <div style="font-size: var(--font-xs); color: var(--text-muted); text-transform: uppercase;">Hook</div>
                <div style="font-weight: 600; color: ${result.breakdown.hook >= 70 ? 'var(--success)' : 'inherit'};">${result.breakdown.hook}%</div>
            </div>
            <div style="text-align: center; background: var(--bg-secondary); padding: var(--space-2); border-radius: var(--radius-sm);">
                <div style="font-size: var(--font-xs); color: var(--text-muted); text-transform: uppercase;">Bằng chứng</div>
                <div style="font-weight: 600; color: ${result.breakdown.proof >= 70 ? 'var(--success)' : 'inherit'};">${result.breakdown.proof}%</div>
            </div>
            <div style="text-align: center; background: var(--bg-secondary); padding: var(--space-2); border-radius: var(--radius-sm);">
                <div style="font-size: var(--font-xs); color: var(--text-muted); text-transform: uppercase;">CTA</div>
                <div style="font-weight: 600; color: ${result.breakdown.cta >= 70 ? 'var(--success)' : 'inherit'};">${result.breakdown.cta}%</div>
            </div>
        </div>

        ${suggestionsHtml}
    `;
}
