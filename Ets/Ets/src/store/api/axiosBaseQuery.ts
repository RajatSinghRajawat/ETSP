import type { AxiosError, AxiosRequestConfig } from 'axios';
import { axiosInstance } from './axiosInstance';

type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
};

type NormalizedApiError = {
  status?: number;
  data?: {
    message?: string;
    errors?: Record<string, string[]>;
  };
  message?: string;
};

const isNormalizedApiError = (error: unknown): error is NormalizedApiError =>
  typeof error === 'object' && error !== null && ('status' in error || 'data' in error);

export const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params, headers }: AxiosBaseQueryArgs) => {
    try {
      const result = await axiosInstance({ url, method, data, params, headers });

      return { data: result.data };
    } catch (axiosError) {
      if (isNormalizedApiError(axiosError)) {
        return {
          error: {
            status: axiosError.status ?? 500,
            data: axiosError.data ?? { message: axiosError.message ?? 'Request failed' },
          },
        };
      }

      const error = axiosError as AxiosError;

      return {
        error: {
          status: error.response?.status ?? 500,
          data: error.response?.data ?? { message: error.message },
        },
      };
    }
  };
