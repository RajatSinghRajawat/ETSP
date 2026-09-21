import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link as MuiLink,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTimeOutlined,
  ClearRounded,
  ContentCopyOutlined,
  DescriptionOutlined,
  EditOutlined,
  GroupOutlined,
  LockOutlined,
  MoreHoriz,
  OpenInNewOutlined,
  PersonSearchOutlined,
  PlaceOutlined,
  PlayArrowOutlined,
  SearchRounded,
  StarBorderRounded,
  StarRounded,
  StopCircleOutlined,
  WorkOutlineOutlined,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type { JobApplicationCounts } from '../../store/api/applicationApi';
import type { JobResponse, JobStatus } from '../../store/api/jobApi';
import { useUpdateJobStatusMutation } from '../../store/api/jobApi';
import JobStatusControl from './JobStatusControl';
import { JOB_STATUS_META, POSTED_VIA_LABEL, formatJobDate, formatRelativeDate } from './jobStatus';
import { SoftChip } from './employerUi';
import { pillTabsSx } from './employerTokens';

const EMPTY_COUNTS: JobApplicationCounts = {
  total: 0,
  new: 0,
  reviewing: 0,
  shortlisted: 0,
  rejected: 0,
  hired: 0,
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    return (error as { data?: { message?: string } }).data?.message ?? fallback;
  }
  return fallback;
};

const getInitials = (name?: string) => {
  if (!name || !name.trim()) return 'IN';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * Candidate Tallies Capsule:
 * Premium, spacious segmented metric container with clear typography,
 * generous padding, distinct active states, and comfortable breathing room.
 */
const CandidateCapsule: React.FC<{
  counts: JobApplicationCounts;
  showMatches: boolean;
  onAllClick: () => void;
  onNewClick: () => void;
  onMatchesClick: () => void;
}> = ({ counts, showMatches, onAllClick, onNewClick, onMatchesClick }) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        bgcolor: '#ffffff',
        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        p: '5px',
        height: 62,
        flexShrink: 0,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#cbd5e1',
          boxShadow: '0 6px 18px -3px rgba(15, 23, 42, 0.09)',
        },
      }}
    >
      {/* 1. All */}
      <Box
        component="button"
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onAllClick();
        }}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1.8,
          py: 0.75,
          minWidth: 56,
          borderRadius: '10px',
          transition: 'all 0.18s ease',
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            '& .capsule-label': { color: 'primary.main' },
            '& .capsule-icon': { color: 'primary.main' },
          },
        }}
      >
        <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
          <GroupOutlined
            className="capsule-icon"
            sx={{ fontSize: 18, color: '#64748b', transition: 'color 0.18s ease' }}
          />
          <Typography
            component="span"
            sx={{
              fontWeight: 850,
              fontSize: '1.06rem',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            {counts.total}
          </Typography>
        </Stack>
        <Typography
          component="span"
          className="capsule-label"
          sx={{
            fontWeight: 650,
            fontSize: '0.75rem',
            lineHeight: 1.15,
            color: '#64748b',
            mt: 0.45,
            letterSpacing: '0.02em',
            transition: 'color 0.18s ease',
          }}
        >
          All
        </Typography>
      </Box>

      {/* Divider */}
      <Box sx={{ width: '1px', height: 34, bgcolor: '#e2e8f0', mx: 0.6 }} />

      {/* 2. New */}
      <Box
        component="button"
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onNewClick();
        }}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1.8,
          py: 0.75,
          minWidth: 56,
          borderRadius: '10px',
          bgcolor: counts.new > 0 ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
          transition: 'all 0.18s ease',
          '&:hover': {
            bgcolor: counts.new > 0 ? 'rgba(2, 132, 199, 0.14)' : (theme) => alpha(theme.palette.primary.main, 0.08),
            '& .capsule-label': { color: counts.new > 0 ? '#0284c7' : 'primary.main' },
            '& .capsule-icon': { color: counts.new > 0 ? '#0284c7' : 'primary.main' },
          },
        }}
      >
        <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
          <DescriptionOutlined
            className="capsule-icon"
            sx={{
              fontSize: 18,
              color: counts.new > 0 ? '#0284c7' : '#64748b',
              transition: 'color 0.18s ease',
            }}
          />
          <Typography
            component="span"
            sx={{
              fontWeight: 850,
              fontSize: '1.06rem',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: counts.new > 0 ? '#0284c7' : '#0f172a',
            }}
          >
            {counts.new}
          </Typography>
        </Stack>
        <Typography
          component="span"
          className="capsule-label"
          sx={{
            fontWeight: counts.new > 0 ? 750 : 650,
            fontSize: '0.75rem',
            lineHeight: 1.15,
            color: counts.new > 0 ? '#0284c7' : '#64748b',
            mt: 0.45,
            letterSpacing: '0.02em',
            transition: 'color 0.18s ease',
          }}
        >
          New
        </Typography>
      </Box>

      {/* Divider */}
      <Box sx={{ width: '1px', height: 34, bgcolor: '#e2e8f0', mx: 0.6 }} />

      {/* 3. Matches */}
      {showMatches ? (
        <Box
          component="button"
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onMatchesClick();
          }}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1.8,
            py: 0.75,
            minWidth: 72,
            borderRadius: '10px',
            transition: 'all 0.18s ease',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              '& .capsule-label': { color: 'primary.main' },
              '& .capsule-icon': { color: 'primary.main' },
            },
          }}
        >
          <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
            <PersonSearchOutlined
              className="capsule-icon"
              sx={{ fontSize: 18, color: '#64748b', transition: 'color 0.18s ease' }}
            />
            <Typography
              component="span"
              sx={{
                fontWeight: 850,
                fontSize: '1.06rem',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#0f172a',
              }}
            >
              {counts.shortlisted}
            </Typography>
          </Stack>
          <Typography
            component="span"
            className="capsule-label"
            sx={{
              fontWeight: 650,
              fontSize: '0.75rem',
              lineHeight: 1.15,
              color: '#64748b',
              mt: 0.45,
              letterSpacing: '0.02em',
              transition: 'color 0.18s ease',
            }}
          >
            Matches
          </Typography>
        </Box>
      ) : (
        <Tooltip title="Matched candidates are a Premium feature · Click to explore plans" arrow>
          <Box
            component="button"
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onMatchesClick();
            }}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1.8,
              py: 0.75,
              minWidth: 72,
              borderRadius: '10px',
              transition: 'all 0.18s ease',
              '&:hover': {
                bgcolor: 'rgba(241, 245, 249, 0.9)',
                '& .capsule-label': { color: 'primary.main' },
                '& .capsule-icon': { color: 'primary.main' },
              },
            }}
          >
            <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
              <LockOutlined
                className="capsule-icon"
                sx={{ fontSize: 15, color: '#94a3b8', transition: 'color 0.18s ease' }}
              />
              <Typography
                component="span"
                sx={{
                  fontWeight: 850,
                  fontSize: '1.02rem',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: '#94a3b8',
                }}
              >
                0
              </Typography>
            </Stack>
            <Typography
              component="span"
              className="capsule-label"
              sx={{
                fontWeight: 650,
                fontSize: '0.75rem',
                lineHeight: 1.15,
                color: '#94a3b8',
                mt: 0.45,
                letterSpacing: '0.02em',
                transition: 'color 0.18s ease',
              }}
            >
              Matches
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

