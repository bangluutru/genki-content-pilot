// state.js — Backward-compatible re-export wrapper
// Tất cả CRUD logic đã chuyển sang js/services/db/

// ─── Asset CRUD ───
export { createAsset, listAssets, getAsset, updateAsset, deleteAsset, getChildAssets, scheduleAsset, createBrandAsset, listBrandAssets, deleteBrandAsset } from './services/db/assets.js';

// ─── Brand CRUD ───
export { getBrand, saveBrand } from './services/db/brands.js';

// ─── Brief CRUD ───
export { createBrief, listBriefVersions, updateBrief, submitBrief, approveBrief, rejectBrief, getApprovedBrief } from './services/db/briefs.js';

// ─── Campaign CRUD ───
export { saveCampaign, loadCampaigns, getCampaign, updateCampaign, deleteCampaign } from './services/db/campaigns.js';

// ─── Content CRUD ───
export { getContents, getContent, createContent, updateContent, deleteContent, getContentsByCampaign, updateContentStatus } from './services/db/contents.js';

// ─── Idea CRUD ───
export { createIdea, listIdeas, updateIdea, deleteIdea, saveIdeaScore, getIdeaScores } from './services/db/ideas.js';

// ─── Performance CRUD ───
export { addMetric, addMetrics, listMetrics, deleteMetric, addLearningLog, listLearningLogs, createExperiment, listExperiments, updateExperiment } from './services/db/performance.js';

// ─── Settings CRUD ───
export { getSettings, saveSettings } from './services/db/settings.js';

// ─── VOC CRUD ───
export { addVocEntry, addVocEntries, listVocEntries, deleteVocEntry, saveClusters, loadClusters, saveHookBank, loadHookBank } from './services/db/voc.js';
