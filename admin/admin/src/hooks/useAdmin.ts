import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, downloadFile } from '../lib/api';
import type {
  AdminPurchase,
  AdminSubscription,
  ApiResponse,
  ApplicationRow,
  ApplicationStatus,
  AssistantReply,
  BannerPlacement,
  BannerRow,
  BannerUploadResult,
  CandidateRow,
  ChatMessage,
  DashboardAnalytics,
  DashboardStats,
  EmailSettingsView,
  EmployerFilterOptions,
  EmployerImportSummary,
  EmployerRow,
  GrantSubscriptionInput,
  ImportedEmployerRow,
  JobRow,
  LookupCategory,
  LookupCategoryMeta,
  LookupListResult,
  LookupOption,
  LookupStatus,
  Msg91SettingsView,
  Paginated,
  Plan,
  PlanAudience,
  PlanInput,
  PurchaseStatus,
  PurchaseType,
  ResumeData,
  Role,
  TicketPriority,
  TicketStatus,
  StripeSettingsView,
  SubscriptionStatus,
  SupportTicket,
  SupportTicketListResult,
  UserRow,
} from '../types';

export interface ListQuery extends Record<string, unknown> {
  page?: number;
  limit?: number;
  search?: string;
}

function unwrap<T>(data: ApiResponse<T>): T {
  return data.data;
}

export function useStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>('/admin/stats');
      return unwrap(res.data);
    },
    staleTime: 30_000,
  });
}

export function useAnalytics(params: { city?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'analytics', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardAnalytics>>('/admin/analytics', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useAskAssistant() {
  return useMutation({
    mutationFn: async (body: { question: string; history: ChatMessage[] }) => {
      const res = await api.post<ApiResponse<AssistantReply>>('/admin/assistant', body);
      return unwrap(res.data);
    },
  });
}

export function useUsers(params: ListQuery & { role?: Role; isActive?: 'true' | 'false' }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<UserRow>>>('/admin/users', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { role?: Role; isActive?: boolean } }) => {
      const res = await api.patch<ApiResponse<UserRow>>(`/admin/users/${id}`, body);
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useCandidates(params: ListQuery & { status?: string; location?: string }) {
  return useQuery({
    queryKey: ['admin', 'candidates', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<CandidateRow>>>('/admin/candidates', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
  });
}

export function useCandidate(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'candidate', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CandidateRow>>(`/admin/candidates/${id}`);
      return unwrap(res.data);
    },
    enabled: Boolean(id),
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/candidates/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useApproveCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<CandidateRow>>(`/admin/candidates/${id}/approve`);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useRejectCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<CandidateRow>>(`/admin/candidates/${id}/reject`);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useBuildResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (candidateId: string) => {
      const res = await api.post<ApiResponse<ResumeData>>(`/admin/candidates/${candidateId}/resume`);
      return unwrap(res.data);
    },
    onSuccess: (_data, candidateId) => {
      qc.invalidateQueries({ queryKey: ['admin', 'resume', candidateId] });
    },
  });
}

export function useGetResume(candidateId: string | null) {
  return useQuery({
    queryKey: ['admin', 'resume', candidateId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ResumeData>>(`/admin/candidates/${candidateId}/resume`);
      return unwrap(res.data);
    },
    enabled: Boolean(candidateId),
    retry: false,
  });
}

export function useSaveResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ candidateId, htmlContent }: { candidateId: string; htmlContent: string }) => {
      const res = await api.put<ApiResponse<ResumeData>>(`/admin/candidates/${candidateId}/resume`, { htmlContent });
      return unwrap(res.data);
    },
    onSuccess: (_data, { candidateId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'resume', candidateId] });
    },
  });
}

export function useEmployers(
  params: ListQuery & { status?: string; industry?: string; headquarters?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['admin', 'employers', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<EmployerRow>>>('/admin/employers', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}

/** Industry / headquarters values present on employer profiles, for the filter dropdowns. */
export function useEmployerFilterOptions() {
  return useQuery({
    queryKey: ['admin', 'employers', 'filters'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<EmployerFilterOptions>>('/admin/employers/filters');
      return unwrap(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployer(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'employer', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<EmployerRow>>(`/admin/employers/${id}`);
      return unwrap(res.data);
    },
    enabled: Boolean(id),
  });
}

export function useDeleteEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/employers/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'employers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useApproveEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<EmployerRow>>(`/admin/employers/${id}/approve`);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'employers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useRejectEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<EmployerRow>>(`/admin/employers/${id}/reject`);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'employers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useImportEmployers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ApiResponse<EmployerImportSummary>>(
        '/admin/imported-employers/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 },
      );
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'imported-employers'] });
    },
  });
}

