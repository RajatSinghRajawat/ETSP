import { useEffect, useMemo, useState, lazy, Suspense } from 'react';

const ResumeBuilderModal = lazy(() => import('../../components/common/ResumeBuilderModal'));
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
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  type StepIconProps,
} from '@mui/material';
import {
  Add,
  AutoAwesome,
  AutoFixHigh,
  Badge as BadgeIcon,
  Business,
  CalendarMonth,
  CheckCircle,
  Description,
  Email,
  EmojiEvents,
  Home,
  LocationCity,
  LocationOn,
  MonetizationOn,
  Person,
  PersonOutlined,
  Phone,
  PhotoCamera,
  PinDrop,
  Public,
  School,
  Shield,
  TrendingUp,
  Verified,
  Wc,
  Work,
  WorkOutlined,
  WorkspacePremium,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import {
  candidateLocationSuggestions,
  candidateSkillSuggestions,
  defaultCandidateProfile,
  type CandidateExperience,
  type CandidateProfileForm,
} from '../../data/profileData';
import {
  useCreateCandidateProfileMutation,
  useGetMyCandidateProfileQuery,
  useUpdateMyCandidateProfileMutation,
  useUploadCandidateProfileImageMutation,
  type CandidateProfileResponse,
} from '../../store/api/candidateProfileApi';

interface CandidateProfileCreateProps {
  showSidebar?: boolean;
}

const STORAGE_KEY = 'ets-candidate-profile-draft';
const steps = ['Personal Information', 'Professional Information', 'Education', 'Preview'];
const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];
const employmentTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary'];
const salaryFormatOptions = ['per annum', 'per month', 'per week', 'per day', 'per hour'];

const stepMeta: Array<{ label: string; icon: React.ReactNode; description: string; color: string }> = [
  {
    label: 'Personal Information',
    icon: <PersonOutlined />,
    description: 'Tell employers who you are, where to reach you and where you would like to work.',
    color: '#0c5283',
  },
  {
    label: 'Professional Information',
    icon: <WorkOutlined />,
    description: 'Share your current role, skills and the experience that defines your practice.',
    color: '#0ab6a2',
  },
  {
    label: 'Education',
    icon: <School />,
    description: 'Add your degrees, specializations and any professional licenses you hold.',
    color: '#7c3aed',
  },
  {
    label: 'Preview',
    icon: <Verified />,
    description: 'Review every detail before submitting your profile to employers.',
    color: '#f59e0b',
  },
];

// Single sx applied to the form Paper — themes every TextField/Select inside the form
// without having to touch each component individually.
const modernFormSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    transition: 'all 0.2s ease',
    bgcolor: '#fff',
    '& fieldset': { borderColor: 'rgba(12,82,131,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(10,182,162,0.6)' },
    '&.Mui-focused fieldset': { borderColor: '#0ab6a2', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': { color: '#0ab6a2' },
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#0c5283',
    fontSize: 20,
  },
} as const;

const adornment = (icon: React.ReactNode) => ({
  input: {
    startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
  },
});

const ColoredStepIcon: React.FC<StepIconProps> = ({ active, completed, icon }) => {
  const index = Number(icon) - 1;
  const meta = stepMeta[index];
  const baseColor = meta?.color ?? '#0c5283';

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: completed
          ? 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)'
          : active
            ? `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}cc 100%)`
            : 'rgba(12,82,131,0.08)',
        color: completed || active ? '#fff' : 'rgba(12,82,131,0.45)',
        boxShadow: active || completed ? `0 8px 18px -6px ${baseColor}88` : 'none',
        transition: 'all 0.3s ease',
        '& svg': { fontSize: 20 },
      }}
    >
      {completed ? <CheckCircle sx={{ fontSize: 22 }} /> : meta?.icon}
    </Box>
  );
};

const getMonthDifference = (joiningDate: string, endDate: string) => {
  if (!joiningDate) {
    return 0;
  }

  const start = new Date(joiningDate);
  const end = endDate ? new Date(endDate) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1,
  );
};

const createEmptyExperience = (): CandidateExperience => ({
  jobTitle: '',
  employmentType: '',
  organizationName: '',
  joiningDate: '',
  endDate: '',
  roleDescription: '',
});

