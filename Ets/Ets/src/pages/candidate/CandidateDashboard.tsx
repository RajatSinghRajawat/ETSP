import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircleRounded,
  EmojiEventsRounded,
  EventAvailableRounded,
  HourglassEmptyRounded,
  LocationOnOutlined,
  MessageRounded,
  VisibilityRounded,
  VisibilityOffRounded,
  WorkOutlineRounded,
  SearchRounded,
  ClearRounded,
  OpenInNewRounded,
  ExpandMoreRounded,
  PaymentsOutlined,
  AccessTimeRounded,
  ArrowForwardRounded,
  StarsRounded,
  BusinessRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import MyResumeCard from '../../components/common/MyResumeCard';
import { useGetMyCandidateProfileQuery } from '../../store/api/candidateProfileApi';
import {
  useGetMyApplicationsQuery,
  type ApplicationStatus,
} from '../../store/api/applicationApi';
import { useGetJobsQuery } from '../../store/api/jobApi';
import { translateJobType } from '../../i18n';

type StatusFilter = 'all' | 'under_review' | 'shortlisted' | 'hired' | 'rejected';

// The candidate never sees internal 'new' vs 'reviewing' split — both mean Under Review
const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  new: {
    label: 'Under Review',
    bg: '#fffbeb',
    text: '#b45309',
    border: '#fde68a',
    dot: '#f59e0b',
  },
  reviewing: {
    label: 'Under Review',
    bg: '#fffbeb',
    text: '#b45309',
    border: '#fde68a',
    dot: '#f59e0b',
  },
  shortlisted: {
    label: 'Shortlisted',
    bg: '#ecfdf5',
    text: '#047857',
    border: '#a7f3d0',
    dot: '#10b981',
  },
  rejected: {
    label: 'Not Selected',
    bg: '#fef2f2',
    text: '#b91c1c',
    border: '#fecaca',
    dot: '#ef4444',
  },
  hired: {
    label: 'Offer Hired',
    bg: '#f5f3ff',
    text: '#6d28d9',
    border: '#ddd6fe',
    dot: '#8b5cf6',
  },
};

