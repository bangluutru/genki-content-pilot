/**
 * Firestore Service — Barrel Re-export
 *
 * All domain modules are now in src/services/db/*.js
 * This file re-exports everything for backward compatibility.
 */

// Brand
export { saveBrand, loadBrand } from './db/brand.js';

// Content
export { saveContent, updateContent, deleteContent, loadContents, approveContent, rejectContent } from './db/content.js';

// Connections
export { saveConnections, loadConnections, deleteConnection } from './db/connections.js';

// Analytics
export { loadContentStats } from './db/analytics.js';

// Schedules
export { saveSchedule, loadSchedules, deleteSchedule } from './db/schedules.js';

// Templates
export { saveTemplate, loadTemplates, deleteTemplate } from './db/templates.js';

// Workspace & Team
export { saveWorkspace, loadWorkspace, loadTeamActivity } from './db/workspace.js';

// Conversions
export { saveConversion, loadConversions, getTopPerformingContent } from './db/conversions.js';

// Campaigns
export { saveCampaign, loadCampaigns, deleteCampaign, updateCampaignPillars, updateCampaignAngles } from './db/campaigns.js';

// Users
export { upsertUser, loadUserProfile } from './db/users.js';