const mapServerProfileToForm = (profile: CandidateProfileResponse): CandidateProfileForm => ({
  firstName: profile.firstName ?? '',
  lastName: profile.lastName ?? '',
  email: profile.email ?? '',
  phone: profile.phone ?? '',
  address: profile.address ?? '',
  city: profile.city ?? '',
  pincode: profile.pincode ?? '',
  currentLocation: profile.currentLocation ?? '',
  gender: profile.gender ?? '',
  aadhaarVerified: Boolean(profile.aadhaarVerified),
  preferredLocations: Array.isArray(profile.preferredLocations) ? profile.preferredLocations : [],
  profileSummary: profile.profileSummary ?? '',
  photoUrl: profile.photoUrl ?? '',
  degree: profile.degree ?? '',
  educationLevel: profile.educationLevel ?? '',
  specialization: profile.specialization ?? '',
  courseType: profile.courseType ?? '',
  courseStartDate: profile.courseStartDate ?? '',
  courseEndDate: profile.courseEndDate ?? '',
  grade: profile.grade ?? '',
  educationCountry: profile.educationCountry || 'India',
  educationCity: profile.educationCity ?? '',
  additionalDetails: profile.additionalDetails ?? '',
  certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
  professionalLicenses: profile.professionalLicenses ?? '',
  currentJobTitle: profile.currentJobTitle ?? '',
  employmentType: profile.employmentType ?? '',
  organizationName: profile.organizationName ?? '',
  currentSalary: profile.currentSalary ?? '',
  salaryFormat: profile.salaryFormat || 'per annum',
  skills: Array.isArray(profile.skills) ? profile.skills : [],
  experiences:
    Array.isArray(profile.experiences) && profile.experiences.length > 0
      ? profile.experiences.map((experience) => ({ ...createEmptyExperience(), ...experience }))
      : [createEmptyExperience()],
});

