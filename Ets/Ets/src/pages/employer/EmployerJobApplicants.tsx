import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  ListItemIcon,
  ListItemText,
  ListSubheader,
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
  ChatBubbleOutlineOutlined as ChatBubbleOutline,
  CheckCircleOutlineOutlined as CheckCircleOutline,
  Close,
  EmojiEventsOutlined,
  EventAvailable,
  HelpOutlined,
  Lock,
  LockOpen,
  MoreHoriz,
  PictureAsPdf,
  PersonSearch,
  PlaceOutlined,
  Search,
  TuneOutlined,
  WorkspacePremium,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import ApplicationDecisionDialog, { type DecisionKind } from '../../components/common/ApplicationDecisionDialog';
import CandidateResumePreviewModal from '../../components/common/CandidateResumePreviewModal';
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
import { useGetCandidateResumeMutation } from '../../store/api/resumeApi';
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

/** The three triage marks, as offered in the per-candidate actions menu. */
const INTEREST_MARKS: Array<{
  value: Exclude<EmployerInterest, ''>;
  label: string;
  tone: string;
  icon: React.ReactElement;
}> = [
  {
    value: 'interested',
    label: 'Interested',
    tone: TONE.green,
    icon: <CheckCircleOutline fontSize="small" />,
  },
  { value: 'undecided', label: 'Undecided', tone: TONE.amber, icon: <HelpOutlined fontSize="small" /> },
  {
    value: 'not_interested',
    label: 'Not interested',
    tone: TONE.red,
    icon: <Close fontSize="small" />,
  },
];

const MARK_TONE = Object.fromEntries(
  INTEREST_MARKS.map((mark) => [mark.value, mark.tone]),
) as Record<Exclude<EmployerInterest, ''>, string>;

