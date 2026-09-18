import axios from 'axios';
import { clearAuthSession, getAuthSession } from '../../hooks/useAuth';
import { API_ENDPOINTS } from './endpoints';

/** Fired on a 401 so the app can bounce the visitor to the login screen. */
export const UNAUTHORIZED_EVENT = 'ets:unauthorized';

// The login flow's own endpoints: a failure here is "wrong OTP", not an
// expired session, so it must never clear the session or redirect.
const AUTH_ENDPOINTS: string[] = [
  API_ENDPOINTS.auth.otpChannels,
  API_ENDPOINTS.auth.sendOtp,
  API_ENDPOINTS.auth.verifyOtp,
];

const isAuthEndpoint = (url?: string) =>
  Boolean(url) && AUTH_ENDPOINTS.some((endpoint) => url!.includes(endpoint));

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('vetslinked.in')) {
      return 'https://api.vetslinked.in';
    }
    if (hostname.endsWith('vetlinked.com')) {
      return 'https://api.vetlinked.com';
    }
    if (hostname.endsWith('vetlinked.in')) {
      return 'https://api.vetlinked.in';
    }
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

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
    // A 401 on a request that carried a token means that session is over: drop
    // it and let the app send the visitor to the login screen.
    //
    // Two cases are deliberately left alone. The login endpoints, where a
    // failure is a wrong OTP rather than an expired session. And a 401 with no
    // token at all, which is just a signed-out visitor touching an
    // authenticated endpoint on a public page — the route guard handles that,
    // and redirecting here would yank them off the page they were reading.
    if (
      error.response?.status === 401 &&
      !isAuthEndpoint(error.config?.url) &&
      getAuthSession().token
    ) {
      clearAuthSession();
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT, {
          detail: { message: error.response?.data?.message },
        }),
      );
    }

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
