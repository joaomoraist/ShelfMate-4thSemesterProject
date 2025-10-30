export const API_CONFIG = {
  // Backend hospedado no Render
  BASE_URL: 'https://shelfmate-4thsemesterproject.onrender.com',
  
  // Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    USERS: {
      LOGIN: '/users/login',
      REGISTER: '/users/register',
      SEND_RESET_CODE: '/users/send-reset-code',
      VERIFY_RESET_CODE: '/users/verify-reset-code',
      RESET_PASSWORD: '/users/reset-password',
      ME: '/users/me',
      LOGOUT: '/users/logout'
    },
    STATS: {
      OVERVIEW: '/stats/overview',
      ACTIVITY_LAST_30_DAYS: '/stats/activity-last-30-days',
      SALES_PER_PRODUCT: '/stats/sales-per-product',
      TOP_PRODUCTS: '/stats/top-products',
      PRODUCTS: '/stats/products',
      PRODUCTS_BULK: '/stats/products/bulk',
      PRODUCTS_DETAILED: '/stats/products-detailed',
      REPORTS_EXPORTED_INC: '/stats/reports-exported'
    }
  }
};

// Função helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// URLs prontas para uso
export const API_URLS = {
  HEALTH: buildApiUrl(API_CONFIG.ENDPOINTS.HEALTH),
  LOGIN: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.LOGIN),
  REGISTER: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.REGISTER),
  SEND_RESET_CODE: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.SEND_RESET_CODE),
  VERIFY_RESET_CODE: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.VERIFY_RESET_CODE),
  RESET_PASSWORD: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.RESET_PASSWORD),
  ME: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.ME),
  LOGOUT: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.LOGOUT),
  HOME: buildApiUrl('/home'),
  
  // Stats endpoints
  STATS_OVERVIEW: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.OVERVIEW),
  ACTIVITY_LAST_30_DAYS: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.ACTIVITY_LAST_30_DAYS),
  SALES_PER_PRODUCT: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.SALES_PER_PRODUCT),
  TOP_PRODUCTS: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.TOP_PRODUCTS),
  STATS_PRODUCTS: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.PRODUCTS),
  STATS_PRODUCTS_BULK: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.PRODUCTS_BULK),
  PRODUCTS_DETAILED: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.PRODUCTS_DETAILED),
  REPORTS_EXPORTED_INC: buildApiUrl(API_CONFIG.ENDPOINTS.STATS.REPORTS_EXPORTED_INC)
};