const MARK_LABEL = Object.fromEntries(
  INTEREST_MARKS.map((mark) => [mark.value, mark.label.toLowerCase()]),
) as Record<Exclude<EmployerInterest, ''>, string>;

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

  return (
    <Stack spacing={0.625} sx={{ alignItems: 'flex-start' }}>
      {matched.slice(0, 3).map((skill) => (
        <SoftChip
          key={`match-${skill}`}
          tone="green"
          icon={<CheckCircleOutline sx={{ fontSize: 14 }} />}
          label={skill}
        />
      ))}
      {missing.slice(0, 2).map((skill) => (
        <SoftChip
          key={`miss-${skill}`}
          tone="slate"
          icon={<Close sx={{ fontSize: 14 }} />}
          label={skill}
        />
      ))}
    </Stack>
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
          border: '1px solid',
          borderColor: active ? alpha(tone, 0.45) : 'divider',
          color: active ? tone : 'text.secondary',
          bgcolor: active ? alpha(tone, 0.14) : 'background.paper',
          transition: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
          '&:hover': { color: tone, bgcolor: alpha(tone, 0.14), borderColor: alpha(tone, 0.45) },
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
  const [setInterest] = useSetEmployerApplicationInterestMutation();
  const [fetchCandidateResume, { isLoading: isFetchingResume }] = useGetCandidateResumeMutation();

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
  const [decision, setDecision] = useState<Decision | null>(null);

  // Resume preview.
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeHtml, setResumeHtml] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [resumeName, setResumeName] = useState('Candidate');
  // Set when the candidate uploaded their own file rather than building one.
  const [resumeFile, setResumeFile] = useState<{ url: string; name: string; mimeType: string } | null>(null);

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

  const handleInterest = async (application: JobApplicationResponse, next: EmployerInterest) => {
    // Clicking the mark that is already set clears it.
    const value = application.employerInterest === next ? '' : next;
    setError('');
    try {
      await setInterest({ id: application._id, interest: value }).unwrap();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      setError(message ?? 'Could not save that mark. Please try again.');
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

  const handleOpenResume = async (candidateProfileId: string, candidateName: string) => {
    if (isFetchingResume) return;
    setResumeError('');
    setResumeHtml('');
    setResumeFile(null);
    setResumeName(candidateName);
    setResumeOpen(true);

    try {
      const response = await fetchCandidateResume(candidateProfileId).unwrap();
      const resume = response.data;
      const uploaded = resume?.uploadedFile;

      if (resume?.source === 'upload' && uploaded?.url) {
        setResumeFile({
          url: uploaded.url,
          name: uploaded.originalName || uploaded.fileName,
          mimeType: uploaded.mimeType,
        });
        return;
      }

      if (!resume?.htmlContent) {
        throw new Error('No resume content was returned for this candidate.');
      }

      setResumeHtml(resume.htmlContent);
    } catch (error) {
      const message =
        (error as { data?: { message?: string }; message?: string })?.data?.message ??
        (error as { message?: string })?.message ??
        'Could not load the resume. Please try again.';
      setResumeError(message);
    }
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuApplication(null);
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
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 800 }}>Candidates</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Matches to job post</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Activity</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Interest</TableCell>
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
                            const markedInterest = application.employerInterest || '';

                            return (
                              <TableRow key={application._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                {/* Candidate */}
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                                    <Avatar
                                      src={locked ? undefined : candidate.photoUrl || undefined}
                                      sx={{
                                        width: 38,
                                        height: 38,
                                        fontWeight: 800,
                                        bgcolor: locked ? 'grey.400' : 'primary.main',
                                      }}
                                    >
                                      {locked ? <Lock sx={{ fontSize: 16 }} /> : candidate.firstName.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Stack
                                        direction="row"
                                        spacing={0.75}
                                        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
                                      >
                                        <Typography sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                                          {locked ? 'Locked candidate' : candidateName}
                                        </Typography>
                                        {candidate.excelMember && !locked && (
                                          <SoftChip label="EXCEL" tone="amber" />
                                        )}
                                        {candidate.verifiedBadge && !locked && (
                                          <SoftChip label="Verified" tone="green" />
                                        )}
                                      </Stack>
                                      <Typography variant="body2" color="text.secondary">
                                        {locked
                                          ? 'Unlock to see contact details'
                                          : [candidate.currentJobTitle, candidate.currentLocation]
                                              .filter(Boolean)
                                              .join(' • ')}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={0.75}
                                        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5, mt: 0.625 }}
                                      >
                                        <StatusPill
                                          label={STATUS_LABEL[application.status]}
                                          color={statusColor}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
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
                                  {chatAllowed && !locked && (
                                    <MuiLink
                                      component="button"
                                      type="button"
                                      underline="hover"
                                      onClick={() =>
                                        startChatWith({
                                          peerProfileId: candidate._id,
                                          peerName: candidateName,
                                          jobId: job._id,
                                          jobTitle: job.title,
                                        })
                                      }
                                      sx={{ display: 'block', mt: 0.75, fontWeight: 700, fontSize: '0.875rem' }}
                                    >
                                      Send message
                                    </MuiLink>
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
                                        title="Select — shortlist this candidate"
                                        tone={TONE.green}
                                        active={application.status === 'shortlisted' || isHired}
                                        disabled={isRejected || isHired}
                                        onClick={() =>
                                          openDecision(application, 'accept', {
                                            stage: 'shortlisted',
                                            heading: 'Select this candidate',
                                          })
                                        }
                                      >
                                        <CheckCircleOutline fontSize="small" />
                                      </ActionIcon>
                                      <ActionIcon
                                        title={
                                          markedInterest
                                            ? `Marked ${MARK_LABEL[markedInterest]} — actions & interest`
                                            : 'Actions & interest'
                                        }
                                        tone={markedInterest ? MARK_TONE[markedInterest] : TONE.amber}
                                        active={
                                          Boolean(markedInterest) || menuApplication?._id === application._id
                                        }
                                        onClick={(event) => {
                                          setMenuAnchor(event.currentTarget);
                                          setMenuApplication(application);
                                        }}
                                      >
                                        <HelpOutlined fontSize="small" />
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
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 224, mt: 0.5 } } }}
      >
        <MenuItem
          onClick={() => {
            if (menuApplication) {
              navigate(
                `/employer/employees/${menuApplication.candidateProfile._id}?application=${menuApplication._id}`,
              );
            }
            closeMenu();
          }}
        >
          <ListItemIcon><PersonSearch fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>View profile</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuApplication) {
              handleOpenResume(menuApplication.candidateProfile._id, menuCandidateName);
            }
            closeMenu();
          }}
        >
          <ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>View resume</ListItemText>
        </MenuItem>
        {chatAllowed && (
          <MenuItem
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
          >
            <ListItemIcon><ChatBubbleOutline fontSize="small" /></ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Message</ListItemText>
          </MenuItem>
        )}
        {Boolean(menuCandidate?.phone) && (
          <MenuItem component="a" href={`tel:${menuCandidate?.phone}`} onClick={closeMenu}>
            <ListItemIcon><CallOutlined fontSize="small" /></ListItemIcon>
            <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Call</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          disabled={menuApplication?.status === 'rejected'}
          onClick={() => {
            if (menuApplication) {
              openDecision(menuApplication, 'accept', {
                // Booking a slot must not demote someone already hired.
                stage: menuApplication.status === 'hired' ? 'hired' : 'shortlisted',
                heading: menuApplication.interview?.scheduledAt
                  ? 'Reschedule the interview'
                  : 'Set up an interview',
              });
            }
            closeMenu();
          }}
        >
          <ListItemIcon><EventAvailable fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Set up interview</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={menuApplication?.status === 'hired' || menuApplication?.status === 'rejected'}
          onClick={() => {
            if (menuApplication) {
              openDecision(menuApplication, 'accept', {
                stage: 'hired',
                heading: 'Hire this candidate',
              });
            }
            closeMenu();
          }}
        >
          <ListItemIcon><EmojiEventsOutlined fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Mark as hired</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={menuApplication?.status === 'rejected'}
          onClick={() => {
            if (menuApplication) {
              openDecision(menuApplication, 'reject', { heading: 'Remove this candidate' });
            }
            closeMenu();
          }}
        >
          <ListItemIcon><Close fontSize="small" /></ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Remove candidate</ListItemText>
        </MenuItem>

        {/*
          The private triage mark. It notifies nobody and does not move the
          candidate along, so it sits apart from the pipeline actions above —
          and it is what the "Interest marked" filter reads.
        */}
        <Divider />
        <ListSubheader
          sx={{
            lineHeight: 2,
            fontWeight: 800,
            fontSize: '0.7rem',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            bgcolor: 'transparent',
          }}
        >
          Mark interest
        </ListSubheader>
        {INTEREST_MARKS.map((mark) => {
          const selected = menuApplication?.employerInterest === mark.value;

          return (
            <MenuItem
              key={mark.value}
              selected={selected}
              onClick={() => {
                if (menuApplication) handleInterest(menuApplication, mark.value);
                closeMenu();
              }}
            >
              <ListItemIcon sx={{ color: selected ? mark.tone : undefined }}>
                {mark.icon}
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { sx: { fontWeight: selected ? 800 : 600, color: selected ? mark.tone : undefined } },
                }}
              >
                {mark.label}
              </ListItemText>
            </MenuItem>
          );
        })}
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

      <CandidateResumePreviewModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        candidateName={resumeName}
        htmlContent={resumeHtml}
        isLoading={isFetchingResume}
        loadError={resumeError}
        fileUrl={resumeFile?.url}
        fileName={resumeFile?.name}
        fileMimeType={resumeFile?.mimeType}
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
