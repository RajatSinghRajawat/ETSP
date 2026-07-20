import { createApi } from '@reduxjs/toolkit/query/react';
import type { CandidateProfileForm } from '../../data/profileData';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type CandidateProfileStatus = 'draft' | 'submitted';

export type CandidateProfilePayload = CandidateProfileForm & {
  status: CandidateProfileStatus;
};

export type CandidateProfileResponse = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  /** True when the employer viewing this profile has not unlocked it (masked data). */
  locked?: boolean;
  excelMember?: boolean;
  verifiedBadge?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profileVisible?: boolean;
  jobAlertsEnabled?: boolean;
  resumeCreditBalance?: number;
  subscriptionTier?: 'free' | 'excel';
  searchBoost?: boolean;
} & CandidateProfilePayload;

export type CandidateProfileUpdatePayload = Partial<Omit<CandidateProfileForm, 'email' | 'phone'>> & {
  profileVisible?: boolean;
  jobAlertsEnabled?: boolean;
};

export type CandidateListParams = {
  search?: string;
  location?: string;
  experience?: string;
  salary?: string;
  skill?: string;
  page?: number;
  limit?: number;
};

export type UnlockCandidateResult = {
  candidate: CandidateProfileResponse;
  meters: {
    accountBalance: number;
    perJob: Array<{ job: string; title: string; status: string; total: number; used: number }>;
  };
  alreadyUnlocked: boolean;
};

export type FollowedEmployer = {
  _id: string;
  employerProfile: {
    _id?: string;
    companyName: string;
    logoUrl?: string;
    headquarters?: string;
    organizationType?: string;
  } | null;
  followedAt: string;
};

export type PaginatedCandidates = {
  items: CandidateProfileResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FeaturedCandidate = {
  _id: string;
  firstName: string;
  lastNameInitial: string;
  currentJobTitle?: string;
  organizationName?: string;
  currentLocation?: string;
  skills: string[];
  photoUrl?: string;
  aadhaarVerified: boolean;
  educationLevel?: string;
  degree?: string;
  excelMember?: boolean;
  verifiedBadge?: boolean;
  featuredProfile?: boolean;
};

export type FeaturedCandidatesResult = {
  items: FeaturedCandidate[];
  total: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type CandidateProfileImageUploadResponse = {
  fileName: string;
  mimeType: string;
  url: string;
};

export const candidateProfileApi = createApi({
  reducerPath: 'candidateProfileApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['CandidateProfile', 'Follows'],
  endpoints: (builder) => ({
    createCandidateProfile: builder.mutation<ApiResponse<CandidateProfileResponse>, CandidateProfilePayload>({
      query: (profile) => ({
        url: API_ENDPOINTS.candidateProfiles,
        method: 'POST',
        data: profile,
      }),
      invalidatesTags: ['CandidateProfile'],
    }),
    uploadCandidateProfileImage: builder.mutation<ApiResponse<CandidateProfileImageUploadResponse>, File>({
      query: (image) => {
        const formData = new FormData();
        formData.append('image', image);

        return {
          url: API_ENDPOINTS.candidateProfileImage,
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
    getCandidateProfiles: builder.query<ApiResponse<PaginatedCandidates>, CandidateListParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.candidateProfiles,
        params,
      }),
      providesTags: ['CandidateProfile'],
    }),
    getCandidateProfile: builder.query<ApiResponse<CandidateProfileResponse>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.candidateProfileById(id),
      }),
      providesTags: ['CandidateProfile'],
    }),
    getFeaturedCandidates: builder.query<ApiResponse<FeaturedCandidatesResult>, { limit?: number } | void>({
      query: (params) => ({
        url: API_ENDPOINTS.candidateProfilesFeatured,
        params: params || undefined,
      }),
      providesTags: ['CandidateProfile'],
    }),
    getMyCandidateProfile: builder.query<ApiResponse<CandidateProfileResponse>, void>({
      query: () => ({
        url: API_ENDPOINTS.candidateProfileMe,
      }),
      providesTags: ['CandidateProfile'],
    }),
    updateMyCandidateProfile: builder.mutation<ApiResponse<CandidateProfileResponse>, CandidateProfileUpdatePayload>({
      query: (profile) => ({
        url: API_ENDPOINTS.candidateProfileMe,
        method: 'PATCH',
        data: profile,
      }),
      invalidatesTags: ['CandidateProfile'],
    }),
    unlockCandidate: builder.mutation<
      ApiResponse<UnlockCandidateResult>,
      { id: string; jobId?: string }
    >({
      query: ({ id, jobId }) => ({
        url: API_ENDPOINTS.candidateUnlock(id),
        method: 'POST',
        data: jobId ? { jobId } : {},
      }),
      invalidatesTags: ['CandidateProfile'],
    }),
    verifyPhone: builder.mutation<ApiResponse<{ alreadyVerified?: boolean; message?: string }>, void>({
      query: () => ({
        url: API_ENDPOINTS.verifyPhone,
        method: 'POST',
      }),
    }),
    verifyPhoneConfirm: builder.mutation<ApiResponse<{ phoneVerified: boolean }>, { otp: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.verifyPhoneConfirm,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['CandidateProfile'],
    }),
    getMyFollows: builder.query<ApiResponse<{ items: FollowedEmployer[] }>, void>({
      query: () => ({
        url: API_ENDPOINTS.myFollows,
      }),
      providesTags: ['Follows'],
    }),
    followEmployer: builder.mutation<ApiResponse<{ following: boolean }>, string>({
      query: (employerProfileId) => ({
        url: API_ENDPOINTS.employerFollow(employerProfileId),
        method: 'POST',
      }),
      invalidatesTags: ['Follows'],
    }),
    unfollowEmployer: builder.mutation<ApiResponse<{ following: boolean }>, string>({
      query: (employerProfileId) => ({
        url: API_ENDPOINTS.employerFollow(employerProfileId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Follows'],
    }),
  }),
});

export const {
  useCreateCandidateProfileMutation,
  useUploadCandidateProfileImageMutation,
  useGetCandidateProfilesQuery,
  useGetCandidateProfileQuery,
  useGetFeaturedCandidatesQuery,
  useGetMyCandidateProfileQuery,
  useUpdateMyCandidateProfileMutation,
  useUnlockCandidateMutation,
  useVerifyPhoneMutation,
  useVerifyPhoneConfirmMutation,
  useGetMyFollowsQuery,
  useFollowEmployerMutation,
  useUnfollowEmployerMutation,
} = candidateProfileApi;
