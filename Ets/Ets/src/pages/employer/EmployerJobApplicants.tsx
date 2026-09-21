import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack,
  AssignmentTurnedIn,
  CallOutlined,
  ClearRounded,
  DeleteOutlineOutlined,
  ChatBubbleOutlineOutlined as ChatBubbleOutline,
  CheckCircleOutlineOutlined as CheckCircleOutline,
  CheckCircleRounded,
  Close,
  EmojiEventsOutlined,
  EventAvailable,
  HelpOutlined,
  Lock,
  LockOpen,
  MoreHoriz,
  PlaceOutlined,
  Search,
  ThumbDownAltOutlined,
  ThumbUpAltOutlined,
  TuneOutlined,
  WorkspacePremium,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import ApplicationDecisionDialog, { type DecisionKind } from '../../components/common/ApplicationDecisionDialog';
import {
  PageHero,
  SoftChip,
  StatusPill,
} from '../../components/employer/employerUi';
import {
  TONE,
  heroButtonSx,
  insetSx,
  panelSx,
  pillTabsSx,
} from '../../components/employer/employerTokens';
import { useChat } from '../../context/ChatContext';
import { useEmployerPlan } from '../../hooks/useEmployerPlan';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyJobsQuery } from '../../store/api/jobApi';
import { useUnlockCandidateMutation } from '../../store/api/candidateProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import {
  useGetEmployerApplicationCountsQuery,
  useGetEmployerApplicationsQuery,
  useSetEmployerApplicationInterestMutation,
  type ApplicationSort,
  type ApplicationStatus,
  type EmployerInterest,
  type JobApplicationResponse,
} from '../../store/api/applicationApi';

const APPLICANTS_PER_PAGE = 10;

/** The tab strip: 'all' plus one tab per pipeline status, in pipeline order. */
type TabKey = 'all' | ApplicationStatus;

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All applications' },
  { key: 'new', label: 'New' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'hired', label: 'Hired' },
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: '#0c5283',
  reviewing: '#d97706',
  shortlisted: '#0ab6a2',
  rejected: '#dc2626',
  hired: '#10b981',
};

const SORT_OPTIONS: Array<{ value: ApplicationSort; label: string }> = [
  { value: 'newest', label: 'Application date (newest first)' },
  { value: 'oldest', label: 'Application date (oldest first)' },
  { value: 'status', label: 'Hiring stage' },
];

