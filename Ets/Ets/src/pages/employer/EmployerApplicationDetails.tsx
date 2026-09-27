import React, { useState } from 'react';
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBackRounded,
  CheckCircleRounded,
  EventAvailableRounded,
  HighlightOffRounded,
  LocationOnOutlined,
  LockOpenRounded,
  PersonSearchRounded,
  VisibilityRounded,
  WorkOutlineRounded,
  SchoolOutlined,
  EmailOutlined,
  PhoneOutlined,
  WorkspacePremiumRounded,
  VerifiedUserRounded,
  QuestionAnswerRounded,
  ArticleOutlined,
  BusinessRounded,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import ApplicationDecisionDialog, {
  INTERVIEW_MODES,
  type DecisionKind,
} from '../../components/common/ApplicationDecisionDialog';
import {
  useGetEmployerApplicationQuery,
  useUpdateEmployerApplicationMutation,
  type ApplicationStatus,
} from '../../store/api/applicationApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useUnlockCandidateMutation } from '../../store/api/candidateProfileApi';

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string; color: string }> = [
  { value: 'new', label: 'New', color: '#0284c7' },
  { value: 'reviewing', label: 'Under Review', color: '#f59e0b' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
  { value: 'hired', label: 'Hired', color: '#8b5cf6' },
];

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
    const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];
    return validationMessages[0] ?? data?.message ?? fallback;
  }
  return fallback;
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

