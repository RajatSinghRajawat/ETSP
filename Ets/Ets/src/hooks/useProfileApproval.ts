import { useGetMyCandidateProfileQuery } from '../store/api/candidateProfileApi';
import { useGetMyEmployerProfileQuery } from '../store/api/employerProfileApi';
import { useAuth } from './useAuth';

export type ProfileApprovalStatus = 'pending' | 'rejected' | 'approved';

export function useProfileApproval() {
  // `useAuth` re-renders on login / logout / profile switch, so the banner
  // follows the active role without a page reload.
  const { role } = useAuth();
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
