import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Close,
  EmojiEvents,
  EventAvailable,
  HourglassEmpty,
  LocationOn,
  Message,
  Visibility,
  VisibilityOff,
  Work,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import MyResumeCard from '../../components/common/MyResumeCard';
import { useGetMyCandidateProfileQuery } from '../../store/api/candidateProfileApi';
import {
  useGetMyApplicationsQuery,
  type ApplicationStatus,
  type MyApplicationSummary,
} from '../../store/api/applicationApi';

type StatusFilter = 'all' | 'under_review' | 'shortlisted' | 'hired';

// The candidate never sees the employer's internal "new" vs "reviewing" split —
// both mean "no decision yet".
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'Under Review',
  reviewing: 'Under Review',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: '#d97706',
  reviewing: '#d97706',
  shortlisted: '#0ab6a2',
  rejected: '#dc2626',
  hired: '#10b981',
};

const INTERVIEW_MODE_LABEL: Record<string, string> = {
  in_person: 'In person',
  video: 'Video call',
  phone: 'Phone call',
};

const UNDER_REVIEW: ApplicationStatus[] = ['new', 'reviewing'];

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sectionCardSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'rgba(12,82,131,0.10)',
  boxShadow: '0 8px 30px -18px rgba(12,82,131,0.35)',
};

const StatusChip: React.FC<{ status: ApplicationStatus }> = ({ status }) => (
  <Chip
    label={STATUS_LABEL[status]}
    size="small"
    sx={{
      fontWeight: 700,
      color: STATUS_COLOR[status],
      bgcolor: `${STATUS_COLOR[status]}1f`,
      border: '1px solid',
      borderColor: `${STATUS_COLOR[status]}55`,
    }}
  />
);

