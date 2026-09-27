import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Link as MuiLink,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ApartmentOutlined,
  ArrowBack,
  ArrowForward,
  AutoGraphOutlined,
  CalendarMonthOutlined,
  CampaignOutlined,
  CheckCircleOutlined,
  ContentCopyOutlined,
  DescriptionOutlined,
  EditOutlined,
  GroupOutlined,
  GroupsOutlined,
  HelpOutlineOutlined,
  LockOutlined,
  MoreHoriz,
  OpenInNewOutlined,
  PaymentsOutlined,
  PersonSearchOutlined,
  PlaceOutlined,
  RocketLaunchOutlined,
  SchoolOutlined,
  ShareOutlined,
  StarOutlineRounded,
  StopCircleOutlined,
  TimelineOutlined,
  TouchAppOutlined,
  TrendingUpOutlined,
  VisibilityOutlined,
  WorkOutlineOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import JobStatusControl from '../../components/employer/JobStatusControl';
import { JOB_STATUS_META, POSTED_VIA_LABEL, formatJobDate, formatRelativeDate } from '../../components/employer/jobStatus';
import { SoftChip } from '../../components/employer/employerUi';
import { panelSx, hoverLiftSx, TONE, type ToneKey } from '../../components/employer/employerTokens';
import { useEmployerPlan } from '../../hooks/useEmployerPlan';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyJobsQuery, useUpdateJobStatusMutation } from '../../store/api/jobApi';
import { useGetEmployerApplicationCountsQuery } from '../../store/api/applicationApi';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    return (error as { data?: { message?: string } }).data?.message ?? fallback;
  }
  return fallback;
};

/**
 * Turns raw description text into headed groups of bullets.
 */
type TextGroup = { heading?: string; lines: string[] };

const toGroups = (value?: string): TextGroup[] => {
  const raw = (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const groups: TextGroup[] = [];

  raw.forEach((line) => {
    const isHeading = /:$/.test(line) && !/^[•\-*]/.test(line);

    if (isHeading) {
      groups.push({ heading: line.replace(/:$/, ''), lines: [] });
      return;
    }

    const text = line.replace(/^[\s•\-*]+/, '').trim();
    if (!text) return;

    if (groups.length === 0) groups.push({ lines: [] });
    groups[groups.length - 1].lines.push(text);
  });

  return groups;
};

const TextBlock: React.FC<{ value?: string }> = ({ value }) => {
  if (!value?.trim()) {
    return <Typography variant="body2" color="text.disabled">Not provided</Typography>;
  }

  const groups = toGroups(value);
  const isPlainParagraph = groups.length === 1 && !groups[0].heading && groups[0].lines.length <= 1;

  if (isPlainParagraph) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#475569' }}>
        {value}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {groups.map((group, groupIndex) => (
        <Box key={`${groupIndex}-${group.heading ?? 'body'}`}>
          {group.heading && (
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>
              {group.heading}
            </Typography>
          )}
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#475569' }}>
            {group.lines.map((line, index) => (
              <Typography
                component="li"
                variant="body2"
                key={`${index}-${line.slice(0, 12)}`}
                sx={{ mb: 0.6, lineHeight: 1.7 }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

/**
 * Modern Interactive Candidate Card:
 * Fully clickable, animated elevation on hover, rich icon plate & clear statistics.
 */
const InteractiveCandidateCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  count: React.ReactNode;
  title: string;
  subtitle: string;
  detail: string;
  actionText: string;
  badge?: React.ReactNode;
  onClick: () => void;
  accentBorderColor?: string;
  locked?: boolean;
}> = ({
  icon,
  iconBg,
  iconColor,
  count,
  title,
  subtitle,
  detail,
  actionText,
  badge,
  onClick,
  accentBorderColor = '#3b82f6',
  locked = false,
}) => {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      role="button"
      tabIndex={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'light' ? '#e2e8f0' : alpha('#ffffff', 0.1),
        bgcolor: 'background.paper',
        boxShadow: (theme) =>
          theme.palette.mode === 'light'
            ? '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.03)'
            : '0 2px 4px rgba(0, 0, 0, 0.3)',
        transition: 'all 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: accentBorderColor,
          boxShadow: `0 12px 28px -4px ${alpha(accentBorderColor, 0.15)}, 0 4px 12px -2px rgba(15, 23, 42, 0.04)`,
          '& .action-arrow': {
            transform: 'translateX(4px)',
            color: accentBorderColor,
          },
        },
      }}
    >
      {/* Top row: Icon plate & Badge */}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            bgcolor: iconBg,
            color: iconColor,
            display: 'grid',
            placeItems: 'center',
            '& svg': { fontSize: 24 },
          }}
        >
          {icon}
        </Box>
        {badge}
      </Stack>

      {/* Count & Title */}
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: '2rem', md: '2.4rem' },
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          color: '#0f172a',
          mb: 0.5,
        }}
      >
        {count}
      </Typography>

      <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', color: '#1e293b', mb: 0.5 }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: '#64748b', mb: 2, lineHeight: 1.5 }}>
        {subtitle}
      </Typography>

      {/* Detail highlight */}
      <Box
        sx={{
          mt: 'auto',
          pt: 1.75,
          borderTop: '1px solid',
          borderColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
          {detail}
        </Typography>
        <Stack
          direction="row"
          spacing={0.5}
          className="action-arrow"
          sx={{
            alignItems: 'center',
            color: '#2563eb',
            fontWeight: 700,
            fontSize: '0.82rem',
            transition: 'all 200ms ease',
          }}
        >
          <span>{actionText}</span>
          <ArrowForward sx={{ fontSize: 16 }} />
        </Stack>
      </Box>
    </Paper>
  );
};

/**
 * Modern Metric Stat Card:
 * Features clear values, trending icons, and soft background tints.
 */
const MetricStatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  caption?: string;
  color?: string;
}> = ({ label, value, icon, caption, color = '#3b82f6' }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.25,
      borderRadius: 3.5,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'light' ? '#f1f5f9' : alpha('#ffffff', 0.08),
      bgcolor: 'background.paper',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
      transition: 'all 180ms ease',
      '&:hover': {
        borderColor: alpha(color, 0.4),
        boxShadow: `0 8px 20px -4px ${alpha(color, 0.1)}`,
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 1 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: alpha(color, 0.1),
          color: color,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.45rem',
            lineHeight: 1.15,
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 }}
        >
          {label}
        </Typography>
      </Box>
    </Stack>
    {caption && (
      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
        {caption}
      </Typography>
    )}
  </Paper>
);

