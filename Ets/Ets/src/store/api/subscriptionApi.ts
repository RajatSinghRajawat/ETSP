import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type PlanAudience = 'employer' | 'candidate';

export type PlanKey =
  | 'employer_free'
  | 'employer_pay_per_job'
  | 'employer_premium'
  | 'candidate_free'
  | 'candidate_excel'
  | null;

export type BillingInterval = 'month' | 'year';

export type PlanFeatures = {
  aiEnabled: boolean;
  // employer
  maxActiveJobs: number | null; // concurrent active jobs, null = unlimited
  jobValidityDays: number | null; // null = never expires
  featuredJobs: number; // concurrent featured jobs allowed
  searchFiltersEnabled: boolean; // location/experience/salary candidate filters
  chatEnabled: boolean;
  screeningQuestionsEnabled: boolean;
  unlockCreditsPerJob: number;
  visibleExcelProfilesPerJob: number | null; // null = ALL EXCEL applicants visible
  dedicatedAccountManager: boolean;
  creditAddonsEnabled: boolean; // may buy ₹199 → +20 credits
  perCvUnlockEnabled: boolean; // free-employer ₹25/₹75 CV unlocks
  autoReplyEnabled: boolean; // employer AI auto-ack in chat
  // candidate
  maxApplications: number | null;
  verifiedBadgeEnabled: boolean;
  featuredProfileEnabled: boolean;
  searchBoostEnabled: boolean;
  jobAlertsEnabled: boolean;
  autoApplyEnabled: boolean;
  profileBoostEnabled: boolean;
  directMessageEmployersPerMonth: number; // 3 on EXCEL
  visibilityToggleEnabled: boolean;
  followEmployersEnabled: boolean;
  resumeBuilderIncluded: boolean;
  maxJobPosts: number | null; // legacy, ignore
};

export type PublicPlan = {
  _id: string;
  name: string;
  description: string;
  audience: PlanAudience;
  planKey: PlanKey;
  priceInr: number;
  annualPriceInr: number | null;
  interval: 'month' | 'one_time'; // one_time = Pay Per Job → purchase flow
  features: PlanFeatures;
  isFree: boolean;
  sortOrder: number;
};

export type MySubscription = {
  plan: {
    _id: string;
    name: string;
    description?: string;
    planKey?: PlanKey;
    priceInr: number;
    annualPriceInr?: number | null;
    interval?: 'month' | 'one_time';
    features: PlanFeatures;
    isFree: boolean;
  } | null;
  isFree: boolean;
  status: 'incomplete' | 'active' | 'past_due' | 'canceled' | null;
  billingInterval: BillingInterval;
  cancelAtPeriodEnd: boolean;
  periodStart: string;
  periodEnd: string;
};

export type UsageMeter = { used: number; limit: number | null };

export type MyUsage = {
  plan: {
    _id: string;
    name: string;
    planKey: PlanKey;
    isFree: boolean;
    features: PlanFeatures;
  } | null;
  /** Employer: OR-merged with pay-per-job context — use this for UI gating. */
  effectiveFeatures: PlanFeatures;
  status: MySubscription['status'];
  billingInterval: BillingInterval;
  cancelAtPeriodEnd: boolean;
  periodStart: string;
  periodEnd: string;
  usage: {
    // employer
    activeJobs?: UsageMeter;
    featuredJobs?: { used: number; limit: number };
    jobCredits?: { available: number }; // unused Pay-Per-Job credits
    unlockCredits?: { accountBalance: number }; // add-on credit balance
    // candidate
    applications?: UsageMeter;
    directMessages?: { used: number; limit: number };
    resumeCredits?: { available: number };
  };
};

export type CheckoutPayload = {
  planId: string;
  billingInterval?: BillingInterval;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const subscriptionApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Subscription', 'Usage'],
  endpoints: (builder) => ({
    getPlans: builder.query<ApiResponse<{ items: PublicPlan[] }>, PlanAudience>({
      query: (audience) => ({
        url: `${API_ENDPOINTS.plans}?audience=${audience}`,
      }),
    }),
    getMySubscription: builder.query<ApiResponse<MySubscription>, void>({
      query: () => ({
        url: API_ENDPOINTS.subscriptionMe,
      }),
      providesTags: ['Subscription'],
    }),
    getMyUsage: builder.query<ApiResponse<MyUsage>, void>({
      query: () => ({
        url: API_ENDPOINTS.subscriptionUsage,
      }),
      providesTags: ['Usage'],
    }),
    createCheckout: builder.mutation<ApiResponse<{ url: string }>, CheckoutPayload>({
      query: (payload) => ({
        url: API_ENDPOINTS.subscriptionCheckout,
        method: 'POST',
        data: payload,
      }),
    }),
    confirmCheckout: builder.mutation<ApiResponse<MySubscription>, string>({
      query: (sessionId) => ({
        url: API_ENDPOINTS.subscriptionConfirm,
        method: 'POST',
        data: { sessionId },
      }),
      invalidatesTags: ['Subscription', 'Usage'],
    }),
    cancelSubscription: builder.mutation<
      ApiResponse<{ cancelAtPeriodEnd: boolean; periodEnd: string | null }>,
      void
    >({
      query: () => ({
        url: API_ENDPOINTS.subscriptionCancel,
        method: 'POST',
      }),
      invalidatesTags: ['Subscription', 'Usage'],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useGetMyUsageQuery,
  useCreateCheckoutMutation,
  useConfirmCheckoutMutation,
  useCancelSubscriptionMutation,
} = subscriptionApi;
