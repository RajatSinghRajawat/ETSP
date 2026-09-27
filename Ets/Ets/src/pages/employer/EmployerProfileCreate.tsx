import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
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
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  type StepIconProps,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { indiaCityOptions, filterCityOptions } from '../../data/indiaCities';
import LookupSelect from '../../components/common/LookupSelect';
import OtpVerifyControl from '../../components/common/OtpVerifyControl';
import {
  Add,
  ArrowBack,
  ArrowForward,
  Business,
  CheckCircle,
  CloudUpload,
  Delete,
  Email,
  Info,
  Language,
  OpenInNew,
  People,
  Phone,
  PhotoCamera,
  Place,
  Psychology,
  Search,
  Stars,
  TrendingUp,
  Verified,
  Visibility,
  Work,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { phoneHtmlInputProps, sanitizePhone, validatePhone } from '../../utils/phone';
import notify from '../../utils/toast';
import { Toast } from '../../components/common';
import { PageHeader } from '../../components/common/PageHeader';
import {
  modernFormSx,
  wizardActionBarSx,
  wizardPrimaryButtonSx,
  wizardSecondaryButtonSx,
} from '../profileWizardStyles';
import {
  defaultEmployerProfile,
  employerBenefitOptions,
  employerSpecialtyOptions,
  type EmployerProfileForm,
} from '../../data/profileData';
import {
  useCreateEmployerProfileMutation,
  useGetMyEmployerProfileQuery,
  useLazyPrefillEmployerProfileQuery,
  useUpdateMyEmployerProfileMutation,
  useUploadEmployerLogoMutation,
  type EmployerPrefillResponse,
} from '../../store/api/employerProfileApi';

interface EmployerProfileCreateProps {
  showSidebar?: boolean;
}

const STORAGE_KEY = 'ets-employer-profile-draft';
const steps = ['Company Identity', 'Hiring Setup', 'Preview'];

/** Per-step colour, icon and one-line brief — drives both the stepper and the
 *  banner that sits above each step's fields. */
const stepMeta: Array<{ label: string; icon: React.ReactNode; description: string; color: string }> = [
  {
    label: 'Company Identity',
    icon: <Business />,
    description: 'Tell candidates who you are, where you are based and how to reach you.',
    color: '#0c5283',
  },
  {
    label: 'Hiring Setup',
    icon: <Work />,
    description: 'Set out the roles you hire for, the benefits you offer and your hiring regions.',
    color: '#0ab6a2',
  },
  {
    label: 'Preview',
    icon: <Verified />,
    description: 'Check how your company profile reads to candidates before you submit it.',
    color: '#f59e0b',
  },
];

const ColoredStepIcon: React.FC<StepIconProps> = ({ active, completed, icon }) => {
  const meta = stepMeta[Number(icon) - 1];
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
            ? `linear-gradient(135deg, ${baseColor} 0%, ${alpha(baseColor, 0.8)} 100%)`
            : alpha('#0c5283', 0.08),
        color: completed || active ? '#fff' : alpha('#0c5283', 0.45),
        boxShadow: active || completed ? `0 8px 18px -6px ${alpha(baseColor, 0.55)}` : 'none',
        transition: 'all 0.3s ease',
        '& svg': { fontSize: 20 },
      }}
    >
      {completed ? <CheckCircle sx={{ fontSize: 22 }} /> : meta?.icon}
    </Box>
  );
};
const currentYear = new Date().getFullYear();
const foundedYearOptions = Array.from({ length: 101 }, (_, index) => String(currentYear - index));

type EmployerProfileErrors = Partial<Record<keyof EmployerProfileForm, string>>;

const getApiErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
    const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];

    if (validationMessages.length > 0) {
      return validationMessages.join(' ');
    }

    return data?.message ?? 'Unable to submit employer profile.';
  }

  return 'Unable to submit employer profile.';
};

