import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('ets-access-token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'Something went wrong while communicating with the server.';

    // Plan-gated failures open the global upgrade dialog (see UpgradeDialog),
    // then still reject so callers handle the error normally.
    const PLAN_GATE_CODES = [
      'PLAN_LIMIT_REACHED',
      'FEATURE_NOT_IN_PLAN',
      'NO_UNLOCK_CREDITS',
      'NO_JOB_CREDIT',
      'NO_RESUME_CREDITS',
      'PROFILE_LOCKED',
    ];
    const code = error.response?.data?.code;
    if (typeof code === 'string' && PLAN_GATE_CODES.includes(code)) {
      window.dispatchEvent(
        new CustomEvent('ets:plan-gate', {
          detail: {
            code,
            message: error.response?.data?.message,
            errors: error.response?.data?.errors,
          },
        }),
      );
    }

    return Promise.reject({
      status: error.response?.status ?? 500,
      data: error.response?.data ?? { message },
    });
  },
);
