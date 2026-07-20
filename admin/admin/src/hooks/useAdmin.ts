import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  AdminPurchase,
  AdminSubscription,
  ApiResponse,
  ApplicationRow,
  ApplicationStatus,
  AssistantReply,
  CandidateRow,
  ChatMessage,
  DashboardAnalytics,
  DashboardStats,
  EmailSettingsView,
  EmployerImportSummary,
  EmployerRow,
  GrantSubscriptionInput,
  ImportedEmployerRow,
  JobRow,
  Msg91SettingsView,
  Paginated,
  Plan,
  PlanAudience,
  PlanInput,
  PurchaseStatus,
  PurchaseType,
  ResumeData,
  Role,
  StripeSettingsView,
  SubscriptionStatus,
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

export function useEmployers(params: ListQuery & { status?: string }) {
  return useQuery({
    queryKey: ['admin', 'employers', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<EmployerRow>>>('/admin/employers', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
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

export function useImportedEmployers(params: ListQuery & { status?: string }) {
  return useQuery({
    queryKey: ['admin', 'imported-employers', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<ImportedEmployerRow>>>('/admin/imported-employers', { params });
      return unwrap(res.data);
    },
    placeholderData: (previous) => previous,
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
    mutationFn: async (body: { secretKey?: string; publishableKey?: string; webhookSecret?: string }) => {
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