const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: profileData } = useGetMyCandidateProfileQuery();
  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    isError: isApplicationsError,
  } = useGetMyApplicationsQuery();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<MyApplicationSummary | null>(null);

  const profile = profileData?.data;
  const candidateName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Candidate';
  const candidateRole = profile?.currentJobTitle || 'Candidate';

  const applications = useMemo(() => applicationsData?.data.items ?? [], [applicationsData]);

  const counts = useMemo(
    () => ({
      all: applications.length,
      under_review: applications.filter((item) => UNDER_REVIEW.includes(item.status)).length,
      shortlisted: applications.filter((item) => item.status === 'shortlisted').length,
      hired: applications.filter((item) => item.status === 'hired').length,
    }),
    [applications],
  );

  const stats: Array<{ key: StatusFilter; label: string; icon: React.ReactNode; color: string }> = [
    { key: 'all', label: 'Applied Jobs', icon: <Work />, color: '#0c5283' },
    { key: 'under_review', label: 'Under Review', icon: <HourglassEmpty />, color: '#d97706' },
    { key: 'shortlisted', label: 'Shortlisted', icon: <CheckCircle />, color: '#0ab6a2' },
    { key: 'hired', label: 'Hired', icon: <EmojiEvents />, color: '#10b981' },
  ];

  const visibleApplications = useMemo(() => {
    if (filter === 'all') return applications;
    if (filter === 'under_review') return applications.filter((item) => UNDER_REVIEW.includes(item.status));
    return applications.filter((item) => item.status === filter);
  }, [applications, filter]);

  const activeStat = stats.find((stat) => stat.key === filter);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type="candidate" userName={candidateName} userRole={candidateRole} />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: '#f4f8fc' }}>
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${candidateName}. Track every job you applied to.`}
        />

        {/* Stat cards — each one also filters the table below. */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
          {stats.map((stat) => {
            const isActive = filter === stat.key;

            return (
              <Grid size={{ xs: 6, md: 3 }} key={stat.key}>
                <Card
                  elevation={0}
                  onClick={() => setFilter(stat.key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setFilter(stat.key);
                    }
                  }}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: isActive ? stat.color : 'rgba(12,82,131,0.10)',
                    boxShadow: isActive ? `0 14px 30px -18px ${stat.color}` : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 18px 36px -18px rgba(12,82,131,0.45)' },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -24,
                      right: -24,
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      bgcolor: `${stat.color}12`,
                    }}
                  />
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1.5, md: 2.5 },
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 44, md: 56 },
                        height: { xs: 44, md: 56 },
                        flexShrink: 0,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}b3 100%)`,
                        boxShadow: `0 8px 20px -8px ${stat.color}`,
                        '& svg': { fontSize: { xs: 22, md: 28 } },
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        {isLoadingApplications ? '—' : counts[stat.key]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Resume — AI-built or self-uploaded */}
        <Box sx={{ mb: 3 }}>
          <MyResumeCard candidateName={candidateName} />
        </Box>

        {/* Applied jobs */}
        <Card elevation={0} sx={sectionCardSx}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mb: 2.5,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  My Applications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filter === 'all'
                    ? 'Every job you applied to, with the employer’s response.'
                    : `Showing ${activeStat?.label.toLowerCase()} applications.`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                {filter !== 'all' && (
                  <Button
                    size="small"
                    onClick={() => setFilter('all')}
                    sx={{ fontWeight: 700, textTransform: 'none' }}
                  >
                    Clear filter
                  </Button>
                )}
                <Button
                  size="small"
                  startIcon={<Work />}
                  onClick={() => navigate('/find-job')}
                  sx={{ fontWeight: 700, textTransform: 'none', color: '#0ab6a2' }}
                >
                  Find Jobs
                </Button>
              </Stack>
            </Box>

            {isLoadingApplications && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            )}

            {isApplicationsError && !isLoadingApplications && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                Unable to load your applications.
              </Alert>
            )}

            {!isLoadingApplications && !isApplicationsError && applications.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Work sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
                <Typography sx={{ fontWeight: 700 }}>No applications yet</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Apply to jobs and track their status here.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/find-job')}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  }}
                >
                  Browse Jobs
                </Button>
              </Box>
            )}

            {!isLoadingApplications && !isApplicationsError && applications.length > 0 && (
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 3, borderColor: 'rgba(12,82,131,0.12)' }}
              >
                <Table sx={{ minWidth: 900 }} size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(12,82,131,0.04)' }}>
                      <TableCell sx={{ fontWeight: 800 }}>Job</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Company</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Applied On</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Employer Viewed</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Interview</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Employer Message</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleApplications.map((application) => {
                      const interviewAt = application.interview?.scheduledAt ?? null;
                      const employerMessage = application.employerMessage ?? '';

                      return (
                        <TableRow key={application._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                              {application.job.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {application.job.location}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>{application.job.companyName}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                            {formatDate(application.createdAt)}
                          </TableCell>
                          <TableCell>
                            {application.viewedByEmployer ? (
                              <Tooltip title={`Viewed on ${formatDateTime(application.viewedAt)}`}>
                                <Chip
                                  icon={<Visibility sx={{ fontSize: 16 }} />}
                                  label="Viewed"
                                  size="small"
                                  sx={{ fontWeight: 700, color: '#0c5283', bgcolor: 'rgba(12,82,131,0.10)' }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                icon={<VisibilityOff sx={{ fontSize: 16 }} />}
                                label="Not viewed"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600, color: 'text.secondary' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={application.status} />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                            {interviewAt ? (
                              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                                <EventAvailable sx={{ fontSize: 16, color: '#7c3aed' }} />
                                <span>{formatDateTime(interviewAt)}</span>
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            {employerMessage ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {employerMessage}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => setSelected(application)}
                              sx={{ fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap' }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {visibleApplications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No {activeStat?.label.toLowerCase()} applications.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Application detail — full employer response and stage history. */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ pr: 6, fontWeight: 800 }}>
              {selected.job.title}
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {selected.job.companyName}
              </Typography>
              <IconButton
                onClick={() => setSelected(null)}
                aria-label="Close"
                sx={{ position: 'absolute', right: 12, top: 12 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack direction="row" spacing={2} sx={{ mb: 2.5, alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                <Avatar
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  }}
                >
                  {selected.job.companyName.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
                    <StatusChip status={selected.status} />
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={selected.viewedByEmployer ? <Visibility sx={{ fontSize: 15 }} /> : <VisibilityOff sx={{ fontSize: 15 }} />}
                      label={
                        selected.viewedByEmployer
                          ? `Viewed ${formatDate(selected.viewedAt)}`
                          : 'Not viewed yet'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    <LocationOn sx={{ fontSize: 13, verticalAlign: -2 }} /> {selected.job.location} · Applied{' '}
                    {formatDate(selected.createdAt)}
                  </Typography>
                </Box>
              </Stack>

              {selected.interview?.scheduledAt && (
                <Alert
                  icon={<EventAvailable />}
                  severity="info"
                  sx={{ borderRadius: 3, mb: 2.5 }}
                >
                  <Typography sx={{ fontWeight: 800 }}>
                    Interview on {formatDateTime(selected.interview.scheduledAt)}
                  </Typography>
                  {selected.interview.mode && (
                    <Typography variant="body2">
                      Mode: {INTERVIEW_MODE_LABEL[selected.interview.mode] ?? selected.interview.mode}
                    </Typography>
                  )}
                  {selected.interview.location && (
                    <Typography variant="body2">Where: {selected.interview.location}</Typography>
                  )}
                </Alert>
              )}

              {selected.employerMessage && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 3, mb: 2.5, bgcolor: 'rgba(12,82,131,0.03)' }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                    <Message sx={{ fontSize: 18, color: '#0c5283' }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                      Message from {selected.job.companyName}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {selected.employerMessage}
                  </Typography>
                </Paper>
              )}

              <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Application Timeline</Typography>
              <Stack spacing={1.5}>
                {(selected.statusHistory ?? []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Applied on {formatDate(selected.createdAt)}. No updates from the employer yet.
                  </Typography>
                )}
                {(selected.statusHistory ?? []).map((event, index) => (
                  <Box key={`${event.status}-${event.changedAt}-${index}`} sx={{ display: 'flex', gap: 1.5 }}>
                    <Box
                      sx={{
                        mt: 0.75,
                        width: 10,
                        height: 10,
                        flexShrink: 0,
                        borderRadius: '50%',
                        bgcolor: STATUS_COLOR[event.status],
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {index === 0 && event.status === 'new' ? 'Application submitted' : STATUS_LABEL[event.status]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(event.changedAt)}
                      </Typography>
                      {event.interviewAt && (
                        <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                          Interview: {formatDateTime(event.interviewAt)}
                        </Typography>
                      )}
                      {event.message && (
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {event.message}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2.5 }} />
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSelected(null);
                  navigate(`/jobs/${selected.job._id}`);
                }}
                sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
              >
                View Job Posting
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CandidateDashboard;
