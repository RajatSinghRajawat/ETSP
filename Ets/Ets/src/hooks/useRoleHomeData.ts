import {
  useGetEmployerApplicationsQuery,
  useGetMyApplicationsQuery,
  type JobApplicationResponse,
  type MyApplicationSummary,
} from '../store/api/applicationApi';
import { useGetMyJobsQuery, type JobResponse } from '../store/api/jobApi';
import { useGetMySavedJobsQuery, type SavedJobResponse } from '../store/api/savedJobApi';
import { useGetMyCandidateProfileQuery } from '../store/api/candidateProfileApi';
import { useGetMyEmployerProfileQuery } from '../store/api/employerProfileApi';

const ACTIVE_APPLICATION_STATUSES = ['shortlisted', 'hired'] as const;

export type CandidateHomeData = {
  isLoading: boolean;
  /** Name for the greeting; the stored session only carries the email. */
  displayName: string;
  approvalStatus?: 'pending' | 'rejected' | 'approved';
  applications: MyApplicationSummary[];
  applicationCount: number;
  shortlistedCount: number;
  savedJobs: SavedJobResponse[];
  savedCount: number;
};

export type EmployerHomeData = {
  isLoading: boolean;
  displayName: string;
  approvalStatus?: 'pending' | 'rejected' | 'approved';
  jobs: JobResponse[];
  activeJobCount: number;
  applications: JobApplicationResponse[];
  applicationCount: number;
  newApplicationCount: number;
};

/**
 * Everything the home page shows a signed-in candidate. `enabled` is false for
 * every other visitor, so no candidate-only endpoint is ever called for them.
 */
export function useCandidateHomeData(enabled: boolean): CandidateHomeData {
  const profileQuery = useGetMyCandidateProfileQuery(undefined, { skip: !enabled });
  const applicationsQuery = useGetMyApplicationsQuery(undefined, { skip: !enabled });
  const savedJobsQuery = useGetMySavedJobsQuery(undefined, { skip: !enabled });

  const profile = profileQuery.data?.data;
  const applications = applicationsQuery.data?.data.items ?? [];
  const savedJobs = savedJobsQuery.data?.data.items ?? [];

  return {
    isLoading:
      enabled && (profileQuery.isLoading || applicationsQuery.isLoading || savedJobsQuery.isLoading),
    displayName: [profile?.firstName, profile?.lastName].filter(Boolean).join(' '),
    approvalStatus: profile?.approvalStatus,
    applications,
    applicationCount: applications.length,
    shortlistedCount: applications.filter((application) =>
      ACTIVE_APPLICATION_STATUSES.includes(application.status as (typeof ACTIVE_APPLICATION_STATUSES)[number]),
    ).length,
    savedJobs,
    savedCount: savedJobs.length,
  };
}

/** The employer counterpart of {@link useCandidateHomeData}. */
export function useEmployerHomeData(enabled: boolean): EmployerHomeData {
  const profileQuery = useGetMyEmployerProfileQuery(undefined, { skip: !enabled });
  const jobsQuery = useGetMyJobsQuery(undefined, { skip: !enabled });
  const applicationsQuery = useGetEmployerApplicationsQuery({ limit: 5 }, { skip: !enabled });
  // Separate call so the count covers every unread application, not just page 1.
  const newApplicationsQuery = useGetEmployerApplicationsQuery(
    { status: 'new', limit: 1 },
    { skip: !enabled },
  );

  const profile = profileQuery.data?.data;
  const jobs = jobsQuery.data?.data ?? [];

  return {
    isLoading: enabled && (profileQuery.isLoading || jobsQuery.isLoading || applicationsQuery.isLoading),
    displayName: profile?.companyName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' '),
    approvalStatus: profile?.approvalStatus,
    jobs,
    activeJobCount: jobs.filter((job) => job.status === 'active').length,
    applications: applicationsQuery.data?.data.items ?? [],
    applicationCount: applicationsQuery.data?.data.pagination.total ?? 0,
    newApplicationCount: newApplicationsQuery.data?.data.pagination.total ?? 0,
  };
}
