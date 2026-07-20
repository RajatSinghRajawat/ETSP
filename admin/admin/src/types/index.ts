export type Role = 'admin' | 'employer' | 'candidate';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface DashboardStats {
  users: { total: number; active: number; candidate: number; employer: number; admin: number };
  candidates: { total: number };
  employers: { total: number };
  jobs: { total: number; active: number; closed: number };
  applications: { total: number; pending: number; hired: number };
  recent: {
    jobs: Array<{ _id: string; title: string; companyName: string; status: string; createdAt: string; location?: string }>;
    applications: Array<{
      _id: string;
      status: string;
      createdAt: string;
      candidateEmail: string;
      job?: { title: string; companyName: string } | null;
      candidateProfile?: { firstName: string; lastName: string } | null;
    }>;
  };
}

export interface CityCount {
  city: string;
  count: number;
}

export interface DateCount {
  date: string;
  count: number;
}

export interface JobApplicationCount {
  jobId: string;
  title: string;
  companyName: string;
  location: string;
  count: number;
}

export interface DashboardAnalytics {
  filters: { city: string | null };
  cities: string[];
  jobsByDate: DateCount[];
  candidatesByDate: DateCount[];
  employersByDate: DateCount[];
  applicationsByJob: JobApplicationCount[];
  cityStats: {
    jobs: CityCount[];
    candidates: CityCount[];
    employers: CityCount[];
    applications: CityCount[];
  };
  topCities: {
    jobs: CityCount | null;
    candidates: CityCount | null;
    employers: CityCount | null;
    applications: CityCount | null;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantReply {
  answer: string;
  generatedAt: string;
}

export interface UserRow {
  _id: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentJobTitle?: string;
  currentLocation?: string;
  organizationName?: string;
  degree?: string;
  educationLevel?: string;
  skills?: string[];
  status?: 'draft' | 'submitted';
  aadhaarVerified?: boolean;
  photoUrl?: string;
  createdAt: string;
  preferredLocations?: string[];
  profileSummary?: string;
  certifications?: string[];
  experiences?: Array<Record<string, unknown>>;
}

export interface EmployerRow {
  _id: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  organizationType?: string;
  teamSize?: string;
  headquarters?: string;
  workplaceModel?: string;
  hiringUrgency?: string;
  status?: 'draft' | 'submitted';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  overview?: string;
  specialties?: string[];
  benefits?: string[];
  hiringRegions?: string[];
  logoUrl?: string;
  website?: string;
  createdAt: string;
}

export interface ImportedEmployerRow {
  _id: string;
  companyName: string;
  category?: string;
  state?: string;
  cities?: string[];
  firstName?: string;
  lastName?: string;
  designation?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  email?: string;
  website?: string;
  address?: string;
  pincode?: string;
  aboutUs?: string;
  staffSize?: string;
  status: 'imported' | 'registered';
  sourceFileName?: string;
  createdAt: string;
}

export interface EmployerImportSummary {
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface JobRow {
  _id: string;
  title: string;
  companyName: string;
  type: string;
  location: string;
  salary?: string;
  description?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  benefits?: string;
  status: 'draft' | 'active' | 'closed';
  employerEmail: string;
  employerProfile: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeData {
  _id: string;
  candidateId: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanAudience = 'employer' | 'candidate';

export type PlanInterval = 'month' | 'one_time';

export interface PlanFeatures {
  aiEnabled: boolean;
  // employer
  maxActiveJobs: number | null; // concurrent active jobs, null = unlimited
  jobValidityDays: number | null; // null = never expires
  featuredJobs: number; // concurrent featured jobs allowed
  searchFiltersEnabled: boolean;
  chatEnabled: boolean;
  screeningQuestionsEnabled: boolean;
  unlockCreditsPerJob: number;
  visibleExcelProfilesPerJob: number | null; // null = ALL EXCEL applicants visible
  dedicatedAccountManager: boolean;
  creditAddonsEnabled: boolean;
  perCvUnlockEnabled: boolean;
  autoReplyEnabled: boolean;
  // candidate
  maxApplications: number | null;
  verifiedBadgeEnabled: boolean;
  featuredProfileEnabled: boolean;
  searchBoostEnabled: boolean;
  jobAlertsEnabled: boolean;
  autoApplyEnabled: boolean;
  profileBoostEnabled: boolean;
  directMessageEmployersPerMonth: number;
  visibilityToggleEnabled: boolean;
  followEmployersEnabled: boolean;
  resumeBuilderIncluded: boolean;
  /** legacy field, ignored by the UI */
  maxJobPosts?: number | null;
}

export interface Plan {
  _id: string;
  name: string;
  description: string;
  audience: PlanAudience;
  planKey: string | null;
  priceInr: number;
  annualPriceInr: number | null;
  interval: PlanInterval;
  features: PlanFeatures;
  isFree: boolean;
  isActive: boolean;
  sortOrder: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
  stripeAnnualPriceId?: string | null;
  subscriberCount: number;
  stripeSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanInput {
  name: string;
  description?: string;
  audience: PlanAudience;
  priceInr: number;
  annualPriceInr?: number | null;
  interval?: PlanInterval;
  features: Partial<PlanFeatures>;
  isFree?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export type SubscriptionStatus = 'incomplete' | 'active' | 'past_due' | 'canceled';

export interface AdminSubscription {
  _id: string;
  userEmail: string;
  audienceRole: PlanAudience;
  status: SubscriptionStatus;
  billingInterval: 'month' | 'year';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  plan?: { _id: string; name: string; priceInr: number; audience: PlanAudience } | null;
}

export type PurchaseStatus = 'pending' | 'paid' | 'expired' | 'failed';

export type PurchaseType =
  | 'pay_per_job'
  | 'unlock_credits_20'
  | 'cv_unlock_1'
  | 'cv_unlock_3'
  | 'urgent_tag'
  | 'resume_builder';

export interface AdminPurchase {
  _id: string;
  userEmail: string;
  role: PlanAudience;
  type: PurchaseType;
  amountInr: number;
  job?: { _id: string; title: string } | null;
  status: PurchaseStatus;
  fulfilledAt: string | null;
  createdAt: string;
}

export interface GrantSubscriptionInput {
  userEmail: string;
  planId: string;
  days: number;
}

export interface StripeSettingsView {
  configured: boolean;
  publishableKey: string;
  secretKeyMasked: string;
  webhookSecretSet: boolean;
}

export interface EmailSettingsView {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  passMasked: string;
  from: string;
}

export interface Msg91SettingsView {
  enabled: boolean;
  configured: boolean;
  authKeyMasked: string;
  senderId: string;
  templateId: string;
}

export type ApplicationStatus = 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

export interface ApplicationRow {
  _id: string;
  status: ApplicationStatus;
  coverLetter?: string;
  candidateEmail: string;
  createdAt: string;
  job?: { _id: string; title: string; companyName: string; location: string; type: string; status: string } | null;
  candidateProfile?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentJobTitle?: string;
    photoUrl?: string;
  } | null;
  employerProfile?: { _id: string; companyName: string; email: string } | null;
}