export function useImportedEmployers(
  params: ListQuery & { status?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['admin', 'imported-employers', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<ImportedEmployerRow>>>('/admin/imported-employers', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}

type EmployerExportArgs = {
  view: 'registered' | 'imported';
  search?: string;
  status?: string;
  industry?: string;
  headquarters?: string;
};

/**
 * Download the employers currently matching the admin's filters — the whole
 * result set, not just the page on screen. Industry and headquarters only exist
 * on registered profiles, so they are left off the imported-employer export.
 */
export function useExportEmployers() {
  return useMutation({
    mutationFn: async ({ view, search, status, industry, headquarters }: EmployerExportArgs) => {
      const registered = view === 'registered';
      const path = registered ? '/admin/employers/export' : '/admin/imported-employers/export';
      const fallbackName = registered ? 'registered-employers.xlsx' : 'imported-employers.xlsx';
      await downloadFile(
        path,
        {
          search: search || undefined,
          status: status || undefined,
          ...(registered
            ? { industry: industry || undefined, headquarters: headquarters || undefined }
            : {}),
        },
        fallbackName,
      );
    },
  });
}

/** Download the blank import sheet showing the columns the uploader expects. */
export function useDownloadEmployerTemplate() {
  return useMutation({
    mutationFn: async () => {
      await downloadFile('/admin/imported-employers/template', undefined, 'employer-import-format.xlsx');
    },
  });
}

export function useDeleteImportedEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/imported-employers/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'imported-employers'] });
    },
  });
}

export function useJobs(params: ListQuery & { status?: string; location?: string }) {
  return useQuery({
    queryKey: ['admin', 'jobs', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<JobRow>>>('/admin/jobs', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
  });
}

export function useJob(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'job', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<JobRow>>(`/admin/jobs/${id}`);
      return unwrap(res.data);
    },
    enabled: Boolean(id),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Pick<JobRow, 'status' | 'title' | 'location' | 'salary' | 'type' | 'experience'>> }) => {
      const res = await api.patch<ApiResponse<JobRow>>(`/admin/jobs/${id}`, body);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useApproveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<JobRow>>(`/admin/jobs/${id}/approve`);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useRejectJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<JobRow>>(`/admin/jobs/${id}/reject`);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/jobs/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useApplications(params: ListQuery & { status?: ApplicationStatus | '' }) {
  return useQuery({
    queryKey: ['admin', 'applications', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<ApplicationRow>>>('/admin/applications', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const res = await api.patch<ApiResponse<ApplicationRow>>(`/admin/applications/${id}`, { status });
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/applications/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function usePlans(params: { audience?: PlanAudience | '' } = {}) {
  return useQuery({
    queryKey: ['admin', 'plans', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: Plan[] }>>('/admin/plans', {
        params: { audience: params.audience || undefined },
      });
      return unwrap(res.data).items;
    },
    placeholderData: (previous) => previous,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PlanInput) => {
      const res = await api.post<ApiResponse<Plan>>('/admin/plans', body);
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Omit<PlanInput, 'audience'>> }) => {
      const res = await api.patch<ApiResponse<Plan>>(`/admin/plans/${id}`, body);
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<ApiResponse<Plan>>(`/admin/plans/${id}`);
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
  });
}

export function useSyncPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<Plan>>(`/admin/plans/${id}/sync`);
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
  });
}

export function useAdminSubscriptions(
  params: ListQuery & { status?: SubscriptionStatus | ''; audience?: PlanAudience | '' },
) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<AdminSubscription>>>('/admin/subscriptions', {
        params: {
          ...params,
          status: params.status || undefined,
          audience: params.audience || undefined,
        },
      });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
  });
}

export function useGrantSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: GrantSubscriptionInput) => {
      const res = await api.post<ApiResponse<AdminSubscription>>('/admin/subscriptions/grant', body);
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'plans'] });
    },
  });
}

