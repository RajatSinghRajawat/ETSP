import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Pagination,
  Select,
  Typography,
} from '@mui/material';
import { Lock, LockOpen, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import { useGetEmployerApplicationsQuery, type ApplicationStatus } from '../../store/api/applicationApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useUnlockCandidateMutation } from '../../store/api/candidateProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';

const statuses: Array<ApplicationStatus | ''> = ['', 'new', 'reviewing', 'shortlisted', 'rejected', 'hired'];

const EmployerApplications: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const { data: employerData } = useGetMyEmployerProfileQuery();
  const { data, isLoading, isFetching, isError, refetch } = useGetEmployerApplicationsQuery({
    status,
    page,
    limit: 10,
  });
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery();
  const [unlockCandidate] = useUnlockCandidateMutation();
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const companyName = employerData?.data.companyName || 'Employer';
  const applications = data?.data.items ?? [];
  const pagination = data?.data.pagination;
  const unlockBalance = usageData?.data.usage.unlockCredits?.accountBalance ?? 0;

  const handleUnlock = async (candidateProfileId: string, jobId?: string) => {
    setUnlockingId(candidateProfileId);
    try {
      await unlockCandidate({ id: candidateProfileId, jobId }).unwrap();
      refetch();
      refetchUsage();
    } catch {
      // Plan-gate interceptor shows the buy-credits dialog on 402.
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHeader title="Applications" subtitle="Review candidate applications across your posted jobs." />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">Total Applications</Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main' }}>{pagination?.total ?? 0}</Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  color="secondary"
                  icon={<LockOpen fontSize="small" />}
                  label={`${unlockBalance} unlock credit${unlockBalance === 1 ? '' : 's'}`}
                  sx={{ mt: 1, fontWeight: 600 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={status}
                    onChange={(event) => {
                      setPage(1);
                      setStatus(event.target.value as ApplicationStatus | '');
                    }}
                  >
                    {statuses.map((item) => (
                      <MenuItem key={item || 'all'} value={item}>{item || 'All statuses'}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {isError && <Alert severity="error" sx={{ mb: 3 }}>Unable to load applications.</Alert>}
        {(isLoading || isFetching) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent>
            <List>
              {applications.map((application) => {
                const candidate = application.candidateProfile;
                const locked = Boolean(candidate.locked);

                return (
                  <ListItem
                    key={application._id}
                    sx={{
                      px: 0,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      ...(locked ? { bgcolor: 'action.hover' } : {}),
                    }}
                    secondaryAction={
                      locked ? (
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<LockOpen fontSize="small" />}
                          disabled={unlockingId === candidate._id}
                          onClick={() => handleUnlock(candidate._id, application.job?._id)}
                        >
                          {unlockingId === candidate._id ? 'Unlocking…' : 'Unlock (1 credit)'}
                        </Button>
                      ) : (
                        <Button startIcon={<Visibility />} onClick={() => navigate(`/employer/applications/${application._id}`)}>
                          View
                        </Button>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={locked ? undefined : candidate.photoUrl || undefined}
                        sx={locked ? { bgcolor: 'grey.400' } : undefined}
                      >
                        {locked ? <Lock fontSize="small" /> : candidate.firstName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ fontWeight: 800, ...(locked ? { filter: 'blur(0.5px)', color: 'text.secondary' } : {}) }}
                        >
                          {candidate.firstName} {candidate.lastName}
                          {candidate.excelMember && !locked && (
                            <Chip label="EXCEL" size="small" color="warning" sx={{ ml: 1, fontWeight: 700, height: 20 }} />
                          )}
                          {candidate.verifiedBadge && !locked && (
                            <Chip label="Verified" size="small" color="success" variant="outlined" sx={{ ml: 0.5, fontWeight: 700, height: 20 }} />
                          )}
                        </Typography>
                      }
                      secondary={
                        locked
                          ? `${application.job.title} — contact details locked. Unlock to view name, phone and email.`
                          : `${application.job.title} - ${candidate.currentLocation}`
                      }
                    />
                    <Chip label={application.status} size="small" sx={{ mr: 12, textTransform: 'capitalize' }} />
                  </ListItem>
                );
              })}
              {!isLoading && !isFetching && applications.length === 0 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="No applications found" secondary="Applications will appear here when candidates apply to your jobs." />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={pagination?.totalPages ?? 1} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
        </Box>
      </Box>
    </Box>
  );
};

export default EmployerApplications;
