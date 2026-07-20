import { useState } from 'react';
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
  Select,
  Typography,
} from '@mui/material';
import { ArrowBack, LocationOn, LockOpen, PersonSearch, Work } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import {
  useGetEmployerApplicationQuery,
  useUpdateEmployerApplicationMutation,
  type ApplicationStatus,
} from '../../store/api/applicationApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useUnlockCandidateMutation } from '../../store/api/candidateProfileApi';

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message ?? fallback;
  }
  return fallback;
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
  const companyName = employerData?.data.companyName || 'Employer';
  const application = data?.data;
  const isLocked = Boolean(application?.candidateProfile?.locked);

  const handleUnlock = async () => {
    if (!application) return;
    try {
      await unlockCandidate({
        id: application.candidateProfile._id,
        jobId: application.job?._id,
      }).unwrap();
      refetch();
    } catch {
      // Plan-gate interceptor shows the buy-credits dialog on 402.
    }
  };

  const handleStatusChange = async (nextStatus: ApplicationStatus) => {
    if (!id) return;
    setStatusMessage('');
    setStatusError('');
    try {
      await updateApplication({ id, status: nextStatus }).unwrap();
      setStatusMessage('Application status updated successfully.');
    } catch (error) {
      setStatusError(getApiErrorMessage(error, 'Unable to update application status.'));
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHeader title="Application Details" subtitle="Review candidate profile, job context and cover letter." />
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/employer/applications')} sx={{ mb: 3 }}>
          Back to Applications
        </Button>

        {isLoading && <CircularProgress />}
        {isError && <Alert severity="error">Unable to load application.</Alert>}

        {application && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                    <Avatar
                      src={application.candidateProfile.photoUrl || undefined}
                      sx={{ width: 76, height: 76, bgcolor: 'primary.main' }}
                    >
                      {application.candidateProfile.firstName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        {application.candidateProfile.firstName} {application.candidateProfile.lastName}
                        {application.candidateProfile.excelMember && !isLocked && (
                          <Chip label="EXCEL" size="small" color="warning" sx={{ ml: 1, fontWeight: 700 }} />
                        )}
                        {application.candidateProfile.verifiedBadge && !isLocked && (
                          <Chip label="Verified" size="small" color="success" variant="outlined" sx={{ ml: 0.5, fontWeight: 700 }} />
                        )}
                      </Typography>
                      <Typography color="text.secondary">
                        {application.candidateProfile.currentJobTitle}
                      </Typography>
                      <Chip label={application.status} size="small" sx={{ mt: 1, textTransform: 'capitalize' }} />
                    </Box>
                    {isLocked ? (
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<LockOpen />}
                        disabled={isUnlocking}
                        onClick={handleUnlock}
                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, px: 2.2, py: 1 }}
                      >
                        {isUnlocking ? 'Unlocking…' : 'Unlock (1 credit)'}
                      </Button>
                    ) : (
                    <Button
                      variant="contained"
                      startIcon={<PersonSearch />}
                      onClick={() => navigate(`/employer/employees/${application.candidateProfile._id}`)}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2.5,
                        px: 2.2,
                        py: 1,
                        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                        boxShadow: '0 8px 20px -8px rgba(12,82,131,0.45)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 12px 24px -8px rgba(12,82,131,0.55)',
                        },
                      }}
                    >
                      View Profile
                    </Button>
                    )}
                  </Box>

                  {isLocked && (
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2.5 }}>
                      This candidate's name, contact details, cover letter and screening answers are
                      hidden. Unlock the profile with 1 credit to view everything.
                    </Alert>
                  )}

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn color="primary" />
                        <Typography>{application.candidateProfile.currentLocation}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work color="primary" />
                        <Typography>{application.candidateProfile.degree}</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    {application.candidateProfile.skills.map((skill) => (
                      <Chip key={skill} label={skill} variant="outlined" />
                    ))}
                  </Box>

                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Cover Letter</Typography>
                  <Typography sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                    {application.coverLetter ||
                      (isLocked ? 'Hidden — unlock the profile to read it.' : 'No cover letter was provided.')}
                  </Typography>

                  {(application.screeningAnswers ?? []).length > 0 && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                        Screening Answers
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(application.screeningAnswers ?? []).map((entry, index) => (
                          <Box key={index}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              Q{index + 1}. {entry.question}
                            </Typography>
                            <Typography sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                              {entry.answer}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Application Status</Typography>
                  {statusMessage && <Alert severity="success" sx={{ mb: 2 }}>{statusMessage}</Alert>}
                  {statusError && <Alert severity="error" sx={{ mb: 2 }}>{statusError}</Alert>}
                  <FormControl fullWidth disabled={isUpdatingStatus}>
                    <InputLabel>Hiring Stage</InputLabel>
                    <Select
                      label="Hiring Stage"
                      value={application.status}
                      onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                    {isUpdatingStatus && <CircularProgress size={14} />}
                    <Typography variant="caption" color="text.secondary">
                      Move the candidate through your hiring pipeline.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Applied Job</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{application.job.title}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>{application.job.location} - {application.job.type}</Typography>
                  <Chip label={application.job.salary || 'Salary not disclosed'} sx={{ mb: 2 }} />
                  <Typography sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                    {application.job.description}
                  </Typography>
                  <Button fullWidth variant="contained" sx={{ mt: 3 }} onClick={() => navigate(`/jobs/${application.job._id}`)}>
                    View Job
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default EmployerApplicationDetails;
