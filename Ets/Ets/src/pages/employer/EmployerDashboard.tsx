import { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  AssignmentTurnedIn,
  CheckCircleOutlined,
  EmojiEventsOutlined,
  GroupsOutlined,
  WorkOutlineOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import EmployerJobsTable from '../../components/employer/EmployerJobsTable';
import {
  PageHero,
  SectionHeading,
  SoftChip,
  StatTile,
} from '../../components/employer/employerUi';
import {
  panelSx,
  type ToneKey,
} from '../../components/employer/employerTokens';
import { useEmployerPlan } from '../../hooks/useEmployerPlan';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyJobsQuery } from '../../store/api/jobApi';
import { useGetEmployerApplicationCountsQuery } from '../../store/api/applicationApi';

const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: profileData, isError: isProfileError } = useGetMyEmployerProfileQuery();
  const { data: jobsData, isLoading: isJobsLoading, isError: isJobsError } = useGetMyJobsQuery();
  const { data: countsData } = useGetEmployerApplicationCountsQuery();
  const { isPremium } = useEmployerPlan();

  const profile = profileData?.data;
  const companyName = profile?.companyName || 'Employer';
  const isApprovalPending = Boolean(profile?.approvalStatus && profile.approvalStatus !== 'approved');

  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData]);
  const counts = countsData?.data;

  const liveJobs = jobs.filter((job) => job.status === 'active').length;
  const newApplications = Object.values(counts?.byJob ?? {}).reduce((sum, row) => sum + row.new, 0);
  const shortlisted = Object.values(counts?.byJob ?? {}).reduce((sum, row) => sum + row.shortlisted, 0);
  const hired = Object.values(counts?.byJob ?? {}).reduce((sum, row) => sum + row.hired, 0);

  const metrics: Array<{
    label: string;
    value: number;
    caption: string;
    icon: React.ReactNode;
    tone: ToneKey;
    onClick?: () => void;
  }> = [
    {
      label: 'Total jobs',
      value: jobs.length,
      caption: `${liveJobs} open right now`,
      icon: <WorkOutlineOutlined />,
      tone: 'blue',
    },
    {
      label: 'Applications',
      value: counts?.total ?? 0,
      caption: `${newApplications} awaiting review`,
      icon: <AssignmentTurnedIn />,
      tone: 'teal',
      onClick: () => navigate('/employer/applications'),
    },
    {
      label: 'Shortlisted',
      value: shortlisted,
      caption: 'Moved to interview stage',
      icon: <CheckCircleOutlined />,
      tone: 'violet',
    },
    {
      label: 'Hired',
      value: hired,
      caption: 'Offers accepted',
      icon: <EmojiEventsOutlined />,
      tone: 'green',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHero
          eyebrow="Employer workspace"
          title={`Welcome back, ${companyName}`}
          meta={
            <>
              <SoftChip onHero label={`${jobs.length} job${jobs.length === 1 ? '' : 's'} posted`} />
              <SoftChip onHero label={`${counts?.total ?? 0} applications`} />
              <SoftChip onHero label={isPremium ? 'Premium plan' : 'Free plan'} />
            </>
          }
          actions={
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Add />}
              onClick={() => navigate('/employer/post-job')}
              disabled={isApprovalPending}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, px: 2.5 }}
            >
              Post a Job
            </Button>
          }
        >
          <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.82), maxWidth: 620 }}>
            Open a job to see how it is performing and to review, shortlist or reject everyone who
            applied to it.
          </Typography>
        </PageHero>

        {isProfileError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>Unable to load employer profile.</Alert>
        )}
        {isApprovalPending && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            Your company profile is awaiting admin approval. You can post jobs once it is approved.
          </Alert>
        )}

        {/* Metric tiles */}
        <Grid container spacing={{ xs: 1.5, md: 2.5 }} sx={{ mb: { xs: 2.5, md: 3.5 } }}>
          {metrics.map((metric) => (
            <Grid size={{ xs: 6, lg: 3 }} key={metric.label}>
              <StatTile
                label={metric.label}
                value={metric.value}
                caption={metric.caption}
                icon={metric.icon}
                tone={metric.tone}
                onClick={metric.onClick}
              />
            </Grid>
          ))}
        </Grid>

        {/* Jobs created by this employer */}
        <Card elevation={0} sx={{ ...panelSx, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <SectionHeading
              icon={<GroupsOutlined />}
              title="My Jobs"
              caption="Open a job to see its performance and everyone who applied to it."
              action={
                jobs.length > 0 ? (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    disabled={isApprovalPending}
                    onClick={() => navigate('/employer/post-job')}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
                  >
                    New job
                  </Button>
                ) : undefined
              }
              sx={{ mb: 2.5 }}
            />

            {isJobsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            )}
            {isJobsError && !isJobsLoading && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>Unable to load your jobs.</Alert>
            )}

            {!isJobsLoading && !isJobsError && jobs.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 1.5,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                  }}
                >
                  <WorkOutlineOutlined sx={{ fontSize: 30 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                  No jobs posted yet
                </Typography>
                <Typography variant="body2" sx={{ mb: 2.5 }}>
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
              <EmployerJobsTable
                jobs={jobs}
                countsByJob={counts?.byJob ?? {}}
                showMatches={isPremium}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EmployerDashboard;
