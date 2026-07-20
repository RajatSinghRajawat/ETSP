export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000/api/v1';

export const TOKEN_STORAGE_KEY = 'ets_admin_token';
export const USER_STORAGE_KEY = 'ets_admin_user';
