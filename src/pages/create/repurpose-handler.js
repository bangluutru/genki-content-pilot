/**
 * Content Repurposing Handler
 * Converts existing content to other platforms (Instagram, Blog, Zalo OA, TikTok, Email)
 */
import { showToast } from '../../components/toast.js';
import { icon } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';
import { store } from '../../utils/state.js';
import { escapeHtml } from '../../utils/helpers.js';

// Platform configurations with character limits and style notes
const PLATFORMS = {
  instagram: {
    labelKey: 'repurpose.instagram',
    icon: 'camera',
    maxChars: 2200,
    style: 'hashtag-heavy, visual-first, emoji-rich',
    prompt: 'Instagram caption. Max 2200 chars. Start with a strong hook (emoji + question). Use line breaks for readability. End with 15-20 relevant hashtags grouped into: Brand (3), Niche (5-7), Trending (3-5). Use emojis generously. Conversational and visual-first tone.'
  },
  blog: {
    labelKey: 'repurpose.blog',
    icon: 'blog',
    maxChars: 8000,
    style: 'SEO-friendly, long-form, structured',
    prompt: 'SEO blog article (800+ words). Include: H1 title with keyword, meta description (155 chars), introduction with hook, 3-5 subheadings (H2), bullet points, conclusion with CTA. Natural keyword density. Write in a helpful, authoritative tone.'
  },
  zalo: {
    labelKey: 'repurpose.zalo',
    icon: 'megaphone',
    maxChars: 500,
    style: 'formal, conversational, Vietnamese-specific',
    prompt: 'Zalo OA message. Max 500 chars. Formal but friendly Vietnamese tone. Start with greeting. Short paragraphs. Clear CTA with action button text. No hashtags. Include "Xin chào" or "Kính gửi" opening.'
  },
  tiktok: {
    labelKey: 'repurpose.tiktok',
    icon: 'film',
    maxChars: 300,
    style: 'hook-first, storytelling, Gen-Z tone',
    prompt: 'TikTok video script caption. Max 300 chars. Start with a 3-second hook (controversial/curious). Use storytelling format: Hook → Problem → Solution → CTA. Short, punchy sentences. 5-8 trending hashtags. Gen-Z friendly tone.'
  },
  email: {
    labelKey: 'repurpose.email',
    icon: 'inbox',
    maxChars: 3000,
    style: 'subject-line-first, scannable, CTA-focused',
    prompt: 'Email newsletter. Include 3 subject line variations (A/B testable). Opening preview text (90 chars). Email body: greeting, main content with subheadings, clear CTA button text. Keep paragraphs 2-3 sentences. Professional yet warm tone.'
  }
};

/**
 * Show repurpose panel below generated content
 * @param {Object} content - { facebook, blog, story }
 */
export function showRepurposePanel(content) {
  const container = document.getElementById('repurpose-panel');
  if (!container) return;

  const platformBtns = Object.entries(PLATFORMS).map(([key, platform]) => `
    <button class="btn btn-ghost btn-sm repurpose-btn" data-platform="${key}" style="display: flex; align-items: center; gap: 6px;">
      ${icon(platform.icon, 16)}
      <span>${t(platform.labelKey)}</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="repurpose-section" style="margin-top: var(--space-4); padding: var(--space-4); background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border);">
      <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3);">
        ${icon('rotate', 18)}
        <span style="font-weight: 600; font-size: var(--font-sm);">${t('repurpose.title')}</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
        ${platformBtns}
      </div>
      <div id="repurpose-result" class="hidden" style="margin-top: var(--space-4);"></div>
    </div>
  `;
  container.classList.remove('hidden');

  // Attach click handlers
  container.querySelectorAll('.repurpose-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const platform = btn.dataset.platform;
      await repurposeContent(content, platform);
    });
  });
}

/**
 * Repurpose content to a specific platform
 */
async function repurposeContent(content, platformKey) {
  const platform = PLATFORMS[platformKey];
  if (!platform) return;

  const resultEl = document.getElementById('repurpose-result');
  if (!resultEl) return;

  // Show loading
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: var(--space-2); color: var(--text-muted); padding: var(--space-3);">
      <div class="spinner-sm"></div>
      <span>${t('repurpose.generating')}</span>
    </div>
  `;

  // Disable all buttons during generation
  document.querySelectorAll('.repurpose-btn').forEach(b => b.disabled = true);

  try {
    const { repurposeForPlatform } = await import('../../services/gemini.js');
    const result = await repurposeForPlatform(content.facebook, platformKey, platform.prompt);

    resultEl.innerHTML = `
      <div style="border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); background: var(--primary-light); border-bottom: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            ${icon(platform.icon, 16)}
            <span style="font-weight: 600; font-size: var(--font-sm);">${t(platform.labelKey)}</span>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-ghost btn-sm" id="btn-repurpose-copy" title="${t('actions.copy')}">
              ${icon('copy', 16)} ${t('actions.copy')}
            </button>
            <button class="btn btn-primary btn-sm" id="btn-repurpose-save" title="${t('actions.save')}">
              ${icon('save', 16)} ${t('actions.save')}
            </button>
          </div>
        </div>
        <div id="repurpose-text" style="padding: var(--space-4); white-space: pre-wrap; font-size: var(--font-sm); line-height: 1.6; max-height: 400px; overflow-y: auto;">${escapeHtml(result)}</div>
      </div>
    `;

    // Copy handler
    document.getElementById('btn-repurpose-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(result);
      showToast(t('create.copied'), 'success', 2000);
    });

    // Save handler — save as new content in Library
    document.getElementById('btn-repurpose-save')?.addEventListener('click', async () => {
      try {
        const { saveContent } = await import('../../services/firestore.js');
        await saveContent({
          facebook: platformKey === 'instagram' || platformKey === 'tiktok' || platformKey === 'zalo' ? result : '',
          blog: platformKey === 'blog' || platformKey === 'email' ? result : '',
          story: '',
          brief: `[Repurposed to ${platformKey}] ${content.facebook?.substring(0, 100) || ''}`,
          status: 'draft',
          repurposedFrom: platformKey,
        });
        showToast(t('create.savedToLibrary'), 'success');
      } catch (err) {
        console.error('Save repurposed content error:', err);
        showToast(t('create.saveError'), 'error');
      }
    });

  } catch (error) {
    console.error('Repurpose error:', error);
    resultEl.innerHTML = `
      <div style="padding: var(--space-3); color: var(--error); font-size: var(--font-sm);">
        ${t('create.generateError', { error: error.message })}
      </div>
    `;
  } finally {
    document.querySelectorAll('.repurpose-btn').forEach(b => b.disabled = false);
  }
}

// escapeHtml imported from utils/helpers.js