const EmployerProfileCreate: React.FC<EmployerProfileCreateProps> = ({ showSidebar = false }) => {
  const navigate = useNavigate();
  const [createEmployerProfile, { isLoading: isSubmitting }] = useCreateEmployerProfileMutation();
  const [updateEmployerProfile, { isLoading: isUpdating }] = useUpdateMyEmployerProfileMutation();
  const [uploadEmployerLogo, { isLoading: isUploadingLogo }] = useUploadEmployerLogoMutation();
  const {
    data: myEmployerProfileData,
    isLoading: isLoadingProfile,
    isError: isProfileLoadError,
    error: profileLoadError,
  } = useGetMyEmployerProfileQuery(undefined, { skip: !showSidebar });
  const [fetchPrefill, { isFetching: isFetchingPrefill }] = useLazyPrefillEmployerProfileQuery();
  const [prefillInput, setPrefillInput] = useState('');
  const [prefillSuccess, setPrefillSuccess] = useState('');
  const [prefillError, setPrefillError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [dashboardTab, setDashboardTab] = useState(0);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'submitted'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [logoUploadError, setLogoUploadError] = useState('');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [formErrors, setFormErrors] = useState<EmployerProfileErrors>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [formData, setFormData] = useState<EmployerProfileForm>(() => {
    if (showSidebar) {
      return defaultEmployerProfile;
    }

    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (!savedDraft) {
      return defaultEmployerProfile;
    }

    try {
      return {
        ...defaultEmployerProfile,
        ...JSON.parse(savedDraft),
      } as EmployerProfileForm;
    } catch {
      return defaultEmployerProfile;
    }
  });

  useEffect(() => {
    if (showSidebar) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, showSidebar]);

  useEffect(() => {
    if (!showSidebar || !myEmployerProfileData?.data) {
      return;
    }

    const {
      _id,
      createdAt,
      updatedAt,
      openJobs,
      status,
      ...profile
    } = myEmployerProfileData.data;

    void _id;
    void createdAt;
    void updatedAt;
    void openJobs;
    void status;

    queueMicrotask(() => {
      setFormData({
        ...defaultEmployerProfile,
        ...profile,
      });
      setSaveState('idle');
      setSubmitError('');
      setFormErrors({});
      setHasUnsavedChanges(false);
    });
  }, [myEmployerProfileData, showSidebar]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const updateField = <K extends keyof EmployerProfileForm>(field: K, value: EmployerProfileForm[K]) => {
    setFormData((previous) => {
      if (field === 'email' && previous.email !== value) {
        setEmailVerified(false);
      }
      if (field === 'phoneNumber' && previous.phoneNumber !== value) {
        setPhoneVerified(false);
      }
      return { ...previous, [field]: value };
    });
    setSaveState('idle');
    setSubmitError('');
    setHasUnsavedChanges(true);
    setFormErrors((previous) => ({
      ...previous,
      [field]: '',
    }));
  };

  const profileStrength = useMemo(() => {
    const requiredFields = [
      formData.companyName,
      formData.firstName,
      formData.lastName,
      formData.phoneNumber,
      formData.email,
      formData.organizationType,
      formData.teamSize,
      formData.headquarters,
      formData.overview,
    ];

    const enhancementScore =
      (formData.logoUrl ? 1 : 0) +
      (formData.specialties.length > 0 ? 1 : 0) +
      (formData.benefits.length > 0 ? 1 : 0) +
      (formData.hiringRegions.length > 0 ? 1 : 0);

    const completed = requiredFields.filter(Boolean).length + enhancementScore;
    return Math.round((completed / (requiredFields.length + 4)) * 100);
  }, [formData]);

  const missingChecklist = useMemo(() => {
    const items: string[] = [];
    if (!formData.logoUrl) items.push('Add company logo');
    if (!formData.website) items.push('Add company website');
    if (formData.specialties.length === 0) items.push('Highlight veterinary specialties');
    if (formData.benefits.length === 0) items.push('List perks & employee benefits');
    if (formData.hiringRegions.length === 0) items.push('Specify hiring regions');
    return items;
  }, [formData]);

  const addChipValue = (field: 'specialties' | 'benefits' | 'hiringRegions', value: string, limit?: number) => {
    const normalized = value.trim();
    if (!normalized || formData[field].includes(normalized)) {
      return;
    }
    if (limit && formData[field].length >= limit) {
      return;
    }

    updateField(field, [...formData[field], normalized]);
  };

  const saveProfile = async () => {
    if (showSidebar) {
      await submitProfile();
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setSaveState('saved');
    notify.success('Draft saved successfully.');
  };

  const validateProfile = (step?: number) => {
    const nextErrors: EmployerProfileErrors = {};
    const requiredFields: Array<keyof EmployerProfileForm> = [
      'companyName',
      'organizationType',
      'firstName',
      'lastName',
      'phoneNumber',
      'email',
      'teamSize',
      'headquarters',
      'overview',
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (typeof value === 'string' && !value.trim()) {
        nextErrors[field] = 'This field is required';
      }
    });

    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) {
      nextErrors.phoneNumber = phoneError;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!showSidebar) {
      if (!nextErrors.email && !emailVerified) {
        nextErrors.email = 'Verify your email address to continue';
      }

      if (!nextErrors.phoneNumber && !phoneVerified) {
        nextErrors.phoneNumber = 'Verify your phone number to continue';
      }
    }

    if (formData.foundedYear && !/^\d{4}$/.test(formData.foundedYear)) {
      nextErrors.foundedYear = 'Select a valid year';
    }

    if (formData.activeJobs && !/^\d+$/.test(formData.activeJobs)) {
      nextErrors.activeJobs = 'Only numbers are allowed';
    }

    if (formData.website && !/^https?:\/\/.+/i.test(formData.website)) {
      nextErrors.website = 'Enter a valid URL starting with http:// or https://';
    }

    if (step !== undefined && !showSidebar) {
      const stepFields: Array<keyof EmployerProfileForm> =
        step === 0
          ? [
              'companyName',
              'organizationType',
              'firstName',
              'lastName',
              'phoneNumber',
              'email',
              'foundedYear',
              'teamSize',
              'activeJobs',
              'headquarters',
              'website',
              'overview',
            ]
          : [];
      const visibleErrors =
        stepFields.length > 0
          ? Object.fromEntries(
              Object.entries(nextErrors).filter(([field]) => stepFields.includes(field as keyof EmployerProfileForm)),
            )
          : nextErrors;

      setFormErrors(visibleErrors as EmployerProfileErrors);
      return Object.keys(visibleErrors).length === 0;
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNumericFieldChange = (field: 'phoneNumber' | 'activeJobs', value: string) => {
    updateField(field, field === 'phoneNumber' ? sanitizePhone(value) : value.replace(/\D/g, ''));
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const logo = event.target.files?.[0];
    event.target.value = '';

    if (!logo) {
      return;
    }

    setLogoUploadError('');
    const nextPreviewUrl = URL.createObjectURL(logo);
    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      return nextPreviewUrl;
    });

    try {
      const response = await uploadEmployerLogo(logo).unwrap();
      updateField('logoUrl', response.data.url);
      setLogoPreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        return '';
      });
      notify.success('Company logo uploaded successfully.');
    } catch (error) {
      const msg = getApiErrorMessage(error);
      setLogoUploadError(msg);
      notify.error(msg);
    }
  };

  const handleFetchPrefill = async () => {
    const query = prefillInput.trim();
    if (!query) {
      setPrefillError('Enter a contact number, WhatsApp number, or email address.');
      setPrefillSuccess('');
      return;
    }

    setPrefillError('');
    setPrefillSuccess('');

    try {
      const result = await fetchPrefill(query).unwrap();

      if (!result.data) {
        setPrefillError('No matching organization record found. You can fill the form manually.');
        return;
      }

      const prefilled = result.data;
      setFormData((previous) => ({
        ...previous,
        companyName: prefilled.companyName || previous.companyName,
        organizationType: prefilled.organizationType || previous.organizationType,
        headquarters: prefilled.headquarters || previous.headquarters,
        website: prefilled.website || previous.website,
        email: prefilled.email || previous.email,
        phoneNumber: prefilled.phoneNumber || previous.phoneNumber,
        overview: prefilled.overview || previous.overview,
        hiringRegions:
          prefilled.hiringRegions && prefilled.hiringRegions.length > 0
            ? prefilled.hiringRegions
            : previous.hiringRegions,
        specialties:
          prefilled.specialties && prefilled.specialties.length > 0
            ? prefilled.specialties
            : previous.specialties,
      }));

      setPrefillSuccess('Company details auto-filled from records! Review and complete remaining fields.');
    } catch {
      setPrefillError('Could not find existing records for this query. You can fill details manually.');
    }
  };

  const submitProfile = async () => {
    if (!validateProfile()) {
      const msg = 'Please fix the highlighted errors before saving.';
      setSubmitError(msg);
      notify.error(msg);
      return;
    }

    try {
      if (showSidebar) {
        await updateEmployerProfile(formData).unwrap();
        setSaveState('saved');
        setHasUnsavedChanges(false);
        const msg = 'Company profile updated successfully.';
        notify.success(msg);
        setToast({ open: true, message: `✅ ${msg}`, severity: 'success' });
        return;
      }

      await createEmployerProfile({ ...formData, status: 'submitted' }).unwrap();
      localStorage.removeItem(STORAGE_KEY);
      setSaveState('submitted');
      notify.success('Employer registered successfully! Please log in.');
    } catch (error) {
      const msg = getApiErrorMessage(error);
      setSubmitError(msg);
      notify.error(msg);
      setToast({ open: true, message: `❌ ${msg}`, severity: 'error' });
    }
  };

  const contactName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim() || 'Hiring Contact';
  const headerTitle = showSidebar ? 'Company Profile' : 'Create Company Profile';
  const headerSubtitle = showSidebar
    ? 'Manage your public company presence, recruitment preferences, and hiring branding.'
    : 'Set up company information, hiring contact details and profile preview before posting jobs.';
  const logoImageUrl = logoPreviewUrl || formData.logoUrl;
  const isSavingProfile = isSubmitting || isUpdating;
  const profileLoadMessage = getApiErrorMessage(profileLoadError);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'var(--app-min-h)', bgcolor: '#f8fafc' }}>
      {showSidebar && <Sidebar type="employer" userName={formData.companyName || 'Employer'} userRole="Employer" />}

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4.5 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        <PageHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          breadcrumbs={
            showSidebar
              ? [
                  { label: 'Employer Dashboard', path: '/employer/dashboard' },
                  { label: 'Company Profile' },
                ]
              : [
                  { label: 'Signup', path: '/signup' },
                  { label: 'Employer Profile' },
                ]
          }
        />

        {isLoadingProfile && (
          <Alert sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }} severity="info" icon={<CircularProgress size={20} />}>
            Loading saved company profile…
          </Alert>
        )}

        {isProfileLoadError && (
          <Alert sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }} severity="error">
            {profileLoadMessage}
          </Alert>
        )}

        {submitError && (
          <Alert sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }} severity="error" onClose={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}

        {/* LOGGED IN DASHBOARD VIEW */}
        {showSidebar && (
          <Stack spacing={3.5}>
            {/* EXECUTIVE BRANDING HERO CARD */}
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
              {/* Cover Ambient Banner */}
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
                {/* Top Row: Logo on left (pulled up), Actions on right */}
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
                  {/* Company Logo Badge */}
                  <Box sx={{ mt: { xs: -6, sm: -8 }, position: 'relative' }}>
                    <Avatar
                      src={logoImageUrl || undefined}
                      sx={{
                        width: { xs: 96, sm: 120 },
                        height: { xs: 96, sm: 120 },
                        border: '4px solid #ffffff',
                        boxShadow: '0 8px 24px rgba(12, 82, 131, 0.22)',
                        bgcolor: '#0c5283',
                        fontSize: { xs: 36, sm: 46 },
                        fontWeight: 900,
                        borderRadius: 3.5,
                      }}
                    >
                      {(formData.companyName || 'E').charAt(0)}
                    </Avatar>

                    <Tooltip title="Upload or change company logo">
                      <IconButton
                        component="label"
                        sx={{
                          position: 'absolute',
                          bottom: -4,
                          right: -4,
                          bgcolor: '#ffffff',
                          color: '#0c5283',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                          border: '2px solid #f1f5f9',
                          '&:hover': { bgcolor: '#f8fafc', color: '#0ab6a2' },
                        }}
                      >
                        {isUploadingLogo ? <CircularProgress size={18} color="inherit" /> : <PhotoCamera fontSize="small" />}
                        <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Actions Toolbar */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ width: { xs: '100%', sm: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}
                  >
                    {myEmployerProfileData?.data._id && (
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNew />}
                        onClick={() => navigate(`/employer/profile/${myEmployerProfileData.data._id}`)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          borderRadius: 2.5,
                          px: 2.5,
                          py: 1.1,
                          borderColor: 'rgba(12, 82, 131, 0.3)',
                          color: '#0c5283',
                          bgcolor: '#ffffff',
                          '&:hover': {
                            borderColor: '#0c5283',
                            bgcolor: 'rgba(12, 82, 131, 0.05)',
                          },
                        }}
                      >
                        View Public Profile
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      disabled={isSavingProfile}
                      onClick={submitProfile}
                      startIcon={isSavingProfile ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        borderRadius: 2.5,
                        px: 3,
                        py: 1.1,
                        background: hasUnsavedChanges
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                        boxShadow: '0 8px 24px -6px rgba(12, 82, 131, 0.45)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 12px 28px -6px rgba(12, 82, 131, 0.6)',
                        },
                      }}
                    >
                      {isSavingProfile ? 'Saving…' : hasUnsavedChanges ? 'Save Unsaved Changes' : 'Save Company Profile'}
                    </Button>
                  </Stack>
                </Box>

                {/* Company Name & Metadata Row */}
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.75 }}>
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
                      {formData.companyName || 'Your Company Name'}
                    </Typography>

                    <Chip
                      icon={<Verified sx={{ fontSize: '1.1rem !important', color: '#ffffff !important' }} />}
                      size="medium"
                      label="Verified Employer"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color: '#ffffff',
                        bgcolor: '#10b981',
                      }}
                    />

                    {hasUnsavedChanges && (
                      <Chip
                        size="medium"
                        label="Unsaved Changes"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          color: '#b45309',
                          bgcolor: '#fef3c7',
                          border: '1px solid #fde68a',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0c5283' }}>
                      {formData.organizationType || 'Veterinary Organization'}
                    </Typography>

                    {formData.foundedYear && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        • Founded {formData.foundedYear}
                      </Typography>
                    )}

                    {formData.teamSize && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        • {formData.teamSize} Team
                      </Typography>
                    )}
                  </Box>

                  {/* Badges / Quick Metrics */}
                  <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    <Chip
                      icon={<Place sx={{ fontSize: '1.1rem !important', color: '#0c5283 !important' }} />}
                      label={formData.headquarters || 'Headquarters not set'}
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(241, 245, 249, 0.95)',
                        color: '#334155',
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                      }}
                    />
                    <Chip
                      icon={<Work sx={{ fontSize: '1.1rem !important', color: '#0ab6a2 !important' }} />}
                      label={
                        formData.hiringRegions.length > 0
                          ? `${formData.hiringRegions.length} Hiring Regions`
                          : 'No regions selected'
                      }
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(241, 245, 249, 0.95)',
                        color: '#334155',
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                      }}
                    />
                    {formData.website && (
                      <Chip
                        icon={<Language sx={{ fontSize: '1.1rem !important', color: '#64748b !important' }} />}
                        label={formData.website.replace(/^https?:\/\//i, '')}
                        component="a"
                        href={formData.website}
                        target="_blank"
                        rel="noreferrer"
                        clickable
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(241, 245, 249, 0.95)',
                          color: '#0c5283',
                          border: '1px solid rgba(226, 232, 240, 0.9)',
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* PROFILE STRENGTH & RECRUITMENT READINESS WIDGET */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                p: { xs: 2.5, sm: 3 },
                background: '#ffffff',
                border: '1px solid',
                borderColor: 'rgba(226, 232, 240, 0.9)',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              }}
            >
              <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: '#0ab6a2', fontSize: 24 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                        Employer Profile Strength
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0c5283' }}>
                      {profileStrength}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={profileStrength}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'rgba(12, 82, 131, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #0c5283 0%, #0ab6a2 100%)',
                      },
                    }}
                  />

                  {missingChecklist.length > 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5, fontSize: '0.9rem' }}>
                      💡 <strong>Quick boost:</strong> {missingChecklist.slice(0, 2).join(' • ')}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'success.main', mt: 1.5, fontWeight: 700, fontSize: '0.9rem' }}>
                      🌟 Excellent! Your profile is 100% complete and verified to attract top candidates.
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 3,
                        bgcolor: 'rgba(241, 245, 249, 0.75)',
                        textAlign: 'center',
                        minWidth: 120,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                        Active Jobs
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#0c5283' }}>
                        {formData.activeJobs || '0'}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 3,
                        bgcolor: 'rgba(241, 245, 249, 0.75)',
                        textAlign: 'center',
                        minWidth: 120,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                        Hiring Footprint
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#0ab6a2' }}>
                        {formData.hiringRegions.length}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Card>

            {/* DASHBOARD SEGMENTED TABS CONTAINER */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'rgba(226, 232, 240, 0.9)',
                background: '#ffffff',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', px: 2 }}>
                <Tabs
                  value={dashboardTab}
                  onChange={(_, val) => setDashboardTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: '0.975rem',
                      fontWeight: 700,
                      py: 2,
                      minHeight: 52,
                      textTransform: 'none',
                    },
                    '& .Mui-selected': {
                      color: '#0c5283 !important',
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: 1.5,
                      bgcolor: '#0c5283',
                    },
                  }}
                >
                  <Tab icon={<Business />} iconPosition="start" label="Company & Branding" />
                  <Tab icon={<Place />} iconPosition="start" label="Contact & Locations" />
                  <Tab icon={<Psychology />} iconPosition="start" label="Culture, Perks & Urgency" />
                  <Tab icon={<Visibility />} iconPosition="start" label="Live Public Preview" />
                </Tabs>
              </Box>

              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                {/* TAB 0: COMPANY & BRANDING */}
                {dashboardTab === 0 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        value={formData.companyName}
                        error={Boolean(formErrors.companyName)}
                        helperText={formErrors.companyName}
                        onChange={(event) => updateField('companyName', event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LookupSelect
                        category="organization_type"
                        label="Organization Type"
                        value={formData.organizationType}
                        onChange={(v) => updateField('organizationType', v)}
                        valueMode="name"
                        helperText={formErrors.organizationType}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        select
                        label="Founded Year"
                        value={formData.foundedYear}
                        error={Boolean(formErrors.foundedYear)}
                        helperText={formErrors.foundedYear}
                        onChange={(event) => updateField('foundedYear', event.target.value)}
                      >
                        <MenuItem value="">Select year</MenuItem>
                        {foundedYearOptions.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <LookupSelect
                        category="team_size"
                        label="Team Size"
                        value={formData.teamSize}
                        onChange={(v) => updateField('teamSize', v)}
                        helperText={formErrors.teamSize}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={formData.website}
                        error={Boolean(formErrors.website)}
                        helperText={formErrors.website || 'e.g. https://yourclinic.com'}
                        onChange={(event) => updateField('website', event.target.value)}
                      />
                    </Grid>

                    {/* Logo Management Box */}
                    <Grid size={{ xs: 12 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: 'rgba(248, 250, 252, 0.75)',
                          border: '1px dashed rgba(12, 82, 131, 0.25)',
                        }}
                      >
                        <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
                          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                            <Avatar
                              src={logoImageUrl || undefined}
                              sx={{
                                width: 90,
                                height: 90,
                                borderRadius: 3,
                                bgcolor: '#0c5283',
                                fontSize: 36,
                                fontWeight: 800,
                                mx: 'auto',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                              }}
                            >
                              {(formData.companyName || 'E').charAt(0)}
                            </Avatar>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 9, md: 10 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                              Company Brand Logo
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                              Upload a high-resolution JPG, PNG, or WEBP logo (up to 2MB). This is displayed on all your job postings and company profile.
                            </Typography>

                            {logoUploadError && (
                              <Typography variant="body2" color="error" sx={{ mb: 1, fontWeight: 600 }}>
                                {logoUploadError}
                              </Typography>
                            )}

                            <Stack direction="row" spacing={1.5}>
                              <Button
                                component="label"
                                variant="contained"
                                startIcon={isUploadingLogo ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}
                                disabled={isUploadingLogo}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                              >
                                {isUploadingLogo ? 'Uploading…' : logoImageUrl ? 'Change Logo' : 'Upload Logo'}
                                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} />
                              </Button>

                              {logoImageUrl && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<Delete />}
                                  onClick={() => {
                                    updateField('logoUrl', '');
                                    setLogoPreviewUrl((currentPreviewUrl) => {
                                      if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
                                      return '';
                                    });
                                    setLogoUploadError('');
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                >
                                  Remove Logo
                                </Button>
                              )}
                            </Stack>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={5}
                        label="Company Overview"
                        value={formData.overview}
                        error={Boolean(formErrors.overview)}
                        helperText={formErrors.overview || `${formData.overview.length}/1000 characters`}
                        slotProps={{ htmlInput: { maxLength: 1000 } }}
                        onChange={(event) => updateField('overview', event.target.value)}
                        placeholder="Describe your organization, care philosophy, work culture, equipment, and why veterinary professionals love working with your team."
                      />
                    </Grid>
                  </Grid>
                )}

                {/* TAB 1: CONTACT & LOCATIONS */}
                {dashboardTab === 1 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Primary Hiring Contact
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Designated contact for recruitment communications.
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Contact First Name"
                        value={formData.firstName}
                        error={Boolean(formErrors.firstName)}
                        helperText={formErrors.firstName}
                        onChange={(event) => updateField('firstName', event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Contact Last Name"
                        value={formData.lastName}
                        error={Boolean(formErrors.lastName)}
                        helperText={formErrors.lastName}
                        onChange={(event) => updateField('lastName', event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        disabled
                        value={formData.phoneNumber}
                        helperText="Primary registered employer phone (contact support to change)"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                  +91
                                </Box>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        disabled
                        value={formData.email}
                        helperText="Primary registered employer email (contact support to change)"
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Geographic Presence & Hiring Regions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Where your facilities are based and where you actively seek veterinary candidates.
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        options={indiaCityOptions}
                        value={formData.headquarters || null}
                        onChange={(_, newValue) => updateField('headquarters', newValue || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Headquarters City"
                            error={Boolean(formErrors.headquarters)}
                            helperText={formErrors.headquarters || 'Select primary clinic or hospital headquarters'}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={indiaCityOptions}
                        value={formData.hiringRegions}
                        filterOptions={filterCityOptions}
                        onChange={(_event, value) => updateField('hiringRegions', value)}
                        renderValue={(value, getItemProps) =>
                          value.map((region, index) => {
                            const { key, ...itemProps } = getItemProps({ index });
                            return <Chip key={key} label={region} size="small" {...itemProps} />;
                          })
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Active Hiring Regions"
                            placeholder="Type to add cities"
                            helperText="Add all cities where you hire veterinary doctors and staff"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* TAB 2: CULTURE, PERKS & URGENCY */}
                {dashboardTab === 2 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LookupSelect
                        category="workplace_model"
                        label="Workplace Model"
                        value={formData.workplaceModel}
                        onChange={(v) => updateField('workplaceModel', v)}
                        valueMode="name"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LookupSelect
                        category="hiring_priority"
                        label="Hiring Priority"
                        value={formData.hiringUrgency}
                        onChange={(v) => updateField('hiringUrgency', v)}
                        valueMode="name"
                      />
                    </Grid>

                    {/* Veterinary Specialties */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Psychology sx={{ color: '#0c5283' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              Veterinary Practice Specialties
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Add clinical areas your organization specializes in (up to 6).
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Add custom specialty"
                              value={specialtyInput}
                              onChange={(event) => setSpecialtyInput(event.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addChipValue('specialties', specialtyInput, 6);
                                  setSpecialtyInput('');
                                }
                              }}
                            />
                            <Button
                              variant="contained"
                              onClick={() => {
                                addChipValue('specialties', specialtyInput, 6);
                                setSpecialtyInput('');
                              }}
                            >
                              <Add />
                            </Button>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {formData.specialties.map((specialty) => (
                              <Chip
                                key={specialty}
                                label={specialty}
                                color="primary"
                                onDelete={() =>
                                  updateField(
                                    'specialties',
                                    formData.specialties.filter((item) => item !== specialty),
                                  )
                                }
                              />
                            ))}
                          </Box>

                          <Divider sx={{ my: 2 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                            Quick Suggestions:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {employerSpecialtyOptions.map((specialty) => (
                              <Chip
                                key={specialty}
                                label={specialty}
                                variant="outlined"
                                onClick={() => addChipValue('specialties', specialty, 6)}
                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(12, 82, 131, 0.08)' } }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Employee Benefits & EVP */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Stars sx={{ color: '#0ab6a2' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              Benefits & Perks (EVP)
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Perks that set your organization apart for prospective veterinary hires.
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Add custom benefit"
                              value={benefitInput}
                              onChange={(event) => setBenefitInput(event.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addChipValue('benefits', benefitInput, 8);
                                  setBenefitInput('');
                                }
                              }}
                            />
                            <Button
                              variant="contained"
                              onClick={() => {
                                addChipValue('benefits', benefitInput, 8);
                                setBenefitInput('');
                              }}
                            >
                              <Add />
                            </Button>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {formData.benefits.map((benefit) => (
                              <Chip
                                key={benefit}
                                label={benefit}
                                color="secondary"
                                onDelete={() =>
                                  updateField('benefits', formData.benefits.filter((item) => item !== benefit))
                                }
                              />
                            ))}
                          </Box>

                          <Divider sx={{ my: 2 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                            Suggested Perks:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {employerBenefitOptions.map((benefit) => (
                              <Chip
                                key={benefit}
                                label={benefit}
                                variant="outlined"
                                onClick={() => addChipValue('benefits', benefit, 8)}
                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(10, 182, 162, 0.08)' } }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* TAB 3: LIVE PUBLIC PREVIEW */}
                {dashboardTab === 3 && (
                  <Grid container spacing={3.5}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Card
                        elevation={0}
                        sx={{
                          border: '1px solid',
                          borderColor: 'rgba(226, 232, 240, 0.9)',
                          borderRadius: 3.5,
                          p: 3,
                          boxShadow: '0 8px 24px rgba(12, 82, 131, 0.06)',
                        }}
                      >
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
                          PUBLIC CARD PREVIEW
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                          <Avatar
                            src={logoImageUrl || undefined}
                            sx={{ width: 64, height: 64, bgcolor: '#0c5283', borderRadius: 2.5, fontWeight: 800 }}
                          >
                            {(formData.companyName || 'E').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                              {formData.companyName || 'Company Name'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formData.organizationType || 'Veterinary Hospital'}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#475569', mb: 2.5, lineHeight: 1.6 }}>
                          {formData.overview || 'Your company overview description will be displayed here for job seekers.'}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Stack spacing={1.2}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Place fontSize="small" sx={{ color: '#0c5283' }} />
                            {formData.headquarters || 'Location not specified'}
                          </Typography>
                          {formData.website && (
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Language fontSize="small" sx={{ color: '#0c5283' }} />
                              {formData.website}
                            </Typography>
                          )}
                        </Stack>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                      <Card
                        elevation={0}
                        sx={{
                          border: '1px solid',
                          borderColor: 'rgba(226, 232, 240, 0.9)',
                          borderRadius: 3.5,
                          p: 3,
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                          Recruitment Profile Highlights
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                Hiring Contact
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {contactName}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                Workplace
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {formData.workplaceModel || 'On-site'}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                Priority
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {formData.hiringUrgency || 'Standard'}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Practice Specialties
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                          {formData.specialties.length > 0 ? (
                            formData.specialties.map((s) => <Chip key={s} label={s} color="primary" />)
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No specialties specified.
                            </Typography>
                          )}
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Benefits & Perks
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                          {formData.benefits.length > 0 ? (
                            formData.benefits.map((b) => <Chip key={b} label={b} color="secondary" />)
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No benefits specified.
                            </Typography>
                          )}
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Active Hiring Footprint
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {formData.hiringRegions.length > 0 ? (
                            formData.hiringRegions.map((r) => <Chip key={r} label={r} variant="outlined" />)
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No regions specified.
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {/* Bottom Save Controls */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 4,
                    pt: 3,
                    borderTop: '1px solid',
                    borderColor: 'rgba(226, 232, 240, 0.8)',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ color: hasUnsavedChanges ? 'warning.main' : 'text.secondary', fontWeight: 600 }}>
                    {hasUnsavedChanges ? '⚠️ You have unsaved changes' : '✓ All changes up to date'}
                  </Typography>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      disabled={isSavingProfile}
                      onClick={submitProfile}
                      startIcon={isSavingProfile ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        borderRadius: 2.5,
                        px: 3.5,
                        py: 1.2,
                        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                        boxShadow: '0 6px 20px rgba(12, 82, 131, 0.35)',
                      }}
                    >
                      {isSavingProfile ? 'Saving…' : 'Save Company Profile'}
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* REGISTRATION / ONBOARDING STEPPER VIEW (showSidebar === false) */}
        {!showSidebar && (
          <>
            {saveState === 'saved' && (
              <Alert sx={{ mb: 3, borderRadius: 3 }} icon={<CheckCircle fontSize="inherit" />} severity="success">
                Employer profile draft saved locally. You can continue editing or move to the dashboard.
              </Alert>
            )}

            {saveState === 'submitted' && (
              <Paper
                elevation={4}
                sx={{
                  p: { xs: 3, md: 5 },
                  mb: 4,
                  textAlign: 'center',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #e6f4ea 0%, #f4fbf7 100%)',
                  border: '2px solid #34a853',
                  boxShadow: '0 20px 40px -15px rgba(52, 168, 83, 0.25)',
                }}
              >
                <Box
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    bgcolor: '#34a853',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: '0 8px 24px -4px rgba(52,168,83,0.4)',
                  }}
                >
                  <CheckCircle sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#137333', mb: 1 }}>
                  🎉 Employer Registration Complete!
                </Typography>
                <Typography variant="body1" sx={{ color: '#202124', maxWidth: 620, mx: 'auto', mb: 3, fontSize: 16, lineHeight: 1.6 }}>
                  Your employer profile and account have been registered! You can now log in with your email to access your Employer Dashboard and post jobs.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 3,
                      fontWeight: 800,
                      fontSize: 16,
                      textTransform: 'none',
                      bgcolor: '#0c5283',
                      '&:hover': { bgcolor: '#083b5e' },
                    }}
                  >
                    Proceed to Login with OTP
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/')}
                    sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                  >
                    Back to Home
                  </Button>
                </Stack>
              </Paper>
            )}

            {/* Prefill Box */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'primary.light', borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Already listed with us?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter your Contact Number, WhatsApp No. or Email and we will auto-fill your company details from our records.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    sx={{ flex: '1 1 220px', minWidth: 0 }}
                    label="Contact Number / WhatsApp No. / Email"
                    value={prefillInput}
                    onChange={(event) => {
                      setPrefillInput(event.target.value);
                      setPrefillError('');
                      setPrefillSuccess('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleFetchPrefill();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={isFetchingPrefill ? <CircularProgress color="inherit" size={18} /> : <Search />}
                    disabled={isFetchingPrefill}
                    onClick={handleFetchPrefill}
                  >
                    {isFetchingPrefill ? 'Fetching' : 'Fetch My Details'}
                  </Button>
                </Box>
                {prefillSuccess && (
                  <Alert sx={{ mt: 2 }} severity="success">
                    {prefillSuccess}
                  </Alert>
                )}
                {prefillError && (
                  <Alert sx={{ mt: 2 }} severity="warning">
                    {prefillError}
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${alpha('#0c5283', 0.08)}`,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 20px 50px -25px rgba(12,82,131,0.2)',
                ...modernFormSx,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  px: { xs: 2.5, md: 4 },
                  py: { xs: 3, md: 4 },
                  color: 'white',
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
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
                <Stack direction="row" spacing={2} sx={{ position: 'relative', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      flexShrink: 0,
                      bgcolor: 'rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '& svg': { fontSize: 26 },
                    }}
                  >
                    <Business />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                      Employer setup flow
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                      Company identity, hiring contact, logo and public preview all stay in one
                      structured flow.
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
                      borderColor: alpha('#0c5283', 0.15),
                      borderTopWidth: 2,
                    },
                    '& .MuiStepLabel-label': {
                      fontWeight: 600,
                      fontSize: { xs: 11, sm: 13, md: 14 },
                      lineHeight: 1.25,
                      mt: { xs: 0.5, md: 1 },
                      '&.Mui-active': { color: '#0c5283' },
                      '&.Mui-completed': { color: '#0ab6a2' },
                    },
                    '& .MuiStepLabel-iconContainer': { pr: 0 },
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
                      background: `linear-gradient(135deg, ${alpha(stepMeta[activeStep].color, 0.07)} 0%, ${alpha(stepMeta[activeStep].color, 0.02)} 100%)`,
                      border: `1px solid ${alpha(stepMeta[activeStep].color, 0.16)}`,
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
                        background: `linear-gradient(135deg, ${stepMeta[activeStep].color} 0%, ${alpha(stepMeta[activeStep].color, 0.8)} 100%)`,
                        color: '#fff',
                        boxShadow: `0 8px 16px -6px ${alpha(stepMeta[activeStep].color, 0.4)}`,
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
                        bgcolor: alpha(stepMeta[activeStep].color, 0.12),
                        color: stepMeta[activeStep].color,
                        display: { xs: 'none', sm: 'inline-flex' },
                      }}
                    />
                  </Box>
                )}

                {activeStep === 0 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Alert severity={emailVerified && phoneVerified ? 'success' : 'info'} sx={{ borderRadius: 2.5 }}>
                        {emailVerified && phoneVerified
                          ? 'Email and phone number verified. You can continue with your registration.'
                          : 'Before registering, verify your email address and phone number with the OTP buttons below.'}
                      </Alert>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Company Name"
                            value={formData.companyName}
                            error={Boolean(formErrors.companyName)}
                            helperText={formErrors.companyName}
                            onChange={(event) => updateField('companyName', event.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <LookupSelect
                            category="organization_type"
                            label="Organization Type"
                            value={formData.organizationType}
                            onChange={(v) => updateField('organizationType', v)}
                            valueMode="name"
                            helperText={formErrors.organizationType}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="First Name"
                            value={formData.firstName}
                            error={Boolean(formErrors.firstName)}
                            helperText={formErrors.firstName}
                            onChange={(event) => updateField('firstName', event.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            value={formData.lastName}
                            error={Boolean(formErrors.lastName)}
                            helperText={formErrors.lastName}
                            onChange={(event) => updateField('lastName', event.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            placeholder="10 digit mobile number"
                            value={formData.phoneNumber}
                            error={Boolean(formErrors.phoneNumber)}
                            helperText={formErrors.phoneNumber || '10 digits, without +91'}
                            onChange={(event) => handleNumericFieldChange('phoneNumber', event.target.value)}
                            type="tel"
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                      +91
                                    </Box>
                                  </InputAdornment>
                                ),
                              },
                              htmlInput: phoneHtmlInputProps,
                            }}
                          />
                          <OtpVerifyControl
                            kind="phone"
                            role="employer"
                            value={formData.phoneNumber}
                            verified={phoneVerified}
                            onVerified={() => {
                              setPhoneVerified(true);
                              setFormErrors((previous) => ({ ...previous, phoneNumber: '' }));
                            }}
                            canSend={!validatePhone(formData.phoneNumber)}
                            disabledReason="Enter a valid 10-digit mobile number first."
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            error={Boolean(formErrors.email)}
                            helperText={formErrors.email}
                            onChange={(event) => updateField('email', event.target.value)}
                          />
                          <OtpVerifyControl
                            kind="email"
                            role="employer"
                            value={formData.email}
                            verified={emailVerified}
                            onVerified={() => {
                              setEmailVerified(true);
                              setFormErrors((previous) => ({ ...previous, email: '' }));
                            }}
                            canSend={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                            disabledReason="Enter a valid email address first."
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            select
                            label="Founded Year"
                            value={formData.foundedYear}
                            error={Boolean(formErrors.foundedYear)}
                            helperText={formErrors.foundedYear}
                            onChange={(event) => updateField('foundedYear', event.target.value)}
                          >
                            <MenuItem value="">Select year</MenuItem>
                            {foundedYearOptions.map((year) => (
                              <MenuItem key={year} value={year}>
                                {year}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <LookupSelect
                            category="team_size"
                            label="Team Size"
                            value={formData.teamSize}
                            onChange={(v) => updateField('teamSize', v)}
                            helperText={formErrors.teamSize}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label="Active Jobs Count"
                            disabled
                            value={formData.activeJobs || '0 (Auto-managed)'}
                            helperText="Active job postings count"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Autocomplete
                            options={indiaCityOptions}
                            value={formData.headquarters || null}
                            onChange={(_, newValue) => updateField('headquarters', newValue || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Headquarters City"
                                error={Boolean(formErrors.headquarters)}
                                helperText={formErrors.headquarters || 'Select headquarters city'}
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Website"
                            value={formData.website}
                            error={Boolean(formErrors.website)}
                            helperText={formErrors.website}
                            onChange={(event) => updateField('website', event.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            label="Company Overview"
                            value={formData.overview}
                            error={Boolean(formErrors.overview)}
                            helperText={formErrors.overview || `${formData.overview.length}/1000 characters`}
                            slotProps={{ htmlInput: { maxLength: 1000 } }}
                            onChange={(event) => updateField('overview', event.target.value)}
                            placeholder="Describe the organization, care standards, team culture and hiring proposition"
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                            Hiring Regions
                          </Typography>
                          <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={indiaCityOptions}
                            value={formData.hiringRegions}
                            filterOptions={filterCityOptions}
                            onChange={(_event, value) => updateField('hiringRegions', value)}
                            renderValue={(value, getItemProps) =>
                              value.map((region, index) => {
                                const { key, ...itemProps } = getItemProps({ index });
                                return <Chip key={key} label={region} {...itemProps} />;
                              })
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                label="Search Indian cities"
                                placeholder="Type a city name"
                                helperText={`${indiaCityOptions.length.toLocaleString()} Indian cities available`}
                              />
                            )}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {activeStep === 1 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LookupSelect
                        category="workplace_model"
                        label="Workplace Model"
                        value={formData.workplaceModel}
                        onChange={(v) => updateField('workplaceModel', v)}
                        valueMode="name"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LookupSelect
                        category="hiring_priority"
                        label="Hiring Priority"
                        value={formData.hiringUrgency}
                        onChange={(v) => updateField('hiringUrgency', v)}
                        valueMode="name"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                            Specialties
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Add specialty"
                              value={specialtyInput}
                              onChange={(event) => setSpecialtyInput(event.target.value)}
                            />
                            <Button
                              variant="contained"
                              onClick={() => {
                                addChipValue('specialties', specialtyInput, 6);
                                setSpecialtyInput('');
                              }}
                            >
                              <Add />
                            </Button>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {formData.specialties.map((specialty) => (
                              <Chip
                                key={specialty}
                                label={specialty}
                                color="primary"
                                onDelete={() =>
                                  updateField(
                                    'specialties',
                                    formData.specialties.filter((item) => item !== specialty),
                                  )
                                }
                              />
                            ))}
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {employerSpecialtyOptions.map((specialty) => (
                              <Chip
                                key={specialty}
                                label={specialty}
                                variant="outlined"
                                onClick={() => addChipValue('specialties', specialty, 6)}
                                sx={{ cursor: 'pointer' }}
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
                            Benefits & Employer Value Proposition
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Add benefit"
                              value={benefitInput}
                              onChange={(event) => setBenefitInput(event.target.value)}
                            />
                            <Button
                              variant="contained"
                              onClick={() => {
                                addChipValue('benefits', benefitInput, 8);
                                setBenefitInput('');
                              }}
                            >
                              <Add />
                            </Button>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {formData.benefits.map((benefit) => (
                              <Chip
                                key={benefit}
                                label={benefit}
                                color="secondary"
                                onDelete={() =>
                                  updateField('benefits', formData.benefits.filter((item) => item !== benefit))
                                }
                              />
                            ))}
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {employerBenefitOptions.map((benefit) => (
                              <Chip
                                key={benefit}
                                label={benefit}
                                variant="outlined"
                                onClick={() => addChipValue('benefits', benefit, 8)}
                                sx={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {activeStep === 2 && (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar src={logoImageUrl || undefined} sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                              {(formData.companyName || 'E').charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {formData.companyName || 'Company name pending'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formData.organizationType || 'Organization type pending'}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {formData.overview || 'Company overview pending'}
                          </Typography>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Place fontSize="small" color="primary" />
                            {formData.headquarters || 'Headquarters pending'}
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Language fontSize="small" color="primary" />
                            {formData.website || 'Website pending'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                            Employer Preview
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Hiring Contact
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {contactName}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Active Jobs
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {formData.activeJobs || '0'}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Hiring Priority
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {formData.hiringUrgency}
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>

                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Specialties
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            {formData.specialties.map((specialty) => (
                              <Chip key={specialty} label={specialty} color="primary" variant="outlined" />
                            ))}
                          </Box>

                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Benefits
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            {formData.benefits.map((benefit) => (
                              <Chip key={benefit} label={benefit} color="secondary" variant="outlined" />
                            ))}
                          </Box>

                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Hiring Regions
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {formData.hiringRegions.map((region) => (
                              <Chip key={region} label={region} />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                <Box sx={wizardActionBarSx}>
                  <Button
                    variant="outlined"
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((step) => step - 1)}
                    startIcon={<ArrowBack />}
                    sx={{
                      ...wizardSecondaryButtonSx,
                      order: { xs: 2, sm: 0 },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Previous
                  </Button>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      flexWrap: 'wrap',
                      width: { xs: '100%', sm: 'auto' },
                      '& > *': { flex: { xs: '1 1 140px', sm: '0 0 auto' } },
                    }}
                  >
                    <Button variant="outlined" onClick={saveProfile} sx={wizardSecondaryButtonSx}>
                      Save Draft
                    </Button>
                    {activeStep < steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (validateProfile(activeStep)) {
                            setActiveStep((step) => step + 1);
                          }
                        }}
                        endIcon={<ArrowForward />}
                        sx={wizardPrimaryButtonSx}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        disabled={isSavingProfile}
                        onClick={submitProfile}
                        sx={wizardPrimaryButtonSx}
                      >
                        {isSavingProfile ? (
                          <>
                            <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                            Submitting…
                          </>
                        ) : (
                          'Submit Company Profile'
                        )}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </>
        )}
      </Box>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default EmployerProfileCreate;
