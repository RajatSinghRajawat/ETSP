import { useGetMyCandidateProfileQuery } from '../store/api/candidateProfileApi';
import { useGetMyEmployerProfileQuery } from '../store/api/employerProfileApi';

export type ProfileApprovalStatus = 'pending' | 'rejected' | 'approved';

function getAuthenticatedRole() {
  if (!localStorage.getItem('ets-access-token')) {
    return null;
  }

  try {
    const stored = localStorage.getItem('user');
    const user = stored ? (JSON.parse(stored) as { role?: string }) : null;
    return user?.role ?? null;
  } catch {
    return null;
  }
}

export function useProfileApproval() {
  const role = getAuthenticatedRole();
  const isCandidate = role === 'candidate';
  const isEmployer = role === 'employer';
  const candidateQuery = useGetMyCandidateProfileQuery(undefined, {
    skip: !isCandidate,
    pollingInterval: 60_000,
  });
  const employerQuery = useGetMyEmployerProfileQuery(undefined, {
    skip: !isEmployer,
    pollingInterval: 60_000,
  });
  const approvalStatus = (isCandidate
    ? candidateQuery.data?.data.approvalStatus
    : isEmployer
      ? employerQuery.data?.data.approvalStatus
      : undefined) as ProfileApprovalStatus | undefined;

  return {
    role,
    approvalStatus,
    isApprovalPending: Boolean((isCandidate || isEmployer) && approvalStatus !== 'approved'),
    isLoading: isCandidate ? candidateQuery.isLoading : isEmployer ? employerQuery.isLoading : false,
  };
}