const CandidateProfileCreate: React.FC<CandidateProfileCreateProps> = ({ showSidebar = false }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [preferredLocationInput, setPreferredLocationInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'submitted'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState('');
  const [createCandidateProfile, { isLoading: isCreating }] = useCreateCandidateProfileMutation();
  const [updateMyCandidateProfile, { isLoading: isUpdating }] = useUpdateMyCandidateProfileMutation();
  const [uploadCandidateProfileImage, { isLoading: isUploadingImage }] = useUploadCandidateProfileImageMutation();
  const isSubmitting = isCreating || isUpdating;
  const {
    data: myProfileResponse,
    isLoading: isLoadingProfile,
    isFetching: isFetchingProfile,
    error: profileLoadError,
  } = useGetMyCandidateProfileQuery(undefined, { skip: !showSidebar });
  const existingProfile = myProfileResponse?.data;
  const hasExistingProfile = Boolean(existingProfile?._id);
  const [hasHydratedFromServer, setHasHydratedFromServer] = useState(false);
  const [hasResetForNotFound, setHasResetForNotFound] = useState(false);
  const [formData, setFormData] = useState<CandidateProfileForm>(() => {
    // When the page is shown inside the authenticated sidebar shell, we always wait
    // for the server's /me response before populating the form. Otherwise stale
    // localStorage drafts from a different account or a deleted profile would leak in.
    if (showSidebar) {
      return defaultCandidateProfile;
    }

    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (!savedDraft) {
      return defaultCandidateProfile;
    }

    try {
      return {
        ...defaultCandidateProfile,
        ...JSON.parse(savedDraft),
      } as CandidateProfileForm;
    } catch {
      return defaultCandidateProfile;
    }
  });

  const profileLoadStatus =
    profileLoadError && typeof profileLoadError === 'object' && 'status' in profileLoadError
      ? (profileLoadError as { status?: number }).status
      : undefined;
  const showProfileLoadError = Boolean(profileLoadError) && profileLoadStatus !== 404;

  useEffect(() => {
    if (!hasHydratedFromServer && existingProfile) {
      setFormData(mapServerProfileToForm(existingProfile));
      setHasHydratedFromServer(true);
    }
  }, [existingProfile, hasHydratedFromServer]);

  useEffect(() => {
    if (!showSidebar || hasResetForNotFound) {
      return;
    }
    if (profileLoadError && profileLoadStatus === 404) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData(defaultCandidateProfile);
      setHasResetForNotFound(true);
    }
  }, [profileLoadError, profileLoadStatus, showSidebar, hasResetForNotFound]);

  useEffect(() => {
    if (showSidebar && !hasHydratedFromServer && !hasResetForNotFound) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, hasHydratedFromServer, hasResetForNotFound, showSidebar]);

  useEffect(() => {
    return () => {
      if (profileImagePreviewUrl) {
        URL.revokeObjectURL(profileImagePreviewUrl);
      }
    };
  }, [profileImagePreviewUrl]);

  useEffect(() => {
    const handleFillEvent = (event: Event) => {
      const detail = (event as CustomEvent<Partial<CandidateProfileForm>>).detail;
      if (!detail || typeof detail !== 'object') {
        return;
      }
      setFormData((previous) => {
        const next: CandidateProfileForm = { ...previous };
        (Object.keys(detail) as Array<keyof CandidateProfileForm>).forEach((key) => {
          const value = detail[key];
          if (value === undefined || value === null) return;
          if (Array.isArray(value) && value.length === 0) return;
          if (typeof value === 'string' && value.trim() === '') return;
          // @ts-expect-error narrowed at runtime
          next[key] = value;
        });
        return next;
      });
      setActiveStep(0);
    };
    window.addEventListener('candidate-profile:ai-fill', handleFillEvent);
    return () => window.removeEventListener('candidate-profile:ai-fill', handleFillEvent);
  }, []);

  const totalExperienceMonths = useMemo(
    () =>
      formData.experiences.reduce(
        (total, experience) => total + getMonthDifference(experience.joiningDate, experience.endDate),
        0,
      ),
    [formData.experiences],
  );

  const totalExperienceLabel = useMemo(() => {
    const years = Math.floor(totalExperienceMonths / 12);
    const months = totalExperienceMonths % 12;

    if (years === 0 && months === 0) {
      return 'Add experience to calculate';
    }

    if (years === 0) {
      return `${months} month${months === 1 ? '' : 's'}`;
    }

    if (months === 0) {
      return `${years} year${years === 1 ? '' : 's'}`;
    }

    return `${years}y ${months}m`;
  }, [totalExperienceMonths]);

  const generatedSummary = useMemo(() => {
    const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
    const profileName = fullName || 'This candidate';
    const skillText = formData.skills.length > 0 ? formData.skills.slice(0, 3).join(', ') : 'core veterinary care';
    const locationText = formData.currentLocation || formData.city || 'multiple locations';
    const experienceText = totalExperienceMonths > 0 ? totalExperienceLabel : 'growing hands-on exposure';
    const roleText = formData.currentJobTitle || 'veterinary professional';

    return `${profileName} is a ${roleText} with ${experienceText} in ${skillText}. Currently based in ${locationText}, this profile is aligned for roles that value practical case handling, patient care and strong communication with employers and pet owners.`;
  }, [
    formData.city,
    formData.currentJobTitle,
    formData.currentLocation,
    formData.firstName,
    formData.lastName,
    formData.skills,
    totalExperienceLabel,
    totalExperienceMonths,
  ]);

  const completionScore = useMemo(() => {
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.currentLocation,
      formData.currentJobTitle,
      formData.organizationName,
      formData.educationLevel,
      formData.degree,
    ];

    const locationScore = formData.preferredLocations.length > 0 ? 1 : 0;
    const skillScore = formData.skills.length > 0 ? 1 : 0;
    const summaryScore = formData.profileSummary.trim() ? 1 : 0;

    const completed = requiredFields.filter(Boolean).length + locationScore + skillScore + summaryScore;
    return Math.round((completed / (requiredFields.length + 3)) * 100);
  }, [formData]);

  const updateField = <K extends keyof CandidateProfileForm>(field: K, value: CandidateProfileForm[K]) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
    setSaveState('idle');
    setSubmitError('');
  };

  const handleExperienceChange = (
    index: number,
    field: keyof CandidateExperience,
    value: CandidateExperience[keyof CandidateExperience],
  ) => {
    setFormData((previous) => ({
      ...previous,
      experiences: previous.experiences.map((experience, experienceIndex) =>
        experienceIndex === index ? { ...experience, [field]: value } : experience,
      ),
    }));
    setSaveState('idle');
    setSubmitError('');
  };

  const addPreferredLocation = (value: string) => {
    const nextLocation = value.trim();
    if (!nextLocation || formData.preferredLocations.includes(nextLocation) || formData.preferredLocations.length >= 3) {
      return;
    }

    updateField('preferredLocations', [...formData.preferredLocations, nextLocation]);
    setPreferredLocationInput('');
  };

  const addSkill = (value: string) => {
    const nextSkill = value.trim();
    if (!nextSkill || formData.skills.includes(nextSkill) || formData.skills.length >= 5) {
      return;
    }

    updateField('skills', [...formData.skills, nextSkill]);
    setSkillInput('');
  };

  const addCertification = () => {
    const nextCertification = certificationInput.trim();
    if (!nextCertification || formData.certifications.includes(nextCertification)) {
      return;
    }

    updateField('certifications', [...formData.certifications, nextCertification]);
    setCertificationInput('');
  };

  const saveProfile = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setSaveState('saved');
    setSubmitError('');
  };

  const getApiErrorMessage = (error: unknown) => {
    if (typeof error === 'object' && error && 'data' in error) {
      const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
      const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];

      if (validationMessages.length > 0) {
        return validationMessages.join(' ');
      }

      return data?.message ?? 'Unable to submit candidate profile.';
    }

    if (typeof error === 'object' && error && 'error' in error) {
      return String((error as { error?: string }).error);
    }

    return 'Unable to submit candidate profile.';
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = '';

    if (!image) {
      return;
    }

    setImageUploadError('');
    const nextPreviewUrl = URL.createObjectURL(image);
    setProfileImagePreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });

    try {
      const response = await uploadCandidateProfileImage(image).unwrap();
      updateField('photoUrl', response.data.url);
      setProfileImagePreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        return '';
      });
    } catch (error) {
      setImageUploadError(getApiErrorMessage(error));
    }
  };

  const submitProfile = async () => {
    setSubmitError('');

    try {
      if (hasExistingProfile) {
        const { email: _omitEmail, phone: _omitPhone, ...updatable } = formData;
        void _omitEmail;
        void _omitPhone;
        await updateMyCandidateProfile(updatable).unwrap();
      } else {
        await createCandidateProfile({
          ...formData,
          status: 'submitted',
        }).unwrap();
      }

      localStorage.removeItem(STORAGE_KEY);
      setSaveState('submitted');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  const headerTitle = showSidebar ? 'Candidate Profile' : 'Create Your Candidate Profile';
  const headerSubtitle = showSidebar
    ? 'Keep your profile current so employers can evaluate and contact you faster.'
    : 'Complete your public-ready profile with personal, professional and education details.';
  const candidateName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim() || 'Candidate';
  const candidateRole = formData.currentJobTitle || 'Professional';
  const profileImageUrl = profileImagePreviewUrl || formData.photoUrl;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {showSidebar && <Sidebar type="candidate" userName={candidateName} userRole={candidateRole} />}

      <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
        <PageHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          breadcrumbs={
            showSidebar
              ? [
                  { label: 'Candidate', path: '/candidate/dashboard' },
                  { label: 'Profile' },
                ]
              : [
                  { label: 'Signup', path: '/signup' },
                  { label: 'Candidate Profile' },
                ]
          }
          action={
            <Button
              variant="contained"
              startIcon={<AutoFixHigh />}
              onClick={() => setResumeOpen(true)}
              sx={{ bgcolor: '#0ab6a2', '&:hover': { bgcolor: '#089e8c' }, fontWeight: 700 }}
            >
              Build Resume
            </Button>
          }
        />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              accent="#0c5283"
              icon={<TrendingUp />}
              label="Profile Strength"
              value={`${completionScore}%`}
              caption="Completion improves employer visibility and CV quality."
              progress={completionScore}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              accent="#0ab6a2"
              icon={<WorkspacePremium />}
              label="Total Experience"
              value={totalExperienceLabel}
              caption="Calculated automatically from your experience entries."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              accent={formData.aadhaarVerified ? '#10b981' : '#f59e0b'}
              icon={<Shield />}
              label="Profile Visibility"
              value={formData.aadhaarVerified ? 'Verified' : 'Standard'}
              caption="Verified profiles can be highlighted for employer trust."
            />
          </Grid>
        </Grid>

        {showSidebar && (isLoadingProfile || isFetchingProfile) && !hasHydratedFromServer && (
          <Alert sx={{ mb: 3 }} severity="info" icon={<CircularProgress size={18} />}>
            Loading your saved profile...
          </Alert>
        )}
        {showSidebar && hasHydratedFromServer && (
          <Alert sx={{ mb: 3 }} severity="info" icon={<CheckCircle fontSize="inherit" />}>
            Existing profile loaded. Update the details and click "Save Changes" to keep them current.
          </Alert>
        )}
        {showProfileLoadError && (
          <Alert sx={{ mb: 3 }} severity="warning">
            Could not load your saved profile. You can still edit and submit details below.
          </Alert>
        )}
        {saveState === 'saved' && (
          <Alert sx={{ mb: 3 }} icon={<CheckCircle fontSize="inherit" />} severity="success">
            Candidate profile draft saved locally. You can continue editing or open your dashboard.
          </Alert>
        )}
        {saveState === 'submitted' && (
          <Alert sx={{ mb: 3 }} icon={<CheckCircle fontSize="inherit" />} severity="success">
            {hasExistingProfile
              ? 'Candidate profile updated successfully.'
              : 'Candidate profile submitted successfully.'}
          </Alert>
        )}
        {submitError && (
          <Alert sx={{ mb: 3 }} severity="error">
            {submitError}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            border: '1px solid rgba(12,82,131,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 20px 50px -25px rgba(12,82,131,0.2)',
            ...modernFormSx,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              color: 'white',
              background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                right: -60,
                top: -60,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              }}
            />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'relative' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': { fontSize: 26 },
                }}
              >
                <BadgeIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                  Candidate profile builder
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                  Personal information, professional history, education and preview before submission.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                mb: 4,
                '& .MuiStepConnector-line': {
                  borderColor: 'rgba(12,82,131,0.15)',
                  borderTopWidth: 2,
                },
                '& .MuiStepLabel-label': {
                  fontWeight: 600,
                  fontSize: 13,
                  mt: 1,
                  '&.Mui-active': { color: '#0c5283' },
                  '&.Mui-completed': { color: '#0ab6a2' },
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel slots={{ stepIcon: ColoredStepIcon }}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {stepMeta[activeStep] && (
              <Box
                sx={{
                  mb: 3.5,
                  px: 2.5,
                  py: 2,
                  borderRadius: 3,
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  background: `linear-gradient(135deg, ${stepMeta[activeStep].color}10 0%, ${stepMeta[activeStep].color}05 100%)`,
                  border: `1px solid ${stepMeta[activeStep].color}25`,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${stepMeta[activeStep].color} 0%, ${stepMeta[activeStep].color}cc 100%)`,
                    color: '#fff',
                    boxShadow: `0 8px 16px -6px ${stepMeta[activeStep].color}66`,
                  }}
                >
                  {stepMeta[activeStep].icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, color: stepMeta[activeStep].color }}
                  >
                    {stepMeta[activeStep].label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stepMeta[activeStep].description}
                  </Typography>
                </Box>
                <Chip
                  label={`Step ${activeStep + 1} / ${steps.length}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: `${stepMeta[activeStep].color}15`,
                    color: stepMeta[activeStep].color,
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                />
              </Box>
            )}

            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.firstName}
                        onChange={(event) => updateField('firstName', event.target.value)}
                        slotProps={adornment(<Person />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(event) => updateField('lastName', event.target.value)}
                        slotProps={adornment(<Person />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        slotProps={adornment(<Email />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Contact Number"
                        value={formData.phone}
                        onChange={(event) => updateField('phone', event.target.value)}
                        slotProps={adornment(<Phone />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Current Location"
                        value={formData.currentLocation}
                        onChange={(event) => updateField('currentLocation', event.target.value)}
                        slotProps={adornment(<LocationOn />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Gender"
                        value={formData.gender}
                        onChange={(event) => updateField('gender', event.target.value)}
                        slotProps={adornment(<Wc />)}
                      >
                        {genderOptions.map((gender) => (
                          <MenuItem key={gender} value={gender}>
                            {gender}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={formData.address}
                        onChange={(event) => updateField('address', event.target.value)}
                        slotProps={adornment(<Home />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="City"
                        value={formData.city}
                        onChange={(event) => updateField('city', event.target.value)}
                        slotProps={adornment(<LocationCity />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Pincode"
                        value={formData.pincode}
                        onChange={(event) => updateField('pincode', event.target.value)}
                        slotProps={adornment(<PinDrop />)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent>
                          <Grid container spacing={2.5} alignItems="center">
                            <Grid size={{ xs: 12, sm: 5 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  aspectRatio: '4 / 3',
                                  borderRadius: 3,
                                  border: '1px dashed',
                                  borderColor: profileImageUrl ? 'divider' : 'primary.light',
                                  bgcolor: 'action.hover',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {profileImageUrl ? (
                                  <img
                                    src={profileImageUrl}
                                    alt="Profile Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                ) : (
                                  <Stack alignItems="center" spacing={1}>
                                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                                      {candidateName.charAt(0)}
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                      Image preview
                                    </Typography>
                                  </Stack>
                                )}
                              </Box>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 7 }}>
                              <Stack spacing={1.5} alignItems="flex-start">
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Profile Image
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Upload JPG, PNG, or WEBP image up to 2MB. The preview updates after upload.
                                  </Typography>
                                </Box>
                                {imageUploadError && (
                                  <Typography variant="body2" color="error">
                                    {imageUploadError}
                                  </Typography>
                                )}
                                {formData.photoUrl && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ wordBreak: 'break-all' }}
                                  >
                                    {formData.photoUrl}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                  <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={isUploadingImage ? <CircularProgress size={18} /> : <PhotoCamera />}
                                    disabled={isUploadingImage}
                                  >
                                    {isUploadingImage ? 'Uploading' : profileImageUrl ? 'Change Image' : 'Upload Image'}
                                    <input
                                      hidden
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={handleProfileImageChange}
                                    />
                                  </Button>
                                  {profileImageUrl && (
                                    <Button
                                      variant="text"
                                      color="error"
                                      onClick={() => {
                                        updateField('photoUrl', '');
                                        setProfileImagePreviewUrl((currentPreviewUrl) => {
                                          if (currentPreviewUrl) {
                                            URL.revokeObjectURL(currentPreviewUrl);
                                          }

                                          return '';
                                        });
                                        setImageUploadError('');
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </Box>
                              </Stack>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Preferred Job Locations
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Add city"
                          value={preferredLocationInput}
                          onChange={(event) => setPreferredLocationInput(event.target.value)}
                        />
                        <Button
                          variant="contained"
                          onClick={() => addPreferredLocation(preferredLocationInput)}
                          disabled={formData.preferredLocations.length >= 3}
                        >
                          <Add />
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {formData.preferredLocations.map((location) => (
                          <Chip
                            key={location}
                            label={location}
                            onDelete={() =>
                              updateField(
                                'preferredLocations',
                                formData.preferredLocations.filter((item) => item !== location),
                              )
                            }
                          />
                        ))}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {candidateLocationSuggestions.map((location) => (
                          <Chip
                            key={location}
                            label={location}
                            variant="outlined"
                            onClick={() => addPreferredLocation(location)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        Verification Preference
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Aadhaar verification is optional, but it adds a trust badge to the public profile.
                      </Typography>
                      <Button
                        variant={formData.aadhaarVerified ? 'contained' : 'outlined'}
                        onClick={() => updateField('aadhaarVerified', !formData.aadhaarVerified)}
                        fullWidth
                      >
                        {formData.aadhaarVerified ? 'Verified profile enabled' : 'Mark as Aadhaar verified'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Current Job Title"
                    value={formData.currentJobTitle}
                    onChange={(event) => updateField('currentJobTitle', event.target.value)}
                    slotProps={adornment(<Work />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Employment Type"
                    value={formData.employmentType}
                    onChange={(event) => updateField('employmentType', event.target.value)}
                    slotProps={adornment(<WorkOutlined />)}
                  >
                    {employmentTypeOptions.map((employmentType) => (
                      <MenuItem key={employmentType} value={employmentType}>
                        {employmentType}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Organization Name"
                    value={formData.organizationName}
                    onChange={(event) => updateField('organizationName', event.target.value)}
                    slotProps={adornment(<Business />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Current Salary"
                    value={formData.currentSalary}
                    onChange={(event) => updateField('currentSalary', event.target.value)}
                    slotProps={adornment(<MonetizationOn />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    select
                    label="Salary Format"
                    value={formData.salaryFormat}
                    onChange={(event) => updateField('salaryFormat', event.target.value)}
                    slotProps={adornment(<CalendarMonth />)}
                  >
                    {salaryFormatOptions.map((salaryFormat) => (
                      <MenuItem key={salaryFormat} value={salaryFormat}>
                        {salaryFormat}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Skills
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Maximum 5 skills
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Add custom skill"
                          value={skillInput}
                          onChange={(event) => setSkillInput(event.target.value)}
                        />
                        <Button
                          variant="contained"
                          onClick={() => addSkill(skillInput)}
                          disabled={formData.skills.length >= 5}
                        >
                          <Add />
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {formData.skills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            color="primary"
                            onDelete={() => updateField('skills', formData.skills.filter((item) => item !== skill))}
                          />
                        ))}
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {candidateSkillSuggestions.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            variant="outlined"
                            onClick={() => addSkill(skill)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Job Experience
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => updateField('experiences', [...formData.experiences, createEmptyExperience()])}
                        >
                          Add Experience
                        </Button>
                      </Box>
                      <Grid container spacing={2}>
                        {formData.experiences.map((experience, index) => (
                          <Grid size={{ xs: 12 }} key={`experience-${index}`}>
                            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                Experience {index + 1}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <TextField
                                    fullWidth
                                    label="Job Title"
                                    value={experience.jobTitle}
                                    onChange={(event) => handleExperienceChange(index, 'jobTitle', event.target.value)}
                                  />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                  <TextField
                                    fullWidth
                                    label="Organization Name"
                                    value={experience.organizationName}
                                    onChange={(event) =>
                                      handleExperienceChange(index, 'organizationName', event.target.value)
                                    }
                                  />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <TextField
                                    fullWidth
                                    select
                                    label="Employment Type"
                                    value={experience.employmentType}
                                    onChange={(event) =>
                                      handleExperienceChange(index, 'employmentType', event.target.value)
                                    }
                                  >
                                    {employmentTypeOptions.map((employmentType) => (
                                      <MenuItem key={employmentType} value={employmentType}>
                                        {employmentType}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <TextField
                                    fullWidth
                                    type="date"
                                    label="Joining Date"
                                    value={experience.joiningDate}
                                    onChange={(event) => handleExperienceChange(index, 'joiningDate', event.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                  />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <TextField
                                    fullWidth
                                    type="date"
                                    label="End Date"
                                    value={experience.endDate}
                                    onChange={(event) => handleExperienceChange(index, 'endDate', event.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                  />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    label="Role Description"
                                    value={experience.roleDescription}
                                    onChange={(event) =>
                                      handleExperienceChange(index, 'roleDescription', event.target.value)
                                    }
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Level of Education"
                    value={formData.educationLevel}
                    onChange={(event) => updateField('educationLevel', event.target.value)}
                    slotProps={adornment(<School />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Degree"
                    value={formData.degree}
                    onChange={(event) => updateField('degree', event.target.value)}
                    slotProps={adornment(<EmojiEvents />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    value={formData.specialization}
                    onChange={(event) => updateField('specialization', event.target.value)}
                    slotProps={adornment(<WorkspacePremium />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Course Type"
                    value={formData.courseType}
                    onChange={(event) => updateField('courseType', event.target.value)}
                    slotProps={adornment(<Description />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Course Start Date"
                    value={formData.courseStartDate}
                    onChange={(event) => updateField('courseStartDate', event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Course End Date"
                    value={formData.courseEndDate}
                    onChange={(event) => updateField('courseEndDate', event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Percentage / Grade"
                    value={formData.grade}
                    onChange={(event) => updateField('grade', event.target.value)}
                    slotProps={adornment(<TrendingUp />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.educationCountry}
                    onChange={(event) => updateField('educationCountry', event.target.value)}
                    slotProps={adornment(<Public />)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.educationCity}
                    onChange={(event) => updateField('educationCity', event.target.value)}
                    slotProps={adornment(<LocationCity />)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Additional Details"
                    value={formData.additionalDetails}
                    onChange={(event) => updateField('additionalDetails', event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Profile Summary / About
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<AutoAwesome />}
                          onClick={() => updateField('profileSummary', generatedSummary)}
                        >
                          Generate summary
                        </Button>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="About Section"
                        value={formData.profileSummary}
                        onChange={(event) => updateField('profileSummary', event.target.value)}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Certifications
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Add certification"
                          value={certificationInput}
                          onChange={(event) => setCertificationInput(event.target.value)}
                        />
                        <Button variant="contained" onClick={addCertification}>
                          <Add />
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {formData.certifications.map((certification) => (
                          <Chip
                            key={certification}
                            label={certification}
                            onDelete={() =>
                              updateField(
                                'certifications',
                                formData.certifications.filter((item) => item !== certification),
                              )
                            }
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Professional Licenses
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={5}
                        label="Licenses"
                        placeholder="Mention registration numbers, councils or practice licenses"
                        value={formData.professionalLicenses}
                        onChange={(event) => updateField('professionalLicenses', event.target.value)}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeStep === 3 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>
                        Build Your Veterinary Resume with AI
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                        Generate a professional, beautifully designed resume from your profile in seconds.
                        You can preview, edit, and download it.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AutoFixHigh />}
                      onClick={() => setResumeOpen(true)}
                      sx={{
                        bgcolor: 'white',
                        color: '#0c5283',
                        fontWeight: 700,
                        flexShrink: 0,
                        '&:hover': { bgcolor: '#f0f0f0' },
                      }}
                    >
                      Build Resume
                    </Button>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar
                          src={profileImageUrl || undefined}
                          sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
                        >
                          {candidateName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {candidateName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formData.currentJobTitle || 'Profile role pending'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {formData.profileSummary || generatedSummary}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="primary" />
                        {formData.currentLocation || 'Current location pending'}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Work fontSize="small" color="primary" />
                        {totalExperienceLabel}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description fontSize="small" color="primary" />
                        CV export ready after admin approval
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                        Profile Preview
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Skills
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                        {formData.skills.map((skill) => (
                          <Chip key={skill} label={skill} color="primary" variant="outlined" />
                        ))}
                      </Box>

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Experience Snapshot
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
                        {formData.experiences
                          .filter((experience) => experience.jobTitle || experience.organizationName)
                          .map((experience, index) => (
                            <Paper key={`${experience.jobTitle}-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {experience.jobTitle || 'Role title pending'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {experience.organizationName || 'Organization pending'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {experience.roleDescription || 'Role description pending'}
                              </Typography>
                            </Paper>
                          ))}
                      </Box>

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Education
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {[formData.degree, formData.specialization].filter(Boolean).join(' - ') || 'Education details pending'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[formData.educationLevel, formData.educationCity, formData.educationCountry].filter(Boolean).join(' • ')}
                        </Typography>
                      </Paper>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4, flexWrap: 'wrap' }}>
              <Button variant="outlined" disabled={activeStep === 0} onClick={() => setActiveStep((step) => step - 1)}>
                Previous
              </Button>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={saveProfile}>
                  Save Draft
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button variant="contained" onClick={() => setActiveStep((step) => step + 1)}>
                    Continue
                  </Button>
                ) : (
                  <>
                    <Button variant="contained" onClick={submitProfile} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                          {hasExistingProfile ? 'Saving' : 'Submitting'}
                        </>
                      ) : hasExistingProfile ? (
                        'Save Changes'
                      ) : (
                        'Submit Profile'
                      )}
                    </Button>
                    <Button variant="text" onClick={() => navigate('/candidate/dashboard')}>
                      Open Dashboard
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Suspense fallback={null}>
        <ResumeBuilderModal
          open={resumeOpen}
          onClose={() => setResumeOpen(false)}
          candidateName={candidateName}
        />
      </Suspense>
    </Box>
  );
};

interface StatCardProps {
  accent: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
  progress?: number;
}

const StatCard: React.FC<StatCardProps> = ({ accent, icon, label, value, caption, progress }) => (
  <Card
    elevation={0}
    sx={{
      position: 'relative',
      borderRadius: 3,
      height: '100%',
      overflow: 'hidden',
      border: `1px solid ${accent}25`,
      background: `linear-gradient(135deg, ${accent}10 0%, ${accent}03 100%)`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `0 18px 36px -16px ${accent}55`,
      },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 130,
        height: 130,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, ${accent}00 70%)`,
        pointerEvents: 'none',
      }}
    />
    <CardContent sx={{ position: 'relative', p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
            color: '#fff',
            boxShadow: `0 8px 18px -6px ${accent}66`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.6 }}
          >
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: accent, lineHeight: 1.2, mt: 0.2 }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: progress !== undefined ? 1.5 : 0 }}>
        {caption}
      </Typography>
      {progress !== undefined && (
        <Box
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: `${accent}15`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              background: `linear-gradient(90deg, ${accent} 0%, ${accent}aa 100%)`,
              borderRadius: 3,
              transition: 'width 0.6s ease',
            }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

export default CandidateProfileCreate;
