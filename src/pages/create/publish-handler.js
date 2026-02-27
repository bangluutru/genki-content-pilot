/**
 * Publish Handlers — Facebook & WordPress publishing logic
 * Extracted from create.js for maintainability
 */
import { store } from '../../utils/state.js';
import { showToast } from '../../components/toast.js';
import { loadConnections, saveContent, updateContent } from '../../services/firestore.js';
import { publishToFacebook } from '../../services/facebook.js';
import { publishToWordPress } from '../../services/wordpress.js';
import { icon } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';

/**
 * Initialize publish panel — check connection statuses
 */
export async function initPublishPanel() {
    const connections = store.get('connections') || await loadConnections() || {};
    const fb = connections.facebook;
    const wp = connections.wordpress;

    const fbStatus = document.getElementById('fb-conn-status');
    const wpStatus = document.getElementById('wp-conn-status');
    const toggleFb = document.getElementById('toggle-fb');
    const toggleWp = document.getElementById('toggle-wp');

    if (fb?.pageId) {
        if (fbStatus) fbStatus.textContent = `(${fb.pageName || t('settings.connected')})`;
    } else {
        if (fbStatus) fbStatus.innerHTML = `(<a href="#/settings">${t('create.notConnected')}</a>)`;
        if (toggleFb) { toggleFb.disabled = true; }
    }

    if (wp?.siteUrl) {
        if (wpStatus) wpStatus.textContent = `(${wp.siteName || t('settings.connected')})`;
    } else {
        if (wpStatus) wpStatus.innerHTML = `(<a href="#/settings">${t('create.notConnected')}</a>)`;
        if (toggleWp) { toggleWp.disabled = true; }
    }
}

/**
 * Handle publish to Facebook / WordPress
 * @param {Function} getCurrentContent - getter for currentContent state
 */
export async function handlePublish(getCurrentContent) {
    const currentContent = getCurrentContent();
    if (!currentContent) return;

    const connections = store.get('connections') || {};
    const publishFb = document.getElementById('toggle-fb')?.checked;
    const publishWp = document.getElementById('toggle-wp')?.checked;
    const publishBtn = document.getElementById('btn-publish');
    const resultsEl = document.getElementById('publish-results');

    if (!publishFb && !publishWp) {
        showToast(t('create.selectPlatform'), 'warning');
        return;
    }

    // Get latest edited content
    const facebook = document.getElementById('content-facebook')?.textContent || '';
    const blog = document.getElementById('content-blog')?.textContent || '';

    // Disable button + show loading
    publishBtn.disabled = true;
    publishBtn.innerHTML = '⏳ ' + t('create.publishing');
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = `<span class="text-muted">${icon('refresh', 16)} ${t('create.processing')}</span>`;

    const results = [];
    const publishedTo = [];
    const publishedUrls = {};

    // Publish to Facebook
    if (publishFb && connections.facebook) {
        const fb = connections.facebook;
        const fbResult = await publishToFacebook(facebook, fb.pageId, fb.accessToken);
        if (fbResult.success) {
            results.push(`<div class="publish-result-item text-success">${icon('check', 14)} Facebook: <a href="${fbResult.postUrl}" target="_blank" rel="noopener">${t('create.viewPost')}</a></div>`);
            publishedTo.push('facebook');
            publishedUrls.facebook = fbResult.postUrl;
        } else {
            results.push(`<div class="publish-result-item text-danger">${icon('cross', 14)} Facebook: ${fbResult.error}</div>`);
        }
    }

    // Publish to WordPress
    if (publishWp && connections.wordpress) {
        const wp = connections.wordpress;
        const wpResult = await publishToWordPress({
            title: currentContent.brief || 'ContentPilot Post',
            content: blog,
            status: 'publish',
            siteUrl: wp.siteUrl,
            username: wp.username,
            appPassword: wp.appPassword,
        });
        if (wpResult.success) {
            results.push(`<div class="publish-result-item text-success">${icon('check', 14)} WordPress: <a href="${wpResult.postUrl}" target="_blank" rel="noopener">${t('create.viewPost')}</a></div>`);
            publishedTo.push('wordpress');
            publishedUrls.wordpress = wpResult.postUrl;
        } else {
            results.push(`<div class="publish-result-item text-danger">${icon('cross', 14)} WordPress: ${wpResult.error}</div>`);
        }
    }

    // Show results
    resultsEl.innerHTML = results.join('');

    // Auto-save content with published status
    if (publishedTo.length > 0) {
        try {
            const story = document.getElementById('content-story')?.textContent || '';
            const context = window.__createContext;
            const contentPayload = {
                ...currentContent,
                facebook,
                blog,
                story,
                status: 'published',
                publishedTo,
                publishedUrls,
                publishedAt: new Date().toISOString(),
                ...(context && {
                    campaignId: context.campaign?.id,
                    pillarId: context.pillar?.id,
                    angleId: context.angle?.id
                })
            };

            if (window.__savedContentId) {
                // Update existing record
                await updateContent(window.__savedContentId, contentPayload);
            } else {
                // First save — create new record and track ID
                const saved = await saveContent(contentPayload);
                window.__savedContentId = saved.id;
            }
            showToast(t('create.publishSuccess', { platforms: publishedTo.join(' + ') }), 'success');
        } catch (e) {
            console.error('Auto-save after publish error:', e);
        }
    }

    // Reset button
    publishBtn.disabled = false;
    publishBtn.innerHTML = icon('publish', 16) + ' ' + t('create.publishButton');
}

