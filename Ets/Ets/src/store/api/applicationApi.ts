import { createApi } from '@reduxjs/toolkit/query/react';
import type { CandidateProfileResponse } from './candidateProfileApi';
import type { JobResponse } from './jobApi';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type ApplicationStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

export type ScreeningAnswer = { question: string; answer: string };

export type JobApplicationPayload = {
  jobId: string;
  coverLetter?: string;
  screeningAnswers?: ScreeningAnswer[];
};

export type JobApplicationResponse = {
  _id: string;
  job: JobResponse;
  employerProfile: string;
  candidateProfile: CandidateProfileResponse;
  candidateEmail: string;
  coverLetter: string;
  screeningAnswers?: ScreeningAnswer[];
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationListParams = {
  status?: ApplicationStatus | '';
  job?: string;
  page?: number;
  limit?: number;
};

type PaginatedApplications = {
  items: JobApplicationResponse[];
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

export type MyApplicationSummary = {
  _id: string;
  job: Pick<JobResponse, '_id' | 'title' | 'companyName' | 'location' | 'type' | 'salary' | 'status'>;
  status: ApplicationStatus;
  coverLetter: string;
  createdAt: string;
  updatedAt: string;
};

export type MyApplicationStatus = {
  applied: boolean;
  application: {
    _id: string;
    job: string;
    status: ApplicationStatus;
    coverLetter: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type AutoApplyStatus = {
  enabled: boolean;
  allowedByPlan: boolean;
  planName: string | null;
};

export type AutoApplyResult = {
  enabled: boolean;
  applied: number;
  matched: number;
  quotaExhausted?: boolean;
  jobs: Array<{ _id: string; title: string; companyName: string; location: string }>;
};

export const applicationApi = createApi({
  reducerPath: 'applicationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Application', 'MyApplication', 'AutoApply'],
  endpoints: (builder) => ({
    createApplication: builder.mutation<ApiResponse<JobApplicationResponse>, JobApplicationPayload>({
      query: (application) => ({
        url: API_ENDPOINTS.applications,
        method: 'POST',
        data: application,
      }),
      invalidatesTags: (_result, _error, payload) => [
        'Application',
        'MyApplication',
        { type: 'MyApplication', id: payload.jobId },
      ],
    }),
    getMyApplications: builder.query<ApiResponse<{ items: MyApplicationSummary[] }>, void>({
      query: () => ({
        url: API_ENDPOINTS.myApplications,
      }),
      providesTags: ['MyApplication'],
    }),
    getMyApplicationStatus: builder.query<ApiResponse<MyApplicationStatus>, string>({
      query: (jobId) => ({
        url: API_ENDPOINTS.myApplicationStatus(jobId),
      }),
      providesTags: (_result, _error, jobId) => [{ type: 'MyApplication', id: jobId }, 'MyApplication'],
    }),
    getEmployerApplications: builder.query<ApiResponse<PaginatedApplications>, ApplicationListParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.employerApplications,
        params,
      }),
      providesTags: ['Application'],
    }),
    getEmployerApplication: builder.query<ApiResponse<JobApplicationResponse>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.employerApplicationById(id),
      }),
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
    }),
    getAutoApplyStatus: builder.query<ApiResponse<AutoApplyStatus>, void>({
      query: () => ({
        url: API_ENDPOINTS.autoApply,
      }),
      providesTags: ['AutoApply'],
    }),
    setAutoApply: builder.mutation<ApiResponse<AutoApplyResult>, boolean>({
      query: (enabled) => ({
        url: API_ENDPOINTS.autoApply,
        method: 'POST',
        data: { enabled },
      }),
      invalidatesTags: ['AutoApply', 'MyApplication'],
    }),
    updateEmployerApplication: builder.mutation<
      ApiResponse<JobApplicationResponse>,
      { id: string; status: ApplicationStatus }
    >({
      query: ({ id, status }) => ({
        url: API_ENDPOINTS.employerApplicationById(id),
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => ['Application', { type: 'Application', id }],
    }),
  }),
});

export const {
  useCreateApplicationMutation,
  useGetAutoApplyStatusQuery,
  useGetEmployerApplicationQuery,
  useGetEmployerApplicationsQuery,
  useGetMyApplicationsQuery,
  useGetMyApplicationStatusQuery,
  useSetAutoApplyMutation,
  useUpdateEmployerApplicationMutation,
} = applicationApi;
