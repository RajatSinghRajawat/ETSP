import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Badge,
  ChatBubbleOutlineOutlined as ChatBubbleOutline,
  CalendarMonth,
  Email,
  LocationOn,
  LockOpen,
  Phone,
  PictureAsPdf,
  School,
  Verified,
  Work,
  WorkHistory,
} from '@mui/icons-material';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import CandidateResumePreviewModal from '../../components/common/CandidateResumePreviewModal';
import {
  useGetCandidateProfileQuery,
  useUnlockCandidateMutation,
} from '../../store/api/candidateProfileApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import { useGetCandidateResumeMutation } from '../../store/api/resumeApi';
import { useChat } from '../../context/ChatContext';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
    <Box sx={{ color: 'primary.main', mt: 0.25 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  </Box>
);

const EmployerEmployeeView: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { startChatWith } = useChat();
  const { data: employerData } = useGetMyEmployerProfileQuery();
  const { data, isLoading, isError, refetch } = useGetCandidateProfileQuery(id, { skip: !id });
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery();
  const [unlockCandidate, { isLoading: isUnlocking }] = useUnlockCandidateMutation();
  const candidate = data?.data;
  const companyName = employerData?.data.companyName || 'Employer';
  const isLocked = Boolean(candidate?.locked);
  const chatAllowed = Boolean(usageData?.data.effectiveFeatures?.chatEnabled);

  const handleUnlock = async () => {
    if (!candidate) return;
    try {
      await unlockCandidate({ id: candidate._id }).unwrap();
      refetch();
      refetchUsage();
    } catch {
      // Plan-gate interceptor shows the buy-credits dialog on 402.
    }
  };

  const [fetchCandidateResume, { isLoading: isFetchingResume }] = useGetCandidateResumeMutation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resumeHtml, setResumeHtml] = useState('');
  const [resumeError, setResumeError] = useState('');

  const handleOpenResumePreview = async () => {
    if (!candidate || isFetchingResume) return;
    setResumeError('');
    setPreviewOpen(true);

    try {
      const response = await fetchCandidateResume(candidate._id).unwrap();
      const html = response.data?.htmlContent;
      if (!html) {
        throw new Error('No resume content was returned for this candidate.');
      }
      setResumeHtml(html);
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHeader
          title="Candidate Details"
          subtitle="Complete profile of the selected candidate."
          breadcrumbs={[
            { label: 'Employees', path: '/employer/employees' },
            { label: 'Details' },
          ]}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/employer/employees')}>
            Back to Employees
          </Button>
          {candidate && isLocked && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LockOpen />}
              disabled={isUnlocking}
              onClick={handleUnlock}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, px: 2.5, py: 1 }}
            >
              {isUnlocking ? 'Unlocking…' : 'Unlock profile (1 credit)'}
            </Button>
          )}
          {candidate && !isLocked && (
            <Stack direction="row" spacing={1.5}>
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
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 1,
                  borderColor: '#0ab6a2',
                  color: '#0c5283',
                  '&:hover': { borderColor: '#0ab6a2', bgcolor: 'rgba(10,182,162,0.08)' },
                }}
              >
                Message
              </Button>
              )}
              <Button
                variant="contained"
                startIcon={
                  isFetchingResume && !previewOpen ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PictureAsPdf />
                  )
                }
                onClick={handleOpenResumePreview}
                disabled={isFetchingResume && !previewOpen}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 1,
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  boxShadow: '0 10px 20px -8px rgba(12,82,131,0.45)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 14px 26px -8px rgba(12,82,131,0.55)',
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(12,82,131,0.5)',
                    color: '#fff',
                    opacity: 0.85,
                  },
                }}
              >
                {isFetchingResume && !previewOpen ? 'Loading resume…' : 'View Resume'}
              </Button>
            </Stack>
          )}
        </Stack>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        )}
        {isError && <Alert severity="error">Unable to load candidate details.</Alert>}
        {!isLoading && !isError && !candidate && <Alert severity="info">Candidate not found.</Alert>}

        {candidate && (
          <Grid container spacing={3}>
            {isLocked && (
              <Grid size={{ xs: 12 }}>
                <Alert
                  severity="warning"
                  sx={{ borderRadius: 2.5 }}
                  action={
                    <Button color="inherit" size="small" disabled={isUnlocking} onClick={handleUnlock}>
                      {isUnlocking ? 'Unlocking…' : 'Unlock (1 credit)'}
                    </Button>
                  }
                >
                  This profile is locked — the name, contact details, photo and resume are hidden.
                  Spend 1 unlock credit to reveal the full profile.
                </Alert>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Avatar src={candidate.photoUrl || undefined} sx={{ width: 96, height: 96, bgcolor: 'primary.main', fontSize: 32 }}>
                      {isLocked ? <LockOpen /> : candidate.firstName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {candidate.firstName} {candidate.lastName}
                        </Typography>
                        {candidate.excelMember && <Chip size="small" color="warning" label="EXCEL" sx={{ fontWeight: 700 }} />}
                        {candidate.verifiedBadge && <Chip icon={<Verified />} size="small" color="success" label="Verified" />}
                        {candidate.aadhaarVerified && <Chip icon={<Verified />} size="small" color="success" variant="outlined" label="Aadhaar Verified" />}
                      </Box>
                      <Typography variant="body1" color="text.secondary">{candidate.currentJobTitle || '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">{candidate.organizationName || '—'}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" icon={<LocationOn />} label={candidate.currentLocation || '—'} />
                        <Chip size="small" icon={<Work />} label={candidate.employmentType || '—'} />
                        {candidate.gender && <Chip size="small" label={candidate.gender} />}
                      </Stack>
                    </Box>
                  </Box>
                  {candidate.profileSummary && (
                    <>
                      <Divider sx={{ my: 2.5 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Profile Summary</Typography>
                      <Typography variant="body2" color="text.secondary">{candidate.profileSummary}</Typography>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {candidate.skills.length > 0
                      ? candidate.skills.map((skill) => <Chip key={skill} label={skill} color="primary" variant="outlined" />)
                      : <Typography variant="body2" color="text.secondary">No skills added.</Typography>}
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Education</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<School />} label="Degree" value={candidate.degree} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<School />} label="Education Level" value={candidate.educationLevel} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<School />} label="Specialization" value={candidate.specialization} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<School />} label="Course Type" value={candidate.courseType} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<CalendarMonth />} label="Course Start" value={formatDate(candidate.courseStartDate)} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<CalendarMonth />} label="Course End" value={formatDate(candidate.courseEndDate)} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<School />} label="Grade" value={candidate.grade} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={<LocationOn />} label="Education Location" value={[candidate.educationCity, candidate.educationCountry].filter(Boolean).join(', ')} /></Grid>
                    {candidate.additionalDetails && (
                      <Grid size={{ xs: 12 }}><InfoRow icon={<School />} label="Additional Details" value={candidate.additionalDetails} /></Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Work Experience</Typography>
                  {candidate.experiences.length === 0 || candidate.experiences.every((e) => !e.jobTitle && !e.organizationName) ? (
                    <Typography variant="body2" color="text.secondary">No experience added.</Typography>
                  ) : (
                    <Stack spacing={2}>
                      {candidate.experiences.map((exp, idx) => (
                        <Box key={idx} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{exp.jobTitle || '—'}</Typography>
                          <Typography variant="body2" color="text.secondary">{exp.organizationName || '—'} • {exp.employmentType || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(exp.joiningDate)} — {formatDate(exp.endDate)}</Typography>
                          {exp.roleDescription && <Typography variant="body2" sx={{ mt: 1 }}>{exp.roleDescription}</Typography>}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3, position: 'sticky', top: 24 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Contact</Typography>
                  <Stack spacing={1.5}>
                    <InfoRow icon={<Email fontSize="small" />} label="Email" value={candidate.email} />
                    <InfoRow icon={<Phone fontSize="small" />} label="Phone" value={candidate.phone} />
                    <InfoRow icon={<LocationOn fontSize="small" />} label="Address" value={[candidate.address, candidate.city, candidate.pincode].filter(Boolean).join(', ')} />
                  </Stack>
                  <Divider sx={{ my: 2.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Current Role</Typography>
                  <Stack spacing={1.5}>
                    <InfoRow icon={<Work fontSize="small" />} label="Job Title" value={candidate.currentJobTitle} />
                    <InfoRow icon={<WorkHistory fontSize="small" />} label="Organization" value={candidate.organizationName} />
                    <InfoRow icon={<Badge fontSize="small" />} label="Salary" value={candidate.currentSalary ? `${candidate.currentSalary} ${candidate.salaryFormat || ''}`.trim() : ''} />
                  </Stack>
                  <Divider sx={{ my: 2.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Preferred Locations</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                    {candidate.preferredLocations.length > 0
                      ? candidate.preferredLocations.map((loc) => <Chip key={loc} label={loc} size="small" />)
                      : <Typography variant="body2" color="text.secondary">—</Typography>}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>Certifications</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                    {candidate.certifications.length > 0
                      ? candidate.certifications.map((cert) => <Chip key={cert} label={cert} size="small" variant="outlined" />)
                      : <Typography variant="body2" color="text.secondary">—</Typography>}
                  </Box>
                  {candidate.professionalLicenses && (
                    <InfoRow icon={<Badge fontSize="small" />} label="Professional Licenses" value={candidate.professionalLicenses} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      <CandidateResumePreviewModal
        open={previewOpen}
        onClose={handleClosePreview}
        candidateName={candidateFullName}
        htmlContent={resumeHtml}
        isLoading={isFetchingResume && !resumeHtml && !resumeError}
        loadError={resumeError}
      />
    </Box>
  );
};

export default EmployerEmployeeView;
