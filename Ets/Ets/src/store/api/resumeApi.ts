import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type ResumeData = {
  _id: string;
  candidateId: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
};

export const resumeApi = createApi({
  reducerPath: 'resumeApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Resume'],
  endpoints: (builder) => ({
    buildMyResume: builder.mutation<ApiResponse<ResumeData>, void>({
      query: () => ({ url: API_ENDPOINTS.myResume, method: 'POST' }),
      invalidatesTags: ['Resume'],
    }),
    getMyResume: builder.query<ApiResponse<ResumeData>, void>({
      query: () => ({ url: API_ENDPOINTS.myResume }),
      providesTags: ['Resume'],
    }),
    saveMyResume: builder.mutation<ApiResponse<ResumeData>, string>({
      query: (htmlContent) => ({
        url: API_ENDPOINTS.myResume,
        method: 'PUT',
        data: { htmlContent },
      }),
      invalidatesTags: ['Resume'],
    }),
    refineMyResume: builder.mutation<
      ApiResponse<ResumeData>,
      { mode: 'design' | 'data' | 'regenerate'; instructions: string }
    >({
      query: (body) => ({
        url: API_ENDPOINTS.myResumeRefine,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Resume'],
    }),
    // Employer/admin: fetches (and lazily builds) the resume for a given candidate id.
    getCandidateResume: builder.mutation<ApiResponse<ResumeData>, string>({
      query: (candidateId) => ({
        url: API_ENDPOINTS.candidateResumeById(candidateId),
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useBuildMyResumeMutation,
  useGetMyResumeQuery,
  useSaveMyResumeMutation,
  useRefineMyResumeMutation,
  useGetCandidateResumeMutation,
} = resumeApi;
