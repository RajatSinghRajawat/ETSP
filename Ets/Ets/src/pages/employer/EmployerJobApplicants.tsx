import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack,
  AssignmentTurnedIn,
  ChatBubbleOutlineOutlined as ChatBubbleOutline,
  CheckCircle,
  EventAvailable,
  HighlightOff,
  Lock,
  LockOpen,
  PictureAsPdf,
  PersonSearch,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import ApplicationDecisionDialog, { type DecisionKind } from '../../components/common/ApplicationDecisionDialog';
import CandidateResumePreviewModal from '../../components/common/CandidateResumePreviewModal';
import { useChat } from '../../context/ChatContext';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyJobsQuery } from '../../store/api/jobApi';
import { useUnlockCandidateMutation } from '../../store/api/candidateProfileApi';
import { useGetCandidateResumeMutation } from '../../store/api/resumeApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import {
  useGetEmployerApplicationCountsQuery,
  useGetEmployerApplicationsQuery,
  type ApplicationStatus,
} from '../../store/api/applicationApi';

const APPLICANTS_PER_PAGE = 10;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewing: 'Under Review',
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

const JOB_STATUS_COLOR: Record<string, 'success' | 'default' | 'error' | 'warning'> = {
  active: 'success',
  draft: 'default',
  closed: 'error',
  expired: 'warning',
};

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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const surfaceCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 4,
} as const;

