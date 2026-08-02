import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';
import { API_ENDPOINTS } from './endpoints';

export type SiteContact = {
  email: string;
  phone: string;
  address: string;
  workingHours: string;
  heroTitle: string;
  heroSubtitle: string;
  formTitle: string;
  formSubmitLabel: string;
};

export type SiteSocial = {
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
};

export type SiteAboutStat = {
  value: string;
  label: string;
};

export type SiteAboutValue = {
  id: string;
  title: string;
  description: string;
  iconKey?: string;
};

export type SiteAboutMilestone = {
  year: string;
  title: string;
  description: string;
};

export type SiteAboutTeamMember = {
  name: string;
  role: string;
  image?: string;
  experience?: string;
};

export type SiteAbout = {
  heroOverline: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaPath: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
  missionTitle: string;
  missionBody: string[];
  missionImageUrl: string;
  storyTitle: string;
  storyBody: string;
  stats: SiteAboutStat[];
  valuesTitle: string;
  valuesSubtitle: string;
  values: SiteAboutValue[];
  journeyTitle: string;
  journeySubtitle: string;
  milestones: SiteAboutMilestone[];
  teamTitle: string;
  teamSubtitle: string;
  team: SiteAboutTeamMember[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryPath: string;
  ctaSecondaryLabel: string;
  ctaSecondaryPath: string;
};

export type SiteHero = {
  badge: string;
  headlinePrefix: string;
  headlineAccent: string;
  headlineSuffix: string;
  subtitle: string;
  searchKeywordPlaceholder: string;
  searchLocationPlaceholder: string;
  searchButtonLabel: string;
  trustLine: string;
  hiringPrompt: string;
  hiringCtaLabel: string;
  hiringCtaPath: string;
  floatingBadge1Title: string;
  floatingBadge1Subtitle: string;
  floatingBadge2Title: string;
  floatingBadge2Subtitle: string;
};

export type SiteJobProfileItem = {
  id: string;
  title: string;
  description: string;
  searchQuery?: string;
  color?: string;
  bgColor?: string;
  iconKey?: string;
};

export type SiteJobProfiles = {
  title: string;
  subtitle: string;
  exploreLabel: string;
  items: SiteJobProfileItem[];
};

export type SiteLegalSection = {
  id: string;
  title: string;
  body: string[];
};

export type SiteLegalPage = {
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  intro: string;
  sections: SiteLegalSection[];
  contactCardTitle: string;
  contactCardBody: string;
};

export type SiteLocaleContent = {
  contact: SiteContact;
  about: SiteAbout;
  hero: SiteHero;
  jobProfiles: SiteJobProfiles;
  privacy: SiteLegalPage;
  terms: SiteLegalPage;
  cookies: SiteLegalPage;
};

/** Bilingual CMS payload from `/site-content`. */
export type SiteContent = {
  social: SiteSocial;
  en: SiteLocaleContent;
  hi: SiteLocaleContent;
};

/** Flat view used by pages after picking the active locale. */
export type LocalizedSiteContent = SiteLocaleContent & {
  social: SiteSocial;
};

export type BillingStatus = {
  subscriptionsEnabled: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const siteContentApi = createApi({
  reducerPath: 'siteContentApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SiteContent', 'BillingStatus'],
  endpoints: (builder) => ({
    getSiteContent: builder.query<ApiResponse<SiteContent>, void>({
      query: () => ({ url: API_ENDPOINTS.siteContent }),
      providesTags: ['SiteContent'],
    }),
    getBillingStatus: builder.query<ApiResponse<BillingStatus>, void>({
      query: () => ({ url: API_ENDPOINTS.billingStatus }),
      providesTags: ['BillingStatus'],
    }),
  }),
});

export const { useGetSiteContentQuery, useGetBillingStatusQuery } = siteContentApi;