const INTERVIEW_MODE_LABEL: Record<string, string> = {
  in_person: 'In-person Interview',
  video: 'Video Conference',
  phone: 'Phone Call',
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

const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: profileData } = useGetMyCandidateProfileQuery();
  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    isError: isApplicationsError,
  } = useGetMyApplicationsQuery();
  const { data: recommendedJobsData } = useGetJobsQuery({ limit: 4 });

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  const profile = profileData?.data;
  const candidateName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Doctor';
  const candidateRole = profile?.currentJobTitle || profile?.degree || 'Veterinary Candidate';

  const applications = useMemo(() => applicationsData?.data.items ?? [], [applicationsData]);
  const recommendedJobs = useMemo(() => recommendedJobsData?.data?.items ?? [], [recommendedJobsData]);

  const counts = useMemo(
    () => ({
      all: applications.length,
      under_review: applications.filter((item) => UNDER_REVIEW.includes(item.status)).length,
      shortlisted: applications.filter((item) => item.status === 'shortlisted').length,
      hired: applications.filter((item) => item.status === 'hired').length,
      rejected: applications.filter((item) => item.status === 'rejected').length,
    }),
    [applications],
  );

  const stats: Array<{ key: StatusFilter; label: string; sub: string; icon: React.ReactNode; color: string }> = [
    { key: 'all', label: 'All Applications', sub: 'Total submissions', icon: <WorkOutlineRounded />, color: '#0c5283' },
    { key: 'under_review', label: 'Under Review', sub: 'Pending response', icon: <HourglassEmptyRounded />, color: '#f59e0b' },
    { key: 'shortlisted', label: 'Shortlisted', sub: 'Interview ready', icon: <CheckCircleRounded />, color: '#0ab6a2' },
    { key: 'hired', label: 'Hired & Offers', sub: 'Accepted roles', icon: <EmojiEventsRounded />, color: '#10b981' },
  ];

  const visibleApplications = useMemo(() => {
    return applications.filter((app) => {
      let matchesStatus = true;
      if (filter === 'under_review') matchesStatus = UNDER_REVIEW.includes(app.status);
      else if (filter !== 'all') matchesStatus = app.status === filter;

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          app.job.title.toLowerCase().includes(q) ||
          app.job.companyName.toLowerCase().includes(q) ||
          app.job.location.toLowerCase().includes(q);
      }

      return matchesStatus && matchesSearch;
    });
  }, [applications, filter, searchQuery]);

  const toggleTimeline = (id: string) => {
    setExpandedTimelineId((prev) => (prev === id ? null : id));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'var(--app-min-h)', bgcolor: '#f8fafc' }}>
      <Sidebar type="candidate" userName={candidateName} userRole={candidateRole} />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4.5 } }}>
        {/* Top Candidate Executive Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 3.5, md: 4 },
            mb: 3.5,
            borderRadius: '16px',
            color: '#ffffff',
            background: 'linear-gradient(125deg, #0c5283 0%, #0a4570 50%, #0ab6a2 135%)',
            boxShadow: '0 12px 32px -8px rgba(12, 82, 131, 0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -60,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
          >
            <Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.8,
                  py: 0.5,
                  borderRadius: 10,
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  mb: 1.5,
                }}
              >
                <StarsRounded sx={{ fontSize: 16, color: '#fef08a' }} />
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.72rem' }}>
                  CANDIDATE CAREER PORTAL
                </Typography>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '-0.025em',
                  fontSize: { xs: '1.85rem', sm: '2.4rem' },
                  lineHeight: 1.15,
                  mb: 1,
                }}
              >
                Welcome back, {candidateName}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.88)',
                  maxWidth: 600,
                  fontSize: { xs: '0.92rem', md: '1.02rem' },
                  lineHeight: 1.5,
                }}
              >
                Track your submitted applications, upcoming interview schedules, and discover verified veterinary vacancies.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexShrink: 0 }}>
              <Button
                component={Link}
                to="/find-job"
                variant="contained"
                endIcon={<ArrowForwardRounded />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#0c5283',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              >
                Explore Open Jobs
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* 4 Quick Filter Metric Tiles */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {stats.map((stat) => {
            const isActive = filter === stat.key;

            return (
              <Grid size={{ xs: 6, md: 3 }} key={stat.key}>
                <Paper
                  elevation={0}
                  onClick={() => setFilter(stat.key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFilter(stat.key);
                    }
                  }}
                  sx={{
                    p: 2.5,
                    borderRadius: '14px',
                    bgcolor: '#ffffff',
                    border: '1.5px solid',
                    borderColor: isActive ? stat.color : '#e2e8f0',
                    boxShadow: isActive ? `0 8px 24px -6px ${stat.color}35` : '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: stat.color,
                      boxShadow: `0 12px 28px -6px ${stat.color}25`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        display: 'grid',
                        placeItems: 'center',
                        color: stat.color,
                        bgcolor: `${stat.color}15`,
                        '& svg': { fontSize: 22 },
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      color: '#0f172a',
                      lineHeight: 1.1,
                      mb: 0.5,
                    }}
                  >
                    {isLoadingApplications ? '—' : counts[stat.key]}
                  </Typography>

                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    {stat.sub}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* AI Resume & File Upload Card */}
        <Box sx={{ mb: 3.5 }}>
          <MyResumeCard candidateName={candidateName} />
        </Box>

        {/* My Applications Section Header & Filter Toolbar */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2.5,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <Stack spacing={2}>
            {/* Toolbar Row 1: Heading & Actions */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  My Applications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filter === 'all'
                    ? 'Track all your submitted applications in one clean list.'
                    : `Filtered by "${filter.replace('_', ' ')}".`}
                </Typography>
              </Box>

              <Button
                component={Link}
                to="/find-job"
                variant="outlined"
                size="small"
                startIcon={<WorkOutlineRounded />}
                sx={{
                  borderRadius: '10px',
                  borderColor: '#0ab6a2',
                  color: '#0ab6a2',
                  fontWeight: 700,
                  textTransform: 'none',
                  height: 38,
                  '&:hover': { borderColor: '#0891b2', bgcolor: 'rgba(10, 182, 162, 0.05)' },
                }}
              >
                Find More Jobs
              </Button>
            </Box>

            {/* Toolbar Row 2: Search Input & Quick Filter Chips */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', md: 'center' },
                pt: 1.5,
                borderTop: '1px dashed #e2e8f0',
              }}
            >
              <TextField
                placeholder="Search by job title, clinic name, or location..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: '#64748b', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <ClearRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                sx={{
                  flex: 1,
                  maxWidth: { xs: '100%', md: 440 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                  },
                }}
              />

              {/* Status Filter Chips */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  overflowX: 'auto',
                  py: 0.5,
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 },
                }}
              >
                {[
                  { key: 'all', label: `All (${counts.all})` },
                  { key: 'under_review', label: `Under Review (${counts.under_review})` },
                  { key: 'shortlisted', label: `Shortlisted (${counts.shortlisted})` },
                  { key: 'hired', label: `Hired (${counts.hired})` },
                  { key: 'rejected', label: `Not Selected (${counts.rejected})` },
                ].map((tab) => {
                  const isActive = filter === tab.key;
                  return (
                    <Chip
                      key={tab.key}
                      label={tab.label}
                      onClick={() => setFilter(tab.key as StatusFilter)}
                      clickable
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        height: 32,
                        borderRadius: '8px',
                        bgcolor: isActive ? '#0c5283' : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#475569',
                        border: '1px solid',
                        borderColor: isActive ? '#0c5283' : '#e2e8f0',
                        '&:hover': {
                          bgcolor: isActive ? '#0a4570' : '#e2e8f0',
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Loading Spinner */}
        {isLoadingApplications && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error Alert */}
        {isApplicationsError && !isLoadingApplications && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            Unable to load your applications. Please check your connection and refresh.
          </Alert>
        )}

        {/* Empty State */}
        {!isLoadingApplications && !isApplicationsError && visibleApplications.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              py: 8,
              px: 3,
              textAlign: 'center',
              borderRadius: '16px',
              border: '2px dashed #cbd5e1',
              bgcolor: '#ffffff',
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                bgcolor: 'rgba(12, 82, 131, 0.08)',
                color: '#0c5283',
                display: 'grid',
                placeItems: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <WorkOutlineRounded sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
              {searchQuery || filter !== 'all' ? 'No matching applications' : 'No applications submitted yet'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3, lineHeight: 1.6 }}>
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your search query or switching to another status filter.'
                : 'Browse verified veterinary openings across top clinics and hospitals to start applying today.'}
            </Typography>

            {searchQuery || filter !== 'all' ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                sx={{
                  borderRadius: '10px',
                  borderColor: '#0c5283',
                  color: '#0c5283',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                component={Link}
                to="/find-job"
                variant="contained"
                sx={{
                  borderRadius: '10px',
                  bgcolor: '#0c5283',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3.5,
                  py: 1.2,
                  '&:hover': { bgcolor: '#08385a' },
                }}
              >
                Browse Open Jobs
              </Button>
            )}
          </Paper>
        )}

        {/* ONE-LINE COMPACT MODERN ROWS (MATCHING USER REFERENCE SCREENSHOT) */}
        {!isLoadingApplications && !isApplicationsError && visibleApplications.length > 0 && (
          <Stack spacing={1.5} sx={{ mb: 4 }}>
            {visibleApplications.map((application) => {
              const statusCfg = STATUS_CONFIG[application.status] || STATUS_CONFIG.new;
              const interview = application.interview;
              const isTimelineOpen = expandedTimelineId === application._id;

              return (
                <Paper
                  key={application._id}
                  elevation={0}
                  sx={{
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${statusCfg.dot}`,
                    bgcolor: '#ffffff',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    '&:hover': {
                      borderColor: '#0c5283',
                      boxShadow: '0 8px 24px -4px rgba(12, 82, 131, 0.12)',
                      transform: 'translateY(-1.5px)',
                    },
                  }}
                >
                  {/* Single Line Clean Row with Generous Height & Alignment */}
                  <Box
                    sx={{
                      minHeight: { xs: 'auto', md: 86 },
                      py: { xs: 2, md: 2.25 },
                      px: { xs: 2.5, md: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2.5,
                      flexWrap: { xs: 'wrap', md: 'nowrap' },
                    }}
                  >
                    {/* Left: Icon Plate & Job Identity */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: { xs: '1 1 100%', md: '0 1 380px' } }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          bgcolor: 'rgba(10, 182, 162, 0.12)',
                          color: '#0ab6a2',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          flexShrink: 0,
                          border: '1px solid rgba(10, 182, 162, 0.2)',
                        }}
                      >
                        {application.job.companyName?.charAt(0).toUpperCase() || <WorkOutlineRounded sx={{ fontSize: 22 }} />}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        {/* Title with link that opens directly in a new tab/page (NO MODAL) */}
                        <Typography
                          variant="subtitle1"
                          component={Link}
                          to={`/jobs/${application.job._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            color: '#0f172a',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.6,
                            minWidth: 0,
                            minHeight: 32,
                            lineHeight: 1.3,
                            mb: 0.4,
                            '&:hover': { color: '#0c5283', textDecoration: 'underline' },
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {application.job.title}
                          </Box>
                          <OpenInNewRounded sx={{ fontSize: 14, color: '#64748b', flexShrink: 0 }} />
                        </Typography>

                        {/* Subtitle: Company, Location, Type, Salary */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#64748b',
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: { xs: 'wrap', md: 'nowrap' },
                            rowGap: 0.4,
                            gap: 0.8,
                            fontWeight: 500,
                            minWidth: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                              color: '#334155',
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {application.job.companyName}
                          </Box>
                          <span>•</span>
                          <LocationOnOutlined sx={{ fontSize: 14, color: '#94a3b8' }} />
                          <span>{application.job.location}</span>
                          {application.job.type && (
                            <>
                              <span>•</span>
                              <span>{translateJobType(application.job.type)}</span>
                            </>
                          )}
                          {application.job.salary && (
                            <>
                              <span>•</span>
                              <Box
                                component="span"
                                sx={{
                                  color: '#047857',
                                  fontWeight: 700,
                                  bgcolor: '#ecfdf5',
                                  px: 0.9,
                                  py: 0.2,
                                  borderRadius: '5px',
                                  border: '1px solid #a7f3d0',
                                }}
                              >
                                {application.job.salary}
                              </Box>
                            </>
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Middle: Premium Capsule Status Widget (Matching Reference Screenshot!) */}
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'flex' },
                        alignItems: 'center',
                        gap: 1.75,
                        height: 52,
                        px: 2.2,
                        borderRadius: '12px',
                        bgcolor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                        flexShrink: 0,
                      }}
                    >
                      {/* Status Chip (Ensured whiteSpace: nowrap) */}
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.8,
                          px: 1.4,
                          py: 0.55,
                          borderRadius: '8px',
                          bgcolor: statusCfg.bg,
                          color: statusCfg.text,
                          border: `1px solid ${statusCfg.border}`,
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          lineHeight: 1,
                        }}
                      >
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusCfg.dot, flexShrink: 0 }} />
                        <span>{statusCfg.label}</span>
                      </Box>

                      {/* Clean 1px Vertical Divider */}
                      <Box sx={{ width: '1px', height: '24px', bgcolor: '#e2e8f0', flexShrink: 0 }} />

                      {/* Viewed Status */}
                      {application.viewedByEmployer ? (
                        <Tooltip title={`Employer viewed this application on ${formatDateTime(application.viewedAt)}`}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, color: '#0c5283', fontSize: '0.8rem', fontWeight: 700, cursor: 'help', whiteSpace: 'nowrap' }}>
                            <VisibilityRounded sx={{ fontSize: 16, color: '#0c5283' }} />
                            <span>Viewed</span>
                          </Box>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Employer has not opened this application yet">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, cursor: 'help', whiteSpace: 'nowrap' }}>
                            <VisibilityOffRounded sx={{ fontSize: 16 }} />
                            <span>Pending</span>
                          </Box>
                        </Tooltip>
                      )}

                      {/* Interview Pill if scheduled */}
                      {interview?.scheduledAt && (
                        <>
                          <Box sx={{ width: '1px', height: '24px', bgcolor: '#e2e8f0', flexShrink: 0 }} />
                          <Tooltip title={`Interview: ${formatDateTime(interview.scheduledAt)} (${INTERVIEW_MODE_LABEL[interview.mode] || interview.mode})`}>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.6,
                                px: 1.3,
                                py: 0.5,
                                borderRadius: '8px',
                                bgcolor: '#ccfbf1',
                                color: '#0f766e',
                                border: '1px solid #99f6e4',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                              onClick={() => toggleTimeline(application._id)}
                            >
                              <EventAvailableRounded sx={{ fontSize: 15 }} />
                              <span>Interview</span>
                            </Box>
                          </Tooltip>
                        </>
                      )}

                      {/* Message Tag if note exists */}
                      {application.employerMessage && (
                        <>
                          <Box sx={{ width: '1px', height: '24px', bgcolor: '#e2e8f0', flexShrink: 0 }} />
                          <Tooltip title={`Note from clinic: "${application.employerMessage}"`}>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.6,
                                px: 1.3,
                                py: 0.5,
                                borderRadius: '8px',
                                bgcolor: '#eff6ff',
                                color: '#0c5283',
                                border: '1px solid #bfdbfe',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                              onClick={() => toggleTimeline(application._id)}
                            >
                              <MessageRounded sx={{ fontSize: 15 }} />
                              <span>Note</span>
                            </Box>
                          </Tooltip>
                        </>
                      )}
                    </Box>

                    {/* Right: Date & Open Job Button & Expand Chevron */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: { xs: 1.25, md: 2.25 },
                        rowGap: 1,
                        // `flexShrink: 0` here kept the row wider than the card
                        // on a 320px screen, so the chevron hung off the edge.
                        flexShrink: { xs: 1, md: 0 },
                        minWidth: 0,
                        ml: { xs: 0, md: 'auto' },
                      }}
                    >
                      {/* Date */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: '#64748b' }}>
                        <AccessTimeRounded sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                          {formatDate(application.createdAt)}
                        </Typography>
                      </Box>

                      {/* Open Job Button (Opens directly in new tab/page, NO MODAL!) */}
                      <Button
                        component={Link}
                        to={`/jobs/${application.job._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNewRounded sx={{ fontSize: 14 }} />}
                        sx={{
                          height: 40,
                          borderRadius: '10px',
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '0.86rem',
                          px: 2.5,
                          borderColor: '#cbd5e1',
                          color: '#0c5283',
                          bgcolor: '#ffffff',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                          '&:hover': {
                            borderColor: '#0c5283',
                            bgcolor: 'rgba(12, 82, 131, 0.04)',
                          },
                        }}
                      >
                        Open Job
                      </Button>

                      {/* Expand Chevron to drop down interview details / message / timeline */}
                      {(interview?.scheduledAt || application.employerMessage || (application.statusHistory && application.statusHistory.length > 0)) && (
                        <IconButton
                          size="small"
                          onClick={() => toggleTimeline(application._id)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            color: isTimelineOpen ? '#0c5283' : '#64748b',
                            bgcolor: isTimelineOpen ? 'rgba(12, 82, 131, 0.06)' : '#ffffff',
                            transform: isTimelineOpen ? 'rotate(180deg)' : 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#cbd5e1',
                              bgcolor: '#f8fafc',
                            },
                          }}
                          title={isTimelineOpen ? 'Hide Details' : 'Show Interview & Note Details'}
                        >
                          <ExpandMoreRounded fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  {/* Smooth In-Place Details Dropdown (Only visible when expanded, takes NO height by default!) */}
                  <Collapse in={isTimelineOpen}>
                    <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                      {/* Interview details */}
                      {interview?.scheduledAt && (
                        <Box
                          sx={{
                            mb: 2,
                            p: 1.75,
                            borderRadius: '10px',
                            bgcolor: '#f0fdfa',
                            border: '1px solid #99f6e4',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <EventAvailableRounded sx={{ fontSize: 20, color: '#0f766e' }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f766e' }}>
                              Interview Scheduled for {formatDateTime(interview.scheduledAt)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#115e59', fontWeight: 600 }}>
                              Format: {INTERVIEW_MODE_LABEL[interview.mode] || interview.mode || 'Direct Connect'}
                              {interview.location && ` • Location/Link: ${interview.location}`}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Employer note */}
                      {application.employerMessage && (
                        <Box
                          sx={{
                            mb: 2,
                            p: 1.5,
                            borderRadius: '8px',
                            bgcolor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderLeft: '4px solid #0c5283',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0c5283', textTransform: 'uppercase' }}>
                            Message from Clinic:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', mt: 0.3 }}>
                            &ldquo;{application.employerMessage}&rdquo;
                          </Typography>
                        </Box>
                      )}

                      {/* Timeline history */}
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                        Application Timeline Updates
                      </Typography>
                      <Stack spacing={1.25}>
                        {(application.statusHistory ?? []).length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            Application submitted on {formatDate(application.createdAt)}. Awaiting clinic review.
                          </Typography>
                        ) : (
                          (application.statusHistory ?? []).map((event, idx) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: STATUS_CONFIG[event.status]?.dot || '#0c5283',
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                {STATUS_CONFIG[event.status]?.label || event.status}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                • {formatDateTime(event.changedAt)}
                              </Typography>
                              {event.message && (
                                <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic' }}>
                                  — {event.message}
                                </Typography>
                              )}
                            </Box>
                          ))
                        )}
                      </Stack>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        )}

        {/* EXPLORE RECOMMENDED JOBS SECTION */}
        {recommendedJobs.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Box
              sx={{
                display: 'flex',
                // On a phone the CTA drops under the heading instead of being
                // crushed into a three-line column beside it.
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 1, sm: 2 },
                mb: 2.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 1.6,
                    py: 0.4,
                    borderRadius: 8,
                    bgcolor: 'rgba(10, 182, 162, 0.1)',
                    color: '#0ab6a2',
                    mb: 0.8,
                  }}
                >
                  <TrendingUpRounded sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                    Recommended For You
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Explore Active Veterinary Openings
                </Typography>
              </Box>

              <Button
                component={Link}
                to="/find-job"
                endIcon={<ArrowForwardRounded />}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  color: '#0c5283',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                View All Jobs
              </Button>
            </Box>

            <Grid container spacing={2.5}>
              {recommendedJobs.map((job) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={job._id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      bgcolor: '#ffffff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: '#0c5283',
                        boxShadow: '0 12px 24px -6px rgba(12, 82, 131, 0.12)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '10px',
                          bgcolor: 'rgba(12, 82, 131, 0.08)',
                          color: '#0c5283',
                          fontWeight: 800,
                          fontSize: '1rem',
                        }}
                      >
                        {job.companyName?.charAt(0).toUpperCase() || 'V'}
                      </Avatar>
                      <Chip
                        label={translateJobType(job.type)}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          height: 22,
                          bgcolor: '#f1f5f9',
                          color: '#475569',
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h6"
                      component={Link}
                      to={`/jobs/${job._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: '#0f172a',
                        textDecoration: 'none',
                        lineHeight: 1.3,
                        mb: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 32,
                        '&:hover': { color: '#0c5283' },
                      }}
                    >
                      {job.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.84rem', mb: 1.5 }}>
                      {job.companyName}
                    </Typography>

                    <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontSize: '0.8rem', mb: 1 }}>
                        <LocationOnOutlined sx={{ fontSize: 16 }} />
                        <span>{job.location}</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857' }}>
                          {job.salary || 'Negotiable'}
                        </Typography>
                        <Button
                          component={Link}
                          to={`/jobs/${job._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          endIcon={<OpenInNewRounded sx={{ fontSize: 14 }} />}
                          sx={{
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '0.78rem',
                            color: '#0c5283',
                          }}
                        >
                          View Job
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CandidateDashboard;
