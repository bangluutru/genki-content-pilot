// db/index.js — Barrel file: re-exports db instance + all domain modules

// Database instance
export { db } from '../../firebase.js';

// Collection constants
export { COLLECTIONS } from './collections.js';

// Shared helpers
export {
    assertUser,
    assertRequired,
    withMeta,
    updateMeta,
    docWithId,
    snapshotToArray,
    normalizeError,
} from './common.js';

// Domain modules
export { createAsset, listAssets, getAsset, updateAsset, deleteAsset, getChildAssets, scheduleAsset, createBrandAsset, listBrandAssets, deleteBrandAsset } from './assets.js';
export { getBrand, saveBrand } from './brands.js';
export { createBrief, listBriefVersions, updateBrief, submitBrief, approveBrief, rejectBrief, getApprovedBrief } from './briefs.js';
export { saveCampaign, loadCampaigns, getCampaign, updateCampaign, deleteCampaign } from './campaigns.js';
export { getContents, getContent, createContent, updateContent, deleteContent, getContentsByCampaign, updateContentStatus } from './contents.js';
export { createIdea, listIdeas, updateIdea, deleteIdea, saveIdeaScore, getIdeaScores } from './ideas.js';
export { addMetric, addMetrics, listMetrics, deleteMetric, addLearningLog, listLearningLogs, createExperiment, listExperiments, updateExperiment } from './performance.js';
export { getSettings, saveSettings } from './settings.js';
export { addVocEntry, addVocEntries, listVocEntries, deleteVocEntry, saveClusters, loadClusters, saveHookBank, loadHookBank } from './voc.js';