const JobView: React.FC<{ jobId: string }> = ({ jobId }) => {
  const navigate = useNavigate();
  const { data: profileData } = useGetMyEmployerProfileQuery();
  const { data: jobsData, isLoading, isError } = useGetMyJobsQuery();
  const { data: countsData } = useGetEmployerApplicationCountsQuery();
  const { isPremium, showUpgrade } = useEmployerPlan();
  const [updateJobStatus, { isLoading: isStatusUpdating }] = useUpdateJobStatusMutation();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const companyName = profileData?.data?.companyName || 'Employer';
  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData]);
  const job = jobs.find((item) => item._id === jobId) ?? null;
  const counts = countsData?.data.byJob[jobId];

  const applicantsPath = `/employer/jobs/${jobId}/applicants`;

  const setStatus = async (status: 'active' | 'closed' | 'paused') => {
    setError('');
    try {
      await updateJobStatus({ id: jobId, status }).unwrap();
      setSnackbarMessage(`Job status updated to ${status}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change the job status. Please try again.'));
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard?.writeText(url);
    setSnackbarMessage('Public job link copied to clipboard!');
  };

  const planLabel = POSTED_VIA_LABEL[job?.postedVia ?? 'free'] ?? 'Free';
  const isOffline = job ? job.status !== 'active' : false;
  const statusMeta = JOB_STATUS_META[job?.status ?? 'draft'] ?? JOB_STATUS_META.draft;

  // Conversion calculations
  const impressions = job?.metrics?.impressions ?? 0;
  const clicks = job?.metrics?.clicks ?? 0;
  const totalApps = counts?.total ?? 0;
  const applyRate = clicks > 0 ? ((totalApps / clicks) * 100).toFixed(1) : '0.0';

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'var(--app-min-h)', bgcolor: '#f8fafc' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4.5 } }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && !isLoading && (
          <Alert severity="error" sx={{ borderRadius: 3, mb: 3 }}>
            Unable to load your job post details. Please refresh or try again later.
          </Alert>
        )}

        {!isLoading && !isError && !job && (
          <Alert severity="warning" sx={{ borderRadius: 3, mb: 3 }}>
            This job could not be found in your active employer account.
          </Alert>
        )}

        {job && (
          <>
            {/* Top Navigation & Breadcrumbs Bar */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 2.5,
              }}
            >
              <MuiLink
                component={RouterLink}
                to="/employer/dashboard"
                underline="none"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: '#475569',
                  bgcolor: '#ffffff',
                  px: 1.75,
                  py: 0.85,
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    color: 'primary.main',
                    borderColor: '#cbd5e1',
                    transform: 'translateX(-2px)',
                  },
                }}
              >
                <ArrowBack sx={{ fontSize: 17 }} />
                Back to All Jobs
              </MuiLink>

              {/* Status & Quick Actions Bar */}
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ width: 135 }}>
                  <JobStatusControl
                    job={job}
                    onError={setError}
                    sx={{
                      height: 40,
                      borderRadius: 2.5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  />
                </Box>

                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<EditOutlined />}
                  onClick={() => navigate(`/employer/edit-job/${job._id}`)}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    height: 40,
                    bgcolor: '#ffffff',
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                  }}
                >
                  Edit Job
                </Button>

                <Tooltip title="Copy Public Job Link" arrow>
                  <IconButton
                    onClick={handleCopyLink}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      bgcolor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                    }}
                  >
                    <ContentCopyOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View Live Job Listing" arrow>
                  <IconButton
                    onClick={() => window.open(`/jobs/${job._id}`, '_blank', 'noopener')}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      bgcolor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                    }}
                  >
                    <OpenInNewOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <IconButton
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                  }}
                >
                  <MoreHoriz sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Error & Notifications */}
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Modern Elevated Job Hero Card (Pure White Theme) */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 3.5, md: 4 },
                mb: 3.5,
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 12px 32px -8px rgba(15, 23, 42, 0.06)',
                transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Subtle top decorative accent bar */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #10b981 100%)',
                }}
              />

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
              >
                <Box sx={{ maxWidth: { md: '75%' } }}>
                  {/* Status & Plan Pills */}
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.75, flexWrap: 'wrap', gap: 0.75 }}>
                    <Chip
                      size="small"
                      label={statusMeta.label}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        bgcolor: alpha(statusMeta.color, 0.1),
                        color: statusMeta.color,
                        border: '1px solid',
                        borderColor: alpha(statusMeta.color, 0.25),
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${planLabel} Posting`}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        bgcolor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    {job.isFeatured && (
                      <Chip
                        size="small"
                        label="Featured"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          bgcolor: alpha('#f59e0b', 0.12),
                          color: '#b45309',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      />
                    )}
                    {job.isUrgent && (
                      <Chip
                        size="small"
                        label="Urgent Hiring"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          bgcolor: alpha('#ef4444', 0.1),
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                      />
                    )}
                  </Stack>

                  {/* Title */}
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: '1.65rem', sm: '2.05rem', md: '2.35rem' },
                      lineHeight: 1.25,
                      letterSpacing: '-0.025em',
                      mb: 1.5,
                      color: '#0f172a',
                    }}
                  >
                    {job.title}
                  </Typography>

                  {/* Quick Meta Strip */}
                  <Stack
                    direction="row"
                    spacing={2.5}
                    sx={{
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1.75,
                      color: '#64748b',
                      fontSize: '0.88rem',
                    }}
                  >
                    <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                      <PlaceOutlined sx={{ fontSize: 17, color: '#2563eb' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {job.location || 'Remote'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                      <WorkOutlineOutlined sx={{ fontSize: 17, color: '#2563eb' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {job.type}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                      <PaymentsOutlined sx={{ fontSize: 17, color: '#2563eb' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {job.salary?.trim() || 'Salary undisclosed'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                      <CalendarMonthOutlined sx={{ fontSize: 17, color: '#2563eb' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748b' }}>
                        Posted {formatJobDate(job.createdAt)} ({formatRelativeDate(job.createdAt)})
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                {/* Primary CTA */}
                <Box sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<GroupsOutlined />}
                    onClick={() => navigate(applicantsPath)}
                    sx={{
                      py: 1.5,
                      px: 3.25,
                      borderRadius: 3,
                      fontWeight: 800,
                      fontSize: '0.96rem',
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
                      transition: 'all 200ms ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                        boxShadow: '0 8px 22px rgba(37, 99, 235, 0.45)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Manage Candidates ({counts?.total ?? 0})
                  </Button>
                </Box>
              </Stack>
            </Paper>

            {/* Inactive Job Warning Alert if Paused/Closed/Draft */}
            {isOffline && (
              <Alert
                severity={job.status === 'paused' ? 'info' : 'warning'}
                sx={{
                  mb: 3.5,
                  borderRadius: 3.5,
                  alignItems: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
                action={
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={isStatusUpdating}
                      onClick={() => setStatus('active')}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Reopen Job
                    </Button>
                    {job.status !== 'closed' && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={isStatusUpdating}
                        onClick={() => setStatus('closed')}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                      >
                        Close Job
                      </Button>
                    )}
                  </Stack>
                }
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {job.status === 'paused'
                    ? 'This job is currently paused. Candidates cannot view or apply to it.'
                    : job.status === 'closed'
                      ? 'This job post is closed and archived.'
                      : 'This job is in draft mode and not yet published.'}
                </Typography>
              </Alert>
            )}

            {/* SECTION 1: Candidate Funnel (Interactive Cards) */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <GroupsOutlined sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  Candidate Pipeline
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                  Click any card to jump directly to those applicants
                </Typography>
              </Stack>

              <Grid container spacing={2.5}>
                {/* 1. All Applications */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <InteractiveCandidateCard
                    icon={<GroupOutlined />}
                    iconBg={alpha('#2563eb', 0.12)}
                    iconColor="#2563eb"
                    accentBorderColor="#2563eb"
                    count={counts?.total ?? 0}
                    title="All Applications"
                    subtitle="Full applicant pool for this role."
                    detail={`${counts?.new ?? 0} new · ${counts?.shortlisted ?? 0} shortlisted`}
                    actionText="View all candidates"
                    badge={
                      <Chip
                        size="small"
                        label="Active Pool"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: alpha('#2563eb', 0.1),
                          color: '#2563eb',
                        }}
                      />
                    }
                    onClick={() => navigate(applicantsPath)}
                  />
                </Grid>

                {/* 2. New Applications */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <InteractiveCandidateCard
                    icon={<DescriptionOutlined />}
                    iconBg={alpha('#7c3aed', 0.12)}
                    iconColor="#7c3aed"
                    accentBorderColor="#7c3aed"
                    count={counts?.new ?? 0}
                    title="New Applications"
                    subtitle="Unreviewed candidates awaiting initial screening."
                    detail={counts?.new && counts.new > 0 ? `${counts.new} awaiting evaluation` : 'All candidates screened'}
                    actionText="Review new"
                    badge={
                      <Chip
                        size="small"
                        label={counts?.new && counts.new > 0 ? 'Action Needed' : 'Up to Date'}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: counts?.new && counts.new > 0 ? alpha('#dc2626', 0.1) : alpha('#10b981', 0.1),
                          color: counts?.new && counts.new > 0 ? '#dc2626' : '#059669',
                        }}
                      />
                    }
                    onClick={() => navigate(`${applicantsPath}?tab=new`)}
                  />
                </Grid>

                {/* 3. Matched Talent */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <InteractiveCandidateCard
                    icon={<PersonSearchOutlined />}
                    iconBg={alpha('#0ab6a2', 0.12)}
                    iconColor="#0ab6a2"
                    accentBorderColor="#0ab6a2"
                    count={isPremium ? (counts?.shortlisted ?? 0) : '0'}
                    title="Matched Talent"
                    subtitle="Candidates with skill profiles matching your job."
                    detail={isPremium ? 'Skill-fit matching active' : 'Unlock candidate matches with Pro'}
                    actionText={isPremium ? 'Review matches' : 'Explore Pro Plan'}
                    locked={!isPremium}
                    badge={
                      !isPremium ? (
                        <Chip
                          size="small"
                          icon={<LockOutlined sx={{ fontSize: 13 }} />}
                          label="Premium"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: alpha('#f59e0b', 0.16),
                            color: '#b45309',
                            '& .MuiChip-icon': { color: '#b45309' },
                          }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="AI Match"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: alpha('#0ab6a2', 0.12),
                            color: '#0ab6a2',
                          }}
                        />
                      )
                    }
                    onClick={() => {
                      if (isPremium) {
                        navigate(`${applicantsPath}?tab=shortlisted`);
                      } else {
                        navigate('/pricing');
                      }
                    }}
                  />
                </Grid>
              </Grid>

              {/* One-Click Pipeline Stage Jump Strip */}
              <Paper
                elevation={0}
                sx={{
                  mt: 2.5,
                  p: 1.5,
                  px: 2.5,
                  borderRadius: 3.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: { xs: 1, sm: 2 },
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155', minWidth: 100 }}>
                  Quick Pipeline:
                </Typography>

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { label: 'All', count: counts?.total ?? 0, tab: 'all', color: '#2563eb' },
                    { label: 'New', count: counts?.new ?? 0, tab: 'new', color: '#7c3aed' },
                    { label: 'Reviewing', count: counts?.reviewing ?? 0, tab: 'reviewing', color: '#0284c7' },
                    { label: 'Shortlisted', count: counts?.shortlisted ?? 0, tab: 'shortlisted', color: '#059669' },
                    { label: 'Hired', count: counts?.hired ?? 0, tab: 'hired', color: '#10b981' },
                    { label: 'Rejected', count: counts?.rejected ?? 0, tab: 'rejected', color: '#64748b' },
                  ].map((stage) => (
                    <Chip
                      key={stage.label}
                      clickable
                      onClick={() => navigate(stage.tab === 'all' ? applicantsPath : `${applicantsPath}?tab=${stage.tab}`)}
                      label={
                        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                          <span>{stage.label}</span>
                          <Box
                            component="span"
                            sx={{
                              bgcolor: alpha(stage.color, 0.12),
                              color: stage.color,
                              px: 0.7,
                              py: 0.1,
                              borderRadius: 999,
                              fontWeight: 800,
                              fontSize: '0.72rem',
                            }}
                          >
                            {stage.count}
                          </Box>
                        </Stack>
                      }
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#334155',
                        '&:hover': {
                          bgcolor: alpha(stage.color, 0.08),
                          borderColor: alpha(stage.color, 0.4),
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Paper>
            </Box>

            {/* SECTION 2: Performance & Analytics */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <AutoGraphOutlined sx={{ color: '#7c3aed', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  Performance & Reach
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                  Engagement metrics since job posting
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <MetricStatCard
                    icon={<VisibilityOutlined />}
                    label="Impressions"
                    value={impressions}
                    color="#2563eb"
                    caption="Search appearances"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <MetricStatCard
                    icon={<TouchAppOutlined />}
                    label="Clicks"
                    value={clicks}
                    color="#7c3aed"
                    caption="Detail views"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <MetricStatCard
                    icon={<DescriptionOutlined />}
                    label="Applications"
                    value={totalApps}
                    color="#059669"
                    caption="Submissions"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <MetricStatCard
                    icon={<TrendingUpOutlined />}
                    label="Apply Rate"
                    value={`${applyRate}%`}
                    color="#0284c7"
                    caption="Clicks to applied"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <MetricStatCard
                    icon={<StarOutlineRounded />}
                    label="Shortlisted"
                    value={counts?.shortlisted ?? 0}
                    color="#f59e0b"
                    caption="Qualified talent"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <MetricStatCard
                    icon={<WorkspacePremiumOutlined />}
                    label="Current Plan"
                    value={planLabel}
                    color="#64748b"
                    caption={job.postedVia === 'free' ? 'Standard free listing' : 'Featured listing'}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SECTION 3: Performance Boost & Sponsored Features */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <CampaignOutlined sx={{ color: '#f59e0b', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  Boost Hiring Speed
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                  Promotional features to attract more qualified candidates
                </Typography>
              </Stack>

              <Grid container spacing={2.5}>
                {/* Sponsor Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '14px',
                          bgcolor: alpha('#f59e0b', 0.12),
                          color: '#f59e0b',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          '& svg': { fontSize: 24 },
                        }}
                      >
                        <RocketLaunchOutlined />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', mb: 0.5 }}>
                          Sponsor Job for 3x Faster Hiring
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                          Sponsored jobs appear at the top of candidate search results, receive priority alerts, and generate up to 3x more qualified applicant submissions.
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      variant="contained"
                      onClick={() => navigate('/pricing')}
                      sx={{
                        alignSelf: 'flex-start',
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: '#0f172a',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1e293b' },
                      }}
                    >
                      Explore Sponsorship Options
                    </Button>
                  </Paper>
                </Grid>

                {/* Urgent Hiring Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '14px',
                          bgcolor: alpha('#ef4444', 0.12),
                          color: '#ef4444',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          '& svg': { fontSize: 24 },
                        }}
                      >
                        <CampaignOutlined />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', mb: 0.5 }}>
                          Urgent Hiring Badge
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                          Highlight this job opening as actively hiring with an eye-catching urgent tag to signal candidates that you will respond quickly.
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/employer/edit-job/${job._id}`)}
                      sx={{
                        alignSelf: 'flex-start',
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        borderColor: '#cbd5e1',
                        color: '#334155',
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                      }}
                    >
                      {job.isUrgent ? 'Badge Active (Edit)' : 'Add Urgent Badge'}
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* SECTION 4: Job Post Summary & Details */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <DescriptionOutlined sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                  Job Post Details
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                  Full public job listing as seen by candidates
                </Typography>
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5, md: 4 },
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* 4 Core Facts Grid */}
                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Salary Offer
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                        {job.salary?.trim() || 'Not disclosed'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Job Type
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                        {job.type}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Required Experience
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                        {job.experience || 'Not specified'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Education Requirement
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                        {job.education || 'Not specified'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3 }} />

                {/* Description */}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                  Job Description & Scope
                </Typography>
                <Box sx={{ mb: 3.5, pl: 0.5 }}>
                  <TextBlock value={job.description} />
                </Box>

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <Box sx={{ mb: 3.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                      Required Skills & Competencies
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {job.skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            bgcolor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Benefits */}
                {job.benefits?.trim() && (
                  <Box sx={{ mb: 3.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                      Perks & Benefits
                    </Typography>
                    <Box sx={{ pl: 0.5 }}>
                      <TextBlock value={job.benefits} />
                    </Box>
                  </Box>
                )}

                {/* Screening questions */}
                {(job.screeningQuestions ?? []).length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                      Candidate Screening Questions ({job.screeningQuestions?.length})
                    </Typography>
                    <Stack spacing={1.5}>
                      {(job.screeningQuestions ?? []).map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              bgcolor: '#e2e8f0',
                              color: '#334155',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {item.question}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Action Menu (3 Dots) */}
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 220, mt: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  navigate(`/employer/edit-job/${job._id}`);
                }}
              >
                <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Edit Job Details</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  navigate(applicantsPath);
                }}
              >
                <ListItemIcon><GroupOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Manage Applicants</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  handleCopyLink();
                }}
              >
                <ListItemIcon><ContentCopyOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Copy Public Link</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  window.open(`/jobs/${job._id}`, '_blank', 'noopener');
                }}
              >
                <ListItemIcon><OpenInNewOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>View Public Page</ListItemText>
              </MenuItem>
              <Divider />
              {job.status === 'active' ? (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    setStatus('paused');
                  }}
                >
                  <ListItemIcon><StopCircleOutlined fontSize="small" color="warning" /></ListItemIcon>
                  <ListItemText slotProps={{ primary: { sx: { fontWeight: 600, color: 'warning.main' } } }}>
                    Pause Job Post
                  </ListItemText>
                </MenuItem>
              ) : (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    setStatus('active');
                  }}
                >
                  <ListItemIcon><CheckCircleOutlined fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText slotProps={{ primary: { sx: { fontWeight: 600, color: 'success.main' } } }}>
                    Reopen Job Post
                  </ListItemText>
                </MenuItem>
              )}
              {job.status !== 'closed' && (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    setStatus('closed');
                  }}
                >
                  <ListItemIcon><StopCircleOutlined fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText slotProps={{ primary: { sx: { fontWeight: 600, color: 'error.main' } } }}>
                    Close Job Post
                  </ListItemText>
                </MenuItem>
              )}
            </Menu>

            {/* Notification Toast */}
            <Snackbar
              open={Boolean(snackbarMessage)}
              autoHideDuration={3500}
              onClose={() => setSnackbarMessage('')}
              message={snackbarMessage}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

/**
 * Route: /employer/jobs/:id
 */
const EmployerJobView: React.FC = () => {
  const { id: jobId = '' } = useParams();
  return <JobView key={jobId} jobId={jobId} />;
};

export default EmployerJobView;
