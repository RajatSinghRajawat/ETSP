const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('vetlinked.com')) {
      return 'https://api.vetlinked.com/api/v1';
    }
    if (hostname.endsWith('vetlinked.in')) {
      return 'https://api.vetlinked.in/api/v1';
    }
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const TOKEN_STORAGE_KEY = 'ets_admin_token';
export const USER_STORAGE_KEY = 'ets_admin_user';
