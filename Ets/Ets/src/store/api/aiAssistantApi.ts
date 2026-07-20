import { createApi } from '@reduxjs/toolkit/query/react';
import type { CandidateProfileForm } from '../../data/profileData';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type RefinedCandidateProfile = Partial<Omit<CandidateProfileForm, 'email' | 'aadhaarVerified' | 'photoUrl' | 'certifications'>>;

export type AiJobMatch = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  skills: string[];
  experience: string;
  education: string;
  score?: number;
};

export type AiJobSearchResult = {
  jobs: AiJobMatch[];
  summary: string;
  filters: {
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    skills?: string[];
    keyword?: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const aiAssistantApi = createApi({
  reducerPath: 'aiAssistantApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    refineCandidateProfile: builder.mutation<ApiResponse<RefinedCandidateProfile>, Record<string, string>>({
      query: (answers) => ({
        url: API_ENDPOINTS.aiRefineCandidateProfile,
        method: 'POST',
        data: { answers },
      }),
    }),
    searchJobsWithAi: builder.mutation<ApiResponse<AiJobSearchResult>, { query: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.aiJobSearch,
        method: 'POST',
        data: body,
      }),
    }),
  }),
});

export const { useRefineCandidateProfileMutation, useSearchJobsWithAiMutation } = aiAssistantApi;
