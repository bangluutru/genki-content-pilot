/**
 * Facebook Graph API Service — Publish content to Facebook Page
 * Uses Graph API v21.0
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

/**
 * Test Facebook connection by fetching page info
 * @param {string} pageId - Facebook Page ID
 * @param {string} accessToken - Page Access Token
 * @returns {Object} { success, pageName, error }
 */
export async function testFacebookConnection(pageId, accessToken) {
    try {
        const response = await fetch(
            `${GRAPH_API_BASE}/${pageId}?fields=name,fan_count,picture&access_token=${accessToken}`
        );

        if (!response.ok) {
            let errorMessage = 'Connection failed';
            try {
                const errText = await response.text();
                if (errText) {
                    const errData = JSON.parse(errText);
                    errorMessage = errData.error?.message || errorMessage;
                }
            } catch { /* ignore */ }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return {
            success: true,
            pageName: data.name,
            fanCount: data.fan_count || 0,
            picture: data.picture?.data?.url || '',
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Không thể kết nối Facebook Page',
        };
    }
}

/**
 * Publish a text post to Facebook Page
 * @param {string} message - Post content
 * @param {string} pageId - Facebook Page ID
 * @param {string} accessToken - Page Access Token
 * @returns {Object} { success, postId, postUrl, error }
 */
export async function publishToFacebook(message, pageId, accessToken) {
    try {
        if (!message?.trim()) throw new Error('Nội dung bài viết không được để trống');
        if (!pageId || !accessToken) throw new Error('Thiếu Page ID hoặc Access Token. Vui lòng cấu hình trong Cài đặt.');

        const response = await fetch(
            `${GRAPH_API_BASE}/${pageId}/feed`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message.trim(),
                    access_token: accessToken,
                }),
            }
        );

        if (!response.ok) {
            let fbError = 'Đăng bài thất bại';
            try {
                const errText = await response.text();
                if (errText) {
                    const errData = JSON.parse(errText);
                    fbError = errData.error?.message || fbError;
                    if (errData.error?.code === 190) throw new Error('Token đã hết hạn. Vui lòng cập nhật Access Token trong Cài đặt.');
                    if (errData.error?.code === 200) throw new Error('Không có quyền đăng bài. Kiểm tra lại quyền App.');
                    if (errData.error?.code === 4) throw new Error('Đã vượt quá giới hạn API. Vui lòng thử lại sau.');
                }
            } catch (innerErr) {
                if (innerErr.message !== fbError) throw innerErr; // re-throw specific errors
            }
            throw new Error(fbError);
        }

        const data = await response.json();
        const postId = data.id;

        return {
            success: true,
            postId,
            postUrl: `https://facebook.com/${postId}`,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Lỗi đăng bài lên Facebook',
        };
    }
}

/**
 * Publish a post with a link to Facebook Page
 * @param {string} message - Post content
 * @param {string} link - URL to attach
 * @param {string} pageId - Facebook Page ID
 * @param {string} accessToken - Page Access Token
 * @returns {Object} { success, postId, postUrl, error }
 */
export async function publishToFacebookWithLink(message, link, pageId, accessToken) {
    try {
        if (!pageId || !accessToken) throw new Error('Thiếu Page ID hoặc Access Token.');

        const body = {
            message: message?.trim() || '',
            access_token: accessToken,
        };
        if (link) body.link = link;

        const response = await fetch(
            `${GRAPH_API_BASE}/${pageId}/feed`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            let errorMessage = 'Đăng bài thất bại';
            try {
                const errText = await response.text();
                if (errText) {
                    const errData = JSON.parse(errText);
                    errorMessage = errData.error?.message || errorMessage;
                }
            } catch { /* ignore */ }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return {
            success: true,
            postId: data.id,
            postUrl: `https://facebook.com/${data.id}`,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Lỗi đăng bài lên Facebook',
        };
    }
}
