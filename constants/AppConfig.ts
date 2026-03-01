// ============================================================
// AppConfig.ts — White-Label Foundation (v2.4.0)
// ============================================================
// Central place for all global constants.
// Changing a value here updates the entire app automatically.
// ============================================================

/** Current application version — shown in the UI wherever {APP_VERSION} is used */
export const APP_VERSION = 'v2.5.1';

/** Product name shown in the branding footer of the sidebar */
export const APP_NAME = 'PROXIMA SUITE';

/** Developer / maker name shown below APP_NAME in the sidebar footer */
export const MAKER_NAME = 'SG TechLab';

/**
 * Default fallback company name used when no companySettings are loaded yet.
 * Change this for white-label deployments.
 */
export const DEFAULT_COMPANY_NAME = 'SNEP';

/**
 * localStorage key prefix.
 * All browser-storage keys are built as `${STORAGE_PREFIX}<key>`.
 * Keep as 'snep_' to maintain backwards compatibility with existing user data.
 * To rename for a white-label client, change this value — add a migration if needed.
 */
export const STORAGE_PREFIX = 'snep_';

/** Production Vercel URL — used for QR-code generation and mobile deep-links */
export const PROD_URL = 'https://proximasuite.vercel.app';
