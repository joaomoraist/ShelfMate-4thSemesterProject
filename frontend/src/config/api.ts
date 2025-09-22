// Configuração da API
export const API_CONFIG = {
  // URL base da API - altere aqui se necessário
  BASE_URL: 'https://shelfmate-4thsemesterproject.onrender.com',
  
  // Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    USERS: {
      LOGIN: '/users/login',
      REGISTER: '/users/register',
      SEND_RESET_CODE: '/users/send-reset-code',
      VERIFY_RESET_CODE: '/users/verify-reset-code',
      RESET_PASSWORD: '/users/reset-password'
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
  RESET_PASSWORD: buildApiUrl(API_CONFIG.ENDPOINTS.USERS.RESET_PASSWORD)
};
