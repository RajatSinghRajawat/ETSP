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
  DescriptionOutlined,
  EditOutlined,
  GroupOutlined,
  GroupsOutlined,
  LockOutlined,
  MoreHoriz,
  OpenInNewOutlined,
  PersonSearchOutlined,
  PlaceOutlined,
  StopCircleOutlined,
  WorkOutlineOutlined,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import JobStatusControl from '../../components/employer/JobStatusControl';
import { JOB_STATUS_META, POSTED_VIA_LABEL, formatJobDate } from '../../components/employer/jobStatus';
import {
  IconPlate,
  PageHero,
  SectionHeading,
  SoftChip,
  StatTile,
} from '../../components/employer/employerUi';
import {
  TONE,
  heroButtonSx,
  hoverLiftSx,
  panelSx,
  type ToneKey,
} from '../../components/employer/employerTokens';
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

/** Splits a free-text block into bullet lines, or `null` when it is a paragraph. */
const toBullets = (value?: string) => {
  const lines = (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean);

  return lines.length > 1 ? lines : null;
};

const TextBlock: React.FC<{ value?: string }> = ({ value }) => {
  const bullets = toBullets(value);

  if (!value?.trim()) {
    return (
      <Typography variant="body2" color="text.disabled">Not provided</Typography>
    );
  }

  if (!bullets) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>
        {value}
      </Typography>
    );
  }

  return (
    <Box component="ul" sx={{ m: 0, pl: 3, color: 'text.secondary' }}>
      {bullets.map((line, index) => (
        <Typography component="li" variant="body2" key={`${index}-${line.slice(0, 12)}`} sx={{ mb: 0.5, lineHeight: 1.7 }}>
          {line}
        </Typography>
      ))}
    </Box>
  );
};

/** One labelled fact in the job post summary. */
const SummaryFact: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'text.secondary' }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
      {value}
    </Typography>
  </Box>
);

