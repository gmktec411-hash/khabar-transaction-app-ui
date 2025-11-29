// ============================================
// Application Configuration
// ============================================
// This file centralizes all configuration settings for the application
// Update these values based on your environment (development, staging, production)

const AppConfig = {
  // ==================== API Configuration ====================

  // Main API Base URL - Primary backend server
  API_BASE_URL: window._env_?.API_BASE_URL || "http://localhost:8848/api",

  // Transaction API Endpoint
  API_TRANSACTION_PATH: window._env_?.API_TRANSACTION_PATH || "/transactions/getAllTransactionsByAdmin",

  // Outlook/Email Integration API Base URL
  OUTLOOK_API_BASE_URL: window._env_?.OUTLOOK_API_BASE_URL || "http://localhost:8080",

  // ==================== Application Branding ====================

  APP_NAME: "FinΞsthétique",
  APP_NAME_ARABIC: "الجماليات المالية",
  APP_TAGLINE: "L'Excellence en Analytique Financière",

  // ==================== Feature Flags ====================

  FEATURES: {
    ENABLE_GMAIL_INTEGRATION: false,  // Gmail integration coming soon
    ENABLE_EXPORT_PDF: true,
    ENABLE_EXPORT_EXCEL: true,
    ENABLE_DARK_MODE: false,  // Future feature
  },

  // ==================== Pagination & Limits ====================

  DEFAULT_PAGE_SIZE: 50,
  MAX_TRANSACTIONS_DISPLAY: 1000,

  // ==================== Date & Time ====================

  DEFAULT_DATE_FORMAT: 'en-US',
  DEFAULT_TIMEZONE: 'UTC',

  // ==================== Environment Detection ====================

  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
};

// ==================== Helper Functions ====================

// Get full API URL
AppConfig.getApiUrl = (endpoint) => {
  return `${AppConfig.API_BASE_URL}${endpoint}`;
};

// Get full Outlook API URL
AppConfig.getOutlookApiUrl = (endpoint) => {
  return `${AppConfig.OUTLOOK_API_BASE_URL}${endpoint}`;
};

// Get transaction fetch URL
AppConfig.getTransactionUrl = (adminId, lastId = 0) => {
  return `${AppConfig.API_BASE_URL}${AppConfig.API_TRANSACTION_PATH}?adminId=${adminId}&lastId=${lastId}`;
};

export default AppConfig;
