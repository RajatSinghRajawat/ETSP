import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Link as MuiLink,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CalendarMonthOutlined,
  DescriptionOutlined,
  EditOutlined,
  GroupOutlined,
  LockOutlined,
  MoreHoriz,
  OpenInNewOutlined,
  PersonSearchOutlined,
  PlaceOutlined,
  PlayArrowOutlined,
  StopCircleOutlined,
  WorkOutlineOutlined,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type { JobApplicationCounts } from '../../store/api/applicationApi';
import type { JobResponse } from '../../store/api/jobApi';
import { useUpdateJobStatusMutation } from '../../store/api/jobApi';
import JobStatusControl from './JobStatusControl';
import { JOB_STATUS_META, POSTED_VIA_LABEL, formatJobDate, formatRelativeDate } from './jobStatus';
import {
  SoftChip,
  StatusPill,
} from './employerUi';
import {
  TONE,
  hoverLiftSx,
  panelSx,
} from './employerTokens';

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

/** One of the three candidate tallies in the middle of a job row. */
const CandidateStat: React.FC<{
  icon: React.ReactNode;
  count?: number;
  label: string;
  tone: string;
  onClick?: () => void;
  locked?: boolean;
}> = ({ icon, count, label, tone, onClick, locked }) => (
  <Box
    onClick={locked ? undefined : onClick}
    role={locked ? undefined : 'button'}
    tabIndex={locked ? undefined : 0}
    onKeyDown={(event) => {
      if (!locked && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick?.();
      }
    }}
    sx={{
      flex: '1 1 0',
      minWidth: 88,
      px: 1.25,
      py: 0.875,
      borderRadius: 2.5,
      cursor: locked ? 'default' : 'pointer',
      textAlign: 'left',
      transition: 'background-color 150ms ease',
      '&:hover': locked ? undefined : { bgcolor: alpha(tone, 0.1) },
    }}
  >
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      <Box sx={{ display: 'flex', color: locked ? 'text.disabled' : tone }}>{icon}</Box>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: '1.15rem',
          lineHeight: 1.1,
          color: locked ? 'text.disabled' : 'text.primary',
        }}
      >
        {locked ? '—' : (count ?? 0)}
      </Typography>
    </Stack>
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        display: 'block',
        mt: 0.25,
        color: locked ? 'text.disabled' : 'text.secondary',
      }}
    >
      {label}
    </Typography>
  </Box>
);

type Props = {
  jobs: JobResponse[];
  countsByJob: Record<string, JobApplicationCounts>;
  /** Hides the premium-only "Matches" tally behind a lock. */
  showMatches?: boolean;
};

/**
 * The employer's "My Jobs" list: one card per job with its candidate tallies,
 * posting plan, date and status control, plus a reopen/close prompt on any job
 * that is no longer live. Opening a row goes to that job's own page — nothing
 * expands inline.
 */