const STATUS_TABS: Array<{ value: JobStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Open' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'expired', label: 'Expired' },
];

type SortKey = 'newest' | 'oldest' | 'applicants' | 'title';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'applicants', label: 'Most applicants' },
  { value: 'title', label: 'Title (A–Z)' },
];

type Props = {
  jobs: JobResponse[];
  countsByJob: Record<string, JobApplicationCounts>;
  /** Hides the premium-only "Matches" tally behind a lock. */
  showMatches?: boolean;
  /** Hides the search / status / sort toolbar above the list. */
  showToolbar?: boolean;
};

/**
 * Employer Jobs List:
 * Renders each job in a single, continuous, ultra-premium horizontal paper row with perfect proportions.
 */
const EmployerJobsTable: React.FC<Props> = ({
  jobs,
  countsByJob,
  showMatches = true,
  showToolbar = true,
}) => {
  const navigate = useNavigate();
  const [updateJobStatus] = useUpdateJobStatusMutation();
  const [menuJob, setMenuJob] = useState<JobResponse | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Persistent starred jobs in localStorage
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('employer_starred_jobs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleStar = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      try {
        localStorage.setItem('employer_starred_jobs', JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSelectJob = (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId],
    );
  };

  const statusCounts = useMemo(() => {
    const counts = { all: jobs.length } as Record<JobStatus | 'all', number>;
    STATUS_TABS.forEach(({ value }) => {
      if (value !== 'all') counts[value] = 0;
    });
    jobs.forEach((job) => {
      counts[job.status] = (counts[job.status] ?? 0) + 1;
    });
    return counts;
  }, [jobs]);

  const visibleTabs = STATUS_TABS.filter(
    (tab) => tab.value === 'all' || statusCounts[tab.value] > 0 || tab.value === statusFilter,
  );

  const visibleJobs = useMemo(() => {
    const term = query.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (!term) return true;
      return (
        job.title.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.type.toLowerCase().includes(term) ||
        (job.skills ?? []).some((skill) => skill.toLowerCase().includes(term))
      );
    });

    const byDate = (job: JobResponse) => new Date(job.createdAt).getTime() || 0;

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'oldest':
          return byDate(a) - byDate(b);
        case 'applicants':
          return (countsByJob[b._id]?.total ?? 0) - (countsByJob[a._id]?.total ?? 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return byDate(b) - byDate(a);
      }
    });
  }, [jobs, query, statusFilter, sortKey, countsByJob]);

  const isFiltered = Boolean(query.trim()) || statusFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuJob(null);
  };

  const setStatus = async (job: JobResponse, status: 'active' | 'closed') => {
    setError('');
    try {
      await updateJobStatus({ id: job._id, status }).unwrap();
      setToastMessage(`Job status changed to ${status === 'active' ? 'Open' : 'Closed'}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change the job status. Please try again.'));
    }
  };

  const handleBulkStatus = async (status: 'active' | 'paused' | 'closed') => {
    if (selectedIds.length === 0) return;
    setError('');
    try {
      await Promise.all(
        selectedIds.map((id) => updateJobStatus({ id, status }).unwrap())
      );
      setToastMessage(`Updated ${selectedIds.length} job(s) to ${status === 'active' ? 'Open' : status}`);
      setSelectedIds([]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update some jobs.'));
    }
  };

  const handleCopyShareLink = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    setToastMessage('Public job link copied to clipboard!');
    closeMenu();
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Bulk action banner when items are selected */}
      {selectedIds.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2.5,
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.25),
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', mr: 1 }}>
            {selectedIds.length} job{selectedIds.length > 1 ? 's' : ''} selected
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleBulkStatus('paused')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Pause
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleBulkStatus('active')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Reopen
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleBulkStatus('closed')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Close
          </Button>
          <Button
            size="small"
            onClick={() => setSelectedIds([])}
            sx={{ ml: 'auto', textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Deselect all
          </Button>
        </Paper>
      )}

      {showToolbar && jobs.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.75}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 1.5 }}
          >
            {/* Left: Modern Segmented Status Pills */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                p: '3px',
                borderRadius: '10px',
                bgcolor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                overflowX: 'auto',
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch',
                flexShrink: 0,
              }}
            >
              {visibleTabs.map((tab) => {
                const isActive = statusFilter === tab.value;
                const count = statusCounts[tab.value] ?? 0;
                return (
                  <Box
                    component="button"
                    type="button"
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    sx={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.85,
                      px: 1.6,
                      py: 0.65,
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? '#0f172a' : '#64748b',
                      bgcolor: isActive ? '#ffffff' : 'transparent',
                      boxShadow: isActive
                        ? '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)'
                        : 'none',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        color: '#0f172a',
                        bgcolor: isActive ? '#ffffff' : alpha('#ffffff', 0.6),
                      },
                    }}
                  >
                    <span>{tab.label}</span>
                    <Box
                      component="span"
                      sx={{
                        px: 0.7,
                        py: 0.1,
                        minWidth: 18,
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        bgcolor: isActive ? '#f1f5f9' : '#e2e8f0',
                        color: isActive ? '#0f172a' : '#64748b',
                      }}
                    >
                      {count}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Right: Search & Sort Bar */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ alignItems: { sm: 'center' }, width: { xs: '100%', md: 'auto' } }}
            >
              <TextField
                size="small"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, location or skill…"
                aria-label="Search your jobs"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ fontSize: 18, color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: query ? (
                      <InputAdornment position="end">
                        <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')} sx={{ p: 0.25 }}>
                          <ClearRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
                sx={{
                  width: { xs: '100%', sm: 260 },
                  '& .MuiOutlinedInput-root': {
                    height: 38,
                    borderRadius: '10px',
                    bgcolor: '#ffffff',
                    fontSize: '0.84rem',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1.5px' },
                  },
                }}
              />

              {/* Sleek Flat Sort Dropdown */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 38,
                  borderRadius: '10px',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  px: 1.25,
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                  transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: '#cbd5e1' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mr: 0.5, whiteSpace: 'nowrap' }}>
                  Sort:
                </Typography>
                <Select
                  size="small"
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                  sx={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': { py: 0.5, pr: 2.75, pl: 0.5 },
                    '& .MuiSelect-icon': { color: '#64748b', fontSize: 18, right: 0 },
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.84rem', fontWeight: 600 }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Stack>
          </Stack>
        </Box>
      )}

      {showToolbar && isFiltered && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', mb: 1.5, color: 'text.secondary' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            {visibleJobs.length} of {jobs.length} job{jobs.length === 1 ? '' : 's'}
          </Typography>
          <Button size="small" onClick={clearFilters} sx={{ minHeight: 28, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}>
            Clear filters
          </Button>
        </Stack>
      )}

      {visibleJobs.length === 0 && jobs.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>No jobs match</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Try a different search term or status.
          </Typography>
          <Button variant="outlined" onClick={clearFilters} sx={{ textTransform: 'none', borderRadius: 2.5 }}>
            Clear filters
          </Button>
        </Box>
      )}

      {/* Single-Line Jobs List Container with responsive horizontal scroll wrapper */}
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          pb: 1,
        }}
      >
        <Box sx={{ minWidth: 960, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visibleJobs.map((job) => {
            const counts = countsByJob[job._id] ?? EMPTY_COUNTS;
            const jobPath = `/employer/jobs/${job._id}`;
            const applicantsPath = `/employer/jobs/${job._id}/applicants`;
            const isSelected = selectedIds.includes(job._id);
            const isStarred = starredIds.has(job._id);
            const statusMeta = JOB_STATUS_META[job.status] ?? JOB_STATUS_META.draft;

            return (
              <Paper
                key={job._id}
                elevation={0}
                onClick={() => navigate(jobPath)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 1.8fr) 250px 125px 125px 180px',
                  alignItems: 'center',
                  gap: 2,
                  px: 2.5,
                  py: 2,
                  minHeight: 90,
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : '#e2e8f0',
                  bgcolor: isSelected ? alpha('#0c5283', 0.03) : '#ffffff',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-1.5px)',
                    borderColor: '#cbd5e1',
                    boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
                    bgcolor: '#fafcff',
                  },
                }}
              >
                {/* Column 1: Select, Icon & Job Identity */}
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onClick={(e) => toggleSelectJob(job._id, e)}
                    sx={{
                      p: 0.5,
                      mr: 0.5,
                      color: '#cbd5e1',
                      '&.Mui-checked': { color: 'primary.main' },
                    }}
                  />

                  <IconButton
                    size="small"
                    onClick={(e) => toggleStar(job._id, e)}
                    sx={{
                      p: 0.5,
                      mr: 1.25,
                      transition: 'transform 0.15s ease',
                      '&:hover': { transform: 'scale(1.15)' },
                    }}
                    aria-label="Star job"
                  >
                    {isStarred ? (
                      <StarRounded sx={{ fontSize: 20, color: '#f59e0b', filter: 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.4))' }} />
                    ) : (
                      <StarBorderRounded sx={{ fontSize: 20, color: '#94a3b8' }} />
                    )}
                  </IconButton>

                  {/* Modern Job Icon Plate */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: '10px',
                      display: 'grid',
                      placeItems: 'center',
                      color: statusMeta.color,
                      bgcolor: alpha(statusMeta.color, 0.09),
                      border: '1px solid',
                      borderColor: alpha(statusMeta.color, 0.2),
                      mr: 1.75,
                      transition: 'transform 0.2s ease',
                      '& svg': { fontSize: 20 },
                      '.MuiPaper-root:hover &': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <WorkOutlineOutlined />
                  </Box>

                  {/* Job Title & Sub-metadata */}
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <MuiLink
                        component={RouterLink}
                        to={jobPath}
                        underline="none"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          lineHeight: 1.3,
                          letterSpacing: '-0.01em',
                          color: '#0f172a',
                          transition: 'color 150ms ease',
                          '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                        }}
                      >
                        {job.title}
                      </MuiLink>
                      {job.isFeatured && <SoftChip label="Featured" tone="amber" />}
                      {job.isUrgent && <SoftChip label="Urgent" tone="red" />}
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.35, color: 'text.secondary', flexWrap: 'wrap' }}>
                      <PlaceOutlined sx={{ fontSize: 13.5, color: '#64748b', flexShrink: 0 }} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: '#64748b',
                        }}
                      >
                        {job.location || 'Remote'}
                      </Typography>
                      {job.type && (
                        <>
                          <Box component="span" sx={{ color: '#cbd5e1', fontSize: '0.7rem' }}>•</Box>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem', color: '#64748b' }}>
                            {job.type}
                          </Typography>
                        </>
                      )}
                    </Stack>
                  </Box>
                </Box>

                {/* Column 2: Candidate Tallies Capsule */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CandidateCapsule
                    counts={counts}
                    showMatches={showMatches}
                    onAllClick={() => navigate(applicantsPath)}
                    onNewClick={() => navigate(`${applicantsPath}?tab=new`)}
                    onMatchesClick={() => {
                      if (showMatches) {
                        navigate(`${applicantsPath}?tab=shortlisted`);
                      } else {
                        navigate('/employer/plans');
                      }
                    }}
                  />
                </Box>

                {/* Column 3: Plan & Sponsorship */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.35 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: 0.9,
                      py: 0.2,
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      bgcolor: job.postedVia === 'premium' ? alpha('#f59e0b', 0.12) : '#f1f5f9',
                      color: job.postedVia === 'premium' ? '#b45309' : '#475569',
                      border: '1px solid',
                      borderColor: job.postedVia === 'premium' ? alpha('#f59e0b', 0.28) : '#e2e8f0',
                    }}
                  >
                    {POSTED_VIA_LABEL[job.postedVia ?? 'free'] ?? 'Free'}
                  </Box>
                  <MuiLink
                    component={RouterLink}
                    to="/employer/plans"
                    underline="hover"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: 'primary.main',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.3,
                      '&:hover': { color: 'primary.dark' },
                    }}
                  >
                    Sponsor job ↗
                  </MuiLink>
                </Box>

                {/* Column 4: Date Stack */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.3 }}>
                  <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
                    <AccessTimeOutlined sx={{ fontSize: 13, color: '#94a3b8' }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: '#1e293b',
                        lineHeight: 1.2,
                      }}
                    >
                      {formatRelativeDate(job.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      pl: '17px',
                      lineHeight: 1.2,
                    }}
                  >
                    {formatJobDate(job.createdAt)}
                  </Typography>
                </Box>

                {/* Column 5: Status Control & Action Cluster */}
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                  {/* Status Selector Dropdown */}
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{ width: 124, flexShrink: 0 }}
                  >
                    <JobStatusControl
                      job={job}
                      onError={setError}
                    />
                  </Box>

                  {/* More Actions 3-dots Menu Button */}
                  <Box onClick={(e) => e.stopPropagation()} sx={{ flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      aria-label={`Actions for ${job.title}`}
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuJob(job);
                      }}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '9px',
                        border: '1px solid #e2e8f0',
                        bgcolor: '#ffffff',
                        color: '#64748b',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: '#f8fafc',
                          borderColor: '#cbd5e1',
                          color: '#0f172a',
                        },
                      }}
                    >
                      <MoreHoriz fontSize="small" />
                    </IconButton>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* Context Menu for Row Actions */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              borderRadius: 3,
              minWidth: 224,
              mt: 0.75,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuJob) navigate(`/employer/edit-job/${menuJob._id}`);
            closeMenu();
          }}
        >
          <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Edit job</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuJob) navigate(`/employer/jobs/${menuJob._id}`);
            closeMenu();
          }}
        >
          <ListItemIcon><DescriptionOutlined fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>View job details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuJob) navigate(`/employer/jobs/${menuJob._id}/applicants`);
            closeMenu();
          }}
        >
          <ListItemIcon><GroupOutlined fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Manage candidates</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuJob) window.open(`/jobs/${menuJob._id}`, '_blank', 'noopener');
            closeMenu();
          }}
        >
          <ListItemIcon><OpenInNewOutlined fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>See public listing</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuJob) handleCopyShareLink(menuJob._id);
          }}
        >
          <ListItemIcon><ContentCopyOutlined fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Copy share link</ListItemText>
        </MenuItem>
        <Divider />
        {menuJob?.status === 'active' ? (
          <MenuItem
            onClick={() => {
              if (menuJob) setStatus(menuJob, 'closed');
              closeMenu();
            }}
          >
            <ListItemIcon><StopCircleOutlined fontSize="small" /></ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Close job</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              if (menuJob) setStatus(menuJob, 'active');
              closeMenu();
            }}
          >
            <ListItemIcon><PlayArrowOutlined fontSize="small" /></ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Reopen job</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Snackbar feedback for actions */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage('')}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default EmployerJobsTable;
