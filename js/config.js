// config.js — Cấu hình tập trung
// Sửa ở đây, cả app thay đổi. Không chứa logic.

export const CONFIG = {
    // App
    APP_NAME: 'ContentPilot',
    APP_VERSION: '1.0.0',

    // Routes — hash-based SPA routing
    ROUTES: {
        LOGIN: 'login',
        DASHBOARD: 'dashboard',
        CREATE: 'create',
        LIBRARY: 'library',
        BRAND: 'brand',
        CAMPAIGNS: 'campaigns',
        CAMPAIGN_DETAIL: 'campaign',
        APPROVALS: 'approvals',
    },

    // Default route sau khi login
    DEFAULT_ROUTE: 'dashboard',

    // Gemini API
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta',
    GEMINI_MODEL: 'gemini-2.0-flash', // Model nhanh, tiết kiệm

    // Facebook Graph API
    FACEBOOK_API_URL: 'https://graph.facebook.com/v21.0',

    // Firestore collection names
    COLLECTIONS: {
        BRANDS: 'brands',
        CONTENTS: 'contents',
        SETTINGS: 'settings',
    },

    // Content statuses
    STATUS: {
        DRAFT: 'draft',
        PENDING_APPROVAL: 'pending_approval',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        PUBLISHED: 'published',
        SCHEDULED: 'scheduled',
    },

    // Brief statuses
    BRIEF_STATUS: {
        DRAFT: 'draft',
        IN_REVIEW: 'in_review',
        APPROVED: 'approved',
        REJECTED: 'rejected',
    },

    // Idea statuses (kanban columns)
    IDEA_STATUS: {
        BACKLOG: 'backlog',
        SHORTLISTED: 'shortlisted',
        IN_PRODUCTION: 'in_production',
        PUBLISHED: 'published',
        ARCHIVED: 'archived',
    },

    // Funnel stages
    FUNNEL_STAGE: {
        TOF: 'TOF',
        MOF: 'MOF',
        BOF: 'BOF',
    },

    // Asset statuses (production pipeline)
    ASSET_STATUS: {
        DRAFT: 'draft',
        NEEDS_QA: 'needs_qa',
        APPROVED: 'approved',
        SCHEDULED: 'scheduled',
        PUBLISHED: 'published',
    },

    // Content types
    CONTENT_TYPES: {
        FACEBOOK: 'facebook',
        BLOG: 'blog',
        CAPTION: 'caption',
    },

    // Sidebar navigation items
    NAV_ITEMS: [
        { route: 'dashboard', label: '📊 Dashboard', icon: '📊' },
        { route: 'create', label: '✨ Tạo bài mới', icon: '✨' },
        { route: 'library', label: '📚 Thư viện', icon: '📚' },
        { route: 'campaigns', label: '📋 Chiến dịch', icon: '📋' },
        { route: 'approvals', label: '✅ Duyệt bài', icon: '✅' },
        { route: 'brand', label: '🏢 Thương hiệu', icon: '🏢' },
    ],
};
