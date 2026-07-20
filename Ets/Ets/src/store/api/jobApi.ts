import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type JobStatus = 'draft' | 'active' | 'closed' | 'expired';

export type ScreeningQuestion = { question: string };

export type JobPayload = {
  title: string;
  type: string;
  location: string;
  salary: string;
  description: string;
  skills: string[];
  experience: string;
  education: string;
  benefits: string;
  status: JobStatus;
  isFeatured?: boolean;
  screeningQuestions?: ScreeningQuestion[];
  /** Post (or reactivate) this job using a Pay-Per-Job credit. */
  useJobCredit?: boolean;
};

export type CandidateApplicationStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

export type JobResponse = JobPayload & {
  _id: string;
  employerProfile: string;
  employerEmail: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  isFeatured?: boolean;
  isUrgent?: boolean;
  postedVia?: 'free' | 'pay_per_job' | 'premium';
  unlockCreditsTotal?: number;
  unlockCreditsUsed?: number;
  screeningQuestions?: ScreeningQuestion[];
  // Present on public job listings when a candidate is signed in.
  hasApplied?: boolean;
  applicationStatus?: CandidateApplicationStatus | null;
};

export type JobAppliedFilter = '' | 'applied' | 'unapplied';

export type JobListParams = {
  search?: string;
  location?: string;
  type?: string;
  experience?: string;
  skill?: string;
  employerProfile?: string;
  applied?: JobAppliedFilter;
  page?: number;
  limit?: number;
};

export type PaginatedJobs = {
  items: JobResponse[];
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

export const jobApi = createApi({
  reducerPath: 'jobApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Job'],
  endpoints: (builder) => ({
    createJob: builder.mutation<ApiResponse<JobResponse>, JobPayload>({
      query: (job) => ({
        url: API_ENDPOINTS.jobs,
        method: 'POST',
        data: job,
      }),
      invalidatesTags: ['Job'],
    }),
    getMyJobs: builder.query<ApiResponse<JobResponse[]>, void>({
      query: () => ({
        url: API_ENDPOINTS.myJobs,
      }),
      providesTags: ['Job'],
    }),
    getJobs: builder.query<ApiResponse<PaginatedJobs>, JobListParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.jobs,
        params,
      }),
      providesTags: ['Job'],
    }),
    getJob: builder.query<ApiResponse<JobResponse>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.jobById(id),
      }),
      providesTags: (_result, _error, id) => [{ type: 'Job', id }],
    }),
    updateJob: builder.mutation<ApiResponse<JobResponse>, { id: string; job: JobPayload }>({
      query: ({ id, job }) => ({
        url: API_ENDPOINTS.jobById(id),
        method: 'PUT',
        data: job,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Job', { type: 'Job', id }],
    }),
  }),
});

export const {
  useCreateJobMutation,
  useGetJobQuery,
  useGetJobsQuery,
  useGetMyJobsQuery,
  useUpdateJobMutation,
} = jobApi;
