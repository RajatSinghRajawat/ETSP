import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack,
  Badge as BadgeIcon,
  Business,
  CalendarMonth,
  ChatBubbleOutlineOutlined as ChatBubbleOutline,
  Check,
  CheckCircle,
  ContentCopy,
  Description,
  Email,
  EventAvailable,
  Grade,
  HighlightOff,
  LocationOn,
  LockOpen,
  Person,
  Phone,
  PictureAsPdf,
  Psychology,
  School,
  Share,
  Stars,
  Verified,
  Work,
  WorkHistory,
} from '@mui/icons-material';
import Sidebar from '../../components/common/Sidebar';
import ShareButton from '../../components/common/ShareButton';
import { PageHeader } from '../../components/common/PageHeader';
import CandidateResumePreviewModal from '../../components/common/CandidateResumePreviewModal';
import ApplicationDecisionDialog, { type DecisionKind } from '../../components/common/ApplicationDecisionDialog';
import { useGetEmployerApplicationQuery, type ApplicationStatus } from '../../store/api/applicationApi';
import {
  useGetCandidateProfileQuery,
  useUnlockCandidateMutation,
} from '../../store/api/candidateProfileApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import { useGetCandidateResumeMutation } from '../../store/api/resumeApi';
import { useChat } from '../../context/ChatContext';

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: 'New Application',
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

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  onCopy?: () => void;
  isCopied?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, onCopy, isCopied }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1.5,
      p: 1.25,
      borderRadius: 2.5,
      bgcolor: 'rgba(241, 245, 249, 0.65)',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: 'rgba(241, 245, 249, 0.95)',
        transform: 'translateX(2px)',
      },
    }}
  >
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 0 }}>
      <Box
        sx={{
          color: '#0c5283',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: 'rgba(12, 82, 131, 0.08)',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 700,
            fontSize: '0.75rem',
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            fontSize: '0.975rem',
            color: 'text.primary',
            wordBreak: 'break-word',
          }}
        >
          {value || '—'}
        </Typography>
      </Box>
    </Box>

    {onCopy && value && (
      <Tooltip title={isCopied ? 'Copied!' : `Copy ${label.toLowerCase()}`} arrow placement="top">
        <IconButton
          size="small"
          onClick={onCopy}
          sx={{
            color: isCopied ? 'success.main' : 'text.secondary',
            bgcolor: isCopied ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(12, 82, 131, 0.1)' },
          }}
        >
          {isCopied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

const EmployerEmployeeView: React.FC = () => {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('application') ?? '';
  const navigate = useNavigate();
  const { startChatWith } = useChat();

  const { data: employerData } = useGetMyEmployerProfileQuery();
  const { data, isLoading, isError, refetch } = useGetCandidateProfileQuery(id, { skip: !id });
  const { data: applicationData } = useGetEmployerApplicationQuery(applicationId, { skip: !applicationId });
  const application = applicationData?.data;
  const applicantsPath = application ? `/employer/jobs/${application.job._id}/applicants` : '';

  const [decision, setDecision] = useState<DecisionKind | null>(null);
  const [decisionMessage, setDecisionMessage] = useState('');
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery();
  const [unlockCandidate, { isLoading: isUnlocking }] = useUnlockCandidateMutation();

  const candidate = data?.data;
  const companyName = employerData?.data.companyName || 'Employer';
  const isLocked = Boolean(candidate?.locked);
  const chatAllowed = Boolean(usageData?.data.effectiveFeatures?.chatEnabled);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2200);
  };

  const handleUnlock = async () => {
    if (!candidate) return;
    try {
      await unlockCandidate({ id: candidate._id }).unwrap();
      refetch();
      refetchUsage();
    } catch {
      // Plan-gate interceptor handles 402 credits dialog.
    }
  };

  const [fetchCandidateResume, { isLoading: isFetchingResume }] = useGetCandidateResumeMutation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resumeHtml, setResumeHtml] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [resumeFile, setResumeFile] = useState<{ url: string; name: string; mimeType: string } | null>(null);

  const handleOpenResumePreview = async () => {
    if (!candidate || isFetchingResume) return;
    setResumeError('');
    setResumeFile(null);
    setPreviewOpen(true);

    try {
      const response = await fetchCandidateResume(candidate._id).unwrap();
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
      const apiMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ??
        (error as { message?: string })?.message ??
        'Could not load the resume. Please try again.';
      setResumeError(apiMessage);
      setResumeHtml('');
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const candidateFullName = candidate ? `${candidate.firstName} ${candidate.lastName}`.trim() : 'Candidate';

  // Hiring pipeline stages
  const pipelineStages: ApplicationStatus[] = ['new', 'reviewing', 'shortlisted', 'hired'];
  const currentStageIndex = application
    ? application.status === 'rejected'
      ? -1
      : pipelineStages.indexOf(application.status)
    : -1;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4.5 },
          maxWidth: 1400,
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* Navigation & Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(application ? applicantsPath : '/employer/employees')}
              sx={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#0c5283',
                bgcolor: '#ffffff',
                px: 2.2,
                py: 1,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'rgba(12, 82, 131, 0.15)',
                boxShadow: '0 2px 8px rgba(12, 82, 131, 0.04)',
                '&:hover': {
                  bgcolor: 'rgba(12, 82, 131, 0.05)',
                  transform: 'translateX(-3px)',
                  boxShadow: '0 4px 12px rgba(12, 82, 131, 0.1)',
                },
              }}
            >
              {application ? 'Back to Applicants' : 'Back to Candidates'}
            </Button>

            {application && (
              <Chip
                label={`Job: ${application.job.title}`}
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  borderColor: 'rgba(12, 82, 131, 0.25)',
                  bgcolor: '#ffffff',
                  color: '#0c5283',
                }}
              />
            )}
          </Stack>
        </Box>

        {decisionMessage && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 3,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
            }}
            onClose={() => setDecisionMessage('')}
          >
            {decisionMessage}
          </Alert>
        )}

        {/* APPLICATION REVIEW COMMAND BAR (When application query is present) */}
        {application && candidate && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              mb: 3.5,
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: alpha(STATUS_COLOR[application.status], 0.35),
              background: '#ffffff',
              boxShadow: '0 10px 30px -10px rgba(12, 82, 131, 0.08)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 5,
                background: `linear-gradient(90deg, ${STATUS_COLOR[application.status]} 0%, #0ab6a2 100%)`,
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2.5,
                }}
              >
                {/* Left: Application Details */}
                <Box sx={{ minWidth: 0, flex: '1 1 280px' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.775rem',
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: STATUS_COLOR[application.status],
                      }}
                    >
                      Hiring Pipeline Review
                    </Typography>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: STATUS_COLOR[application.status],
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Applied {formatDate(application.createdAt)}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', sm: '1.45rem' },
                      color: '#0f172a',
                      letterSpacing: '-0.015em',
                      mb: 0.5,
                    }}
                  >
                    {application.job.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', fontSize: '0.925rem', fontWeight: 500 }}
                  >
                    {application.job.location} • {application.job.type}
                  </Typography>
                </Box>

                {/* Right: Stage indicator & Action Buttons */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
                >
                  <Chip
                    label={STATUS_LABEL[application.status]}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      height: 36,
                      px: 1.5,
                      color: STATUS_COLOR[application.status],
                      bgcolor: alpha(STATUS_COLOR[application.status], 0.12),
                      border: '1px solid',
                      borderColor: alpha(STATUS_COLOR[application.status], 0.25),
                    }}
                  />

                  {application.interview?.scheduledAt && (
                    <Chip
                      icon={<EventAvailable sx={{ fontSize: '1.1rem !important' }} />}
                      label={`Interview: ${formatDateTime(application.interview.scheduledAt)}`}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        height: 36,
                        color: '#7c3aed',
                        bgcolor: alpha('#7c3aed', 0.1),
                        border: '1px solid',
                        borderColor: alpha('#7c3aed', 0.3),
                      }}
                    />
                  )}

                  {!isLocked && application.status !== 'rejected' && application.status !== 'hired' && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => setDecision('accept')}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        borderRadius: 2.5,
                        px: 2.5,
                        py: 1,
                        bgcolor: '#10b981',
                        color: '#ffffff',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                        '&:hover': {
                          bgcolor: '#059669',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 18px rgba(16, 185, 129, 0.45)',
                        },
                      }}
                    >
                      Advance Candidate
                    </Button>
                  )}

                  {!isLocked && application.status !== 'rejected' && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<HighlightOff />}
                      onClick={() => setDecision('reject')}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        borderRadius: 2.5,
                        px: 2.2,
                        py: 1,
                        borderWidth: 1.5,
                        '&:hover': { borderWidth: 1.5, bgcolor: alpha('#dc2626', 0.05) },
                      }}
                    >
                      Reject
                    </Button>
                  )}
                </Stack>
              </Box>

              {/* Visual Pipeline Progress Bar */}
              {application.status !== 'rejected' && (
                <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'rgba(226, 232, 240, 0.8)' }}>
                  <Grid container spacing={1} sx={{ alignItems: 'center' }}>
                    {pipelineStages.map((stage, idx) => {
                      const isCompleted = currentStageIndex >= idx;
                      const isCurrent = currentStageIndex === idx;
                      return (
                        <Grid key={stage} size={{ xs: 6, sm: 3 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.25,
                              p: 1,
                              borderRadius: 2,
                              bgcolor: isCurrent
                                ? alpha(STATUS_COLOR[stage], 0.1)
                                : isCompleted
                                ? 'rgba(241, 245, 249, 0.7)'
                                : 'transparent',
                            }}
                          >
                            <Box
                              sx={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                color: isCompleted || isCurrent ? '#ffffff' : 'text.disabled',
                                bgcolor: isCompleted || isCurrent ? STATUS_COLOR[stage] : 'rgba(203, 213, 225, 0.7)',
                              }}
                            >
                              {isCompleted && !isCurrent ? '✓' : idx + 1}
                            </Box>
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: isCurrent ? 800 : isCompleted ? 700 : 500,
                                color: isCurrent ? STATUS_COLOR[stage] : isCompleted ? 'text.primary' : 'text.disabled',
                              }}
                            >
                              {STATUS_LABEL[stage]}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading & Error States */}
        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
            <CircularProgress size={44} sx={{ color: '#0c5283' }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Loading candidate profile…
            </Typography>
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ borderRadius: 3, mb: 3, fontSize: '1rem', fontWeight: 600 }}>
            Unable to load candidate details. Please verify your connection or try again.
          </Alert>
        )}

        {!isLoading && !isError && !candidate && (
          <Alert severity="info" sx={{ borderRadius: 3, mb: 3, fontSize: '1rem' }}>
            Candidate not found.
          </Alert>
        )}

        {candidate && (
          <Grid container spacing={3.5}>
            {/* Locked Profile Notification */}
            {isLocked && (
              <Grid size={{ xs: 12 }}>
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: 3.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    p: 2.5,
                    boxShadow: '0 8px 24px rgba(217, 119, 6, 0.15)',
                    border: '1px solid rgba(217, 119, 6, 0.3)',
                  }}
                  action={
                    <Button
                      variant="contained"
                      color="warning"
                      size="medium"
                      disabled={isUnlocking}
                      onClick={handleUnlock}
                      startIcon={<LockOpen />}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.925rem',
                        px: 2.5,
                        py: 1,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
                      }}
                    >
                      {isUnlocking ? 'Unlocking…' : 'Unlock Profile (1 Credit)'}
                    </Button>
                  }
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.25 }}>
                    Candidate Profile is Locked
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    The candidate's contact details, direct email, phone number, photo, and full resume document are
                    hidden. Spend 1 unlock credit to reveal the complete dossier.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* HERO CARD (Cover Banner + Avatar + Headline + Primary Action Toolbar) */}
            <Grid size={{ xs: 12 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'rgba(226, 232, 240, 0.8)',
                  background: '#ffffff',
                  boxShadow: '0 10px 32px -10px rgba(12, 82, 131, 0.1)',
                }}
              >
                {/* Visual Ambient Banner */}
                <Box
                  sx={{
                    height: { xs: 110, sm: 140 },
                    background: 'linear-gradient(135deg, #0c5283 0%, #173b6c 40%, #0ab6a2 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage:
                        'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.18) 0%, transparent 55%)',
                    },
                  }}
                />

                <CardContent sx={{ p: { xs: 2.5, sm: 4 }, pt: 0 }}>
                  {/* Top Avatar & Action Buttons Bar */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'flex-end' },
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    {/* Avatar: pulled up into the banner cleanly */}
                    <Box sx={{ mt: { xs: -6, sm: -8 } }}>
                      <Avatar
                        src={candidate.photoUrl || undefined}
                        sx={{
                          width: { xs: 96, sm: 120 },
                          height: { xs: 96, sm: 120 },
                          border: '4px solid #ffffff',
                          boxShadow: '0 8px 24px rgba(12, 82, 131, 0.22)',
                          bgcolor: '#0c5283',
                          fontSize: { xs: 38, sm: 48 },
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {isLocked ? <LockOpen sx={{ fontSize: 44 }} /> : candidate.firstName.charAt(0)}
                      </Avatar>
                    </Box>

                    {/* Action Buttons: aligned comfortably on the right */}
                    <Box sx={{ width: { xs: '100%', sm: 'auto' }, pt: { xs: 1, sm: 0 } }}>
                      {isLocked ? (
                        <Button
                          fullWidth
                          variant="contained"
                          color="warning"
                          startIcon={<LockOpen />}
                          disabled={isUnlocking}
                          onClick={handleUnlock}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            textTransform: 'none',
                            borderRadius: 3,
                            px: 3.5,
                            py: 1.2,
                            boxShadow: '0 6px 18px rgba(217, 119, 6, 0.35)',
                          }}
                        >
                          {isUnlocking ? 'Unlocking…' : 'Unlock Profile (1 credit)'}
                        </Button>
                      ) : (
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
                        >
                          <ShareButton
                            url={`/employer/employees/${candidate._id}`}
                            title={candidateFullName}
                            text={`${candidateFullName}${candidate.currentJobTitle ? ` — ${candidate.currentJobTitle}` : ''} on VetsLinked:`}
                            label="Share Profile"
                            variant="button"
                          />

                          {chatAllowed && (
                            <Button
                              variant="outlined"
                              startIcon={<ChatBubbleOutline />}
                              onClick={() =>
                                startChatWith({
                                  peerProfileId: candidate._id,
                                  peerName: candidateFullName,
                                })
                              }
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                borderRadius: 3,
                                px: 2.5,
                                py: 1.1,
                                borderColor: '#0ab6a2',
                                color: '#0c5283',
                                bgcolor: '#ffffff',
                                '&:hover': {
                                  borderColor: '#0ab6a2',
                                  bgcolor: 'rgba(10, 182, 162, 0.08)',
                                  transform: 'translateY(-1px)',
                                },
                              }}
                            >
                              Message
                            </Button>
                          )}

                          <Button
                            variant="contained"
                            startIcon={
                              isFetchingResume && !previewOpen ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <PictureAsPdf />
                              )
                            }
                            onClick={handleOpenResumePreview}
                            disabled={isFetchingResume && !previewOpen}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              textTransform: 'none',
                              borderRadius: 3,
                              px: 3,
                              py: 1.1,
                              background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                              boxShadow: '0 8px 24px -6px rgba(12, 82, 131, 0.45)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 12px 28px -6px rgba(12, 82, 131, 0.6)',
                              },
                              '&.Mui-disabled': {
                                background: 'rgba(12, 82, 131, 0.5)',
                                color: '#fff',
                                opacity: 0.85,
                              },
                            }}
                          >
                            {isFetchingResume && !previewOpen ? 'Loading resume…' : 'View Full Resume'}
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  </Box>

                  {/* Candidate Identity & Credentials (Completely in white card area, NO overlap) */}
                  <Box sx={{ mt: 1 }}>
                    {/* Name & Verification Badges */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.75 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          fontSize: { xs: '1.75rem', sm: '2.25rem' },
                          letterSpacing: '-0.025em',
                          color: '#0f172a',
                          lineHeight: 1.2,
                        }}
                      >
                        {candidate.firstName} {candidate.lastName}
                      </Typography>

                      {candidate.excelMember && (
                        <Chip
                          size="medium"
                          label="EXCEL MEMBER"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: '#ffffff',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                          }}
                        />
                      )}

                      {candidate.verifiedBadge && (
                        <Chip
                          icon={<Verified sx={{ fontSize: '1.1rem !important', color: '#ffffff !important' }} />}
                          size="medium"
                          label="Verified"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: '#ffffff',
                            bgcolor: '#10b981',
                          }}
                        />
                      )}

                      {candidate.aadhaarVerified && (
                        <Chip
                          icon={<Verified sx={{ fontSize: '1.1rem !important' }} />}
                          size="medium"
                          variant="outlined"
                          label="Aadhaar Verified"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: '#0c5283',
                            borderColor: 'rgba(12, 82, 131, 0.4)',
                            bgcolor: 'rgba(12, 82, 131, 0.06)',
                          }}
                        />
                      )}
                    </Box>

                    {/* Title & Organization */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '1.15rem', sm: '1.3rem' },
                          color: '#1e293b',
                        }}
                      >
                        {candidate.currentJobTitle || 'Specialized Professional'}
                      </Typography>

                      {candidate.organizationName && (
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            fontSize: '1.05rem',
                            color: '#64748b',
                          }}
                        >
                          at {candidate.organizationName}
                        </Typography>
                      )}
                    </Box>

                    {/* Metadata Pills */}
                    <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      <Chip
                        icon={<LocationOn sx={{ fontSize: '1.1rem !important', color: '#0c5283 !important' }} />}
                        label={candidate.currentLocation || 'Location unspecified'}
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(241, 245, 249, 0.95)',
                          color: '#334155',
                          border: '1px solid rgba(226, 232, 240, 0.9)',
                          py: 0.5,
                        }}
                      />
                      <Chip
                        icon={<Work sx={{ fontSize: '1.1rem !important', color: '#0ab6a2 !important' }} />}
                        label={candidate.employmentType || 'Full-time'}
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(241, 245, 249, 0.95)',
                          color: '#334155',
                          border: '1px solid rgba(226, 232, 240, 0.9)',
                          py: 0.5,
                        }}
                      />
                      {candidate.gender && (
                        <Chip
                          icon={<Person sx={{ fontSize: '1.1rem !important', color: '#64748b !important' }} />}
                          label={candidate.gender}
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(241, 245, 249, 0.95)',
                            color: '#334155',
                            border: '1px solid rgba(226, 232, 240, 0.9)',
                            py: 0.5,
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* MAIN CONTENT COLUMN (Left 8 Cols) */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={3.5}>
                {/* 1. Profile Summary Card */}
                {candidate.profileSummary && (
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'rgba(226, 232, 240, 0.8)',
                      background: '#ffffff',
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2.5,
                            bgcolor: 'rgba(12, 82, 131, 0.08)',
                            color: '#0c5283',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Stars fontSize="medium" />
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}
                          >
                            About & Executive Summary
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Overview of professional background and value proposition
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          bgcolor: 'rgba(248, 250, 252, 0.8)',
                          borderLeft: '4px solid #0ab6a2',
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '1.025rem',
                            lineHeight: 1.8,
                            color: '#334155',
                            fontWeight: 450,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {candidate.profileSummary}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* 2. Skills & Competencies Card */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'rgba(226, 232, 240, 0.8)',
                    background: '#ffffff',
                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        mb: 2.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2.5,
                            bgcolor: 'rgba(10, 182, 162, 0.1)',
                            color: '#0ab6a2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Psychology fontSize="medium" />
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}
                          >
                            Core Skills & Competencies
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Technical abilities and domain expertise
                          </Typography>
                        </Box>
                      </Box>

                      {candidate.skills.length > 0 && (
                        <Chip
                          label={`${candidate.skills.length} Skills Listed`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: '#0c5283',
                            bgcolor: 'rgba(12, 82, 131, 0.08)',
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                      {candidate.skills.length > 0 ? (
                        candidate.skills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.925rem',
                              py: 2.2,
                              px: 1,
                              borderRadius: 2.5,
                              color: '#0c5283',
                              bgcolor: 'rgba(12, 82, 131, 0.06)',
                              border: '1px solid',
                              borderColor: 'rgba(12, 82, 131, 0.15)',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(10, 182, 162, 0.15)',
                                borderColor: '#0ab6a2',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 10px rgba(10, 182, 162, 0.18)',
                              },
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
                          No specific skills highlighted yet.
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* 3. Work Experience Timeline Card */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'rgba(226, 232, 240, 0.8)',
                    background: '#ffffff',
                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(12, 82, 131, 0.08)',
                          color: '#0c5283',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <WorkHistory fontSize="medium" />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}
                        >
                          Work Experience
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Career milestones, roles, and demonstrated contributions
                        </Typography>
                      </Box>
                    </Box>

                    {candidate.experiences.length === 0 ||
                    candidate.experiences.every((e) => !e.jobTitle && !e.organizationName) ? (
                      <Box
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          borderRadius: 3,
                          bgcolor: 'rgba(248, 250, 252, 0.8)',
                          border: '1px dashed',
                          borderColor: 'rgba(203, 213, 225, 0.8)',
                        }}
                      >
                        <WorkHistory sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          No prior experience records provided.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ pl: { xs: 1, sm: 2 } }}>
                        {candidate.experiences.map((exp, idx) => {
                          const isLast = idx === candidate.experiences.length - 1;
                          return (
                            <Box key={idx} sx={{ display: 'flex', gap: 2.5 }}>
                              {/* Left Milestone Node & Connector Line */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    bgcolor: '#ffffff',
                                    border: '3px solid #0c5283',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(12, 82, 131, 0.25)',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      bgcolor: '#0ab6a2',
                                    }}
                                  />
                                </Box>
                                {!isLast && (
                                  <Box
                                    sx={{
                                      width: 2,
                                      flexGrow: 1,
                                      my: 1,
                                      bgcolor: 'rgba(12, 82, 131, 0.15)',
                                      minHeight: 40,
                                    }}
                                  />
                                )}
                              </Box>

                              {/* Experience Content Box */}
                              <Box
                                sx={{
                                  flex: 1,
                                  pb: isLast ? 0 : 3.5,
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    bgcolor: 'rgba(248, 250, 252, 0.9)',
                                    border: '1px solid',
                                    borderColor: 'rgba(226, 232, 240, 0.9)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: '#ffffff',
                                      boxShadow: '0 6px 18px rgba(12, 82, 131, 0.08)',
                                      borderColor: 'rgba(12, 82, 131, 0.25)',
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      flexWrap: 'wrap',
                                      gap: 1,
                                      mb: 0.75,
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: '1.15rem',
                                        color: '#0f172a',
                                      }}
                                    >
                                      {exp.jobTitle || 'Role Title Unspecified'}
                                    </Typography>

                                    <Chip
                                      icon={<CalendarMonth sx={{ fontSize: '0.95rem !important' }} />}
                                      label={`${formatDate(exp.joiningDate)} — ${
                                        exp.endDate ? formatDate(exp.endDate) : 'Present'
                                      }`}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: '0.825rem',
                                        bgcolor: '#ffffff',
                                        border: '1px solid rgba(203, 213, 225, 0.8)',
                                        color: 'text.secondary',
                                      }}
                                    />
                                  </Box>

                                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
                                    <Typography
                                      variant="body1"
                                      sx={{ fontWeight: 700, fontSize: '1rem', color: '#0c5283' }}
                                    >
                                      {exp.organizationName || 'Company Name'}
                                    </Typography>

                                    {exp.employmentType && (
                                      <Chip
                                        label={exp.employmentType}
                                        size="small"
                                        sx={{
                                          fontSize: '0.775rem',
                                          fontWeight: 600,
                                          bgcolor: 'rgba(10, 182, 162, 0.1)',
                                          color: '#0ab6a2',
                                        }}
                                      />
                                    )}
                                  </Stack>

                                  {exp.roleDescription && (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: '0.975rem',
                                        lineHeight: 1.7,
                                        color: '#475569',
                                        whiteSpace: 'pre-line',
                                      }}
                                    >
                                      {exp.roleDescription}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Education & Academics Card */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'rgba(226, 232, 240, 0.8)',
                    background: '#ffffff',
                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(12, 82, 131, 0.08)',
                          color: '#0c5283',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <School fontSize="medium" />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}
                        >
                          Education & Academic Qualifications
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Degrees, specialization, grades, and coursework
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow icon={<School />} label="Degree" value={candidate.degree} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow icon={<School />} label="Education Level" value={candidate.educationLevel} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow icon={<Stars />} label="Specialization" value={candidate.specialization} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow icon={<Work />} label="Course Type" value={candidate.courseType} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow
                          icon={<CalendarMonth />}
                          label="Course Start Date"
                          value={formatDate(candidate.courseStartDate)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow
                          icon={<CalendarMonth />}
                          label="Course End Date"
                          value={formatDate(candidate.courseEndDate)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow icon={<Grade />} label="Grade / Score" value={candidate.grade} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <InfoRow
                          icon={<LocationOn />}
                          label="Institution Location"
                          value={[candidate.educationCity, candidate.educationCountry].filter(Boolean).join(', ')}
                        />
                      </Grid>
                      {candidate.additionalDetails && (
                        <Grid size={{ xs: 12 }}>
                          <InfoRow
                            icon={<Description />}
                            label="Additional Academic Details"
                            value={candidate.additionalDetails}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* STICKY SIDEBAR COLUMN (Right 4 Cols) */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
                <Stack spacing={3.5}>
                  {/* 1. Contact & Identity Card */}
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'rgba(226, 232, 240, 0.8)',
                      background: '#ffffff',
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: 'rgba(12, 82, 131, 0.08)',
                            color: '#0c5283',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Email fontSize="small" />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}
                        >
                          Contact Information
                        </Typography>
                      </Box>

                      {isLocked ? (
                        <Box
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            borderRadius: 3,
                            bgcolor: 'rgba(248, 250, 252, 0.8)',
                            border: '1px dashed rgba(217, 119, 6, 0.4)',
                          }}
                        >
                          <LockOpen sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                            Contact Details Hidden
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                            Unlock this candidate's profile to view their direct email address and phone number.
                          </Typography>
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            onClick={handleUnlock}
                            disabled={isUnlocking}
                            sx={{ fontWeight: 800, borderRadius: 2 }}
                          >
                            {isUnlocking ? 'Unlocking…' : 'Unlock (1 Credit)'}
                          </Button>
                        </Box>
                      ) : (
                        <Stack spacing={1.5}>
                          <InfoRow
                            icon={<Email fontSize="small" />}
                            label="Email Address"
                            value={candidate.email}
                            onCopy={() => copyToClipboard(candidate.email || '', 'email')}
                            isCopied={copiedKey === 'email'}
                          />
                          <InfoRow
                            icon={<Phone fontSize="small" />}
                            label="Phone Number"
                            value={candidate.phone}
                            onCopy={() => copyToClipboard(candidate.phone || '', 'phone')}
                            isCopied={copiedKey === 'phone'}
                          />
                          <InfoRow
                            icon={<LocationOn fontSize="small" />}
                            label="Full Address"
                            value={[candidate.address, candidate.city, candidate.pincode].filter(Boolean).join(', ')}
                          />
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {/* 2. Compensation & Role Details Card */}
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'rgba(226, 232, 240, 0.8)',
                      background: '#ffffff',
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: 'rgba(10, 182, 162, 0.1)',
                            color: '#0ab6a2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Work fontSize="small" />
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}
                        >
                          Current Role & Salary
                        </Typography>
                      </Box>

                      <Stack spacing={1.5}>
                        <InfoRow
                          icon={<Work fontSize="small" />}
                          label="Current Designation"
                          value={candidate.currentJobTitle}
                        />
                        <InfoRow
                          icon={<Business fontSize="small" />}
                          label="Current Company"
                          value={candidate.organizationName}
                        />
                        <InfoRow
                          icon={<BadgeIcon fontSize="small" />}
                          label="Current Compensation"
                          value={
                            candidate.currentSalary
                              ? `${candidate.currentSalary} ${candidate.salaryFormat || ''}`.trim()
                              : 'Not disclosed'
                          }
                        />
                      </Stack>

                      <Divider sx={{ my: 2.5, borderColor: 'rgba(226, 232, 240, 0.8)' }} />

                      {/* Preferred Locations */}
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                          mb: 1.25,
                        }}
                      >
                        Preferred Work Locations
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
                        {candidate.preferredLocations.length > 0 ? (
                          candidate.preferredLocations.map((loc) => (
                            <Chip
                              key={loc}
                              label={loc}
                              size="medium"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                bgcolor: 'rgba(241, 245, 249, 0.85)',
                                border: '1px solid rgba(203, 213, 225, 0.7)',
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Open to all locations
                          </Typography>
                        )}
                      </Box>

                      {/* Certifications & Licenses */}
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                          mb: 1.25,
                        }}
                      >
                        Certifications & Accreditations
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: candidate.professionalLicenses ? 2 : 0 }}>
                        {candidate.certifications.length > 0 ? (
                          candidate.certifications.map((cert) => (
                            <Chip
                              key={cert}
                              label={cert}
                              size="medium"
                              variant="outlined"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: '#0c5283',
                                borderColor: 'rgba(12, 82, 131, 0.3)',
                                bgcolor: 'rgba(12, 82, 131, 0.04)',
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            None listed
                          </Typography>
                        )}
                      </Box>

                      {candidate.professionalLicenses && (
                        <Box sx={{ mt: 2 }}>
                          <InfoRow
                            icon={<BadgeIcon fontSize="small" />}
                            label="Professional Licenses"
                            value={candidate.professionalLicenses}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Decision Dialog for Accept / Reject */}
      <ApplicationDecisionDialog
        decision={decision}
        applicationId={application?._id ?? ''}
        candidateName={candidateFullName}
        currentStatus={application?.status}
        onClose={() => setDecision(null)}
        onDone={setDecisionMessage}
      />

      {/* Candidate Resume Preview Modal */}
      <CandidateResumePreviewModal
        open={previewOpen}
        onClose={handleClosePreview}
        candidateName={candidateFullName}
        htmlContent={resumeHtml}
        isLoading={isFetchingResume && !resumeHtml && !resumeFile && !resumeError}
        loadError={resumeError}
        fileUrl={resumeFile?.url}
        fileName={resumeFile?.name}
        fileMimeType={resumeFile?.mimeType}
      />
    </Box>
  );
};

export default EmployerEmployeeView;
