/**
 * API Index
 * Central export point for all refactored API endpoints
 */

// Consolidated endpoints
export { default as analyzeProperty } from './analyze-property.js';
export { default as userManagement } from './user-management.js';

// Other API endpoints (to be consolidated later)
export { default as submitAnalysis } from '../../api/submit-analysis.js';
export { default as submitContact } from '../../api/submit-contact.js';
export { default as submitLead } from '../../api/submit-lead.js';
export { default as generateReport } from '../../api/reports/generate.js';

// Property endpoints
export { default as ingestProperty } from '../../api/properties/ingest.js';
export { default as listProperties } from '../../api/properties/list.js';
export { default as deleteProperty } from '../../api/properties/delete.js';

// Analysis endpoints
export { default as saveAnalysis } from '../../api/analyses/save.js';
export { default as listAnalyses } from '../../api/analyses/list.js';

// Auth endpoints
export { default as login } from '../../api/auth/login.js';
export { default as verify } from '../../api/auth/verify.js';