export function usePurchases(
  params: ListQuery & { type?: PurchaseType | ''; status?: PurchaseStatus | '' },
) {
  return useQuery({
    queryKey: ['admin', 'purchases', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<AdminPurchase>>>('/admin/purchases', {
        params: {
          ...params,
          type: params.type || undefined,
          status: params.status || undefined,
        },
      });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
  });
}

export function useStripeSettings() {
  return useQuery({
    queryKey: ['admin', 'settings', 'stripe'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<StripeSettingsView>>('/admin/settings/stripe');
      return unwrap(res.data);
    },
  });
}

export function useUpdateStripeSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      secretKey?: string;
      publishableKey?: string;
      webhookSecret?: string;
      subscriptionsEnabled?: boolean;
    }) => {
      const res = await api.put<ApiResponse<StripeSettingsView>>('/admin/settings/stripe', body);
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings', 'stripe'] }),
  });
}

export function useEmailSettings() {
  return useQuery({
    queryKey: ['admin', 'settings', 'email'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<EmailSettingsView>>('/admin/settings/email');
      return unwrap(res.data);
    },
  });
}

export interface EmailSettingsInput {
  enabled?: boolean;
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: EmailSettingsInput) => {
      const res = await api.put<ApiResponse<EmailSettingsView>>('/admin/settings/email', body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings', 'email'] }),
  });
}

export interface SiteLegalSection {
  id: string;
  title: string;
  body: string[];
}

export interface SiteLegalPage {
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  intro: string;
  sections: SiteLegalSection[];
  contactCardTitle: string;
  contactCardBody: string;
}

export interface SiteJobProfileItem {
  id: string;
  title: string;
  description: string;
  searchQuery?: string;
  color?: string;
  bgColor?: string;
  iconKey?: string;
}

export interface SiteLocaleContent {
  contact: {
    email: string;
    phone: string;
    address: string;
    workingHours: string;
    heroTitle: string;
    heroSubtitle: string;
    formTitle: string;
    formSubmitLabel: string;
  };
  about: {
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
    stats: Array<{ value: string; label: string }>;
    valuesTitle: string;
    valuesSubtitle: string;
    values: Array<{ id: string; title: string; description: string; iconKey?: string }>;
    journeyTitle: string;
    journeySubtitle: string;
    milestones: Array<{ year: string; title: string; description: string }>;
    teamTitle: string;
    teamSubtitle: string;
    team: Array<{ name: string; role: string; image?: string; experience?: string }>;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaPrimaryLabel: string;
    ctaPrimaryPath: string;
    ctaSecondaryLabel: string;
    ctaSecondaryPath: string;
  };
  hero: {
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
  jobProfiles: {
    title: string;
    subtitle: string;
    exploreLabel: string;
    items: SiteJobProfileItem[];
  };
  privacy: SiteLegalPage;
  terms: SiteLegalPage;
  cookies: SiteLegalPage;
}

export interface SiteContent {
  social: { facebook: string; twitter: string; linkedin: string; instagram: string };
  en: SiteLocaleContent;
  hi: SiteLocaleContent;
}

export type SiteContentLang = 'en' | 'hi';

export type SiteContentUpdateInput = Partial<SiteLocaleContent> & {
  lang?: SiteContentLang;
  social?: SiteContent['social'];
  en?: Partial<SiteLocaleContent>;
  hi?: Partial<SiteLocaleContent>;
};

export function useSiteContent() {
  return useQuery({
    queryKey: ['admin', 'settings', 'site-content'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SiteContent>>('/admin/settings/site-content');
      return unwrap(res.data);
    },
  });
}

export function useUpdateSiteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: SiteContentUpdateInput | Record<string, unknown>) => {
      const res = await api.put<ApiResponse<SiteContent>>('/admin/settings/site-content', body);
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings', 'site-content'] }),
  });
}

export function useTranslateSiteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body?: { sections?: Array<keyof SiteLocaleContent> }) => {
      const res = await api.post<ApiResponse<SiteContent>>(
        '/admin/settings/site-content/translate',
        body ?? {},
      );
      return unwrap(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings', 'site-content'] }),
  });
}

export function useMsg91Settings() {
  return useQuery({
    queryKey: ['admin', 'settings', 'msg91'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Msg91SettingsView>>('/admin/settings/msg91');
      return unwrap(res.data);
    },
  });
}

export interface Msg91SettingsInput {
  enabled?: boolean;
  authKey?: string;
  senderId?: string;
  templateId?: string;
}

export function useUpdateMsg91Settings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Msg91SettingsInput) => {
      const res = await api.put<ApiResponse<Msg91SettingsView>>('/admin/settings/msg91', body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings', 'msg91'] }),
  });
}

/* ------------------------------ Lookups ------------------------------ */

