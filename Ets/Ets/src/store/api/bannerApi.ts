import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

/** A slot on the site that can show an advertisement banner. */
export type BannerPlacement =
  | 'global_top'
  | 'home_top'
  | 'home_mid'
  | 'home_bottom'
  | 'jobs_list'
  | 'job_detail';

/** Display-only shape — the admin-side title and click count stay server-side. */
export type Banner = {
  _id: string;
  imageUrl: string;
  linkUrl: string;
  altText?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const bannerApi = createApi({
  reducerPath: 'bannerApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Banner'],
  endpoints: (builder) => ({
    getBanners: builder.query<ApiResponse<Banner[]>, BannerPlacement>({
      query: (placement) => ({ url: API_ENDPOINTS.banners, params: { placement } }),
      providesTags: ['Banner'],
    }),
    /**
     * Counts the click. Fired alongside the navigation, so a failed count never
     * stops the visitor from reaching the advertiser.
     */
    recordBannerClick: builder.mutation<ApiResponse<{ linkUrl: string }>, string>({
      query: (id) => ({ url: API_ENDPOINTS.bannerClick(id), method: 'POST' }),
    }),
  }),
});

export const { useGetBannersQuery, useRecordBannerClickMutation } = bannerApi;
