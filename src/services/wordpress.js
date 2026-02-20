/**
 * WordPress REST API Service — Publish content to WordPress site
 * Uses WP REST API v2 with Application Passwords
 */

/**
 * Test WordPress connection by fetching current user info
 * @param {string} siteUrl - WordPress site URL (e.g., https://yourblog.com)
 * @param {string} username - WordPress username
 * @param {string} appPassword - Application Password
 * @returns {Object} { success, siteName, userName, error }
 */
export async function testWordPressConnection(siteUrl, username, appPassword) {
    try {
        const baseUrl = normalizeSiteUrl(siteUrl);
        const response = await fetch(
            `${baseUrl}/wp-json/wp/v2/users/me`,
            {
                headers: {
                    'Authorization': `Basic ${btoa(`${username}:${appPassword}`)}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Sai username hoặc Application Password');
            if (response.status === 403) throw new Error('Không có quyền truy cập');
            if (response.status === 404) throw new Error('Không tìm thấy WordPress REST API. Kiểm tra URL site.');
            throw new Error(`HTTP ${response.status}`);
        }

        const user = await response.json();

        // Also get site info
        let siteName = '';
        try {
            const siteRes = await fetch(`${baseUrl}/wp-json`);
            if (siteRes.ok) {
                const siteData = await siteRes.json();
                siteName = siteData.name || '';
            }
        } catch { /* ignore */ }

        return {
            success: true,
            userName: user.name || username,
            siteName,
            siteUrl: baseUrl,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Không thể kết nối WordPress',
        };
    }
}

/**
 * Publish a post to WordPress
 * @param {Object} options
 * @param {string} options.title - Post title
 * @param {string} options.content - Post content (HTML)
 * @param {string} options.status - 'publish' or 'draft'
 * @param {string} options.siteUrl - WordPress site URL
 * @param {string} options.username - WordPress username
 * @param {string} options.appPassword - Application Password
 * @returns {Object} { success, postId, postUrl, error }
 */
export async function publishToWordPress({ title, content, status = 'publish', siteUrl, username, appPassword }) {
    try {
        if (!content?.trim()) throw new Error('Nội dung bài viết không được để trống');
        if (!siteUrl || !username || !appPassword) {
            throw new Error('Thiếu thông tin kết nối WordPress. Vui lòng cấu hình trong Cài đặt.');
        }

        const baseUrl = normalizeSiteUrl(siteUrl);

        // Convert plain text to HTML paragraphs
        const htmlContent = textToHtml(content);

        const response = await fetch(
            `${baseUrl}/wp-json/wp/v2/posts`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${username}:${appPassword}`)}`,
                },
                body: JSON.stringify({
                    title: title || extractTitle(content),
                    content: htmlContent,
                    status,
                }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Token đã hết hạn. Kiểm tra lại Application Password.');
            if (response.status === 403) throw new Error('Không có quyền đăng bài. Kiểm tra quyền user WordPress.');
            let errorMessage = 'Đăng bài thất bại';
            try {
                const errText = await response.text();
                if (errText) {
                    const errData = JSON.parse(errText);
                    errorMessage = errData.message || errorMessage;
                }
            } catch { /* ignore */ }
            throw new Error(errorMessage);
        }

        const post = await response.json();

        return {
            success: true,
            postId: post.id,
            postUrl: post.link || `${baseUrl}/?p=${post.id}`,
            status: post.status,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Lỗi đăng bài lên WordPress',
        };
    }
}

/**
 * Convert plain text content to HTML paragraphs
 */
function textToHtml(text) {
    if (!text) return '';

    return text
        .split('\n\n')
        .map(paragraph => {
            const trimmed = paragraph.trim();
            if (!trimmed) return '';

            // Check if it looks like a heading
            if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
            if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
            if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;

            // Regular paragraph — preserve single line breaks as <br>
            const html = trimmed.replace(/\n/g, '<br>');
            return `<p>${html}</p>`;
        })
        .filter(Boolean)
        .join('\n');
}

/**
 * Extract a title from content (first line or first 60 chars)
 */
function extractTitle(content) {
    if (!content) return 'Untitled';
    const firstLine = content.split('\n')[0]?.trim() || '';
    // Remove markdown heading markers
    const clean = firstLine.replace(/^#+\s*/, '');
    return clean.length > 60 ? clean.slice(0, 57) + '...' : clean || 'Untitled';
}

/**
 * Normalize WordPress site URL
 */
function normalizeSiteUrl(url) {
    if (!url) return '';
    let normalized = url.trim();
    if (!normalized.startsWith('http')) normalized = `https://${normalized}`;
    return normalized.replace(/\/+$/, '');
}