/** A candidate-funnel card: a count, a caption and the action that opens it. */
const CandidateCard: React.FC<{
  icon: React.ReactNode;
  tone: ToneKey;
  count: React.ReactNode;
  headline: string;
  caption: string;
  actionLabel: string;
  onClick?: () => void;
  locked?: boolean;
}> = ({ icon, tone, count, headline, caption, actionLabel, onClick, locked }) => (
  <Paper
    elevation={0}
    sx={{
      ...(panelSx as object),
      ...(locked ? {} : (hoverLiftSx as object)),
      p: { xs: 2, md: 2.5 },
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.25 }}>
      <IconPlate tone={tone} size={44}>{icon}</IconPlate>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{ fontWeight: 900, fontSize: '1.75rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}
        >
          {count}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
          {headline}
        </Typography>
      </Box>
    </Stack>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {caption}
    </Typography>
    <Button
      disabled={locked}
      onClick={onClick}
      endIcon={<ArrowForward fontSize="small" />}
      sx={{ mt: 'auto', alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700, px: 0 }}
    >
      {actionLabel}
    </Button>
    {locked && (
      <Chip
        size="small"
        icon={<LockOutlined sx={{ fontSize: 14 }} />}
        label="Premium"
        sx={{
          position: 'absolute',
          right: 14,
          top: 14,
          fontWeight: 700,
          borderRadius: 999,
          color: '#92400e',
          bgcolor: alpha(TONE.amber, 0.16),
          '& .MuiChip-icon': { color: '#92400e' },
        }}
      />
    )}
  </Paper>
);

/** One of the two sponsored-feature cards under job performance. */
const SponsorCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  caption: string;
  badge?: React.ReactNode;
}> = ({ icon, title, caption, badge }) => (
  <Paper
    elevation={0}
    sx={{ ...(panelSx as object), p: { xs: 2, md: 2.5 }, height: '100%' }}
  >
    <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
      <IconPlate tone="amber">{icon}</IconPlate>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, mb: 0.375 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{caption}</Typography>
        {badge && <Box sx={{ mt: 1.25 }}>{badge}</Box>}
      </Box>
    </Stack>
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

  const companyName = profileData?.data?.companyName || 'Employer';
  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData]);
  const job = jobs.find((item) => item._id === jobId) ?? null;
  const counts = countsData?.data.byJob[jobId];

  const applicantsPath = `/employer/jobs/${jobId}/applicants`;

  const setStatus = async (status: 'active' | 'closed') => {
    setError('');
    try {
      await updateJobStatus({ id: jobId, status }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change the job status. Please try again.'));
    }
  };

  const planLabel = POSTED_VIA_LABEL[job?.postedVia ?? 'free'] ?? 'Free';
  const isOffline = job ? job.status !== 'active' : false;
  const statusMeta = JOB_STATUS_META[job?.status ?? 'draft'] ?? JOB_STATUS_META.draft;

  const performance: Array<{ label: string; value: string | number; tone: ToneKey }> = [
    { label: 'Impressions', value: job?.metrics?.impressions ?? 0, tone: 'blue' },
    { label: 'Clicks', value: job?.metrics?.clicks ?? 0, tone: 'violet' },
    { label: 'Applications', value: counts?.total ?? 0, tone: 'teal' },
    { label: 'Shortlisted', value: counts?.shortlisted ?? 0, tone: 'amber' },
    { label: 'Hired', value: counts?.hired ?? 0, tone: 'green' },
    {
      label: 'Total cost',
      value: job?.postedVia === 'free' || !job?.postedVia ? '₹0.00' : 'In plan',
      tone: 'slate',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: 'background.default' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {isError && !isLoading && (
          <Alert severity="error" sx={{ borderRadius: 3 }}>Unable to load your jobs.</Alert>
        )}
        {!isLoading && !isError && !job && (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            This job was not found in your posted jobs.
          </Alert>
        )}

        {job && (
          <>
            <PageHero
              back={
                <MuiLink
                  component={RouterLink}
                  to="/employer/dashboard"
                  underline="hover"
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
                  Back to My Jobs
                </MuiLink>
              }
              title={job.title}
              meta={
                <>
                  <SoftChip onHero label={statusMeta.label} />
                  <SoftChip onHero icon={<PlaceOutlined />} label={job.location} />
                  <SoftChip onHero icon={<ApartmentOutlined />} label={job.companyName} />
                  <SoftChip onHero icon={<WorkOutlineOutlined />} label={`${planLabel} job`} />
                  <SoftChip
                    onHero
                    icon={<CalendarMonthOutlined />}
                    label={`Posted ${formatJobDate(job.createdAt)}`}
                  />
                </>
              }
              actions={
                <>
                  <JobStatusControl job={job} onError={setError} />
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={() => navigate(`/employer/edit-job/${job._id}`)}
                    sx={heroButtonSx}
                  >
                    Edit job
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<GroupsOutlined />}
                    onClick={() => navigate(applicantsPath)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
                  >
                    Candidates
                  </Button>
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      aria-label="Job actions"
                      onClick={(e) => setMenuAnchor(e.currentTarget)}
                      sx={{
                        color: '#ffffff',
                        border: '1px solid',
                        borderColor: alpha('#ffffff', 0.4),
                        borderRadius: 2,
                        '&:hover': { bgcolor: alpha('#ffffff', 0.18) },
                      }}
                    >
                      <MoreHoriz fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              }
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Status prompt */}
            {isOffline && (
              <Alert
                severity={job.status === 'paused' ? 'info' : 'warning'}
                icon={false}
                sx={{ mb: 3, borderRadius: 3, alignItems: 'center' }}
                action={
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={isStatusUpdating}
                      onClick={() => setStatus('active')}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Reopen
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
                <Box component="span" sx={{ fontWeight: 800 }}>
                  {job.status === 'paused'
                    ? 'Your job has been paused.'
                    : job.status === 'expired'
                      ? 'Your job has expired.'
                      : job.status === 'closed'
                        ? 'Your job is closed.'
                        : 'This job is still a draft.'}
                </Box>{' '}
                Candidates cannot see or apply to it right now.
              </Alert>
            )}

            {/* Candidates */}
            <SectionHeading
              icon={<GroupsOutlined />}
              title="Candidates"
              caption="Everyone in this job's pipeline, grouped by where they are."
              sx={{ mb: 2 }}
            />
            <Grid container spacing={{ xs: 1.5, md: 2.5 }} sx={{ mb: { xs: 3, md: 4 } }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <CandidateCard
                  icon={<GroupOutlined />}
                  tone="blue"
                  count={counts?.total ?? 0}
                  headline="All applications"
                  caption="Everyone who applied to this job."
                  actionLabel="View all applications"
                  onClick={() => navigate(applicantsPath)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <CandidateCard
                  icon={<DescriptionOutlined />}
                  tone="violet"
                  count={counts?.new ?? 0}
                  headline="New"
                  caption="Applications still awaiting your review."
                  actionLabel="Review new applications"
                  onClick={() => navigate(`${applicantsPath}?tab=new`)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <CandidateCard
                  icon={<PersonSearchOutlined />}
                  tone="teal"
                  count={isPremium ? (counts?.shortlisted ?? 0) : '—'}
                  headline="Matches"
                  caption="Potential candidates we surfaced for this role."
                  actionLabel="Review matches"
                  locked={!isPremium}
                  onClick={() => navigate(`${applicantsPath}?tab=shortlisted`)}
                />
              </Grid>
            </Grid>

            {/* Job performance */}
            <SectionHeading
              icon={<AutoGraphOutlined />}
              tone="violet"
              title="Job performance"
              caption={`${planLabel} job · ${formatJobDate(job.createdAt)} – Today`}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 3, md: 4 } }}>
              {performance.map((stat) => (
                <Grid size={{ xs: 6, sm: 4, lg: 2 }} key={stat.label}>
                  <StatTile label={stat.label} value={stat.value} tone={stat.tone} />
                </Grid>
              ))}
            </Grid>

            {/* Sponsored features */}
            <SectionHeading
              icon={<CampaignOutlined />}
              tone="amber"
              title="Enhance performance"
              caption="Sponsored features that put this job in front of more candidates."
              sx={{ mb: 2 }}
            />
            <Grid container spacing={{ xs: 1.5, md: 2.5 }} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <SponsorCard
                  icon={<ApartmentOutlined />}
                  title="Job branding"
                  caption="Show your company logo and header in job search results."
                  badge={!isPremium ? <SoftChip icon={<LockOutlined />} label="Premium" tone="amber" /> : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SponsorCard
                  icon={<CampaignOutlined />}
                  title="Urgently needed label"
                  caption="Add this label to stand out and attract more applications."
                  badge={
                    job.isUrgent ? (
                      <SoftChip label="Active" tone="green" />
                    ) : !isPremium ? (
                      <SoftChip icon={<LockOutlined />} label="Premium" tone="amber" />
                    ) : undefined
                  }
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5, mb: { xs: 3, md: 4 } }}>
              {/* Shown to every employer until they are on a paid plan. */}
              {showUpgrade && (
                <Button
                  variant="contained"
                  onClick={() => navigate('/pricing')}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
                >
                  Upgrade plan
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => navigate(applicantsPath)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
              >
                View candidate report
              </Button>
            </Stack>

            {/* Job post summary */}
            <SectionHeading
              icon={<DescriptionOutlined />}
              tone="teal"
              title="Job post summary"
              caption="Exactly what candidates see on the public listing."
              sx={{ mb: 2 }}
            />
            <Card elevation={0} sx={panelSx}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <SummaryFact label="Date posted" value={formatJobDate(job.createdAt)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <SummaryFact label="Pay" value={job.salary?.trim() || 'Not disclosed'} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <SummaryFact label="Job type" value={job.type} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <SummaryFact
                      label="Expires"
                      value={job.expiresAt ? formatJobDate(job.expiresAt) : 'No end date'}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2.5 }} />

                <Typography sx={{ fontWeight: 800, mb: 1 }}>Job description</Typography>
                <TextBlock value={job.description} />

                <Typography sx={{ fontWeight: 800, mt: 2.5, mb: 1 }}>Qualifications</Typography>
                <Box component="ul" sx={{ m: 0, pl: 3, color: 'text.secondary' }}>
                  <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>Education:</Box>{' '}
                    {job.education}
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>Experience:</Box>{' '}
                    {job.experience}
                  </Typography>
                </Box>

                {job.skills.length > 0 && (
                  <>
                    <Typography sx={{ fontWeight: 800, mt: 2.5, mb: 1 }}>Skills</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {job.skills.map((skill) => (
                        <SoftChip key={skill} label={skill} tone="teal" />
                      ))}
                    </Box>
                  </>
                )}

                {job.benefits?.trim() && (
                  <>
                    <Typography sx={{ fontWeight: 800, mt: 2.5, mb: 1 }}>Benefits</Typography>
                    <TextBlock value={job.benefits} />
                  </>
                )}

                {(job.screeningQuestions ?? []).length > 0 && (
                  <>
                    <Typography sx={{ fontWeight: 800, mt: 2.5, mb: 1 }}>Screening questions</Typography>
                    <Box component="ol" sx={{ m: 0, pl: 3, color: 'text.secondary' }}>
                      {(job.screeningQuestions ?? []).map((item, index) => (
                        <Typography component="li" variant="body2" key={`${index}-${item.question.slice(0, 12)}`} sx={{ mb: 0.5 }}>
                          {item.question}
                        </Typography>
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 224, mt: 0.5 } } }}
            >
              <MenuItem onClick={() => { setMenuAnchor(null); navigate(`/employer/edit-job/${job._id}`); }}>
                <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Edit job</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setMenuAnchor(null); navigate(applicantsPath); }}>
                <ListItemIcon><GroupOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Manage candidates</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  window.open(`/jobs/${job._id}`, '_blank', 'noopener');
                }}
              >
                <ListItemIcon><OpenInNewOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>See public listing</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                disabled={job.status === 'closed'}
                onClick={() => { setMenuAnchor(null); setStatus('closed'); }}
              >
                <ListItemIcon><StopCircleOutlined fontSize="small" /></ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>Close job</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );
};

/**
 * A single job's own page: status, candidate funnel, performance and the full
 * post — opened from "My Jobs". Keyed by job id so switching jobs resets the
 * page's menu and error state without an effect.
 *
 * Route: /employer/jobs/:id
 */
const EmployerJobView: React.FC = () => {
  const { id: jobId = '' } = useParams();
  return <JobView key={jobId} jobId={jobId} />;
};

export default EmployerJobView;