const EmployerApplicationDetails: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: employerData } = useGetMyEmployerProfileQuery();
  const { data, isLoading, isError, refetch } = useGetEmployerApplicationQuery(id, { skip: !id });
  const [updateApplication, { isLoading: isUpdatingStatus }] = useUpdateEmployerApplicationMutation();
  const [unlockCandidate, { isLoading: isUnlocking }] = useUnlockCandidateMutation();
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');

  const [decision, setDecision] = useState<DecisionKind | null>(null);

  const companyName = employerData?.data?.companyName || 'Employer';
  const application = data?.data;
  const isLocked = Boolean(application?.candidateProfile?.locked);
  const interview = application?.interview ?? null;

  const handleUnlock = async () => {
    if (!application) return;
    try {
      await unlockCandidate({
        id: application.candidateProfile._id,
        jobId: application.job?._id,
      }).unwrap();
      refetch();
    } catch {
      // Handled by plan-gate interceptor
    }
  };

  const openAccept = () => {
    setStatusMessage('');
    setStatusError('');
    setDecision('accept');
  };

  const openReject = () => {
    setStatusMessage('');
    setStatusError('');
    setDecision('reject');
  };

  const handleStatusChange = async (nextStatus: ApplicationStatus) => {
    if (!id) return;
    setStatusMessage('');
    setStatusError('');

    if (nextStatus === 'rejected') {
      openReject();
      return;
    }

    try {
      await updateApplication({ id, status: nextStatus }).unwrap();
      setStatusMessage('Application status updated successfully.');
    } catch (error) {
      setStatusError(getApiErrorMessage(error, 'Unable to update application status.'));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'var(--app-min-h)', bgcolor: '#f8fafc' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4.5 } }}>
        {/* Back Navigation Button */}
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/employer/applications')}
          sx={{
            mb: 3,
            borderRadius: '10px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontWeight: 700,
            textTransform: 'none',
            px: 2.2,
            py: 0.8,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' },
          }}
        >
          Back to All Applications
        </Button>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            Unable to load application details. Please check the ID or return to the applications list.
          </Alert>
        )}

        {application && (
          <Grid container spacing={3.5}>
            {/* Left Column: Candidate Dossier, Cover Letter, Q&A */}
            <Grid size={{ xs: 12, lg: 7.5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.04)',
                  mb: 3.5,
                }}
              >
                {/* Candidate Header Profile Block */}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: 3,
                    alignItems: 'flex-start',
                    mb: 3.5,
                    pb: 3.5,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <Avatar
                    src={isLocked ? undefined : application.candidateProfile.photoUrl || undefined}
                    sx={{
                      width: { xs: 68, md: 84 },
                      height: { xs: 68, md: 84 },
                      borderRadius: '16px',
                      bgcolor: isLocked ? '#e2e8f0' : 'rgba(12, 82, 131, 0.08)',
                      color: isLocked ? '#64748b' : '#0c5283',
                      fontWeight: 800,
                      fontSize: '1.8rem',
                      border: '3px solid #f8fafc',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
                      flexShrink: 0,
                    }}
                  >
                    {isLocked ? '?' : application.candidateProfile.firstName?.charAt(0) || 'C'}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          fontSize: { xs: '1.35rem', md: '1.75rem' },
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {isLocked
                          ? 'Candidate Profile (Locked)'
                          : `${application.candidateProfile.firstName} ${application.candidateProfile.lastName}`}
                      </Typography>

                      {!isLocked && application.candidateProfile.excelMember && (
                        <Chip
                          icon={<WorkspacePremiumRounded sx={{ fontSize: '14px !important', color: '#b45309 !important' }} />}
                          label="EXCEL"
                          size="small"
                          sx={{
                            bgcolor: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            height: 24,
                            borderRadius: 1,
                          }}
                        />
                      )}

                      {!isLocked && application.candidateProfile.verifiedBadge && (
                        <Chip
                          icon={<VerifiedUserRounded sx={{ fontSize: '14px !important', color: '#047857 !important' }} />}
                          label="Verified"
                          size="small"
                          sx={{
                            bgcolor: '#ecfdf5',
                            color: '#047857',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 24,
                          }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        color: '#0c5283',
                        fontWeight: 700,
                        fontSize: '1rem',
                        mb: 1.5,
                      }}
                    >
                      {application.candidateProfile.currentJobTitle || application.candidateProfile.degree || 'Veterinary Specialist'}
                    </Typography>

                    {/* Metadata chips */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, color: '#64748b', fontSize: '0.88rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <LocationOnOutlined sx={{ fontSize: 18, color: '#0c5283' }} />
                        <span>{isLocked ? 'Location Protected' : application.candidateProfile.currentLocation || 'Location not specified'}</span>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <SchoolOutlined sx={{ fontSize: 18, color: '#0ab6a2' }} />
                        <span>{application.candidateProfile.degree || 'Degree on file'}</span>
                      </Box>
                    </Box>
                  </Box>

                  {/* Primary CTA button */}
                  {isLocked ? (
                    <Button
                      variant="contained"
                      startIcon={isUnlocking ? <CircularProgress size={16} color="inherit" /> : <LockOpenRounded />}
                      disabled={isUnlocking}
                      onClick={handleUnlock}
                      sx={{
                        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: '10px',
                        px: 3,
                        py: 1.2,
                        boxShadow: '0 4px 14px rgba(12, 82, 131, 0.25)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
                        },
                      }}
                    >
                      {isUnlocking ? 'Unlocking…' : 'Unlock Contact (1 credit)'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<PersonSearchRounded />}
                      onClick={() => navigate(`/employer/employees/${application.candidateProfile._id}`)}
                      sx={{
                        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                        color: '#ffffff',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '10px',
                        px: 2.5,
                        py: 1.1,
                        boxShadow: '0 4px 14px rgba(12, 82, 131, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
                        },
                      }}
                    >
                      View Full Dossier
                    </Button>
                  )}
                </Box>

                {/* Locked Privacy Notice Banner */}
                {isLocked && (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 3.5,
                      borderRadius: '12px',
                      bgcolor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      color: '#0369a1',
                      '& .MuiAlert-icon': { color: '#0284c7' },
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.2 }}>
                      Contact Details Protected
                    </Typography>
                    <Typography variant="body2">
                      This candidate&apos;s full name, direct phone number, email address, cover letter and screening responses are protected. Unlock with 1 credit to immediately reveal direct contact channels.
                    </Typography>
                  </Alert>
                )}

                {/* Contact Coordinates (when unlocked) */}
                {!isLocked && (
                  <Box
                    sx={{
                      mb: 3.5,
                      p: 2.5,
                      borderRadius: '12px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          bgcolor: 'rgba(12, 82, 131, 0.08)',
                          color: '#0c5283',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <EmailOutlined sx={{ fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Email Address</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {application.candidateEmail || application.candidateProfile.email || 'Email available'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          bgcolor: 'rgba(10, 182, 162, 0.08)',
                          color: '#0ab6a2',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <PhoneOutlined sx={{ fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Direct Phone</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {application.candidateProfile.phone || 'Phone verified'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Skills Section */}
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                  Professional Competencies & Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3.5 }}>
                  {application.candidateProfile.skills && application.candidateProfile.skills.length > 0 ? (
                    application.candidateProfile.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        sx={{
                          bgcolor: '#f1f5f9',
                          color: '#334155',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          borderRadius: 1.5,
                          height: 30,
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specific skills listed on profile.
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3.5, borderColor: '#f1f5f9' }} />

                {/* Cover Letter Section */}
                <Box sx={{ mb: 3.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <ArticleOutlined sx={{ fontSize: 22, color: '#0c5283' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Cover Letter / Candidate Statement
                    </Typography>
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '12px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderLeft: '4px solid #0c5283',
                    }}
                  >
                    <Typography sx={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.7, fontSize: '0.94rem' }}>
                      {application.coverLetter ||
                        (isLocked ? 'Hidden — unlock candidate contact details to read cover letter.' : 'No cover letter was submitted with this application.')}
                    </Typography>
                  </Paper>
                </Box>

                {/* Screening Answers Section */}
                {(application.screeningAnswers ?? []).length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <QuestionAnswerRounded sx={{ fontSize: 22, color: '#0ab6a2' }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Screening Questions & Responses
                      </Typography>
                    </Box>

                    <Stack spacing={2}>
                      {(application.screeningAnswers ?? []).map((entry, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '12px',
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c5283', mb: 1 }}>
                            Q{index + 1}. {entry.question}
                          </Typography>
                          <Typography sx={{ whiteSpace: 'pre-line', color: '#334155', fontSize: '0.92rem' }}>
                            {isLocked ? 'Hidden — unlock candidate to view response' : entry.answer}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right Column: Stage Triage, Interview Coordination & Job Preview */}
            <Grid size={{ xs: 12, lg: 4.5 }}>
              {/* Decision Action Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.04)',
                  mb: 3.5,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', mb: 2.5 }}>
                  Triage Decision
                </Typography>

                {statusMessage && (
                  <Alert severity="success" sx={{ mb: 2.5, borderRadius: '10px' }} onClose={() => setStatusMessage('')}>
                    {statusMessage}
                  </Alert>
                )}
                {statusError && (
                  <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }} onClose={() => setStatusError('')}>
                    {statusError}
                  </Alert>
                )}

                {/* Accept / Reject Fast Buttons */}
                <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleRounded />}
                    disabled={isUpdatingStatus}
                    onClick={openAccept}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '10px',
                      py: 1.2,
                      bgcolor: '#10b981',
                      '&:hover': { bgcolor: '#059669' },
                    }}
                  >
                    Shortlist / Accept
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<HighlightOffRounded />}
                    disabled={isUpdatingStatus}
                    onClick={openReject}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '10px',
                      py: 1.2,
                      borderColor: '#fca5a5',
                      bgcolor: '#fef2f2',
                      '&:hover': { bgcolor: '#fee2e2', borderColor: '#ef4444' },
                    }}
                  >
                    Reject
                  </Button>
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, lineHeight: 1.5 }}>
                  Shortlisting prompts you to schedule an interview and send candidate instructions. Rejection requires a professional message.
                </Typography>

                <Divider sx={{ my: 2.5, borderColor: '#f1f5f9' }} />

                {/* Pipeline Stage Selector */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                  Current Stage
                </Typography>

                <FormControl fullWidth size="small" disabled={isUpdatingStatus}>
                  <Select
                    value={application.status}
                    onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                    sx={{ borderRadius: '10px', bgcolor: '#f8fafc' }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color }} />
                          <span>{opt.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Interview Information Banner */}
                {interview?.scheduledAt && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 3,
                      p: 2.5,
                      borderRadius: '12px',
                      bgcolor: '#f0fdfa',
                      border: '1px solid #ccfbf1',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0d9488', mb: 1 }}>
                      <EventAvailableRounded sx={{ fontSize: 22 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Interview Scheduled
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f766e', mb: 0.5 }}>
                      {formatDateTime(interview.scheduledAt)}
                    </Typography>
                    {interview.mode && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#115e59', fontWeight: 600 }}>
                        Mode: {INTERVIEW_MODES.find((m) => m.value === interview.mode)?.label ?? interview.mode}
                      </Typography>
                    )}
                    {interview.location && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#115e59' }}>
                        Location / Link: {interview.location}
                      </Typography>
                    )}
                  </Paper>
                )}

                {/* Employer's Last Message */}
                {application.employerMessage && (
                  <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Last Message Sent
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, fontStyle: 'italic', bgcolor: '#f8fafc', p: 1.5, borderRadius: '8px' }}>
                      &ldquo;{application.employerMessage}&rdquo;
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Applied Job Information Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <BusinessRounded sx={{ fontSize: 20, color: '#0c5283' }} />
                  <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b' }}>
                    APPLIED VACANCY
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5 }}>
                  {application.job.title}
                </Typography>

                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  {application.job.location} • {application.job.type}
                </Typography>

                <Chip
                  label={application.job.salary || 'Salary Negotiable'}
                  size="small"
                  sx={{
                    bgcolor: '#ecfdf5',
                    color: '#065f46',
                    fontWeight: 700,
                    borderRadius: '8px',
                    mb: 2.5,
                  }}
                />

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(`/jobs/${application.job._id}`)}
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#0c5283',
                    color: '#0c5283',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1,
                    '&:hover': { bgcolor: 'rgba(12, 82, 131, 0.04)' },
                  }}
                >
                  View Full Job Posting
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Decision Dialog */}
      <ApplicationDecisionDialog
        decision={decision}
        applicationId={id}
        candidateName={
          application
            ? `${application.candidateProfile.firstName} ${application.candidateProfile.lastName}`.trim()
            : undefined
        }
        currentStatus={application?.status}
        onClose={() => setDecision(null)}
        onDone={(msg) => {
          setStatusMessage(msg);
          refetch();
        }}
      />
    </Box>
  );
};

export default EmployerApplicationDetails;
