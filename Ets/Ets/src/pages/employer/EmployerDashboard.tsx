import { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AddRounded,
  AssignmentTurnedInOutlined,
  CheckCircleOutlined,
  EmojiEventsOutlined,
  GroupsOutlined,
  TrendingUpOutlined,
  WorkOutlineOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import EmployerJobsTable from '../../components/employer/EmployerJobsTable';
import { useEmployerPlan } from '../../hooks/useEmployerPlan';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyJobsQuery } from '../../store/api/jobApi';
import { useGetEmployerApplicationCountsQuery } from '../../store/api/applicationApi';

/**
 * Modern Sleek Metric Tile:
 * 12px border radius, pure white paper surface, subtle hover lift, rich icon plate.
 */
const ModernStatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  caption: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}> = ({ label, value, caption, icon, color, onClick }) => {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        p: { xs: 2.25, md: 2.75 },
        borderRadius: '12px',
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.02)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(color, 0.5),
          boxShadow: `0 8px 24px -4px ${alpha(color, 0.14)}, 0 2px 6px -1px rgba(15, 23, 42, 0.03)`,
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: alpha(color, 0.1),
            color: color,
            display: 'grid',
            placeItems: 'center',
            '& svg': { fontSize: 23 },
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            fontSize: '0.74rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: '1.85rem', sm: '2.1rem' },
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: '#0f172a',
          mb: 0.75,
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: '#64748b',
          fontWeight: 600,
          fontSize: '0.8rem',
          mt: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {caption}
      </Typography>
    </Paper>
  );
};

import type { JobResponse } from '../../store/api/jobApi';
import type { JobApplicationCounts } from '../../store/api/applicationApi';

interface EmployerDashboardProps {
  overrideJobs?: JobResponse[];
  overrideCounts?: Record<string, JobApplicationCounts>;
  overrideCompanyName?: string;
}