const EmployerJobsTable: React.FC<Props> = ({ jobs, countsByJob, showMatches = true }) => {
  const navigate = useNavigate();
  const [updateJobStatus, { isLoading: isStatusUpdating }] = useUpdateJobStatusMutation();
  const [menuJob, setMenuJob] = useState<JobResponse | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState('');

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuJob(null);
  };

  const setStatus = async (job: JobResponse, status: 'active' | 'closed') => {
    setError('');
    try {
      await updateJobStatus({ id: job._id, status }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change the job status. Please try again.'));
    }
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={{ xs: 1.5, md: 2 }}>
        {jobs.map((job) => {
          const counts = countsByJob[job._id] ?? EMPTY_COUNTS;
          const jobPath = `/employer/jobs/${job._id}`;
          const applicantsPath = `/employer/jobs/${job._id}/applicants`;
          const isOffline = job.status === 'paused' || job.status === 'closed' || job.status === 'expired';
          const statusMeta = JOB_STATUS_META[job.status] ?? JOB_STATUS_META.draft;

          return (
            <Paper
              key={job._id}
              elevation={0}
              sx={{
                ...(panelSx as object),
                ...(hoverLiftSx as object),
                position: 'relative',
                overflow: 'hidden',
                // A status rail down the left edge, so the state of every job
                // reads at a glance while scanning the list.
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  bgcolor: statusMeta.color,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: { xs: 'wrap', lg: 'nowrap' },
                  alignItems: { xs: 'flex-start', lg: 'center' },
                  gap: { xs: 1.75, lg: 2.5 },
                  p: { xs: 2, sm: 2.25, md: 2.5 },
                  pl: { xs: 2.25, sm: 2.5, md: 2.75 },
                }}
              >
                {/* Title + meta */}
                <Box sx={{ minWidth: 0, flex: { xs: '1 1 100%', lg: '2 1 260px' } }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75, mb: 0.75 }}
                  >
                    <StatusPill label={statusMeta.label} color={statusMeta.color} />
                    {job.isFeatured && <SoftChip label="Featured" tone="amber" />}
                    {job.isUrgent && <SoftChip label="Urgent" tone="red" />}
                  </Stack>
                  <MuiLink
                    component={RouterLink}
                    to={jobPath}
                    underline="none"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      lineHeight: 1.35,
                      color: 'text.primary',
                      wordBreak: 'break-word',
                      display: 'inline-block',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {job.title}
                  </MuiLink>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ flexWrap: 'wrap', rowGap: 0.5, mt: 0.5, color: 'text.secondary' }}
                  >
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <PlaceOutlined sx={{ fontSize: 15 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
                        {job.location}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <WorkOutlineOutlined sx={{ fontSize: 15 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {job.type}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                {/* Candidate tallies */}
                <Box
                  sx={{
                    flex: { xs: '1 1 100%', lg: '2 1 300px' },
                    display: 'flex',
                    gap: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    p: 0.75,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'light' ? alpha('#f8fafc', 0.9) : alpha('#ffffff', 0.03),
                  }}
                >
                  <CandidateStat
                    icon={<GroupOutlined sx={{ fontSize: 17 }} />}
                    count={counts.total}
                    label="All"
                    tone={TONE.blue}
                    onClick={() => navigate(applicantsPath)}
                  />
                  <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                  <CandidateStat
                    icon={<DescriptionOutlined sx={{ fontSize: 17 }} />}
                    count={counts.new}
                    label="New"
                    tone={TONE.violet}
                    onClick={() => navigate(`${applicantsPath}?tab=new`)}
                  />
                  <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                  {showMatches ? (
                    <CandidateStat
                      icon={<PersonSearchOutlined sx={{ fontSize: 17 }} />}
                      count={counts.shortlisted}
                      label="Shortlisted"
                      tone={TONE.teal}
                      onClick={() => navigate(`${applicantsPath}?tab=shortlisted`)}
                    />
                  ) : (
                    <Tooltip title="Matched candidates are a Premium feature">
                      <Box sx={{ flex: '1 1 0' }}>
                        <CandidateStat
                          icon={<LockOutlined sx={{ fontSize: 17 }} />}
                          label="Matches"
                          tone={TONE.slate}
                          locked
                        />
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                {/* Plan + date posted */}
                <Box sx={{ flex: { xs: '1 1 160px', lg: '1 1 150px' }, minWidth: 0 }}>
                  <SoftChip
                    label={POSTED_VIA_LABEL[job.postedVia ?? 'free'] ?? 'Free'}
                    tone={job.postedVia && job.postedVia !== 'free' ? 'teal' : 'slate'}
                  />
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ alignItems: 'center', mt: 0.875, color: 'text.secondary' }}
                  >
                    <CalendarMonthOutlined sx={{ fontSize: 15 }} />
                    <Tooltip title={formatJobDate(job.createdAt)}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {formatRelativeDate(job.createdAt)}
                      </Typography>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* Status + overflow */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    ml: { xs: 0, lg: 'auto' },
                    flexShrink: 0,
                  }}
                >
                  <JobStatusControl job={job} onError={setError} />
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      aria-label={`Actions for ${job.title}`}
                      onClick={(event) => {
                        setMenuAnchor(event.currentTarget);
                        setMenuJob(job);
                      }}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                    >
                      <MoreHoriz fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Reopen / close prompt for anything that is not live */}
              {isOffline && (
                <>
                  <Divider />
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1.5,
                      px: { xs: 2.25, sm: 2.5 },
                      py: 1.5,
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.07),
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: '1 1 260px' }}>
                      <Box component="span" sx={{ fontWeight: 800 }}>
                        {job.status === 'paused'
                          ? 'This job has been paused.'
                          : job.status === 'expired'
                            ? 'This job has expired.'
                            : 'This job is closed.'}
                      </Box>{' '}
                      Candidates cannot see or apply to it right now.
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isStatusUpdating}
                        onClick={() => setStatus(job, 'active')}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                      >
                        Reopen
                      </Button>
                      {job.status !== 'closed' && (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={isStatusUpdating}
                          onClick={() => setStatus(job, 'closed')}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                          Close Job
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </>
              )}
            </Paper>
          );
        })}
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 224, mt: 0.5 } } }}
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
    </>
  );
};

export default EmployerJobsTable;
