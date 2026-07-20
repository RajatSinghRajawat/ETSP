import { useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AttachMoney,
  Badge,
  BookmarkBorder,
  Business,
  BusinessCenter,
  CardMembership,
  Category,
  CheckCircle,
  Construction,
  Description,
  EmojiEvents,
  Email,
  Event,
  EventAvailable,
  Grade,
  Home,
  HourglassEmpty,
  Image,
  LocationCity,
  LocationOn,
  MenuBook,
  MyLocation,
  Notes,
  Payments,
  Person,
  Phone,
  Pin,
  Public,
  Save,
  School,
  Science,
  VerifiedUser,
  Wc,
  Work,
  WorkHistory,
  WorkOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import AutoApplyCard from '../../components/common/AutoApplyCard';
import ExcelMembershipCard from '../../components/common/ExcelMembershipCard';
import SubscriptionCard from '../../components/common/SubscriptionCard';
import { PageHeader } from '../../components/common/PageHeader';
import type { CandidateExperience, CandidateProfileForm } from '../../data/profileData';
import {
  useGetMyCandidateProfileQuery,
  useUpdateMyCandidateProfileMutation,
  type CandidateProfileResponse,
} from '../../store/api/candidateProfileApi';
import { useGetMyApplicationsQuery, type ApplicationStatus } from '../../store/api/applicationApi';

type CandidateEditableProfile = CandidateProfileForm & {
  experiencesText: string;
};

type FieldDef = {
  key: keyof CandidateProfileForm;
  label: string;
  icon: ReactNode;
  multiline?: boolean;
  disabled?: boolean;
};

type SectionDef = {
  title: string;
  caption: string;
  icon: ReactNode;
  color: string;
  fields: FieldDef[];
};

const sections: SectionDef[] = [
  {
    title: 'Personal Information',
    caption: 'Your basic identity & contact details',
    icon: <Person />,
    color: '#0c5283',
    fields: [
      { key: 'firstName', label: 'First Name', icon: <Badge /> },
      { key: 'lastName', label: 'Last Name', icon: <Badge /> },
      { key: 'email', label: 'Email', icon: <Email />, disabled: true },
      { key: 'phone', label: 'Phone Number', icon: <Phone />, disabled: true },
      { key: 'gender', label: 'Gender', icon: <Wc /> },
      { key: 'photoUrl', label: 'Photo URL', icon: <Image /> },
    ],
  },
  {
    title: 'Location',
    caption: 'Where you are and where you want to work',
    icon: <LocationOn />,
    color: '#0ab6a2',
    fields: [
      { key: 'address', label: 'Address', icon: <Home /> },
      { key: 'city', label: 'City', icon: <LocationCity /> },
      { key: 'pincode', label: 'Pincode', icon: <Pin /> },
      { key: 'currentLocation', label: 'Current Location', icon: <MyLocation /> },
    ],
  },
  {
    title: 'Professional Details',
    caption: 'Your current role and compensation',
    icon: <WorkOutlined />,
    color: '#7c3aed',
    fields: [
      { key: 'currentJobTitle', label: 'Current Job Title', icon: <Work /> },
      { key: 'employmentType', label: 'Employment Type', icon: <BusinessCenter /> },
      { key: 'organizationName', label: 'Organization Name', icon: <Business /> },
      { key: 'currentSalary', label: 'Current Salary', icon: <AttachMoney /> },
      { key: 'salaryFormat', label: 'Salary Format', icon: <Payments /> },
      { key: 'profileSummary', label: 'Profile Summary', icon: <Description />, multiline: true },
    ],
  },
  {
    title: 'Education',
    caption: 'Your academic background',
    icon: <School />,
    color: '#d97706',
    fields: [
      { key: 'educationLevel', label: 'Education Level', icon: <School /> },
      { key: 'degree', label: 'Degree', icon: <MenuBook /> },
      { key: 'specialization', label: 'Specialization', icon: <Science /> },
      { key: 'courseType', label: 'Course Type', icon: <Category /> },
      { key: 'courseStartDate', label: 'Course Start Date', icon: <Event /> },
      { key: 'courseEndDate', label: 'Course End Date', icon: <EventAvailable /> },
      { key: 'grade', label: 'Grade', icon: <Grade /> },
      { key: 'educationCountry', label: 'Education Country', icon: <Public /> },
      { key: 'educationCity', label: 'Education City', icon: <LocationCity /> },
    ],
  },
  {
    title: 'Licenses & Additional',
    caption: 'Professional credentials and extra notes',
    icon: <VerifiedUser />,
    color: '#0891b2',
    fields: [
      { key: 'professionalLicenses', label: 'Professional Licenses', icon: <VerifiedUser /> },
      { key: 'additionalDetails', label: 'Additional Details', icon: <Notes />, multiline: true },
    ],
  },
];

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
    const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];
    return validationMessages[0] ?? data?.message ?? fallback;
  }

  return fallback;
};

const formatAppliedDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusColor: Record<ApplicationStatus, 'info' | 'warning' | 'success' | 'error'> = {
  new: 'info',
  reviewing: 'warning',
  shortlisted: 'success',
  rejected: 'error',
  hired: 'success',
};

const toCsv = (items: string[]) => items.join(', ');

const fromCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildCandidateDraft = (profile: CandidateProfileResponse): CandidateEditableProfile => ({
  ...profile,
  experiencesText: JSON.stringify(profile.experiences ?? [], null, 2),
});

// Shared modern input styling — rounded, soft surface, teal focus ring.
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fff',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'rgba(12,82,131,0.16)' },
    '&:hover fieldset': { borderColor: 'rgba(12,82,131,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#0ab6a2', borderWidth: 2 },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(10,182,162,0.10)' },
    '&.Mui-disabled': { bgcolor: 'rgba(12,82,131,0.04)' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0ab6a2' },
};

const sectionCardSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'rgba(12,82,131,0.10)',
  boxShadow: '0 8px 30px -18px rgba(12,82,131,0.35)',
  mb: 3,
};

const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetMyCandidateProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyCandidateProfileMutation();
  const [draftEdits, setDraftEdits] = useState<Partial<CandidateEditableProfile>>({});
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const profile = data?.data;
  const draft = profile ? { ...buildCandidateDraft(profile), ...draftEdits } : null;
  const candidateName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Candidate';
  const candidateRole = profile?.currentJobTitle || 'Candidate';

  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    isError: isApplicationsError,
  } = useGetMyApplicationsQuery();
  const applications = applicationsData?.data.items ?? [];

  const countByStatus = (statusList: ApplicationStatus[]) =>
    applications.filter((application) => statusList.includes(application.status)).length;

  const stats = [
    { label: 'Applied Jobs', value: applications.length, icon: <Work />, color: '#0c5283' },
    { label: 'Under Review', value: countByStatus(['new', 'reviewing']), icon: <HourglassEmpty />, color: '#d97706' },
    { label: 'Shortlisted', value: countByStatus(['shortlisted']), icon: <CheckCircle />, color: '#0ab6a2' },
    { label: 'Hired', value: countByStatus(['hired']), icon: <EmojiEvents />, color: '#10b981' },
  ];

  const updateField = <K extends keyof CandidateEditableProfile>(field: K, value: CandidateEditableProfile[K]) => {
    setDraftEdits((current) => ({ ...current, [field]: value }));
    setSaveMessage('');
    setSaveError('');
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }

    let experiences: CandidateExperience[];
    try {
      experiences = JSON.parse(draft.experiencesText) as CandidateExperience[];
      if (!Array.isArray(experiences)) {
        throw new Error('Experiences must be an array');
      }
    } catch {
      setSaveError('Experiences must be valid JSON array data.');
      return;
    }

    const {
      email,
      phone,
      experiencesText,
      ...editableProfile
    } = draft;

    void email;
    void phone;
    void experiencesText;

    try {
      await updateProfile({
        ...editableProfile,
        experiences,
      }).unwrap();
      setDraftEdits({});
      setSaveMessage('Candidate profile updated successfully.');
    } catch (updateError) {
      setSaveError(getApiErrorMessage(updateError, 'Unable to update candidate profile.'));
    }
  };

  const renderField = (field: FieldDef) => (
    <Grid size={{ xs: 12, md: field.multiline ? 12 : 6 }} key={field.key}>
      <TextField
        fullWidth
        disabled={field.disabled}
        label={field.label}
        multiline={field.multiline}
        minRows={field.multiline ? 3 : undefined}
        value={(draft?.[field.key] as string) ?? ''}
        onChange={(event) => updateField(field.key, event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment
                position="start"
                sx={{ alignSelf: field.multiline ? 'flex-start' : 'center', mt: field.multiline ? 1.5 : 0, color: '#0c5283', '& svg': { fontSize: 20 } }}
              >
                {field.icon}
              </InputAdornment>
            ),
          },
        }}
        sx={fieldSx}
      />
    </Grid>
  );

  const csvField = (
    key: 'preferredLocations' | 'skills' | 'certifications',
    label: string,
    icon: ReactNode,
  ) => (
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label={label}
        helperText="Comma separated"
        value={draft ? toCsv(draft[key]) : ''}
        onChange={(event) => updateField(key, fromCsv(event.target.value))}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ color: '#0c5283', '& svg': { fontSize: 20 } }}>
                {icon}
              </InputAdornment>
            ),
          },
        }}
        sx={fieldSx}
      />
    </Grid>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="candidate" userName={candidateName} userRole={candidateRole} />

      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: '#f4f8fc' }}>
        <PageHeader title="Dashboard" subtitle={`Welcome back, ${candidateName}. Manage your profile and job activity.`} />

        {/* Plan & usage */}
        <Box sx={{ mb: 3 }}>
          <SubscriptionCard />
        </Box>

        {/* EXCEL membership features */}
        <Box sx={{ mb: 3 }}>
          <ExcelMembershipCard />
        </Box>

        {/* AI auto apply */}
        <Box sx={{ mb: 4 }}>
          <AutoApplyCard />
        </Box>

        {/* Stat cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'rgba(12,82,131,0.10)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 18px 36px -18px rgba(12,82,131,0.45)' },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -24,
                    right: -24,
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    bgcolor: `${stat.color}12`,
                  }}
                />
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, position: 'relative' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}b3 100%)`,
                      boxShadow: `0 8px 20px -8px ${stat.color}`,
                      '& svg': { fontSize: 28 },
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                      {isLoadingApplications ? '—' : stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {getApiErrorMessage(error, 'Unable to load candidate profile.')}
          </Alert>
        )}

        {draft && (
          <>
            {/* Profile header banner */}
            <Card elevation={0} sx={{ ...sectionCardSx, overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'relative',
                  p: { xs: 3, md: 4 },
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexWrap: 'wrap',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -20,
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.10)',
                  }}
                />
                <Avatar
                  src={draft.photoUrl || undefined}
                  sx={{
                    width: 84,
                    height: 84,
                    fontSize: 34,
                    fontWeight: 800,
                    bgcolor: 'rgba(255,255,255,0.22)',
                    border: '3px solid rgba(255,255,255,0.6)',
                  }}
                >
                  {candidateName.charAt(0)}
                </Avatar>
                <Box sx={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {candidateName}
                  </Typography>
                  <Typography sx={{ opacity: 0.9, fontWeight: 500 }}>{candidateRole}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                    {profile?.email && (
                      <Chip
                        icon={<Email sx={{ color: '#fff !important', fontSize: 16 }} />}
                        label={profile.email}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600 }}
                      />
                    )}
                    {profile?.currentLocation && (
                      <Chip
                        icon={<LocationOn sx={{ color: '#fff !important', fontSize: 16 }} />}
                        label={profile.currentLocation}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600 }}
                      />
                    )}
                  </Stack>
                </Box>
                <Stack direction={{ xs: 'row', md: 'column' }} spacing={1.5} sx={{ position: 'relative' }}>
                  <Button
                    startIcon={<Person />}
                    variant="contained"
                    onClick={() => navigate('/candidate/profile')}
                    sx={{
                      bgcolor: '#fff',
                      color: '#0c5283',
                      fontWeight: 700,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      px: 2.5,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                    }}
                  >
                    Open Full Builder
                  </Button>
                  <Button
                    startIcon={<BookmarkBorder />}
                    variant="outlined"
                    onClick={() => navigate('/candidate/saved-jobs')}
                    sx={{
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.6)',
                      fontWeight: 700,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      px: 2.5,
                      '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
                    }}
                  >
                    Saved Jobs
                  </Button>
                </Stack>
              </Box>
            </Card>

            {saveMessage && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{saveMessage}</Alert>}
            {saveError && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{saveError}</Alert>}

            {/* Profile sections */}
            {sections.map((section) => (
              <Card elevation={0} sx={sectionCardSx} key={section.title}>
                <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: section.color,
                        bgcolor: `${section.color}14`,
                        '& svg': { fontSize: 24 },
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {section.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {section.caption}
                      </Typography>
                    </Box>
                  </Stack>
                  <Grid container spacing={2.5}>
                    {section.fields.map(renderField)}
                  </Grid>
                </CardContent>
              </Card>
            ))}

            {/* Skills & Preferences */}
            <Card elevation={0} sx={sectionCardSx}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0ab6a2',
                      bgcolor: 'rgba(10,182,162,0.12)',
                      '& svg': { fontSize: 24 },
                    }}
                  >
                    <Construction />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Skills & Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Help us match you with the right roles
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={2.5}>
                  {csvField('preferredLocations', 'Preferred Locations', <LocationOn />)}
                  {csvField('skills', 'Skills', <Construction />)}
                  {csvField('certifications', 'Certifications', <CardMembership />)}
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={6}
                      label="Job Experiences"
                      helperText="JSON array format"
                      value={draft.experiencesText}
                      onChange={(event) => updateField('experiencesText', event.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5, color: '#0c5283', '& svg': { fontSize: 20 } }}>
                              <WorkHistory />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save />}
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{
                      px: 4,
                      py: 1.3,
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                      boxShadow: '0 10px 25px -8px rgba(12,82,131,0.45)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 14px 30px -8px rgba(12,82,131,0.55)',
                        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                      },
                    }}
                  >
                    {isSaving ? 'Saving' : 'Save Profile'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        )}

        {/* Recent Applications */}
        <Card elevation={0} sx={sectionCardSx}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0c5283',
                    bgcolor: 'rgba(12,82,131,0.10)',
                    '& svg': { fontSize: 24 },
                  }}
                >
                  <WorkHistory />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Recent Applications
                </Typography>
              </Stack>
              <Button
                size="small"
                startIcon={<Work />}
                onClick={() => navigate('/find-job')}
                sx={{ fontWeight: 700, textTransform: 'none', color: '#0ab6a2' }}
              >
                Find Jobs
              </Button>
            </Box>

            {isLoadingApplications && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {isApplicationsError && !isLoadingApplications && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>Unable to load your applications.</Alert>
            )}

            {!isLoadingApplications && !isApplicationsError && applications.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <Work sx={{ fontSize: 40, opacity: 0.4, mb: 1 }} />
                <Typography sx={{ fontWeight: 700 }}>No applications yet</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Apply to jobs and track their status here.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/find-job')}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  }}
                >
                  Browse Jobs
                </Button>
              </Box>
            )}

            {!isLoadingApplications && !isApplicationsError && applications.length > 0 && (
              <List sx={{ py: 0 }}>
                {applications.map((application) => (
                  <ListItem
                    key={application._id}
                    sx={{
                      borderRadius: 3,
                      mb: 1.5,
                      px: 2,
                      py: 1.5,
                      border: '1px solid',
                      borderColor: 'rgba(12,82,131,0.10)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#0ab6a2', bgcolor: 'rgba(10,182,162,0.04)', transform: 'translateX(4px)' },
                    }}
                    onClick={() => navigate(`/jobs/${application.job._id}`)}
                    secondaryAction={
                      <Chip
                        label={application.status}
                        color={statusColor[application.status]}
                        size="small"
                        sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                      />
                    }
                  >
                    <Avatar sx={{ mr: 2, fontWeight: 800, background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)' }}>
                      {application.job.companyName.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: 700 }}>{application.job.title}</Typography>}
                      secondary={`${application.job.companyName} · ${application.job.location} · Applied ${formatAppliedDate(application.createdAt)}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CandidateDashboard;
