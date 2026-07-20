import { createApi } from '@reduxjs/toolkit/query/react';
import type { EmployerProfileForm } from '../../data/profileData';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type EmployerProfileStatus = 'draft' | 'submitted';

export type EmployerProfilePayload = EmployerProfileForm & {
  status: EmployerProfileStatus;
};

export type EmployerProfileResponse = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  openJobs?: number;
} & EmployerProfilePayload;

export type EmployerProfileUpdatePayload = Partial<Omit<EmployerProfileForm, 'email' | 'phoneNumber'>>;

export type EmployerListParams = {
  search?: string;
  location?: string;
  type?: string;
  size?: string;
  page?: number;
  limit?: number;
};

export type PaginatedEmployers = {
  items: EmployerProfileResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type EmployerLogoUploadResponse = {
  fileName: string;
  mimeType: string;
  url: string;
};

export type EmployerPrefillResponse = {
  companyName: string;
  organizationType: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  website: string;
  teamSize: string;
  headquarters: string;
  overview: string;
  hiringRegions: string[];
  status: 'imported' | 'registered';
};

export const employerProfileApi = createApi({
  reducerPath: 'employerProfileApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['EmployerProfile'],
  endpoints: (builder) => ({
    createEmployerProfile: builder.mutation<ApiResponse<EmployerProfileResponse>, EmployerProfilePayload>({
      query: (profile) => ({
        url: API_ENDPOINTS.employerProfiles,
        method: 'POST',
        data: profile,
      }),
      invalidatesTags: ['EmployerProfile'],
    }),
    getEmployerProfiles: builder.query<ApiResponse<PaginatedEmployers>, EmployerListParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.employerProfiles,
        params,
      }),
      providesTags: ['EmployerProfile'],
    }),
    getEmployerProfile: builder.query<ApiResponse<EmployerProfileResponse>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.employerProfileById(id),
      }),
      providesTags: ['EmployerProfile'],
    }),
    getMyEmployerProfile: builder.query<ApiResponse<EmployerProfileResponse>, void>({
      query: () => ({
        url: API_ENDPOINTS.employerProfileMe,
      }),
      providesTags: ['EmployerProfile'],
    }),
    updateMyEmployerProfile: builder.mutation<ApiResponse<EmployerProfileResponse>, EmployerProfileUpdatePayload>({
      query: (profile) => ({
        url: API_ENDPOINTS.employerProfileMe,
        method: 'PATCH',
        data: profile,
      }),
      invalidatesTags: ['EmployerProfile'],
    }),
    prefillEmployerProfile: builder.query<ApiResponse<EmployerPrefillResponse>, string>({
      query: (identifier) => ({
        url: API_ENDPOINTS.employerProfilePrefill,
        params: { identifier },
      }),
    }),
    uploadEmployerLogo: builder.mutation<ApiResponse<EmployerLogoUploadResponse>, File>({
      query: (logo) => {
        const formData = new FormData();
        formData.append('logo', logo);

        return {
          url: API_ENDPOINTS.employerProfileLogo,
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
  }),
});

export const {
  useCreateEmployerProfileMutation,
  useGetEmployerProfilesQuery,
  useGetEmployerProfileQuery,
  useGetMyEmployerProfileQuery,
  useUpdateMyEmployerProfileMutation,
  useUploadEmployerLogoMutation,
  useLazyPrefillEmployerProfileQuery,
} = employerProfileApi;
