import { createApi } from '@reduxjs/toolkit/query/react';
import type { JobResponse } from './jobApi';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type SavedJobResponse = {
  _id: string;
  job: JobResponse;
  savedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const savedJobApi = createApi({
  reducerPath: 'savedJobApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SavedJob'],
  endpoints: (builder) => ({
    getMySavedJobs: builder.query<ApiResponse<{ items: SavedJobResponse[] }>, void>({
      query: () => ({
        url: API_ENDPOINTS.mySavedJobs,
      }),
      providesTags: ['SavedJob'],
    }),
    saveJob: builder.mutation<ApiResponse<{ _id: string }>, string>({
      query: (jobId) => ({
        url: API_ENDPOINTS.savedJobs,
        method: 'POST',
        data: { jobId },
      }),
      invalidatesTags: ['SavedJob'],
    }),
    unsaveJob: builder.mutation<ApiResponse<{ jobId: string }>, string>({
      query: (jobId) => ({
        url: API_ENDPOINTS.savedJobById(jobId),
        method: 'DELETE',
      }),
      invalidatesTags: ['SavedJob'],
    }),
  }),
});

export const {
  useGetMySavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} = savedJobApi;
