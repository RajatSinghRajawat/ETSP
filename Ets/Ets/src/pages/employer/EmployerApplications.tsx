import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircleRounded,
  EventAvailableRounded,
  HighlightOffRounded,
  LockRounded,
  LockOpenRounded,
  VisibilityRounded,
  SearchRounded,
  FilterListRounded,
  ClearRounded,
  WorkOutlineRounded,
  LocationOnOutlined,
  AccessTimeRounded,
  StarsRounded,
  GroupsRounded,
  PendingActionsRounded,
  EmojiEventsRounded,
  ArrowForwardRounded,
  VerifiedUserRounded,
  WorkspacePremiumRounded,
  RefreshRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import ApplicationDecisionDialog, { type DecisionKind } from '../../components/common/ApplicationDecisionDialog';
import {
  useGetEmployerApplicationsQuery,
  useGetEmployerApplicationCountsQuery,
  type ApplicationStatus,
  type ApplicationSort,
} from '../../store/api/applicationApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useUnlockCandidateMutation } from '../../store/api/candidateProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import { useGetMyJobsQuery } from '../../store/api/jobApi';

const STATUS_TABS: Array<{ value: ApplicationStatus | ''; label: string; color: string }> = [
  { value: '', label: 'All Applications', color: '#0c5283' },
  { value: 'new', label: 'New', color: '#0284c7' },
  { value: 'reviewing', label: 'Under Review', color: '#f59e0b' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#10b981' },
  { value: 'hired', label: 'Hired', color: '#8b5cf6' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  new: {
    label: 'New',
    bg: '#f0f9ff',
    text: '#0369a1',
    border: '#bae6fd',
    dot: '#0284c7',
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
    label: 'Rejected',
    bg: '#fef2f2',
    text: '#b91c1c',
    border: '#fecaca',
    dot: '#ef4444',
  },
  hired: {
    label: 'Hired',
    bg: '#f5f3ff',
    text: '#6d28d9',
    border: '#ddd6fe',
    dot: '#8b5cf6',
  },
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const EmployerApplications: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<ApplicationSort>('newest');

  const { data: employerData } = useGetMyEmployerProfileQuery();
  const { data: myJobsData } = useGetMyJobsQuery();
  const { data: countsData } = useGetEmployerApplicationCountsQuery();
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery();

  const { data, isLoading, isFetching, isError, refetch } = useGetEmployerApplicationsQuery({
    status: status || undefined,
    job: selectedJobId || undefined,
    search: activeSearch || undefined,
    sort: sortOrder,
    page,
    limit: 10,
  });

  const [unlockCandidate] = useUnlockCandidateMutation();
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const [decision, setDecision] = useState<{
    kind: DecisionKind;
    applicationId: string;
    candidateName: string;
    status: ApplicationStatus;
  } | null>(null);
  const [decisionMessage, setDecisionMessage] = useState('');

  const companyName = employerData?.data?.companyName || 'Employer';
  const applications = data?.data?.items ?? [];
  const pagination = data?.data?.pagination;
  const unlockBalance = usageData?.data?.usage?.unlockCredits?.accountBalance ?? 0;
  const postedJobs = myJobsData?.data ?? [];

  // Compute status tallies across all jobs
  const statusCounts = useMemo(() => {
    const byJob = countsData?.data?.byJob ?? {};
    let total = 0;
    let newCount = 0;
    let reviewingCount = 0;
    let shortlistedCount = 0;
    let hiredCount = 0;
    let rejectedCount = 0;

    if (selectedJobId && byJob[selectedJobId]) {
      const jobCounts = byJob[selectedJobId];
      return {
        all: jobCounts.total,
        new: jobCounts.new,
        reviewing: jobCounts.reviewing,
        shortlisted: jobCounts.shortlisted,
        hired: jobCounts.hired,
        rejected: jobCounts.rejected,
      };
    }

    Object.values(byJob).forEach((counts) => {
      total += counts.total || 0;
      newCount += counts.new || 0;
      reviewingCount += counts.reviewing || 0;
      shortlistedCount += counts.shortlisted || 0;
      hiredCount += counts.hired || 0;
      rejectedCount += counts.rejected || 0;
    });

    return {
      all: total || (pagination?.total ?? 0),
      new: newCount,
      reviewing: reviewingCount,
      shortlisted: shortlistedCount,
      hired: hiredCount,
      rejected: rejectedCount,
    };
  }, [countsData, selectedJobId, pagination?.total]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchTerm.trim());
  };

  const handleClearFilters = () => {
    setStatus('');
    setSelectedJobId('');
    setSearchTerm('');
    setActiveSearch('');
    setSortOrder('newest');
    setPage(1);
  };

  const isFiltered = Boolean(status || selectedJobId || activeSearch || sortOrder !== 'newest');

  // The metric tiles filter the list further down the page, which the employer
  // cannot see from the tiles — so bring the filter toolbar into view and flash it.
  const [highlightToolbar, setHighlightToolbar] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const statusStripRef = useRef<HTMLDivElement>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeStatusTab = STATUS_TABS.find((tab) => tab.value === status) ?? STATUS_TABS[0];

  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    [],
  );

  // On phones the status strip scrolls sideways; keep the active chip on screen.
  useEffect(() => {
    const strip = statusStripRef.current;
    const chip = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !chip || strip.scrollWidth <= strip.clientWidth) return;
    const left = chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [status]);

  const selectFromTile = (value: ApplicationStatus | '') => {
    setStatus(value);
    setPage(1);

    setHighlightToolbar(true);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightToolbar(false), 1400);

    const toolbar = toolbarRef.current;
    if (toolbar) {
      const { top } = toolbar.getBoundingClientRect();
      if (top < 80 || top > window.innerHeight * 0.55) {
        toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const onTileKeyDown = (event: React.KeyboardEvent, value: ApplicationStatus | '') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectFromTile(value);
    }
  };

  const handleUnlock = async (candidateProfileId: string, jobId?: string) => {
    setUnlockingId(candidateProfileId);
    try {
      await unlockCandidate({ id: candidateProfileId, jobId }).unwrap();
      refetch();
      refetchUsage();
    } catch {
      // Plan-gate interceptor displays the buy-credits dialog on 402
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'var(--app-min-h)', bgcolor: '#f8fafc' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4.5 } }}>
        {/* Top Executive Header Banner */}
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
          {/* Subtle ambient light shape */}
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -60,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={3}
            sx={{ justifyContent: 'space-between', alignItems: { lg: 'center' } }}
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
                  APPLICANT TRACKING & TRIAGE
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
                Candidate Applications
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.88)',
                  maxWidth: 620,
                  fontSize: { xs: '0.92rem', md: '1.02rem' },
                  lineHeight: 1.5,
                }}
              >
                Review candidate resumes, unlock direct contact credentials, and coordinate interviews across your active job postings.
              </Typography>
            </Box>

            {/* Right side unlock credits capsule & quick metrics */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  px: 2.5,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                  }}
                >
                  <LockOpenRounded sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Available Credits
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                    {unlockBalance} <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.85 }}>Credits</Typography>
                  </Typography>
                </Box>
              </Paper>

              <IconButton
                onClick={() => refetch()}
                sx={{
                  color: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  p: 1.5,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.22)' },
                  transition: 'transform 0.2s',
                  '&:active': { transform: 'rotate(180deg)' },
                }}
                title="Refresh application list"
              >
                <RefreshRounded />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        {/* Metric Overview Quick Filter Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <Paper
              elevation={0}
              role="button"
              tabIndex={0}
              aria-pressed={status === ''}
              onClick={() => selectFromTile('')}
              onKeyDown={(event) => onTileKeyDown(event, '')}
              sx={{
                p: 2.2,
                borderRadius: '14px',
                bgcolor: '#ffffff',
                border: '1.5px solid',
                borderColor: status === '' ? '#0c5283' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: status === '' ? '0 8px 24px -6px rgba(12, 82, 131, 0.15)' : 'none',
                '&:hover': { transform: 'translateY(-3px)', borderColor: '#0c5283' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Total
                </Typography>
                <GroupsRounded sx={{ fontSize: 20, color: '#0c5283' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a' }}>
                {statusCounts.all}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                All Candidates
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <Paper
              elevation={0}
              role="button"
              tabIndex={0}
              aria-pressed={status === 'new'}
              onClick={() => selectFromTile('new')}
              onKeyDown={(event) => onTileKeyDown(event, 'new')}
              sx={{
                p: 2.2,
                borderRadius: '14px',
                bgcolor: '#ffffff',
                border: '1.5px solid',
                borderColor: status === 'new' ? '#0284c7' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: status === 'new' ? '0 8px 24px -6px rgba(2, 132, 199, 0.15)' : 'none',
                '&:hover': { transform: 'translateY(-3px)', borderColor: '#0284c7' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  New
                </Typography>
                <StarsRounded sx={{ fontSize: 20, color: '#0284c7' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284c7' }}>
                {statusCounts.new}
              </Typography>
              <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>
                Needs Review
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <Paper
              elevation={0}
              role="button"
              tabIndex={0}
              aria-pressed={status === 'reviewing'}
              onClick={() => selectFromTile('reviewing')}
              onKeyDown={(event) => onTileKeyDown(event, 'reviewing')}
              sx={{
                p: 2.2,
                borderRadius: '14px',
                bgcolor: '#ffffff',
                border: '1.5px solid',
                borderColor: status === 'reviewing' ? '#f59e0b' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: status === 'reviewing' ? '0 8px 24px -6px rgba(245, 158, 11, 0.15)' : 'none',
                '&:hover': { transform: 'translateY(-3px)', borderColor: '#f59e0b' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Reviewing
                </Typography>
                <PendingActionsRounded sx={{ fontSize: 20, color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#f59e0b' }}>
                {statusCounts.reviewing}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                In Evaluation
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <Paper
              elevation={0}
              role="button"
              tabIndex={0}
              aria-pressed={status === 'shortlisted'}
              onClick={() => selectFromTile('shortlisted')}
              onKeyDown={(event) => onTileKeyDown(event, 'shortlisted')}
              sx={{
                p: 2.2,
                borderRadius: '14px',
                bgcolor: '#ffffff',
                border: '1.5px solid',
                borderColor: status === 'shortlisted' ? '#10b981' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: status === 'shortlisted' ? '0 8px 24px -6px rgba(16, 185, 129, 0.15)' : 'none',
                '&:hover': { transform: 'translateY(-3px)', borderColor: '#10b981' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Shortlisted
                </Typography>
                <CheckCircleRounded sx={{ fontSize: 20, color: '#10b981' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>
                {statusCounts.shortlisted}
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                Interview Ready
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 8, lg: 2.4 }}>
            <Paper
              elevation={0}
              role="button"
              tabIndex={0}
              aria-pressed={status === 'hired'}
              onClick={() => selectFromTile('hired')}
              onKeyDown={(event) => onTileKeyDown(event, 'hired')}
              sx={{
                p: 2.2,
                borderRadius: '14px',
                bgcolor: '#ffffff',
                border: '1.5px solid',
                borderColor: status === 'hired' ? '#8b5cf6' : '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: status === 'hired' ? '0 8px 24px -6px rgba(139, 92, 246, 0.15)' : 'none',
                '&:hover': { transform: 'translateY(-3px)', borderColor: '#8b5cf6' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Hired
                </Typography>
                <EmojiEventsRounded sx={{ fontSize: 20, color: '#8b5cf6' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#8b5cf6' }}>
                {statusCounts.hired}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Offers Accepted
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Notifications and Alerts */}
        {decisionMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setDecisionMessage('')}>
            {decisionMessage}
          </Alert>
        )}
        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            Unable to load applications. Please check your network connection and retry.
          </Alert>
        )}

        {/* Filter and Search Control Toolbar */}
        <Paper
          ref={toolbarRef}
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3.5,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: '1.5px solid',
            borderColor: highlightToolbar ? activeStatusTab.color : '#e2e8f0',
            boxShadow: highlightToolbar
              ? `0 0 0 4px ${activeStatusTab.color}22, 0 10px 28px -10px ${activeStatusTab.color}55`
              : '0 2px 10px -2px rgba(15, 23, 42, 0.04)',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            // Clears the fixed navbar (and the phone sidebar bar) when scrolled to.
            scrollMarginTop: { xs: 'calc(var(--app-header-h) + 72px)', md: 'calc(var(--app-header-h) + 16px)' },
          }}
        >
          <Stack spacing={2}>
            {/* Live summary of what the list below is showing. */}
            <Typography sx={{ color: '#0f172a', fontSize: { xs: '0.95rem', sm: '1rem' }, fontWeight: 700 }} aria-live="polite">
              {status ? (
                <>
                  Filtered by{' '}
                  <Box component="span" sx={{ color: activeStatusTab.color }}>
                    {activeStatusTab.label}
                  </Box>
                  <Box component="span" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem', ml: 1 }}>
                    {statusCounts[status as keyof typeof statusCounts] ?? 0} candidate
                    {(statusCounts[status as keyof typeof statusCounts] ?? 0) === 1 ? '' : 's'}
                  </Box>
                </>
              ) : (
                'Review every candidate who applied to your jobs in one place.'
              )}
            </Typography>

            {/* Top Toolbar Row: Search, Job Filter, Sort Order */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2.5fr 1.8fr 1.2fr auto' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              <TextField
                placeholder="Search by candidate name, skills, title, or location..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: '#64748b', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSearchTerm('');
                            setActiveSearch('');
                            setPage(1);
                          }}
                        >
                          <ClearRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    '&:hover': { bgcolor: '#ffffff' },
                  },
                }}
              />

              {/* Job Filter Dropdown */}
              <FormControl size="small" fullWidth>
                <Select
                  displayEmpty
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    setPage(1);
                  }}
                  sx={{
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    '&:hover': { bgcolor: '#ffffff' },
                  }}
                >
                  <MenuItem value="">
                    <em>All Job Postings ({postedJobs.length})</em>
                  </MenuItem>
                  {postedJobs.map((job) => (
                    <MenuItem key={job._id} value={job._id}>
                      {job.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sort Order */}
              <FormControl size="small" fullWidth>
                <Select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as ApplicationSort);
                    setPage(1);
                  }}
                  sx={{
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    '&:hover': { bgcolor: '#ffffff' },
                  }}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="status">By Status</MenuItem>
                </Select>
              </FormControl>

              {/* Clear Filters Button */}
              {isFiltered && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<ClearRounded />}
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'none',
                    height: 40,
                    px: 2,
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' },
                  }}
                >
                  Reset
                </Button>
              )}
            </Box>

            {/* Bottom Toolbar Row: Status Pills Strip */}
            <Box
              ref={statusStripRef}
              sx={{
                position: 'relative', // offsetParent for the active-chip scroll math
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                pb: 0.5,
                pt: 1,
                borderTop: '1px dashed #e2e8f0',
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 },
              }}
            >
              {STATUS_TABS.map((tab) => {
                const isActive = status === tab.value;
                const countKey = tab.value === '' ? 'all' : tab.value;
                const tabCount = statusCounts[countKey as keyof typeof statusCounts] ?? 0;

                return (
                  <Chip
                    key={tab.value}
                    label={`${tab.label} (${tabCount})`}
                    onClick={() => {
                      setStatus(tab.value);
                      setPage(1);
                    }}
                    clickable
                    aria-pressed={isActive}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      height: 34,
                      borderRadius: '8px',
                      px: 0.5,
                      bgcolor: isActive ? tab.color : '#f1f5f9',
                      color: isActive ? '#ffffff' : '#475569',
                      border: '1px solid',
                      borderColor: isActive ? tab.color : '#e2e8f0',
                      boxShadow: isActive ? `0 4px 12px -4px ${tab.color}80` : 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isActive ? tab.color : '#e2e8f0',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Stack>
        </Paper>

        {/* Loading Skeletons */}
        {(isLoading || isFetching) && (
          <Stack spacing={2.5}>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                }}
              >
                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                  <Skeleton variant="circular" width={64} height={64} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={28} />
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="30%" height={18} />
                  </Box>
                  <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 2 }} />
                </Box>
              </Card>
            ))}
          </Stack>
        )}

        {/* Applications List - Modern Cards */}
        {!isLoading && !isFetching && applications.length > 0 && (
          <Stack spacing={2.5}>
            {applications.map((application) => {
              const candidate = application.candidateProfile;
              const locked = Boolean(candidate?.locked);
              const statusCfg = STATUS_CONFIG[application.status] || STATUS_CONFIG.new;

              const candidateFullName = locked
                ? 'Candidate Profile'
                : `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Veterinary Candidate';

              const roleOrDegree = candidate.currentJobTitle || candidate.degree || 'Veterinary Professional';

              return (
                <Card
                  key={application._id}
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: locked ? '#e2e8f0' : 'rgba(226, 232, 240, 0.9)',
                    bgcolor: '#ffffff',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: locked ? '#cbd5e1' : '#0c5283',
                      boxShadow: '0 12px 28px -6px rgba(12, 82, 131, 0.12)',
                    },
                  }}
                >
                  {/* Subtle top indicator strip */}
                  <Box
                    sx={{
                      height: 4,
                      bgcolor: statusCfg.dot,
                    }}
                  />

                  <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={3}
                      sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
                    >
                      {/* Left: Avatar & Candidate Info */}
                      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                        {/* Avatar */}
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar
                            src={locked ? undefined : candidate.photoUrl || undefined}
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: '14px',
                              bgcolor: locked ? '#e2e8f0' : 'rgba(12, 82, 131, 0.08)',
                              color: locked ? '#64748b' : '#0c5283',
                              fontWeight: 800,
                              fontSize: '1.4rem',
                              border: '2px solid #ffffff',
                              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.06)',
                            }}
                          >
                            {locked ? <LockRounded sx={{ fontSize: 26, color: '#94a3b8' }} /> : candidate.firstName?.charAt(0) || 'C'}
                          </Avatar>

                          {/* Verification shield on avatar corner */}
                          {!locked && candidate.aadhaarVerified && (
                            <Box
                              title="Aadhaar Verified"
                              sx={{
                                position: 'absolute',
                                bottom: -3,
                                right: -3,
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                bgcolor: '#10b981',
                                color: '#ffffff',
                                display: 'grid',
                                placeItems: 'center',
                                border: '2px solid #ffffff',
                              }}
                            >
                              <VerifiedUserRounded sx={{ fontSize: 13 }} />
                            </Box>
                          )}
                        </Box>

                        {/* Name, Credentials & Job Badges */}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          {/* Name & Badges */}
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 800,
                                fontSize: '1.15rem',
                                color: '#0f172a',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {candidateFullName}
                            </Typography>

                            {locked && (
                              <Chip
                                size="small"
                                icon={<LockRounded sx={{ fontSize: '13px !important' }} />}
                                label="Protected"
                                sx={{
                                  bgcolor: '#f1f5f9',
                                  color: '#64748b',
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  height: 22,
                                  borderRadius: 1,
                                }}
                              />
                            )}

                            {!locked && candidate.excelMember && (
                              <Chip
                                icon={<WorkspacePremiumRounded sx={{ fontSize: '13px !important', color: '#b45309 !important' }} />}
                                label="EXCEL"
                                size="small"
                                sx={{
                                  bgcolor: '#fef3c7',
                                  color: '#92400e',
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  height: 22,
                                  borderRadius: 1,
                                }}
                              />
                            )}

                            {!locked && candidate.verifiedBadge && !candidate.excelMember && (
                              <Chip
                                label="Verified"
                                size="small"
                                sx={{
                                  bgcolor: '#ecfdf5',
                                  color: '#047857',
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  height: 22,
                                  borderRadius: 1,
                                }}
                              />
                            )}
                          </Box>

                          {/* Role / Current Title */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#0c5283',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              mb: 1,
                            }}
                          >
                            {roleOrDegree}
                          </Typography>

                          {/* Applied Job Capsule & Metadata Row */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            {/* Applied Job Pill */}
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.8,
                                px: 1.4,
                                py: 0.4,
                                borderRadius: 1.5,
                                bgcolor: 'rgba(12, 82, 131, 0.07)',
                                color: '#0c5283',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                              }}
                            >
                              <WorkOutlineRounded sx={{ fontSize: 15 }} />
                              <span>Applied for: {application.job?.title || 'Job Listing'}</span>
                            </Box>

                            {/* Location */}
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#64748b',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                              }}
                            >
                              <LocationOnOutlined sx={{ fontSize: 16 }} />
                              <span>{locked ? 'Location Verified' : candidate.currentLocation || 'Location not specified'}</span>
                            </Box>

                            {/* Applied Date */}
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#94a3b8',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                              }}
                            >
                              <AccessTimeRounded sx={{ fontSize: 15 }} />
                              <span>{timeAgo(application.createdAt)}</span>
                            </Box>
                          </Box>

                          {/* Candidate Skills Pills */}
                          {!locked && candidate.skills && candidate.skills.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
                              {candidate.skills.slice(0, 4).map((skill) => (
                                <Chip
                                  key={skill}
                                  label={skill}
                                  size="small"
                                  sx={{
                                    bgcolor: '#f8fafc',
                                    color: '#475569',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.7rem',
                                    height: 22,
                                    borderRadius: 1,
                                  }}
                                />
                              ))}
                              {candidate.skills.length > 4 && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', alignSelf: 'center', fontWeight: 600 }}>
                                  +{candidate.skills.length - 4} more
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Right: Status Pill & Action Buttons */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'row', md: 'column' },
                          flexWrap: { xs: 'wrap', md: 'nowrap' },
                          alignItems: { xs: 'center', md: 'flex-end' },
                          justifyContent: 'space-between',
                          gap: 1.5,
                          rowGap: 1.25,
                          width: { xs: '100%', md: 'auto' },
                          minWidth: 0,
                          pt: { xs: 2, md: 0 },
                          borderTop: { xs: '1px dashed #e2e8f0', md: 'none' },
                        }}
                      >
                        {/* Status Badge with Dot Indicator */}
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.8,
                            px: 1.6,
                            py: 0.6,
                            borderRadius: 10,
                            bgcolor: statusCfg.bg,
                            border: `1px solid ${statusCfg.border}`,
                            color: statusCfg.text,
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            letterSpacing: '0.02em',
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: statusCfg.dot,
                            }}
                          />
                          <span>{statusCfg.label}</span>
                        </Box>

                        {/* Interactive Buttons Strip */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          {locked ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={
                                unlockingId === candidate._id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <LockOpenRounded fontSize="small" />
                                )
                              }
                              disabled={unlockingId === candidate._id}
                              onClick={() => handleUnlock(candidate._id, application.job?._id)}
                              sx={{
                                background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                                color: '#ffffff',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: '10px',
                                px: 2,
                                py: 0.8,
                                boxShadow: '0 4px 12px rgba(12, 82, 131, 0.25)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
                                },
                              }}
                            >
                              {unlockingId === candidate._id ? 'Unlocking…' : 'Unlock (1 credit)'}
                            </Button>
                          ) : (
                            <>
                              {/* Fast triage: Accept / Shortlist */}
                              {application.status !== 'rejected' && application.status !== 'hired' && (
                                <Tooltip title="Shortlist candidate or schedule interview">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="success"
                                    startIcon={<CheckCircleRounded fontSize="small" />}
                                    onClick={() =>
                                      setDecision({
                                        kind: 'accept',
                                        applicationId: application._id,
                                        candidateName: candidateFullName,
                                        status: application.status,
                                      })
                                    }
                                    sx={{
                                      borderRadius: '10px',
                                      fontWeight: 700,
                                      textTransform: 'none',
                                      px: 1.6,
                                      py: 0.6,
                                      bgcolor: '#f0fdf4',
                                      borderColor: '#bbf7d0',
                                      '&:hover': { bgcolor: '#dcfce7', borderColor: '#86efac' },
                                    }}
                                  >
                                    Accept
                                  </Button>
                                </Tooltip>
                              )}

                              {/* Reject */}
                              {application.status !== 'rejected' && (
                                <Tooltip title="Reject candidate with optional note">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<HighlightOffRounded fontSize="small" />}
                                    onClick={() =>
                                      setDecision({
                                        kind: 'reject',
                                        applicationId: application._id,
                                        candidateName: candidateFullName,
                                        status: application.status,
                                      })
                                    }
                                    sx={{
                                      borderRadius: '10px',
                                      fontWeight: 700,
                                      textTransform: 'none',
                                      px: 1.6,
                                      py: 0.6,
                                      bgcolor: '#fef2f2',
                                      borderColor: '#fecaca',
                                      '&:hover': { bgcolor: '#fee2e2', borderColor: '#fca5a5' },
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </Tooltip>
                              )}

                              {/* View Full Application */}
                              <Button
                                variant="contained"
                                size="small"
                                endIcon={<ArrowForwardRounded fontSize="small" />}
                                onClick={() => navigate(`/employer/applications/${application._id}`)}
                                sx={{
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  px: 2,
                                  py: 0.8,
                                  bgcolor: '#0c5283',
                                  color: '#ffffff',
                                  boxShadow: 'none',
                                  '&:hover': {
                                    bgcolor: '#08385a',
                                    boxShadow: '0 4px 12px rgba(12, 82, 131, 0.25)',
                                  },
                                }}
                              >
                                View
                              </Button>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Stack>

                    {/* Interview Highlight Strip if Scheduled */}
                    {application.interview?.scheduledAt && (
                      <Box
                        sx={{
                          mt: 2.5,
                          pt: 2,
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          bgcolor: '#f0fdfa',
                          border: '1px solid #ccfbf1',
                          borderRadius: '10px',
                          p: 1.5,
                          color: '#0d9488',
                        }}
                      >
                        <EventAvailableRounded sx={{ fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                          Interview Scheduled for {formatDateTime(application.interview.scheduledAt)}
                        </Typography>
                        {application.interview.mode && (
                          <Chip
                            label={application.interview.mode.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              ml: 'auto',
                              height: 22,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: '#ffffff',
                              color: '#0f766e',
                              border: '1px solid #99f6e4',
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        {/* Empty State */}
        {!isLoading && !isFetching && applications.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              py: 8,
              px: 3,
              textAlign: 'center',
              borderRadius: '16px',
              border: '2px dashed #cbd5e1',
              bgcolor: '#ffffff',
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
              <GroupsRounded sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
              No applications found
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3, lineHeight: 1.6 }}>
              {isFiltered
                ? 'No candidates match your current search and status filters. Try clearing or relaxing your filter options.'
                : 'Candidates will appear here as soon as they submit applications to your posted veterinary openings.'}
            </Typography>

            {isFiltered ? (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearRounded />}
                sx={{
                  borderRadius: '10px',
                  borderColor: '#0c5283',
                  color: '#0c5283',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  '&:hover': { bgcolor: 'rgba(12, 82, 131, 0.04)' },
                }}
              >
                Clear All Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate('/employer/post-job')}
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
                Post a New Job
              </Button>
            )}
          </Paper>
        )}

        {/* Responsive Pagination & Results Summary */}
        {!isLoading && !isFetching && applications.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mt: 4,
              pt: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Showing{' '}
              <Typography component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {applications.length}
              </Typography>{' '}
              of{' '}
              <Typography component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {pagination?.total ?? applications.length}
              </Typography>{' '}
              candidates
            </Typography>

            <Pagination
              count={pagination?.totalPages ?? 1}
              page={page}
              onChange={(_, nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              color="primary"
              siblingCount={1}
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 700,
                  borderRadius: '8px',
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Accept / Reject / Interview Dialog */}
      <ApplicationDecisionDialog
        decision={decision?.kind ?? null}
        applicationId={decision?.applicationId ?? ''}
        candidateName={decision?.candidateName}
        currentStatus={decision?.status}
        onClose={() => setDecision(null)}
        onDone={(msg) => {
          setDecisionMessage(msg);
          refetch();
        }}
      />
    </Box>
  );
};

export default EmployerApplications;
