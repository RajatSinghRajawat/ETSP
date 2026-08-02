import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type SiteContact = {
  email: string;
  phone: string;
  address: string;
  workingHours: string;
};

export type SiteSocial = {
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
};

export type SiteAboutStat = {
  value: string;
  label: string;
};

export type SiteAbout = {
  heroTitle: string;
  heroSubtitle: string;
  storyTitle: string;
  storyBody: string;
  stats: SiteAboutStat[];
};

export type SiteContent = {
  contact: SiteContact;
  social: SiteSocial;
  about: SiteAbout;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const siteContentApi = createApi({
  reducerPath: 'siteContentApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SiteContent'],
  endpoints: (builder) => ({
    getSiteContent: builder.query<ApiResponse<SiteContent>, void>({
      query: () => ({ url: API_ENDPOINTS.siteContent }),
      providesTags: ['SiteContent'],
    }),
  }),
});

export const { useGetSiteContentQuery } = siteContentApi;