const INTEREST_OPTIONS: Array<{ value: EmployerInterest | 'unmarked' | ''; label: string }> = [
  { value: '', label: 'Interest marked: Any' },
  { value: 'interested', label: 'Interested' },
  { value: 'undecided', label: 'Undecided' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'unmarked', label: 'Not marked yet' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** "1 month ago" — the activity column's relative phrasing. */
const formatAgo = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

/**
 * Which of the job's requirements this candidate does and does not meet.
 * Matching is done here rather than server-side because it is presentation:
 * the same application is shown against whichever job's list it appears in.
 */
function getRequirementMatches(jobSkills: string[], candidateSkills: string[] = []) {
  const owned = new Set(candidateSkills.map((skill) => skill.trim().toLowerCase()).filter(Boolean));

  const matched: string[] = [];
  const missing: string[] = [];

  for (const requirement of jobSkills) {
    const key = requirement.trim().toLowerCase();
    if (!key) continue;
    (owned.has(key) ? matched : missing).push(requirement);
  }

  return { matched, missing };
}

/**
 * Which of the job's requirements the candidate meets, as a compact chip list
 * that fits one table cell.
 */
const MatchChips: React.FC<{ jobSkills: string[]; candidateSkills?: string[] }> = ({
  jobSkills,
  candidateSkills,
}) => {
  const { matched, missing } = getRequirementMatches(jobSkills, candidateSkills);

  if (matched.length === 0 && missing.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        This job has no listed skill requirements to match against.
      </Typography>
    );
  }

  if (matched.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        We did not find matching qualifications. Review the candidate's profile to see their skills
        and experience.
      </Typography>
    );
  }

  // A score plus the skills the candidate actually has. Stacking every
  // requirement vertically made a single row as tall as five chips, so the
  // misses collapse into one chip that names them on hover.
  const total = matched.length + missing.length;
  const pct = total === 0 ? 0 : Math.round((matched.length / total) * 100);
  const tone = pct >= 67 ? TONE.green : pct >= 34 ? TONE.amber : TONE.slate;

  return (
    <Box sx={{ maxWidth: 260 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.875 }}>
        <Box
          sx={{
            flex: 1,
            height: 6,
            minWidth: 56,
            borderRadius: 999,
            overflow: 'hidden',
            bgcolor: alpha(tone, 0.16),
          }}
        >
          <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 999, bgcolor: tone }} />
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 800, color: tone, whiteSpace: 'nowrap' }}>
          {matched.length}/{total} skills
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {matched.slice(0, 3).map((skill) => (
          <SoftChip
            key={`match-${skill}`}
            tone="green"
            icon={<CheckCircleOutline sx={{ fontSize: 14 }} />}
            label={skill}
          />
        ))}
        {matched.length > 3 && (
          <Tooltip title={matched.slice(3).join(', ')}>
            <Box sx={{ display: 'inline-flex' }}>
              <SoftChip tone="green" label={`+${matched.length - 3}`} />
            </Box>
          </Tooltip>
        )}
        {missing.length > 0 && (
          <Tooltip title={`Missing: ${missing.join(', ')}`}>
            <Box sx={{ display: 'inline-flex' }}>
              <SoftChip
                tone="slate"
                icon={<Close sx={{ fontSize: 14 }} />}
                label={`${missing.length} missing`}
              />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

/**
 * One round button in the Interest column. The tone only shows on hover and
 * while the button is active, so a row of them stays quiet until used.
 */
const ActionIcon: React.FC<{
  title: string;
  tone: string;
  active?: boolean;
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}> = ({ title, tone, active = false, disabled = false, onClick, children }) => (
  <Tooltip title={title}>
    {/* A disabled button fires no events, so the tooltip needs a live wrapper. */}
    <Box component="span" sx={{ display: 'inline-flex' }}>
      <IconButton
        size="small"
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        sx={{
          width: 34,
          height: 34,
          border: '1.5px solid',
          borderColor: active ? tone : 'divider',
          color: active ? tone : 'text.secondary',
          bgcolor: active ? alpha(tone, 0.16) : 'background.paper',
          transition: 'all 150ms ease',
          '&.Mui-disabled': {
            color: active ? tone : 'text.disabled',
            borderColor: active ? tone : 'divider',
            bgcolor: active ? alpha(tone, 0.16) : 'transparent',
            opacity: active ? 1 : 0.45,
          },
          '&:hover': {
            color: tone,
            bgcolor: alpha(tone, 0.22),
            borderColor: tone,
            transform: 'scale(1.08)',
          },
        }}
      >
        {children}
      </IconButton>
    </Box>
  </Tooltip>
);

/** What an open accept/reject dialog is working on. */
type Decision = {
  kind: DecisionKind;
  applicationId: string;
  candidateName: string;
  status: ApplicationStatus;
  stage?: 'shortlisted' | 'hired';
  heading?: string;
};

const JobApplicantsView: React.FC<{ jobId: string }> = ({ jobId }) => {
  const navigate = useNavigate();
  const { startChatWith } = useChat();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: profileData } = useGetMyEmployerProfileQuery();
  const { data: jobsData, isLoading: isJobsLoading, isError: isJobsError } = useGetMyJobsQuery();
  const { data: countsData } = useGetEmployerApplicationCountsQuery();
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery();
  const { isPremium, showUpgrade } = useEmployerPlan();
  const [unlockCandidate] = useUnlockCandidateMutation();

  // The tab lives in the URL so the dashboard/job page can deep-link to it.
  const tabParam = (searchParams.get('tab') ?? 'all') as TabKey;
  const tab: TabKey = TABS.some((item) => item.key === tabParam) ? tabParam : 'all';

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ApplicationSort>('newest');
  const [location, setLocation] = useState('');
  const [interest, setInterestFilter] = useState<EmployerInterest | 'unmarked' | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');
  const [menuApplication, setMenuApplication] = useState<JobApplicationResponse | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [interestApp, setInterestApp] = useState<JobApplicationResponse | null>(null);
  const [interestAnchor, setInterestAnchor] = useState<HTMLElement | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [setEmployerApplicationInterest] = useSetEmployerApplicationInterestMutation();

  // Typing in the search box must not fire a request per keystroke. A new
  // search term is also a new result set, so it resets the page with it.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const companyName = profileData?.data?.companyName || 'Employer';
  const chatAllowed = Boolean(usageData?.data.effectiveFeatures?.chatEnabled);

  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData]);
  const job = jobs.find((item) => item._id === jobId) ?? null;
  const jobCounts = countsData?.data.byJob[jobId];

  const tabCount = (key: TabKey) => (key === 'all' ? jobCounts?.total ?? 0 : jobCounts?.[key] ?? 0);

  const hasFilters = Boolean(search || location || interest || sort !== 'newest' || tab !== 'all');

  const {
    data: applicantsData,
    isLoading: isApplicantsLoading,
    isFetching: isApplicantsFetching,
    isError: isApplicantsError,
    refetch: refetchApplicants,
  } = useGetEmployerApplicationsQuery(
    {
      job: jobId,
      status: tab === 'all' ? '' : tab,
      search,
      location,
      interest: interest || undefined,
      sort,
      page,
      limit: APPLICANTS_PER_PAGE,
    },
    { skip: !jobId },
  );

  const applicants = applicantsData?.data.items ?? [];
  const pagination = applicantsData?.data.pagination;

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setLocation('');
    setInterestFilter('');
    setSort('newest');
    setTab('all');
    setPage(1);
  };

  const handleUnlock = async (candidateProfileId: string) => {
    setUnlockingId(candidateProfileId);
    try {
      await unlockCandidate({ id: candidateProfileId, jobId }).unwrap();
      refetchApplicants();
      refetchUsage();
    } catch {
      // Plan-gate interceptor shows the buy-credits dialog on 402.
    } finally {
      setUnlockingId(null);
    }
  };

  /**
   * Opens the accept/reject dialog for one application. `stage` and `heading`
   * let each action name what it does instead of dropping the employer into a
   * generic "Accept this candidate" form.
   */
  const openDecision = (
    application: JobApplicationResponse,
    kind: DecisionKind,
    options?: { stage?: 'shortlisted' | 'hired'; heading?: string },
  ) => {
    const candidate = application.candidateProfile;
    setDecision({
      kind,
      applicationId: application._id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
      status: application.status,
      stage: options?.stage,
      heading: options?.heading,
    });
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuApplication(null);
  };

  const closeInterestMenu = () => {
    setInterestAnchor(null);
    setInterestApp(null);
  };

  const handleUpdateInterest = async (value: EmployerInterest) => {
    if (!interestApp) return;
    const candidate = interestApp.candidateProfile;
    const name = `${candidate?.firstName ?? ''} ${candidate?.lastName ?? ''}`.trim() || 'Candidate';
    try {
      await setEmployerApplicationInterest({
        id: interestApp._id,
        interest: value,
      }).unwrap();
      const labelMap: Record<string, string> = {
        interested: 'Interested 👍',
        undecided: 'Undecided / Maybe ❓',
        not_interested: 'Not interested 👎',
        '': 'Rating cleared',
      };
      setBanner(
        value
          ? `Marked ${name} as "${labelMap[value]}" (Private note)`
          : `Cleared rating for ${name}`
      );
    } catch {
      setError('Failed to update candidate rating. Please try again.');
    } finally {
      closeInterestMenu();
    }
  };

  const menuCandidate = menuApplication?.candidateProfile;
  const menuCandidateName = menuCandidate
    ? `${menuCandidate.firstName} ${menuCandidate.lastName}`.trim()
    : '';

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHero
          back={
            <MuiLink
              component="button"
              type="button"
              underline="hover"
              onClick={() => navigate(`/employer/jobs/${jobId}`)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                fontWeight: 700,
                fontSize: '0.875rem',
                color: alpha('#ffffff', 0.85),
                mb: 1.5,
                '&:hover': { color: '#ffffff' },
              }}
            >
              <ArrowBack sx={{ fontSize: 17 }} />
              Back to job
            </MuiLink>
          }
          eyebrow="Candidates"
          title={job?.title ?? 'Candidates'}
          meta={
            job && (
              <>
                <SoftChip onHero icon={<PlaceOutlined />} label={job.location} />
                <SoftChip onHero label={`${jobCounts?.total ?? 0} applications`} />
                <SoftChip onHero label={`${jobCounts?.new ?? 0} new`} />
                <SoftChip onHero label={`${jobCounts?.shortlisted ?? 0} shortlisted`} />
              </>
            )
          }
          actions={
            <>
              {/* Switch to another job's candidate list without going back first. */}
              {jobs.length > 1 && (
                <Select
                  size="small"
                  value={jobId}
                  onChange={(event) => navigate(`/employer/jobs/${event.target.value}/applicants`)}
                  sx={{
                    borderRadius: 2.5,
                    minWidth: 200,
                    maxWidth: 300,
                    bgcolor: 'background.paper',
                  }}
                >
                  {jobs.map((item) => (
                    <MenuItem key={item._id} value={item._id}>{item.title}</MenuItem>
                  ))}
                </Select>
              )}
              <Button
                variant="outlined"
                onClick={() => navigate(`/employer/jobs/${jobId}`)}
                sx={heroButtonSx}
              >
                Job details
              </Button>
            </>
          }
        />

        {banner && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 3 }} onClose={() => setBanner('')}>
            {banner}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {isJobsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}
        {isJobsError && !isJobsLoading && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>Unable to load your jobs.</Alert>
        )}
        {!isJobsLoading && !isJobsError && !job && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            This job was not found in your posted jobs.
          </Alert>
        )}

        {job && (
          <>
            {/* Matched candidates — the upgrade prompt, hidden once on a paid plan. */}
            {showUpgrade && !isPremium && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  mb: 3,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: alpha(TONE.amber, 0.45),
                  bgcolor: alpha(TONE.amber, 0.07),
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box sx={{ minWidth: 0, flex: '1 1 320px' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                    <WorkspacePremium sx={{ color: '#b45309' }} />
                    <Typography sx={{ fontWeight: 800 }}>Matched candidates</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Invite matched candidates directly instead of waiting for them to find your job
                    in search.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Lock fontSize="small" />}
                  onClick={() => navigate('/pricing')}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, flexShrink: 0 }}
                >
                  Upgrade to Premium
                </Button>
              </Paper>
            )}

            {/* Pipeline tabs */}
            <Box sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }}>
              <Tabs
                value={tab}
                onChange={(_, next: TabKey) => setTab(next)}
                variant="scrollable"
                scrollButtons={false}
                sx={pillTabsSx}
              >
                {TABS.map((item) => (
                  <Tab key={item.key} value={item.key} label={`${item.label} · ${tabCount(item.key)}`} />
                ))}
              </Tabs>
            </Box>

            <Card elevation={0} sx={panelSx}>
              <CardContent sx={{ p: { xs: 1.75, md: 2.5 } }}>
                {/* Filters */}
                <Paper elevation={0} sx={{ ...insetSx, p: { xs: 1.25, md: 1.5 }, mb: 2.5 }}>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ flexWrap: 'wrap', rowGap: 1.25, alignItems: 'center' }}
                  >
                    <TuneOutlined sx={{ fontSize: 19, color: 'text.secondary', ml: 0.5 }} />

                    <TextField
                      size="small"
                      placeholder="Search candidates"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      sx={{
                        flex: '1 1 220px',
                        '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' },
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <Select
                      size="small"
                      value={sort}
                      onChange={(event) => {
                        setSort(event.target.value as ApplicationSort);
                        setPage(1);
                      }}
                      sx={{ borderRadius: 2.5, minWidth: 240, bgcolor: 'background.paper' }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          Sort by: {option.label}
                        </MenuItem>
                      ))}
                    </Select>

                    <TextField
                      size="small"
                      placeholder="Location"
                      value={location}
                      onChange={(event) => {
                        setLocation(event.target.value);
                        setPage(1);
                      }}
                      sx={{
                        minWidth: 160,
                        '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' },
                      }}
                    />

                    <Select
                      size="small"
                      displayEmpty
                      value={interest}
                      onChange={(event) => {
                        setInterestFilter(event.target.value as EmployerInterest | 'unmarked' | '');
                        setPage(1);
                      }}
                      sx={{ borderRadius: 2.5, minWidth: 190, bgcolor: 'background.paper' }}
                    >
                      {INTEREST_OPTIONS.map((option) => (
                        <MenuItem key={option.value || 'any'} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>

                    <Button
                      disabled={!hasFilters}
                      onClick={clearFilters}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Clear all
                    </Button>
                  </Stack>
                </Paper>

                {(isApplicantsLoading || isApplicantsFetching) && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                )}
                {isApplicantsError && !isApplicantsLoading && (
                  <Alert severity="error" sx={{ borderRadius: 3 }}>
                    Unable to load candidates for this job.
                  </Alert>
                )}

                {!isApplicantsLoading && !isApplicantsFetching && !isApplicantsError && applicants.length === 0 && (
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
                      <AssignmentTurnedIn sx={{ fontSize: 30 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {hasFilters ? 'No candidates match these filters' : 'No applications yet'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {hasFilters
                        ? 'Try clearing the filters to see everyone who applied.'
                        : 'Candidates who apply to this job will show up here.'}
                    </Typography>
                    {hasFilters && (
                      <Button onClick={clearFilters} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Clear all filters
                      </Button>
                    )}
                  </Box>
                )}

                {!isApplicantsLoading && !isApplicantsFetching && applicants.length > 0 && (
                  <>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 3, borderColor: 'divider' }}
                    >
                      <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #eef2f6' }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', py: 1.25 }}>Candidates</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', py: 1.25 }}>Matches to job post</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', py: 1.25 }}>Activity</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', py: 1.25 }}>Interest</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {applicants.map((application) => {
                            const candidate = application.candidateProfile;
                            const locked = Boolean(candidate.locked);
                            const candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
                            const interviewAt = application.interview?.scheduledAt ?? null;
                            const statusColor = STATUS_COLOR[application.status];
                            const isRejected = application.status === 'rejected';
                            const isHired = application.status === 'hired';
                            const interestLabel = application.employerInterest
                              ? INTEREST_OPTIONS.find(
                                  (option) => option.value === application.employerInterest,
                                )?.label
                              : undefined;

                            return (
                              <TableRow key={application._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                {/* Candidate */}
                                <TableCell sx={{ verticalAlign: 'top', py: 2 }}>
                                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                                    <Avatar
                                      src={locked ? undefined : candidate.photoUrl || undefined}
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        bgcolor: locked ? 'grey.400' : 'primary.main',
                                      }}
                                    >
                                      {locked ? <Lock sx={{ fontSize: 15 }} /> : (candidate.firstName?.charAt(0) ?? '?')}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Stack
                                        direction="row"
                                        spacing={0.75}
                                        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
                                      >
                                        {locked ? (
                                          <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f172a' }}>
                                            Locked candidate
                                          </Typography>
                                        ) : (
                                          <MuiLink
                                            component={RouterLink}
                                            to={`/employer/employees/${candidate._id}?application=${application._id}`}
                                            underline="none"
                                            sx={{
                                              fontWeight: 600,
                                              fontSize: '0.92rem',
                                              wordBreak: 'break-word',
                                              color: '#0f172a',
                                              transition: 'color 150ms ease',
                                              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                                            }}
                                          >
                                            {candidateName}
                                          </MuiLink>
                                        )}
                                        {candidate.excelMember && !locked && (
                                          <SoftChip label="EXCEL" tone="amber" />
                                        )}
                                        {candidate.verifiedBadge && !locked && (
                                          <SoftChip label="Verified" tone="green" />
                                        )}
                                      </Stack>
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400, mt: 0.25 }}>
                                        {locked
                                          ? 'Unlock to see contact details'
                                          : [candidate.currentJobTitle, candidate.currentLocation]
                                              .filter(Boolean)
                                              .join(' • ')}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={0.75}
                                        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5, mt: 0.5 }}
                                      >
                                        <StatusPill
                                          label={STATUS_LABEL[application.status]}
                                          color={statusColor}
                                        />
                                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.74rem', color: '#94a3b8' }}>
                                          Applied {formatDate(application.createdAt)}
                                        </Typography>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                </TableCell>

                                {/* Requirement match */}
                                <TableCell sx={{ verticalAlign: 'top', maxWidth: 260 }}>
                                  <MatchChips jobSkills={job.skills} candidateSkills={candidate.skills} />
                                </TableCell>

                                {/* Activity */}
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {application.viewedByEmployer ? 'Reviewed' : 'Awaiting review'}
                                    {' · Applied '}
                                    {formatAgo(application.createdAt)}
                                  </Typography>
                                  {interviewAt && (
                                    <Box sx={{ mt: 0.75 }}>
                                      <SoftChip
                                        tone="violet"
                                        icon={<EventAvailable sx={{ fontSize: 14 }} />}
                                        label={formatDateTime(interviewAt)}
                                      />
                                    </Box>
                                  )}
                                </TableCell>

                                {/* Interest — select, more actions, remove */}
                                <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                                  {locked ? (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                      startIcon={<LockOpen fontSize="small" />}
                                      disabled={unlockingId === candidate._id}
                                      onClick={() => handleUnlock(candidate._id)}
                                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
                                    >
                                      {unlockingId === candidate._id ? 'Unlocking…' : 'Unlock (1 credit)'}
                                    </Button>
                                  ) : (
                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      sx={{ justifyContent: 'flex-end', alignItems: 'center' }}
                                    >
                                      {/*
                                        Select moves the candidate forward, remove rejects them, and
                                        the middle mark opens the same menu the overflow button does —
                                        it doubles as the private interest mark, which is why it also
                                        takes that mark's colour.
                                      */}
                                      <ActionIcon
                                        title={
                                          isHired
                                            ? 'Candidate is Hired! 🎉'
                                            : application.status === 'shortlisted'
                                              ? 'Candidate is Shortlisted (Click to view or hire)'
                                              : 'Select — shortlist this candidate'
                                        }
                                        tone={isHired ? '#10b981' : TONE.green}
                                        active={application.status === 'shortlisted' || isHired}
                                        onClick={() =>
                                          openDecision(application, 'accept', {
                                            stage: isHired ? 'hired' : 'shortlisted',
                                            heading: isHired ? 'Candidate is Hired' : 'Select this candidate',
                                          })
                                        }
                                      >
                                        {isHired ? (
                                          <CheckCircleRounded sx={{ fontSize: 20, color: '#10b981' }} />
                                        ) : application.status === 'shortlisted' ? (
                                          <CheckCircleRounded sx={{ fontSize: 20, color: '#0ab6a2' }} />
                                        ) : (
                                          <CheckCircleOutline fontSize="small" />
                                        )}
                                      </ActionIcon>
                                      {application.status === 'shortlisted' && (
                                        <ActionIcon
                                          title="Hire candidate — sends official offer & notification email"
                                          tone="#10b981"
                                          active={false}
                                          onClick={() =>
                                            openDecision(application, 'accept', {
                                              stage: 'hired',
                                              heading: 'Hire this candidate',
                                            })
                                          }
                                        >
                                          <EmojiEventsOutlined fontSize="small" sx={{ color: '#10b981' }} />
                                        </ActionIcon>
                                      )}
                                      {/*
                                         Candidate Rating / Private Interest (Interested / Undecided / Not Interested)
                                       */}
                                       <ActionIcon
                                         title={
                                           interestLabel
                                             ? `Rating: ${interestLabel} (Click to change)`
                                             : 'Rate candidate (Interested / Undecided / Not interested)'
                                         }
                                         tone={
                                           application.employerInterest === 'interested'
                                             ? '#10b981'
                                             : application.employerInterest === 'not_interested'
                                             ? '#ef4444'
                                             : application.employerInterest === 'undecided'
                                             ? '#f59e0b'
                                             : TONE.amber
                                         }
                                         active={Boolean(application.employerInterest)}
                                         onClick={(event) => {
                                           setInterestAnchor(event.currentTarget);
                                           setInterestApp(application);
                                         }}
                                       >
                                         {application.employerInterest === 'interested' ? (
                                           <ThumbUpAltOutlined fontSize="small" sx={{ color: '#10b981' }} />
                                         ) : application.employerInterest === 'not_interested' ? (
                                           <ThumbDownAltOutlined fontSize="small" sx={{ color: '#ef4444' }} />
                                         ) : (
                                           <HelpOutlined
                                             fontSize="small"
                                             sx={{
                                               color:
                                                 application.employerInterest === 'undecided'
                                                   ? '#f59e0b'
                                                   : undefined,
                                             }}
                                           />
                                         )}
                                       </ActionIcon>
                                      <ActionIcon
                                        title="Remove — reject this candidate"
                                        tone={TONE.red}
                                        active={isRejected}
                                        disabled={isRejected}
                                        onClick={() =>
                                          openDecision(application, 'reject', {
                                            heading: 'Remove this candidate',
                                          })
                                        }
                                      >
                                        <Close fontSize="small" />
                                      </ActionIcon>
                                      <ActionIcon
                                        title="More actions"
                                        tone={TONE.blue}
                                        active={menuApplication?._id === application._id}
                                        onClick={(event) => {
                                          setMenuAnchor(event.currentTarget);
                                          setMenuApplication(application);
                                        }}
                                      >
                                        <MoreHoriz fontSize="small" />
                                      </ActionIcon>
                                    </Stack>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {(pagination?.totalPages ?? 1) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                          count={pagination?.totalPages ?? 1}
                          page={page}
                          onChange={(_, nextPage) => setPage(nextPage)}
                          color="primary"
                          siblingCount={0}
                        />
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* Per-candidate actions */}
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
              borderRadius: '12px',
              minWidth: 204,
              mt: 0.5,
              p: '5px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.1), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
            },
          },
        }}
      >
        {menuCandidateName && (
          <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid #f1f5f9', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Candidate Actions
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {menuCandidateName}
            </Typography>
          </Box>
        )}
        <MenuItem
          disabled={!chatAllowed}
          onClick={() => {
            if (menuApplication && job) {
              startChatWith({
                peerProfileId: menuApplication.candidateProfile._id,
                peerName: menuCandidateName,
                jobId: job._id,
                jobTitle: job.title,
              });
            }
            closeMenu();
          }}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            fontSize: '0.84rem',
            color: '#334155',
            '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#64748b' }}>
            <ChatBubbleOutline sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: '0.84rem', fontWeight: 500 } } }}>
            Message
          </ListItemText>
        </MenuItem>

        <MenuItem
          component="a"
          href={menuCandidate?.phone ? `tel:${menuCandidate.phone}` : undefined}
          disabled={!menuCandidate?.phone}
          onClick={closeMenu}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            fontSize: '0.84rem',
            color: '#334155',
            '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#64748b' }}>
            <CallOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: '0.84rem', fontWeight: 500 } } }}>
            Call
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuApplication) {
              openDecision(menuApplication, 'accept', {
                stage: menuApplication.status === 'hired' ? 'hired' : 'shortlisted',
                heading: menuApplication.interview?.scheduledAt
                  ? 'Reschedule the interview'
                  : 'Set up an interview',
              });
            }
            closeMenu();
          }}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            fontSize: '0.84rem',
            color: '#334155',
            '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#64748b' }}>
            <EventAvailable sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: '0.84rem', fontWeight: 500 } } }}>
            Set up interview
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuApplication) {
              openDecision(menuApplication, 'reject', { heading: 'Delete this candidate' });
            }
            closeMenu();
          }}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            fontSize: '0.84rem',
            color: '#dc2626',
            '&:hover': { bgcolor: alpha('#dc2626', 0.06), color: '#b91c1c' },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#dc2626' }}>
            <DeleteOutlineOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: '0.84rem', fontWeight: 500 } } }}>
            Delete candidate
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuApplication) {
              openDecision(menuApplication, 'accept', {
                stage: 'hired',
                heading: menuApplication.status === 'hired' ? 'Candidate is Hired' : 'Hire this candidate',
              });
            }
            closeMenu();
          }}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            fontSize: '0.84rem',
            color: '#059669',
            bgcolor: alpha('#10b981', 0.08),
            mt: 0.5,
            '&:hover': { bgcolor: alpha('#10b981', 0.16), color: '#047857' },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#059669' }}>
            {menuApplication?.status === 'hired' ? (
              <CheckCircleRounded sx={{ fontSize: 18, color: '#059669' }} />
            ) : (
              <EmojiEventsOutlined sx={{ fontSize: 18, color: '#059669' }} />
            )}
          </ListItemIcon>
          <ListItemText
            slotProps={{ primary: { sx: { fontSize: '0.84rem', fontWeight: 600, color: 'inherit' } } }}
          >
            {menuApplication?.status === 'hired' ? 'Hired (Offer Details)' : 'Mark as hired'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Candidate Private Interest / Rating Menu */}
      <Menu
        anchorEl={interestAnchor}
        open={Boolean(interestAnchor)}
        onClose={closeInterestMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              borderRadius: '12px',
              minWidth: 215,
              mt: 0.5,
              p: '5px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.1), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 0.85, borderBottom: '1px solid #f1f5f9', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Rate Candidate
          </Typography>
          <Typography sx={{ fontSize: '0.71rem', color: '#94a3b8', mt: 0.25 }}>
            Private note for your hiring team
          </Typography>
        </Box>

        <MenuItem
          onClick={() => handleUpdateInterest('interested')}
          selected={interestApp?.employerInterest === 'interested'}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            color: '#059669',
            '&:hover': { bgcolor: alpha('#10b981', 0.08) },
            '&.Mui-selected': { bgcolor: alpha('#10b981', 0.12), fontWeight: 600 },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#10b981' }}>
            <ThumbUpAltOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: { sx: { fontSize: '0.84rem', fontWeight: 500, color: '#047857' } },
            }}
          >
            Interested
          </ListItemText>
          {interestApp?.employerInterest === 'interested' && (
            <CheckCircleRounded sx={{ fontSize: 16, color: '#10b981', ml: 1 }} />
          )}
        </MenuItem>

        <MenuItem
          onClick={() => handleUpdateInterest('undecided')}
          selected={interestApp?.employerInterest === 'undecided'}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            color: '#d97706',
            '&:hover': { bgcolor: alpha('#f59e0b', 0.08) },
            '&.Mui-selected': { bgcolor: alpha('#f59e0b', 0.12), fontWeight: 600 },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#f59e0b' }}>
            <HelpOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: { sx: { fontSize: '0.84rem', fontWeight: 500, color: '#b45309' } },
            }}
          >
            Undecided / Maybe
          </ListItemText>
          {interestApp?.employerInterest === 'undecided' && (
            <CheckCircleRounded sx={{ fontSize: 16, color: '#f59e0b', ml: 1 }} />
          )}
        </MenuItem>

        <MenuItem
          onClick={() => handleUpdateInterest('not_interested')}
          selected={interestApp?.employerInterest === 'not_interested'}
          sx={{
            py: 0.75,
            px: 1.25,
            borderRadius: '8px',
            color: '#dc2626',
            '&:hover': { bgcolor: alpha('#ef4444', 0.08) },
            '&.Mui-selected': { bgcolor: alpha('#ef4444', 0.12), fontWeight: 600 },
          }}
        >
          <ListItemIcon sx={{ minWidth: '28px !important', color: '#ef4444' }}>
            <ThumbDownAltOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: { sx: { fontSize: '0.84rem', fontWeight: 500, color: '#b91c1c' } },
            }}
          >
            Not Interested
          </ListItemText>
          {interestApp?.employerInterest === 'not_interested' && (
            <CheckCircleRounded sx={{ fontSize: 16, color: '#ef4444', ml: 1 }} />
          )}
        </MenuItem>

        {Boolean(interestApp?.employerInterest) && (
          <MenuItem
            onClick={() => handleUpdateInterest('')}
            sx={{
              py: 0.75,
              px: 1.25,
              mt: 0.5,
              borderTop: '1px solid #f1f5f9',
              borderRadius: '8px',
              color: '#64748b',
              '&:hover': { bgcolor: '#f8fafc', color: '#334155' },
            }}
          >
            <ListItemIcon sx={{ minWidth: '28px !important', color: '#94a3b8' }}>
              <ClearRounded sx={{ fontSize: 17 }} />
            </ListItemIcon>
            <ListItemText
              slotProps={{
                primary: { sx: { fontSize: '0.82rem', fontWeight: 500 } },
              }}
            >
              Clear rating
            </ListItemText>
          </MenuItem>
        )}
      </Menu>

      <ApplicationDecisionDialog
        decision={decision?.kind ?? null}
        applicationId={decision?.applicationId ?? ''}
        candidateName={decision?.candidateName}
        currentStatus={decision?.status}
        initialStage={decision?.stage}
        heading={decision?.heading}
        onClose={() => setDecision(null)}
        onDone={setBanner}
      />

    </Box>
  );
};

/**
 * Manage candidates for a single job — the pipeline tabs, filters and triage
 * marks for everyone who applied.
 * Route: /employer/jobs/:id/applicants
 *
 * Keyed by job id so that navigating between jobs remounts the view and
 * resets its page, banner and dialog state without an effect.
 */
const EmployerJobApplicants: React.FC = () => {
  const { id: jobId = '' } = useParams();
  return <JobApplicantsView key={jobId} jobId={jobId} />;
};

export default EmployerJobApplicants;
