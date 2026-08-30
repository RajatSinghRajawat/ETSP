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
import {
  CheckCircle,
  EventAvailable,
  HighlightOff,
  Lock,
  LockOpen,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import ApplicationDecisionDialog, { type DecisionKind } from '../../components/common/ApplicationDecisionDialog';
import { useGetEmployerApplicationsQuery, type ApplicationStatus } from '../../store/api/applicationApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useUnlockCandidateMutation } from '../../store/api/candidateProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';

const statuses: Array<ApplicationStatus | ''> = ['', 'new', 'reviewing', 'shortlisted', 'rejected', 'hired'];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewing: 'Under Review',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

const STATUS_CHIP_COLOR: Record<ApplicationStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  new: 'info',
  reviewing: 'warning',
  shortlisted: 'success',
  rejected: 'error',
  hired: 'success',
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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
  // Accept / reject can be run straight from the list, without opening the detail page.
  const [decision, setDecision] = useState<{
    kind: DecisionKind;
    applicationId: string;
    candidateName: string;
    status: ApplicationStatus;
  } | null>(null);
  const [decisionMessage, setDecisionMessage] = useState('');

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
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />
      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: 'background.default' }}>
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
                      <MenuItem key={item || 'all'} value={item}>
                        {item ? STATUS_LABEL[item] : 'All statuses'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {decisionMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setDecisionMessage('')}>
            {decisionMessage}
          </Alert>
        )}
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
                      // Status chip and action button drop to their own row below sm
                      // instead of overlapping the candidate name.
                      display: 'flex',
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      alignItems: 'center',
                      gap: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      ...(locked ? { bgcolor: 'action.hover' } : {}),
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 56 }}>
                      <Avatar
                        src={locked ? undefined : candidate.photoUrl || undefined}
                        sx={locked ? { bgcolor: 'grey.400' } : undefined}
                      >
                        {locked ? <Lock fontSize="small" /> : candidate.firstName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ minWidth: 0, my: 0 }}
                      primary={
                        <Typography
                          sx={{ fontWeight: 800, wordBreak: 'break-word', ...(locked ? { filter: 'blur(0.5px)', color: 'text.secondary' } : {}) }}
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
                        <>
                          {locked
                            ? `${application.job.title} — contact details locked. Unlock to view name, phone and email.`
                            : `${application.job.title} - ${candidate.currentLocation}`}
                          {application.interview?.scheduledAt && (
                            <Box component="span" sx={{ display: 'block', color: 'secondary.main', fontWeight: 600 }}>
                              <EventAvailable sx={{ fontSize: 14, verticalAlign: -2, mr: 0.5 }} />
                              Interview {formatDateTime(application.interview.scheduledAt)}
                            </Box>
                          )}
                        </>
                      }
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                        gap: 1,
                        flexShrink: 0,
                        width: { xs: '100%', sm: 'auto' },
                      }}
                    >
                      <Chip
                        label={STATUS_LABEL[application.status]}
                        color={STATUS_CHIP_COLOR[application.status]}
                        size="small"
                        variant={application.status === 'new' ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 700 }}
                      />
                      {locked ? (
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<LockOpen fontSize="small" />}
                          disabled={unlockingId === candidate._id}
                          onClick={() => handleUnlock(candidate._id, application.job?._id)}
                        >
                          {unlockingId === candidate._id ? 'Unlocking…' : 'Unlock (1 credit)'}
                        </Button>
                      ) : (
                        <>
                          {application.status !== 'rejected' && application.status !== 'hired' && (
                            <Button
                              size="small"
                              color="success"
                              startIcon={<CheckCircle fontSize="small" />}
                              onClick={() =>
                                setDecision({
                                  kind: 'accept',
                                  applicationId: application._id,
                                  candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
                                  status: application.status,
                                })
                              }
                            >
                              Accept
                            </Button>
                          )}
                          {application.status !== 'rejected' && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<HighlightOff fontSize="small" />}
                              onClick={() =>
                                setDecision({
                                  kind: 'reject',
                                  applicationId: application._id,
                                  candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
                                  status: application.status,
                                })
                              }
                            >
                              Reject
                            </Button>
                          )}
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/employer/applications/${application._id}`)}
                          >
                            View
                          </Button>
                        </>
                      )}
                    </Box>
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
          <Pagination count={pagination?.totalPages ?? 1} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" siblingCount={0} sx={{ '& .MuiPagination-ul': { flexWrap: 'wrap', justifyContent: 'center' } }} />
        </Box>
      </Box>

      <ApplicationDecisionDialog
        decision={decision?.kind ?? null}
        applicationId={decision?.applicationId ?? ''}
        candidateName={decision?.candidateName}
        currentStatus={decision?.status}
        onClose={() => setDecision(null)}
        onDone={setDecisionMessage}
      />
    </Box>
  );
};

export default EmployerApplications;
