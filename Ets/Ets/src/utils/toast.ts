import { toast, type ToastOptions } from 'react-toastify';

/**
 * App-wide toast helpers. Every call routes through here so position, timing
 * and error-message extraction stay identical across the whole site.
 */

const BASE: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'colored',
};

/** Pulls the human-readable message out of whatever the API/axios layer threw. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (typeof error === 'string' && error.trim()) return error;

  if (typeof error === 'object' && error !== null) {
    const withData = error as {
      data?: { message?: string; errors?: Record<string, string[] | string> };
      response?: { data?: { message?: string } };
      message?: string;
    };

    // Field-level validation errors are the most specific thing we can show.
    const fieldErrors = withData.data?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const first = Object.values(fieldErrors).flat().filter(Boolean)[0];
      if (typeof first === 'string' && first.trim()) return first;
    }

    if (withData.data?.message) return withData.data.message;
    if (withData.response?.data?.message) return withData.response.data.message;
    if (typeof withData.message === 'string' && withData.message.trim()) return withData.message;
  }

  return fallback;
}

export const notify = {
  success: (message: string, options?: ToastOptions) => toast.success(message, { ...BASE, ...options }),
  error: (message: string, options?: ToastOptions) => toast.error(message, { ...BASE, autoClose: 6000, ...options }),
  info: (message: string, options?: ToastOptions) => toast.info(message, { ...BASE, ...options }),
  warning: (message: string, options?: ToastOptions) => toast.warning(message, { ...BASE, ...options }),
  /** Shorthand for catch blocks: `catch (e) { notify.apiError(e, 'Could not save') }` */
  apiError: (error: unknown, fallback?: string, options?: ToastOptions) =>
    toast.error(getErrorMessage(error, fallback), { ...BASE, autoClose: 6000, ...options }),
};

export default notify;
