import { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  AssignmentTurnedIn,
  CheckCircle,
  EmojiEvents,
  Work,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyJobsQuery, type JobResponse } from '../../store/api/jobApi';
import { useGetEmployerApplicationCountsQuery, type ApplicationStatus } from '../../store/api/applicationApi';

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: '#0c5283',
  reviewing: '#d97706',
  shortlisted: '#0ab6a2',
  rejected: '#dc2626',
  hired: '#10b981',
};

const JOB_STATUS_COLOR: Record<string, 'success' | 'default' | 'error' | 'warning'> = {
  active: 'success',
  draft: 'default',
  closed: 'error',
  expired: 'warning',
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const surfaceCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 4,
} as const;

const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: profileData, isError: isProfileError } = useGetMyEmployerProfileQuery();
  const { data: jobsData, isLoading: isJobsLoading, isError: isJobsError } = useGetMyJobsQuery();
  const { data: countsData } = useGetEmployerApplicationCountsQuery();

  const profile = profileData?.data;
  const companyName = profile?.companyName || 'Employer';
  const isApprovalPending = Boolean(profile?.approvalStatus && profile.approvalStatus !== 'approved');

  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData]);
  const counts = countsData?.data;

  const metrics = [
    {
      label: 'Total Jobs',
      value: jobs.length,
      icon: <Work />,
      tone: '#0c5283',
    },
    {
      label: 'Applications',
      value: counts?.total ?? 0,
      icon: <AssignmentTurnedIn />,
      tone: '#0ab6a2',
    },
    {
      label: 'Shortlisted',
      value: Object.values(counts?.byJob ?? {}).reduce((sum, row) => sum + row.shortlisted, 0),
      icon: <CheckCircle />,
      tone: '#7c3aed',
    },
    {
      label: 'Hired',
      value: Object.values(counts?.byJob ?? {}).reduce((sum, row) => sum + row.hired, 0),
      icon: <EmojiEvents />,
      tone: '#10b981',
    },
  ];

  // Applicants for a job live on their own page.
  const openJobApplicants = (job: JobResponse) => {
    navigate(`/employer/jobs/${job._id}/applicants`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${companyName}. Open a job to review and respond to its applicants.`}
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/employer/post-job')}
              disabled={isApprovalPending}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5 }}
            >
              Post a Job
            </Button>
          }
        />

        {isProfileError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>Unable to load employer profile.</Alert>
        )}
        {isApprovalPending && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            Your company profile is awaiting admin approval. You can post jobs once it is approved.
          </Alert>
        )}

        {/* Metric cards */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
          {metrics.map((metric) => (
            <Grid size={{ xs: 6, lg: 3 }} key={metric.label}>
              <Card
                elevation={0}
                sx={{
                  ...surfaceCardSx,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    bgcolor: metric.tone,
                  },
                }}
              >
                <CardContent sx={{ pl: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {metric.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        {metric.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: { xs: 42, md: 52 },
                        height: { xs: 42, md: 52 },
                        flexShrink: 0,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(metric.tone, 0.12),
                        color: metric.tone,
                      }}
                    >
                      {metric.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Jobs created by this employer */}
        <Card elevation={0} sx={{ ...surfaceCardSx, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>My Jobs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Click a job to see everyone who applied to it.
            </Typography>

            {isJobsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            )}
            {isJobsError && !isJobsLoading && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>Unable to load your jobs.</Alert>
            )}

            {!isJobsLoading && !isJobsError && jobs.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <Work sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
                <Typography sx={{ fontWeight: 700 }}>No jobs posted yet</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Post your first job to start receiving applications.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  disabled={isApprovalPending}
                  onClick={() => navigate('/employer/post-job')}
                  sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
                >
                  Post a Job
                </Button>
              </Box>
            )}

            {jobs.length > 0 && (
              <Stack spacing={1.5}>
                {jobs.map((job) => {
                  const jobCounts = counts?.byJob[job._id];

                  return (
                    <Paper
                      key={job._id}
                      variant="outlined"
                      onClick={() => openJobApplicants(job)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openJobApplicants(job);
                        }
                      }}
                      sx={{
                        p: { xs: 1.75, sm: 2 },
                        borderRadius: 3,
                        cursor: 'pointer',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 1.5,
                        borderColor: 'divider',
                        transition: 'border-color .2s ease, background-color .2s ease',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
                        <Typography sx={{ fontWeight: 800, wordBreak: 'break-word' }}>{job.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.location} · {job.type} · Posted {formatDate(job.createdAt)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
                        <Chip
                          size="small"
                          label={job.status}
                          color={JOB_STATUS_COLOR[job.status] ?? 'default'}
                          sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${jobCounts?.total ?? 0} applicant${(jobCounts?.total ?? 0) === 1 ? '' : 's'}`}
                          sx={{ fontWeight: 700 }}
                        />
                        {Boolean(jobCounts?.shortlisted) && (
                          <Chip
                            size="small"
                            label={`${jobCounts?.shortlisted} shortlisted`}
                            sx={{ fontWeight: 700, color: STATUS_COLOR.shortlisted, bgcolor: alpha(STATUS_COLOR.shortlisted, 0.12) }}
                          />
                        )}
                        {Boolean(jobCounts?.hired) && (
                          <Chip
                            size="small"
                            label={`${jobCounts?.hired} hired`}
                            sx={{ fontWeight: 700, color: STATUS_COLOR.hired, bgcolor: alpha(STATUS_COLOR.hired, 0.12) }}
                          />
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EmployerDashboard;
