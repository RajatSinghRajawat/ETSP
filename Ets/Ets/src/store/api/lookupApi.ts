import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type LookupCategory =
  | 'job_type'
  | 'skill'
  | 'education'
  | 'salary_unit'
  | 'employment_type'
  | 'gender'
  | 'experience_band'
  | 'job_title'
  | 'organization_type'
  | 'team_size'
  | 'workplace_model'
  | 'hiring_priority'
  | 'course_type'
  | 'benefit'
  | 'specialty';

export type LookupItem = {
  _id: string;
  name: string;
  value: string;
  description?: string;
  order: number;
  isActive: boolean;
  status?: string;
  category?: LookupCategory;
  createdAt?: string;
  updatedAt?: string;
};

export type LookupListParams = {
  search?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const lookupApi = createApi({
  reducerPath: 'lookupApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Lookup', 'JobType', 'Skill', 'Education', 'SalaryUnit'],
  endpoints: (builder) => ({
    getLookups: builder.query<ApiResponse<LookupItem[]>, { category: LookupCategory } & LookupListParams>({
      query: ({ category, ...params }) => ({
        url: API_ENDPOINTS.lookups(category),
        params: params.search ? { search: params.search } : undefined,
      }),
      providesTags: (_result, _err, arg) => [{ type: 'Lookup', id: arg.category }],
    }),
    proposeLookup: builder.mutation<
      ApiResponse<LookupItem>,
      { category: LookupCategory; name: string }
    >({
      query: ({ category, name }) => ({
        url: API_ENDPOINTS.lookupPropose(category),
        method: 'POST',
        data: { name },
      }),
      invalidatesTags: (_result, _err, arg) => [{ type: 'Lookup', id: arg.category }],
    }),
    // Legacy aliases kept for existing call sites.
    getJobTypes: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.jobTypes, params: params ?? undefined }),
      providesTags: [{ type: 'Lookup', id: 'job_type' }, 'JobType'],
    }),
    getSkills: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.skills, params: params ?? undefined }),
      providesTags: [{ type: 'Lookup', id: 'skill' }, 'Skill'],
    }),
    getEducations: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.educations, params: params ?? undefined }),
      providesTags: [{ type: 'Lookup', id: 'education' }, 'Education'],
    }),
    getSalaryUnits: builder.query<ApiResponse<LookupItem[]>, LookupListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.salaryUnits, params: params ?? undefined }),
      providesTags: [{ type: 'Lookup', id: 'salary_unit' }, 'SalaryUnit'],
    }),
  }),
});

export const {
  useGetLookupsQuery,
  useProposeLookupMutation,
  useGetJobTypesQuery,
  useGetSkillsQuery,
  useGetEducationsQuery,
  useGetSalaryUnitsQuery,
} = lookupApi;