const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  overrideJobs,
  overrideCounts,
  overrideCompanyName,
}) => {
  const navigate = useNavigate();

  const { data: profileData, isError: isProfileError } = useGetMyEmployerProfileQuery();
  const { data: jobsData, isLoading: isJobsLoading, isError: isJobsError } = useGetMyJobsQuery();
  const { data: countsData } = useGetEmployerApplicationCountsQuery();
  const { isPremium } = useEmployerPlan();

  const profile = profileData?.data;
  const companyName = overrideCompanyName || profile?.companyName || 'Employer';
  const isApprovalPending = Boolean(profile?.approvalStatus && profile.approvalStatus !== 'approved');

  const jobs = useMemo(() => overrideJobs ?? jobsData?.data ?? [], [overrideJobs, jobsData]);
  const countsByJob = overrideCounts ?? countsData?.data?.byJob ?? {};
  const totalApplications = Object.values(countsByJob).reduce((sum, row) => sum + row.total, 0);

  const liveJobs = jobs.filter((job) => job.status === 'active').length;
  const newApplications = Object.values(countsByJob).reduce((sum, row) => sum + row.new, 0);
  const shortlisted = Object.values(countsByJob).reduce((sum, row) => sum + row.shortlisted, 0);
  const hired = Object.values(countsByJob).reduce((sum, row) => sum + row.hired, 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4.5 } }}>
        {/* Top Hero Banner with requested Blue-Teal Gradient, clean alignment & 14px radius */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.75, sm: 3.5, md: 4 },
            mb: 3.5,
            borderRadius: '14px',
            color: '#ffffff',
            background: 'linear-gradient(125deg, #0c5283 0%, #0a4570 48%, #0ab6a2 135%)',
            boxShadow: '0 12px 32px -8px rgba(12, 82, 131, 0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle ambient lighting circle */}
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -80,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Top header flex row: Content on left, Post a Job CTA on right */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}
          >
            <Box sx={{ maxWidth: { md: '75%' } }}>
              {/* Eyebrow */}
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: alpha('#ffffff', 0.82),
                  mb: 0.75,
                }}
              >
                Employer Workspace
              </Typography>

              {/* Title */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '1.65rem', sm: '2.05rem', md: '2.35rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.025em',
                  color: '#ffffff',
                  mb: 1.5,
                }}
              >
                Welcome back, {companyName}
              </Typography>

              {/* Meta Chips */}
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
                <Chip
                  size="small"
                  label={`${jobs.length} job${jobs.length === 1 ? '' : 's'} posted`}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    bgcolor: alpha('#ffffff', 0.16),
                    color: '#ffffff',
                    border: '1px solid',
                    borderColor: alpha('#ffffff', 0.28),
                  }}
                />
                <Chip
                  size="small"
                  label={`${totalApplications} applications`}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    bgcolor: alpha('#ffffff', 0.16),
                    color: '#ffffff',
                    border: '1px solid',
                    borderColor: alpha('#ffffff', 0.28),
                  }}
                />
                <Chip
                  size="small"
                  label={isPremium ? 'Premium plan' : 'Free plan'}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    bgcolor: alpha('#ffffff', 0.16),
                    color: '#ffffff',
                    border: '1px solid',
                    borderColor: alpha('#ffffff', 0.28),
                  }}
                />
              </Stack>
            </Box>

            {/* CTA Button */}
            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddRounded />}
                onClick={() => navigate('/employer/post-job')}
                disabled={isApprovalPending}
                sx={{
                  py: 1.25,
                  px: 3,
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  textTransform: 'none',
                  bgcolor: '#0ab6a2',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(10, 182, 162, 0.4)',
                  transition: 'all 180ms ease',
                  '&:hover': {
                    bgcolor: '#099b8a',
                    boxShadow: '0 8px 22px rgba(10, 182, 162, 0.6)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Post a Job
              </Button>
            </Box>
          </Stack>

          {/* Subtitle / Description */}
          <Typography
            variant="body2"
            sx={{
              color: alpha('#ffffff', 0.85),
              fontSize: '0.88rem',
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            Open a job to see how it is performing and to review, shortlist or reject everyone who applied to it.
          </Typography>
        </Paper>

        {isProfileError && !overrideCompanyName && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>Unable to load employer profile.</Alert>
        )}
        {isApprovalPending && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '10px' }}>
            Your company profile is awaiting admin approval. You will be able to post jobs once approved.
          </Alert>
        )}

        {/* 4 Metric Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 6, lg: 3 }}>
            <ModernStatCard
              label="Active Jobs"
              value={jobs.length}
              caption={`${liveJobs} currently open & accepting candidates`}
              icon={<WorkOutlineOutlined />}
              color="#2563eb"
            />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <ModernStatCard
              label="Applications"
              value={totalApplications}
              caption={newApplications > 0 ? `${newApplications} new awaiting evaluation` : 'All candidates screened'}
              icon={<AssignmentTurnedInOutlined />}
              color="#7c3aed"
              onClick={() => navigate('/employer/applications')}
            />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <ModernStatCard
              label="Shortlisted"
              value={shortlisted}
              caption="Moved to interview & vetting stage"
              icon={<CheckCircleOutlined />}
              color="#f59e0b"
            />
          </Grid>
          <Grid size={{ xs: 6, lg: 3 }}>
            <ModernStatCard
              label="Hired"
              value={hired}
              caption="Successful offers accepted"
              icon={<EmojiEventsOutlined />}
              color="#10b981"
            />
          </Grid>
        </Grid>

        {/* Jobs Section Container (12px border radius, white paper) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3, md: 3.5 },
            mb: 3,
            borderRadius: '12px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Section Header */}
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '10px',
                  bgcolor: alpha('#2563eb', 0.1),
                  color: '#2563eb',
                  display: 'grid',
                  placeItems: 'center',
                  '& svg': { fontSize: 22 },
                }}
              >
                <GroupsOutlined />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>
                  Posted Jobs
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Search, filter, or open a job to review candidate tallies and applications
                </Typography>
              </Box>
            </Stack>

            {jobs.length > 0 && (
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                disabled={isApprovalPending}
                onClick={() => navigate('/employer/post-job')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  bgcolor: '#0f172a',
                  color: '#ffffff',
                  height: 38,
                  px: 2.25,
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    bgcolor: '#1e293b',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                New job
              </Button>
            )}
          </Stack>

          {isJobsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {isJobsError && !isJobsLoading && !overrideJobs && (
            <Alert severity="error" sx={{ borderRadius: '10px' }}>Unable to load your jobs.</Alert>
          )}

          {!isJobsLoading && !isJobsError && jobs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 7, color: 'text.secondary' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2,
                  borderRadius: '12px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha('#2563eb', 0.08),
                  color: 'primary.main',
                }}
              >
                <WorkOutlineOutlined sx={{ fontSize: 30 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', mb: 0.5 }}>
                No jobs posted yet
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5, color: '#64748b' }}>
                Post your first open role to begin receiving qualified candidates.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                disabled={isApprovalPending}
                onClick={() => navigate('/employer/post-job')}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
              >
                Post a Job
              </Button>
            </Box>
          )}

          {jobs.length > 0 && (
            <EmployerJobsTable
              jobs={jobs}
              countsByJob={countsByJob}
              showMatches={isPremium}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default EmployerDashboard;
