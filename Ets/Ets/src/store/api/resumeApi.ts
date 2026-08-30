import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

type ApiResponse<T> = { success: boolean; message: string; data: T };

/** Which of the two resumes employers see. */
export type ResumeSource = 'ai' | 'upload';

export type UploadedResumeFile = {
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string | null;
};

export type ResumeData = {
  _id: string;
  candidateId: string;
  /** Empty for a candidate who only uploaded a file. */
  htmlContent: string;
  uploadedFile?: UploadedResumeFile | null;
  source?: ResumeSource;
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
    uploadMyResume: builder.mutation<ApiResponse<ResumeData>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: API_ENDPOINTS.myResumeUpload,
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: ['Resume'],
    }),
    deleteMyUploadedResume: builder.mutation<ApiResponse<ResumeData>, void>({
      query: () => ({ url: API_ENDPOINTS.myResumeUpload, method: 'DELETE' }),
      invalidatesTags: ['Resume'],
    }),
    setMyResumeSource: builder.mutation<ApiResponse<ResumeData>, ResumeSource>({
      query: (source) => ({
        url: API_ENDPOINTS.myResumeSource,
        method: 'PUT',
        data: { source },
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
  useDeleteMyUploadedResumeMutation,
  useSetMyResumeSourceMutation,
  useUploadMyResumeMutation,
  useGetMyResumeQuery,
  useSaveMyResumeMutation,
  useRefineMyResumeMutation,
  useGetCandidateResumeMutation,
} = resumeApi;
