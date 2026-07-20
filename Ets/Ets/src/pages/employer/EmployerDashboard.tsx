import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  ArrowForward,
  AssignmentTurnedIn,
  BarChart,
  LocationOn,
  Payments,
  People,
  TrendingUp,
  Visibility,
  Work,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import SubscriptionCard from '../../components/common/SubscriptionCard';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyJobsQuery } from '../../store/api/jobApi';
import { useGetEmployerApplicationsQuery } from '../../store/api/applicationApi';
import { usePurchaseCheckoutMutation } from '../../store/api/purchaseApi';

const BRAND_GRADIENT = 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)';

const statusColor = {
  active: 'success',
  draft: 'default',
  closed: 'error',
  expired: 'warning',
} as const;

const surfaceCardSx = {
  height: '100%',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 4,
  transition: 'transform .25s ease, box-shadow .25s ease',
} as const;

const SectionHeader: React.FC<{ title: string; caption?: string; actionLabel?: string; onAction?: () => void }> = ({
  title,
  caption,
  actionLabel,
  onAction,
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      {caption && (
        <Typography variant="body2" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Box>
    {actionLabel && (
      <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 16 }} />} onClick={onAction} sx={{ fontWeight: 700, flexShrink: 0 }}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: profileData, isLoading: isProfileLoading, isError: isProfileError } = useGetMyEmployerProfileQuery();
  const { data: jobsData, isLoading: isJobsLoading, isError: isJobsError } = useGetMyJobsQuery();
  const { data: applicationData, isLoading: isApplicationsLoading } = useGetEmployerApplicationsQuery({ limit: 5 });
  const [purchaseCheckout] = usePurchaseCheckoutMutation();
  const [buyingUrgentJobId, setBuyingUrgentJobId] = useState<string | null>(null);

  const handleBuyUrgent = async (jobId: string) => {
    setBuyingUrgentJobId(jobId);
    try {
      const res = await purchaseCheckout({ type: 'urgent_tag', jobId }).unwrap();
      window.location.href = res.data.url;
    } catch {
      setBuyingUrgentJobId(null); // interceptor surfaces the error dialog
    }
  };

  const profile = profileData?.data;
  const jobs = jobsData?.data ?? [];
  const applications = applicationData?.data.items ?? [];
  const companyName = profile?.companyName || 'Employer';
  const activeJobs = jobs.filter((job) => job.status === 'active');
  const closedJobs = jobs.filter((job) => job.status === 'closed');
  const draftJobs = jobs.filter((job) => job.status === 'draft');
  const totalApplications = applicationData?.data.pagination.total ?? 0;
  const profileStrength = [
    profile?.companyName,
    profile?.logoUrl,
    profile?.overview,
    profile?.specialties.length,
    profile?.benefits.length,
    profile?.hiringRegions.length,
  ].filter(Boolean).length;
  const profileScore = Math.round((profileStrength / 6) * 100);
  const conversionRate = jobs.length ? Math.round((totalApplications / jobs.length) * 10) / 10 : 0;
  const maxJobCount = Math.max(activeJobs.length, draftJobs.length, closedJobs.length, 1);

  const metrics = [
    { label: 'Open Jobs', value: activeJobs.length, icon: <Work />, tone: '#0c5283' },
    { label: 'Applications', value: totalApplications, icon: <AssignmentTurnedIn />, tone: '#0ab6a2' },
    { label: 'Talent Pool', value: 'Browse', icon: <People />, tone: '#4f46e5', onClick: () => navigate('/employer/employees') },
    { label: 'Apps / Job', value: conversionRate, icon: <TrendingUp />, tone: '#d97706' },
  ];

  const pipeline = [
    { label: 'Active', value: activeJobs.length, color: '#0ab6a2' },
    { label: 'Draft', value: draftJobs.length, color: '#64748b' },
    { label: 'Closed', value: closedJobs.length, color: '#ef4444' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        {/* Hero */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            mb: 4,
            color: 'white',
            background: BRAND_GRADIENT,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              bgcolor: alpha('#ffffff', 0.08),
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 80,
              bottom: -90,
              width: 180,
              height: 180,
              borderRadius: '50%',
              bgcolor: alpha('#ffffff', 0.06),
            }}
          />
          <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar
                  src={profile?.logoUrl || undefined}
                  sx={{ width: 64, height: 64, bgcolor: alpha('#ffffff', 0.18), color: 'white', fontWeight: 800, fontSize: 26 }}
                >
                  {companyName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1.5 }}>
                    Employer Dashboard
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    Welcome back, {companyName}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    Track hiring performance and manage live jobs.
                  </Typography>
                </Box>
              </Box>
              <Button
                size="large"
                startIcon={<Add />}
                onClick={() => navigate('/employer/post-job')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 800,
                  px: 3,
                  '&:hover': { bgcolor: alpha('#ffffff', 0.9) },
                }}
              >
                Post a Job
              </Button>
            </Box>
          </CardContent>
        </Card>

        {isProfileError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            Unable to load employer profile.
          </Alert>
        )}

        {/* Plan & usage */}
        <Box sx={{ mb: 4 }}>
          <SubscriptionCard />
        </Box>

        {/* Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metrics.map((metric) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={metric.label}>
              <Card
                elevation={0}
                onClick={metric.onClick}
                sx={{
                  ...surfaceCardSx,
                  cursor: metric.onClick ? 'pointer' : 'default',
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
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 16px 32px -16px ${alpha(metric.tone, 0.5)}`,
                  },
                }}
              >
                <CardContent sx={{ pl: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {metric.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                        {metric.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
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

        {/* Pipeline + Profile readiness */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card elevation={0} sx={surfaceCardSx}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <SectionHeader title="Job Pipeline" caption="Live status distribution across posted jobs." />

                {isJobsLoading && <CircularProgress size={24} />}
                {isJobsError && (
                  <Alert severity="error" sx={{ borderRadius: 3 }}>
                    Unable to load jobs.
                  </Alert>
                )}

                {!isJobsLoading && !isJobsError && (
                  <Stack spacing={3}>
                    {pipeline.map((item) => (
                      <Box key={item.label}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.label}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {item.value} {item.value === 1 ? 'job' : 'jobs'}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(item.value / maxJobCount) * 100}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 5 },
                          }}
                        />
                      </Box>
                    ))}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total jobs posted
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {jobs.length}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Card elevation={0} sx={surfaceCardSx}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <BarChart color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Profile Readiness
                  </Typography>
                </Box>
                {isProfileLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 900,
                        mb: 1.5,
                        background: BRAND_GRADIENT,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {profileScore}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={profileScore}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        mb: 2.5,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { borderRadius: 6, background: BRAND_GRADIENT },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                      Complete logo, overview, benefits, specialties and hiring regions to improve candidate trust.
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/employer/profile')}
                    >
                      Manage Company Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent jobs + applications */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card elevation={0} sx={surfaceCardSx}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <SectionHeader
                  title="Recent Jobs"
                  caption="Your latest job openings."
                  actionLabel="Create New"
                  onAction={() => navigate('/employer/post-job')}
                />
                <Stack spacing={1.5}>
                  {jobs.slice(0, 6).map((job) => (
                    <Box
                      key={job._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'background-color .2s ease, border-color .2s ease',
                        '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.light' },
                      }}
                    >
                      <Avatar sx={{ bgcolor: alpha('#0c5283', 0.1), color: 'primary.main' }}>
                        <Work fontSize="small" />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {job.title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5, color: 'text.secondary' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 15 }} />
                            <Typography variant="caption">{job.location}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Payments sx={{ fontSize: 15 }} />
                            <Typography variant="caption">{job.salary || 'Not disclosed'}</Typography>
                          </Box>
                          <Typography variant="caption">{job.type}</Typography>
                          {job.expiresAt && job.status === 'active' && (
                            <Typography variant="caption">
                              · live till {new Date(job.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {job.isFeatured && (
                        <Chip label="Featured" size="small" color="secondary" sx={{ fontWeight: 600 }} />
                      )}
                      {job.isUrgent ? (
                        <Chip label="Urgent" size="small" color="warning" sx={{ fontWeight: 600 }} />
                      ) : (
                        job.status === 'active' && (
                          <Button
                            size="small"
                            color="warning"
                            disabled={buyingUrgentJobId === job._id}
                            onClick={() => handleBuyUrgent(job._id)}
                            sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 700 }}
                          >
                            Urgent tag ₹199
                          </Button>
                        )
                      )}
                      <Chip
                        label={job.status}
                        size="small"
                        color={statusColor[job.status]}
                        sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                      />
                      <Button
                        size="small"
                        startIcon={<Visibility sx={{ fontSize: 16 }} />}
                        onClick={() => navigate(`/jobs/${job._id}`)}
                        sx={{ flexShrink: 0 }}
                      >
                        View
                      </Button>
                    </Box>
                  ))}
                  {!isJobsLoading && jobs.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                      <Work sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
                      <Typography sx={{ fontWeight: 700 }}>No jobs posted yet</Typography>
                      <Typography variant="body2">Create your first job opening.</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Card elevation={0} sx={surfaceCardSx}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <SectionHeader
                  title="Latest Applications"
                  caption="Recent candidate activity."
                  actionLabel="View All"
                  onAction={() => navigate('/employer/applications')}
                />
                {isApplicationsLoading && <CircularProgress size={24} />}
                <Stack spacing={1.5}>
                  {applications.map((application) => {
                    const fullName = `${application.candidateProfile.firstName} ${application.candidateProfile.lastName}`;
                    return (
                      <Box
                        key={application._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'background-color .2s ease, border-color .2s ease',
                          '&:hover': { bgcolor: 'action.hover', borderColor: 'secondary.light' },
                        }}
                      >
                        <Avatar sx={{ bgcolor: alpha('#0ab6a2', 0.15), color: 'secondary.main', fontWeight: 700 }}>
                          {application.candidateProfile.firstName.charAt(0)}
                          {application.candidateProfile.lastName.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }} noWrap>
                            {fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {application.job.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={application.status}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        />
                        <Button
                          size="small"
                          onClick={() => navigate(`/employer/applications/${application._id}`)}
                          sx={{ flexShrink: 0 }}
                        >
                          Open
                        </Button>
                      </Box>
                    );
                  })}
                  {!isApplicationsLoading && applications.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                      <People sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
                      <Typography sx={{ fontWeight: 700 }}>No applications yet</Typography>
                      <Typography variant="body2">Applications will appear here when candidates apply.</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default EmployerDashboard;
