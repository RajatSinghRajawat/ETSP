import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AttachMoney,
  Business,
  CalendarToday,
  CheckCircle,
  Edit,
  LocationOn,
  LoginOutlined,
  Work,
} from '@mui/icons-material';
import { JobCard } from '../../components/common/JobCard';
import { useGetJobQuery, useGetJobsQuery } from '../../store/api/jobApi';
import {
  useCreateApplicationMutation,
  useGetMyApplicationStatusQuery,
  type ApplicationStatus,
} from '../../store/api/applicationApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';

const BRAND_GRADIENT = 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)';

const getStoredUser = (): { role: string | null; email: string | null } => {
  const token = localStorage.getItem('ets-access-token');
  if (!token) {
    return { role: null, email: null };
  }

  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? (JSON.parse(raw) as { role?: string; email?: string }) : {};
    return { role: parsed.role ?? null, email: parsed.email ?? null };
  } catch {
    return { role: null, email: null };
  }
};

function formatPostedDate(value?: string) {
  if (!value) {
    return 'Just now';
  }

  const createdAt = new Date(value).getTime();
  const days = Math.floor((Date.now() - createdAt) / 86400000);

  if (Number.isNaN(createdAt) || days <= 0) {
    return 'Just now';
  }

  return days === 1 ? '1 day ago' : `${days} days ago`;
}

