import SupportTickets from './SupportTickets';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';

/** Support centre inside the employer dashboard shell. */
export default function EmployerSupport() {
  const { data } = useGetMyEmployerProfileQuery();
  const companyName = data?.data.companyName || 'Employer';

  return <SupportTickets type="employer" userName={companyName} userRole="Employer" />;
}