const JobApplicantsView: React.FC<{ jobId: string }> = ({ jobId }) => {
  const navigate = useNavigate();
  const { startChatWith } = useChat();

  const { data: profileData } = useGetMyEmployerProfileQuery();
  const { data: jobsData, isLoading: isJobsLoading, isError: isJobsError } = useGetMyJobsQuery();
  const { data: countsData } = useGetEmployerApplicationCountsQuery();
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery();
  const [unlockCandidate] = useUnlockCandidateMutation();
  const [fetchCandidateResume, { isLoading: isFetchingResume }] = useGetCandidateResumeMutation();

  const [applicantPage, setApplicantPage] = useState(1);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [banner, setBanner] = useState('');
  const [decision, setDecision] = useState<{
    kind: DecisionKind;
    applicationId: string;
    candidateName: string;
    status: ApplicationStatus;
  } | null>(null);

  // Resume preview.
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeHtml, setResumeHtml] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [resumeName, setResumeName] = useState('Candidate');
  // Set when the candidate uploaded their own file rather than building one.
  const [resumeFile, setResumeFile] = useState<{ url: string; name: string; mimeType: string } | null>(null);

  const companyName = profileData?.data?.companyName || 'Employer';
  const chatAllowed = Boolean(usageData?.data.effectiveFeatures?.chatEnabled);

  const jobs = useMemo(() => jobsData?.data ?? [], [jobsData]);
  const job = jobs.find((item) => item._id === jobId) ?? null;
  const jobCounts = countsData?.data.byJob[jobId];

  const {
    data: applicantsData,
    isLoading: isApplicantsLoading,
    isFetching: isApplicantsFetching,
    isError: isApplicantsError,
    refetch: refetchApplicants,
  } = useGetEmployerApplicationsQuery(
    { job: jobId, page: applicantPage, limit: APPLICANTS_PER_PAGE },
    { skip: !jobId },
  );

  const applicants = applicantsData?.data.items ?? [];
  const applicantPagination = applicantsData?.data.pagination;

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

  const backButton = (
    <Button
      variant="outlined"
      startIcon={<ArrowBack />}
      onClick={() => navigate('/employer/dashboard')}
      sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5 }}
    >
      Back to Dashboard
    </Button>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHeader
          title={job ? `Applicants — ${job.title}` : 'Applicants'}
          subtitle="View the profile or resume, message the candidate, then accept or reject."
          breadcrumbs={[
            { label: 'Dashboard', path: '/employer/dashboard' },
            { label: 'Applicants' },
          ]}
          action={backButton}
        />

        {banner && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setBanner('')}>
            {banner}
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
            {/* Job summary */}
            <Card elevation={0} sx={{ ...surfaceCardSx, mb: 3 }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
                    <Typography sx={{ fontWeight: 800, wordBreak: 'break-word' }}>{job.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.location} · {job.type} · Posted {formatDate(job.createdAt)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
                    <Chip
                      size="small"
                      label={job.status}
                      color={JOB_STATUS_COLOR[job.status] ?? 'default'}
                      sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${jobCounts?.total ?? 0} applicant${(jobCounts?.total ?? 0) === 1 ? '' : 's'}`}
                      sx={{ fontWeight: 700 }}
                    />
                    {Boolean(jobCounts?.shortlisted) && (
                      <Chip
                        size="small"
                        label={`${jobCounts?.shortlisted} shortlisted`}
                        sx={{ fontWeight: 700, color: STATUS_COLOR.shortlisted, bgcolor: alpha(STATUS_COLOR.shortlisted, 0.12) }}
                      />
                    )}
                    {Boolean(jobCounts?.hired) && (
                      <Chip
                        size="small"
                        label={`${jobCounts?.hired} hired`}
                        sx={{ fontWeight: 700, color: STATUS_COLOR.hired, bgcolor: alpha(STATUS_COLOR.hired, 0.12) }}
                      />
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Applicants */}
            <Card elevation={0} sx={surfaceCardSx}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {(isApplicantsLoading || isApplicantsFetching) && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                )}
                {isApplicantsError && !isApplicantsLoading && (
                  <Alert severity="error" sx={{ borderRadius: 3 }}>Unable to load applicants for this job.</Alert>
                )}

                {!isApplicantsLoading && !isApplicantsFetching && !isApplicantsError && applicants.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    <AssignmentTurnedIn sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
                    <Typography sx={{ fontWeight: 700 }}>No applications yet</Typography>
                    <Typography variant="body2">Candidates who apply to this job will show up here.</Typography>
                  </Box>
                )}

                {!isApplicantsLoading && !isApplicantsFetching && applicants.length > 0 && (
                  <>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                      <Table sx={{ minWidth: 900 }} size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 800 }}>Candidate</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Applied On</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Interview</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {applicants.map((application) => {
                            const candidate = application.candidateProfile;
                            const locked = Boolean(candidate.locked);
                            const candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
                            const interviewAt = application.interview?.scheduledAt ?? null;

                            return (
                              <TableRow key={application._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell>
                                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                    <Avatar
                                      src={locked ? undefined : candidate.photoUrl || undefined}
                                      sx={{ width: 34, height: 34, bgcolor: locked ? 'grey.400' : 'primary.main' }}
                                    >
                                      {locked ? <Lock sx={{ fontSize: 16 }} /> : candidate.firstName.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', wordBreak: 'break-word' }}>
                                        {locked ? 'Locked candidate' : candidateName}
                                        {candidate.excelMember && !locked && (
                                          <Chip label="EXCEL" size="small" color="warning" sx={{ ml: 0.75, height: 18, fontWeight: 700 }} />
                                        )}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {locked ? 'Unlock to see contact details' : candidate.currentJobTitle || candidate.currentLocation}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                                  {formatDate(application.createdAt)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={STATUS_LABEL[application.status]}
                                    sx={{
                                      fontWeight: 700,
                                      color: STATUS_COLOR[application.status],
                                      bgcolor: alpha(STATUS_COLOR[application.status], 0.12),
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                                  {interviewAt ? (
                                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                                      <EventAvailable sx={{ fontSize: 16, color: '#7c3aed' }} />
                                      <span>{formatDateTime(interviewAt)}</span>
                                    </Stack>
                                  ) : (
                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', rowGap: 0.5 }}>
                                    {locked ? (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<LockOpen fontSize="small" />}
                                        disabled={unlockingId === candidate._id}
                                        onClick={() => handleUnlock(candidate._id)}
                                        sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                                      >
                                        {unlockingId === candidate._id ? 'Unlocking…' : 'Unlock (1 credit)'}
                                      </Button>
                                    ) : (
                                      <>
                                        <Tooltip title="View profile">
                                          <Button
                                            size="small"
                                            startIcon={<PersonSearch fontSize="small" />}
                                            onClick={() => navigate(`/employer/employees/${candidate._id}?application=${application._id}`)}
                                            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}
                                          >
                                            Profile
                                          </Button>
                                        </Tooltip>
                                        <Tooltip title="View resume">
                                          <Button
                                            size="small"
                                            startIcon={<PictureAsPdf fontSize="small" />}
                                            onClick={() => handleOpenResume(candidate._id, candidateName)}
                                            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}
                                          >
                                            Resume
                                          </Button>
                                        </Tooltip>
                                        {chatAllowed && (
                                          <Tooltip title="Message candidate">
                                            <Button
                                              size="small"
                                              startIcon={<ChatBubbleOutline fontSize="small" />}
                                              onClick={() =>
                                                startChatWith({
                                                  peerProfileId: candidate._id,
                                                  peerName: candidateName,
                                                  jobId: job._id,
                                                  jobTitle: job.title,
                                                })
                                              }
                                              sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}
                                            >
                                              Message
                                            </Button>
                                          </Tooltip>
                                        )}
                                        {application.status !== 'rejected' && application.status !== 'hired' && (
                                          <Button
                                            size="small"
                                            color="success"
                                            startIcon={<CheckCircle fontSize="small" />}
                                            onClick={() =>
                                              setDecision({
                                                kind: 'accept',
                                                applicationId: application._id,
                                                candidateName,
                                                status: application.status,
                                              })
                                            }
                                            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}
                                          >
                                            Accept
                                          </Button>
                                        )}
                                        {application.status !== 'rejected' && (
                                          <Button
                                            size="small"
                                            color="error"
                                            startIcon={<HighlightOff fontSize="small" />}
                                            onClick={() =>
                                              setDecision({
                                                kind: 'reject',
                                                applicationId: application._id,
                                                candidateName,
                                                status: application.status,
                                              })
                                            }
                                            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}
                                          >
                                            Reject
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {(applicantPagination?.totalPages ?? 1) > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                          count={applicantPagination?.totalPages ?? 1}
                          page={applicantPage}
                          onChange={(_, nextPage) => setApplicantPage(nextPage)}
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

      <ApplicationDecisionDialog
        decision={decision?.kind ?? null}
        applicationId={decision?.applicationId ?? ''}
        candidateName={decision?.candidateName}
        currentStatus={decision?.status}
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
 * Applicants for a single job, opened from the employer dashboard.
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