const JobDetails: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetJobQuery(id, { skip: !id });
  const [coverLetter, setCoverLetter] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const [createApplication, { isLoading: isApplying }] = useCreateApplicationMutation();
  const job = data?.data;
  const screeningQuestions = job?.screeningQuestions ?? [];
  const { data: similarJobsData } = useGetJobsQuery({
    skill: job?.skills?.[0] || undefined,
    limit: 3,
  });
  const similarJobs = (similarJobsData?.data.items ?? []).filter((item) => item._id !== id).slice(0, 3);
  const requirements = [job?.education, job?.experience].filter(Boolean) as string[];

  const { role, email } = getStoredUser();
  const isCandidate = role === 'candidate';
  const isOwnerEmployer = role === 'employer' && !!job && job.employerEmail === email;

  const { data: myApplicationStatus, isLoading: isLoadingMyStatus } = useGetMyApplicationStatusQuery(id, {
    skip: !id || !isCandidate,
  });
  const hasApplied = Boolean(myApplicationStatus?.data?.applied);
  const myApplication = myApplicationStatus?.data?.application ?? null;

  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery(undefined, {
    skip: !isCandidate,
  });
  const applicationMeter = usageData?.data.usage.applications;
  const applyQuotaExhausted = Boolean(
    applicationMeter && applicationMeter.limit !== null && applicationMeter.used >= applicationMeter.limit,
  );

  const handleApply = async () => {
    setApplyMessage('');
    setApplyError('');

    if (screeningQuestions.some((entry) => !screeningAnswers[entry.question]?.trim())) {
      setApplyError('Please answer all screening questions before applying.');
      return;
    }

    try {
      const response = await createApplication({
        jobId: id,
        coverLetter,
        screeningAnswers: screeningQuestions.map((entry) => ({
          question: entry.question,
          answer: screeningAnswers[entry.question].trim(),
        })),
      }).unwrap();
      setApplyMessage(response.message);
      setCoverLetter('');
      setScreeningAnswers({});
      refetchUsage();
    } catch (error) {
      const fallback = 'Unable to submit application. Please login as a candidate and try again.';
      if (typeof error === 'object' && error !== null && 'data' in error) {
        setApplyError((error as { data?: { message?: string } }).data?.message ?? fallback);
        return;
      }

      setApplyError(fallback);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !job) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Unable to load this job. It may be closed or removed.
        </Alert>
      </Container>
    );
  }

  const facts = [
    { icon: <LocationOn fontSize="small" />, label: job.location },
    { icon: <AttachMoney fontSize="small" />, label: job.salary || 'Not disclosed' },
    { icon: <Work fontSize="small" />, label: job.type },
    { icon: <CalendarToday fontSize="small" />, label: `Posted ${formatPostedDate(job.createdAt)}` },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero */}
      <Box
        sx={{
          background: BRAND_GRADIENT,
          color: 'white',
          py: { xs: 5, md: 7 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: -80,
            top: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            bgcolor: alpha('#ffffff', 0.07),
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={job.status}
              size="small"
              sx={{ textTransform: 'capitalize', bgcolor: alpha('#ffffff', 0.2), color: 'white', fontWeight: 700 }}
            />
            {job.isFeatured && (
              <Chip label="Featured" size="small" sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 700 }} />
            )}
            {job.isUrgent && (
              <Chip label="Urgent Hiring" size="small" sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 700 }} />
            )}
          </Stack>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            {job.title}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
              {job.companyName}
            </Typography>
            {job.employerProfile && (
              <Button
                size="small"
                startIcon={<Business />}
                onClick={() => navigate(`/employer/profile/${job.employerProfile}`)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  color: '#fff',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha('#ffffff', 0.5),
                  px: 1.5,
                  '&:hover': { borderColor: '#fff', bgcolor: alpha('#ffffff', 0.12) },
                }}
              >
                View Employer Profile
              </Button>
            )}
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            {facts.map((fact) => (
              <Box
                key={fact.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: alpha('#ffffff', 0.14),
                }}
              >
                {fact.icon}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {fact.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 3 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Job Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 4, lineHeight: 1.8, color: 'text.secondary' }}>
                  {job.description}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Required Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
                  {job.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      sx={{ bgcolor: alpha('#0ab6a2', 0.12), color: 'secondary.main', fontWeight: 600 }}
                    />
                  ))}
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Requirements
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {requirements.map((requirement) => (
                    <Chip
                      key={requirement}
                      label={requirement}
                      sx={{ bgcolor: alpha('#0c5283', 0.1), color: 'primary.main', fontWeight: 600 }}
                    />
                  ))}
                </Box>

                {job.benefits && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, mt: 4 }}>
                      Benefits
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>
                      {job.benefits}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, position: 'sticky', top: 20 }}
            >
              <CardContent sx={{ p: 3 }}>
                {isCandidate && hasApplied && (
                  <AppliedPanel
                    status={myApplication?.status ?? 'new'}
                    appliedAt={myApplication?.createdAt}
                    onViewApplications={() => navigate('/candidate/dashboard')}
                  />
                )}

                {isCandidate && !hasApplied && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                      Apply for this position
                    </Typography>
                    {applyMessage && (
                      <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
                        {applyMessage}
                      </Alert>
                    )}
                    {applyError && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                        {applyError}
                      </Alert>
                    )}
                    {applyQuotaExhausted && (
                      <Alert
                        severity="warning"
                        sx={{ mb: 2, borderRadius: 3 }}
                        action={
                          <Button color="inherit" size="small" onClick={() => navigate('/pricing')}>
                            Upgrade
                          </Button>
                        }
                      >
                        You have used all {applicationMeter?.limit} job applications in your plan this
                        period.
                      </Alert>
                    )}
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="Cover Letter"
                      placeholder="Write a short message for the employer"
                      value={coverLetter}
                      onChange={(event) => setCoverLetter(event.target.value)}
                      sx={{ mb: 2 }}
                    />
                    {screeningQuestions.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Screening questions
                        </Typography>
                        <Stack spacing={1.5}>
                          {screeningQuestions.map((entry) => (
                            <TextField
                              key={entry.question}
                              fullWidth
                              multiline
                              minRows={2}
                              label={entry.question}
                              value={screeningAnswers[entry.question] ?? ''}
                              onChange={(event) =>
                                setScreeningAnswers((current) => ({
                                  ...current,
                                  [entry.question]: event.target.value,
                                }))
                              }
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{ mb: 2 }}
                      disabled={isApplying || isLoadingMyStatus || applyQuotaExhausted}
                      onClick={handleApply}
                    >
                      {isApplying ? 'Applying' : 'Apply Now'}
                    </Button>
                    <Button fullWidth variant="outlined" color="primary">
                      Save Job
                    </Button>
                  </>
                )}

                {isOwnerEmployer && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Manage this job
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Update the role details, salary, skills and requirements anytime.
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<Edit />}
                      sx={{ mb: 2 }}
                      onClick={() => navigate(`/employer/edit-job/${job._id}`)}
                    >
                      Edit Job
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/employer/applications')}
                    >
                      View Applications
                    </Button>
                  </>
                )}

                {!isCandidate && !isOwnerEmployer && (
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        mx: 'auto',
                        mb: 2,
                        bgcolor: alpha('#0c5283', 0.1),
                        color: 'primary.main',
                      }}
                    >
                      <LoginOutlined />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Interested in this role?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Sign in to your candidate account to apply for this position.
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<LoginOutlined />}
                      onClick={() => navigate('/login')}
                    >
                      Sign in to apply
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {similarJobs.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
              Similar Jobs
            </Typography>
            <Grid container spacing={3}>
              {similarJobs.map((similarJob) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={similarJob._id}>
                  <JobCard
                    title={similarJob.title}
                    clinic={similarJob.companyName}
                    location={similarJob.location}
                    salary={similarJob.salary}
                    type={similarJob.type}
                    skills={similarJob.skills}
                    onClick={() => navigate(`/jobs/${similarJob._id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

const STATUS_META: Record<ApplicationStatus, { label: string; color: string }> = {
  new: { label: 'Application received', color: '#0c5283' },
  reviewing: { label: 'Under review', color: '#f59e0b' },
  shortlisted: { label: 'Shortlisted', color: '#0ab6a2' },
  rejected: { label: 'Not selected', color: '#ef4444' },
  hired: { label: 'Hired', color: '#10b981' },
};

interface AppliedPanelProps {
  status: ApplicationStatus;
  appliedAt?: string;
  onViewApplications: () => void;
}

const AppliedPanel: React.FC<AppliedPanelProps> = ({ status, appliedAt, onViewApplications }) => {
  const meta = STATUS_META[status] ?? STATUS_META.new;
  const appliedDate = appliedAt
    ? new Date(appliedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 1.5,
          px: 2,
          py: 3.5,
          borderRadius: 3,
          background: alpha('#0ab6a2', 0.08),
          border: `1px solid ${alpha('#0ab6a2', 0.25)}`,
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
            boxShadow: '0 10px 20px -8px rgba(10,182,162,0.5)',
          }}
        >
          <CheckCircle sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          You've applied
        </Typography>
        <Chip
          label={meta.label}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha(meta.color, 0.12),
            color: meta.color,
            border: `1px solid ${alpha(meta.color, 0.3)}`,
          }}
        />
        {appliedDate && (
          <Typography variant="caption" color="text.secondary">
            Applied on {appliedDate}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          The employer will review your profile. You'll be notified when there's an update.
        </Typography>
      </Box>
      <Button fullWidth variant="outlined" color="primary" onClick={onViewApplications}>
        View my applications
      </Button>
    </Box>
  );
};

export default JobDetails;