/**
 * Handle saving content as draft
 * @param {Function} getCurrentContent - getter for currentContent state
 */
export async function handleSave(getCurrentContent) {
    const currentContent = getCurrentContent();
    if (!currentContent) return;

    try {
        const facebook = document.getElementById('content-facebook')?.textContent || '';
        const blog = document.getElementById('content-blog')?.textContent || '';
        const story = document.getElementById('content-story')?.textContent || '';
        const context = window.__createContext;

        const contentPayload = {
            ...currentContent,
            facebook,
            blog,
            story,
            status: 'draft',
            ...(context && {
                campaignId: context.campaign?.id,
                pillarId: context.pillar?.id,
                angleId: context.angle?.id
            })
        };

        if (window.__savedContentId) {
            // Update existing record — prevent duplicates
            await updateContent(window.__savedContentId, contentPayload);
        } else {
            // First save — create new record and track ID
            const saved = await saveContent(contentPayload);
            window.__savedContentId = saved.id;
        }

        showToast(t('create.savedToLibrary'), 'success');

        // Show calendar shortcut banner
        showScheduleBanner(window.__savedContentId);
    } catch (error) {
        console.error('Save error:', error);
        showToast(t('create.saveError'), 'error');
    }
}

/** Show a floating "Schedule now" banner after saving content */
function showScheduleBanner(contentId) {
    // Remove any existing banner
    document.getElementById('schedule-banner')?.remove();

    const banner = document.createElement('div');
    banner.id = 'schedule-banner';
    banner.innerHTML = `
    <div style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 1000;
                background: linear-gradient(135deg, var(--color-primary), var(--color-info));
                color: #fff; padding: 12px 24px; border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px;
                animation: slideUp 0.3s ease; cursor: pointer; max-width: 90%;">
      <span>${icon('calendar', 18)}</span>
      <span style="font-weight: 600; font-size: 14px;">${t('create.scheduleNow') || 'Lên lịch đăng ngay →'}</span>
      <button id="schedule-banner-close" style="background: none; border: none; color: #fff; opacity: 0.8; cursor: pointer; padding: 0 4px; font-size: 18px;">✕</button>
    </div>
    <style>
      @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    </style>
  `;

    document.body.appendChild(banner);

    // Click banner -> go to calendar
    banner.querySelector('div').addEventListener('click', (e) => {
        if (e.target.id === 'schedule-banner-close') {
            banner.remove();
            return;
        }
        banner.remove();
        window.location.hash = contentId ? `#/calendar?contentId=${contentId}` : '#/calendar';
    });

    // Auto-dismiss after 10s
    setTimeout(() => { banner?.remove(); }, 10000);
}
