import SupportTickets from './SupportTickets';
import { useGetMyCandidateProfileQuery } from '../../store/api/candidateProfileApi';

/** Support centre inside the candidate dashboard shell. */
export default function CandidateSupport() {
  const { data } = useGetMyCandidateProfileQuery();
  const profile = data?.data;
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Candidate';

  return (
    <SupportTickets
      type="candidate"
      userName={name}
      userRole={profile?.currentJobTitle || 'Candidate'}
    />
  );
}
