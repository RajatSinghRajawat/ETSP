import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type PurchaseType =
  | 'pay_per_job'
  | 'unlock_credits_20'
  | 'cv_unlock_1'
  | 'cv_unlock_3'
  | 'urgent_tag'
  | 'resume_builder';

export type AddonInfo = {
  amountInr: number;
  credits?: number;
  label?: string;
  description?: string;
};

export type AddonCatalog = Partial<Record<PurchaseType, AddonInfo>>;

export type PurchaseStatus = 'pending' | 'paid' | 'expired' | 'failed';

export type Purchase = {
  _id: string;
  type: PurchaseType;
  amountInr: number;
  status: PurchaseStatus;
  job?: { _id: string; title: string } | string | null;
  fulfilledAt?: string | null;
  createdAt: string;
};

export type PurchaseCheckoutPayload = {
  type: PurchaseType;
  jobId?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const purchaseApi = createApi({
  reducerPath: 'purchaseApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Purchase'],
  endpoints: (builder) => ({
    getAddons: builder.query<ApiResponse<{ addons: AddonCatalog }>, void>({
      query: () => ({
        url: API_ENDPOINTS.purchaseAddons,
      }),
    }),
    purchaseCheckout: builder.mutation<ApiResponse<{ url: string }>, PurchaseCheckoutPayload>({
      query: (payload) => ({
        url: API_ENDPOINTS.purchaseCheckout,
        method: 'POST',
        data: payload,
      }),
    }),
    purchaseConfirm: builder.mutation<ApiResponse<Purchase>, string>({
      query: (sessionId) => ({
        url: API_ENDPOINTS.purchaseConfirm,
        method: 'POST',
        data: { sessionId },
      }),
      invalidatesTags: ['Purchase'],
    }),
    getMyPurchases: builder.query<ApiResponse<{ items: Purchase[] }>, void>({
      query: () => ({
        url: API_ENDPOINTS.myPurchases,
      }),
      providesTags: ['Purchase'],
    }),
  }),
});

export const {
  useGetAddonsQuery,
  usePurchaseCheckoutMutation,
  usePurchaseConfirmMutation,
  useGetMyPurchasesQuery,
} = purchaseApi;