function invalidateLookups(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['admin', 'lookups'] });
}

export function useLookupCategories() {
  return useQuery({
    queryKey: ['admin', 'lookups', 'categories'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: LookupCategoryMeta[] }>>('/admin/lookups/categories');
      return unwrap(res.data);
    },
  });
}

export function useLookups(params: {
  category?: LookupCategory | '';
  status?: LookupStatus | '';
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['admin', 'lookups', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LookupListResult>>('/admin/lookups', { params });
      return unwrap(res.data);
    },
  });
}

export function useCreateLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      category: LookupCategory;
      name: string;
      value?: string;
      description?: string;
      order?: number;
      isActive?: boolean;
    }) => {
      const res = await api.post<ApiResponse<LookupOption>>('/admin/lookups', body);
      return unwrap(res.data);
    },
    onSuccess: () => invalidateLookups(qc),
  });
}

export function useUpdateLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      value?: string;
      description?: string;
      order?: number;
      isActive?: boolean;
      status?: LookupStatus;
    }) => {
      const res = await api.patch<ApiResponse<LookupOption>>(`/admin/lookups/${id}`, body);
      return unwrap(res.data);
    },
    onSuccess: () => invalidateLookups(qc),
  });
}

export function useDeleteLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<ApiResponse<null>>(`/admin/lookups/${id}`);
      return unwrap(res.data);
    },
    onSuccess: () => invalidateLookups(qc),
  });
}

export function useApproveLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<LookupOption>>(`/admin/lookups/${id}/approve`);
      return unwrap(res.data);
    },
    onSuccess: () => invalidateLookups(qc),
  });
}

export function useRejectLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.patch<ApiResponse<LookupOption>>(`/admin/lookups/${id}/reject`, { reason });
      return unwrap(res.data);
    },
    onSuccess: () => invalidateLookups(qc),
  });
}

export function useDisableLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<LookupOption>>(`/admin/lookups/${id}/disable`);
      return unwrap(res.data);
    },
    onSuccess: () => invalidateLookups(qc),
  });
}

/* --------------------------------------------------------- support tickets */

export function useSupportTickets(
  params: ListQuery & { status?: TicketStatus | ''; priority?: TicketPriority | '' },
) {
  return useQuery({
    queryKey: ['admin', 'support-tickets', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SupportTicketListResult>>('/admin/support-tickets', {
        params,
      });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
  });
}

export function useSupportTicket(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'support-tickets', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<SupportTicket>>(`/admin/support-tickets/${id}`);
      return unwrap(res.data);
    },
  });
}

/** Reply and/or change status — the backend emails the ticket owner either way. */
export function useRespondToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      message,
      status,
    }: {
      id: string;
      message?: string;
      status?: TicketStatus;
    }) => {
      const res = await api.post<ApiResponse<SupportTicket>>(
        `/admin/support-tickets/${id}/respond`,
        { message, status },
      );
      return unwrap(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
    },
  });
}

export function useDeleteSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/support-tickets/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
    },
  });
}

// ---- advertisement banners ----

function invalidateBanners(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
}

/** The slots the website offers, so the admin form never invents a placement key. */
export function useBannerPlacements() {
  return useQuery({
    queryKey: ['admin', 'banners', 'placements'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BannerPlacement[]>>('/admin/banners/placements');
      return unwrap(res.data);
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ['admin', 'banners', 'list'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BannerRow[]>>('/admin/banners');
      return unwrap(res.data);
    },
  });
}

/**
 * Uploads the image on its own and returns the hosted URL, which the create /
 * update call then stores. Splitting it keeps the banner record itself plain
 * JSON, so a cancelled form never leaves a half-written banner behind.
 */
export function useUploadBannerImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ApiResponse<BannerUploadResult>>(
        '/admin/banners/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 },
      );
      return unwrap(res.data);
    },
  });
}

export type BannerInput = {
  title: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  placements: string[];
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: BannerInput) => {
      const res = await api.post<ApiResponse<BannerRow>>('/admin/banners', body);
      return unwrap(res.data);
    },
    onSuccess: () => invalidateBanners(qc),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<BannerInput> }) => {
      const res = await api.patch<ApiResponse<BannerRow>>(`/admin/banners/${id}`, body);
      return unwrap(res.data);
    },
    onSuccess: () => invalidateBanners(qc),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/banners/${id}`);
      return id;
    },
    onSuccess: () => invalidateBanners(qc),
  });
}
