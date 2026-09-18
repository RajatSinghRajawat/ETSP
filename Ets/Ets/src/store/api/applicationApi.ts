import { createApi } from '@reduxjs/toolkit/query/react';
import type { CandidateProfileResponse } from './candidateProfileApi';
import type { JobResponse } from './jobApi';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type ApplicationStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

/** The employer's private ✓ / ? / ✗ triage mark; '' means not marked yet. */
export type EmployerInterest = '' | 'interested' | 'undecided' | 'not_interested';

export type ScreeningAnswer = { question: string; answer: string };

export type InterviewMode = 'in_person' | 'video' | 'phone' | '';

export type ApplicationInterview = {
  scheduledAt: string | null;
  mode: InterviewMode;
  location: string;
  message: string;
};

export type ApplicationStatusEvent = {
  status: ApplicationStatus;
  message: string;
  interviewAt: string | null;
  changedAt: string;
};

/** Employer decision sent with a status change. */
export type ApplicationDecisionPayload = {
  id: string;
  status: ApplicationStatus;
  /** Required when rejecting; optional note otherwise. */
  message?: string;
  /** `datetime-local` value or ISO string; only meaningful on an accept. */
  interviewAt?: string | null;
  interviewMode?: InterviewMode;
  interviewLocation?: string;
};

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
  employerInterest?: EmployerInterest;
  viewedByEmployer?: boolean;
  viewedAt?: string | null;
  employerMessage?: string;
  interview?: ApplicationInterview | null;
  statusHistory?: ApplicationStatusEvent[];
  createdAt: string;
  updatedAt: string;
};

/** Per-job application tallies for the employer dashboard job list. */
export type JobApplicationCounts = {
  total: number;
  new: number;
  reviewing: number;
  shortlisted: number;
  rejected: number;
  hired: number;
};

export type EmployerApplicationCounts = {
  byJob: Record<string, JobApplicationCounts>;
  total: number;
};

/** Order of the employer's applicant list. */
export type ApplicationSort = 'newest' | 'oldest' | 'status';

export type ApplicationListParams = {
  status?: ApplicationStatus | '';
  job?: string;
  /** Matches candidate name, headline, location or skills. */
  search?: string;
  location?: string;
  /** An interest mark, or 'unmarked' for applicants not triaged yet. */
  interest?: EmployerInterest | 'unmarked';
  sort?: ApplicationSort;
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
  /** True once the employer has opened the application. */
  viewedByEmployer?: boolean;
  viewedAt?: string | null;
  /** The employer's latest note — rejection reason or interview message. */
  employerMessage?: string;
  interview?: ApplicationInterview | null;
  statusHistory?: ApplicationStatusEvent[];
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
    getEmployerApplicationCounts: builder.query<ApiResponse<EmployerApplicationCounts>, void>({
      query: () => ({
        url: API_ENDPOINTS.employerApplicationCounts,
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
    /**
     * Private triage mark. Kept separate from the status mutation because it
     * must not notify the candidate or move them through the pipeline.
     */
    setEmployerApplicationInterest: builder.mutation<
      ApiResponse<JobApplicationResponse>,
      { id: string; interest: EmployerInterest }
    >({
      query: ({ id, interest }) => ({
        url: API_ENDPOINTS.employerApplicationInterestById(id),
        method: 'PATCH',
        data: { interest },
      }),
      invalidatesTags: (_result, _error, { id }) => ['Application', { type: 'Application', id }],
    }),
    updateEmployerApplication: builder.mutation<
      ApiResponse<JobApplicationResponse>,
      ApplicationDecisionPayload
    >({
      query: ({ id, ...decision }) => ({
        url: API_ENDPOINTS.employerApplicationById(id),
        method: 'PATCH',
        data: decision,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Application', { type: 'Application', id }],
    }),
  }),
});

export const {
  useCreateApplicationMutation,
  useGetAutoApplyStatusQuery,
  useGetEmployerApplicationCountsQuery,
  useGetEmployerApplicationQuery,
  useGetEmployerApplicationsQuery,
  useGetMyApplicationsQuery,
  useGetMyApplicationStatusQuery,
  useSetAutoApplyMutation,
  useSetEmployerApplicationInterestMutation,
  useUpdateEmployerApplicationMutation,
} = applicationApi;
