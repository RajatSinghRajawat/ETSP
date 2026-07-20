import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type LookupItem = {
  _id: string;
  name: string;
  value: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LookupListParams = {
  search?: string;
  includeInactive?: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const lookupApi = createApi({
  reducerPath: 'lookupApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['JobType', 'Skill', 'Education', 'SalaryUnit'],
  endpoints: (builder) => ({
    getJobTypes: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.jobTypes, params: params ?? undefined }),
      providesTags: ['JobType'],
    }),
    getSkills: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.skills, params: params ?? undefined }),
      providesTags: ['Skill'],
    }),
    getEducations: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.educations, params: params ?? undefined }),
      providesTags: ['Education'],
    }),
    getSalaryUnits: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.salaryUnits, params: params ?? undefined }),
      providesTags: ['SalaryUnit'],
    }),
  }),
});

export const {
  useGetJobTypesQuery,
  useGetSkillsQuery,
  useGetEducationsQuery,
  useGetSalaryUnitsQuery,
} = lookupApi;
