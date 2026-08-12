import axios, { AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './env';

export const api = axios.create({
  baseURL: API_BASE_URL,
  // timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Pull the server-supplied filename out of a Content-Disposition header. */
function filenameFromHeader(disposition: unknown): string | null {
  if (typeof disposition !== 'string') return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * GET a binary endpoint and save it to disk.
 *
 * Errors on a blob request come back as a Blob too, so the JSON body is read
 * back out and rethrown as a normal Error — otherwise the UI would show
 * "[object Blob]" instead of the server's message.
 */
export async function downloadFile(
  path: string,
  params: Record<string, unknown> | undefined,
  fallbackFileName: string,
): Promise<void> {
  try {
    const res = await api.get<Blob>(path, { params, responseType: 'blob', timeout: 120000 });

    const url = URL.createObjectURL(res.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filenameFromHeader(res.headers['content-disposition']) ?? fallbackFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoking synchronously can cancel the download in Safari/Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      let message = text.slice(0, 200);
      try {
        message = (JSON.parse(text) as { message?: string }).message ?? message;
      } catch {
        // Not JSON — fall back to the raw body text.
      }
      throw new Error(message || 'Download failed', { cause: error });
    }
    throw error;
  }
}
