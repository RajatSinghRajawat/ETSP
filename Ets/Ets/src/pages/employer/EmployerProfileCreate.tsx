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
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { indiaCityOptions, filterCityOptions } from '../../data/indiaCities';
import LookupSelect from '../../components/common/LookupSelect';
import {
  Add,
  CheckCircle,
  Language,
  PhotoCamera,
  Place,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { phoneHtmlInputProps, sanitizePhone, validatePhone } from '../../utils/phone';
import notify from '../../utils/toast';
import { Toast } from '../../components/common';
import { PageHeader } from '../../components/common/PageHeader';
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
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
    setSaveState('idle');
    setSubmitError('');
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
  };

  const validateProfile = (step = activeStep) => {
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

    if (formData.foundedYear && !/^\d{4}$/.test(formData.foundedYear)) {
      nextErrors.foundedYear = 'Select a valid year';
    }

    if (formData.activeJobs && !/^\d+$/.test(formData.activeJobs)) {
      nextErrors.activeJobs = 'Only numbers are allowed';
    }

    if (formData.website && !/^https?:\/\/.+/i.test(formData.website)) {
      nextErrors.website = 'Enter a valid URL starting with http:// or https://';
    }

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
    const visibleErrors = stepFields.length > 0
      ? Object.fromEntries(Object.entries(nextErrors).filter(([field]) => stepFields.includes(field as keyof EmployerProfileForm)))
      : nextErrors;

    setFormErrors(visibleErrors as EmployerProfileErrors);
    return Object.keys(visibleErrors).length === 0;
  };

  const handleNumericFieldChange = (field: 'phoneNumber' | 'activeJobs', value: string) => {
    // Phone gets the 10-digit rules; other numeric fields just lose non-digits.
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
    } catch (error) {
      setLogoUploadError(getApiErrorMessage(error));
    }
  };

  const applyPrefill = (prefill: EmployerPrefillResponse) => {
    setFormData((previous) => ({
      ...previous,
      companyName: prefill.companyName || previous.companyName,
      organizationType: prefill.organizationType || previous.organizationType,
      firstName: prefill.firstName || previous.firstName,
      lastName: prefill.lastName || previous.lastName,
      phoneNumber: prefill.phoneNumber || previous.phoneNumber,
      email: prefill.email || previous.email,
      website: prefill.website || previous.website,
      teamSize: prefill.teamSize || previous.teamSize,
      headquarters: prefill.headquarters || previous.headquarters,
      overview: prefill.overview || previous.overview,
      hiringRegions: prefill.hiringRegions.length > 0 ? prefill.hiringRegions : previous.hiringRegions,
    }));
    setFormErrors({});
    setSaveState('idle');
  };

  const handleFetchPrefill = async () => {
    const identifier = prefillInput.trim();
    setPrefillError('');
    setPrefillSuccess('');

    if (!identifier) {
      setPrefillError('Enter your contact number, WhatsApp number, or email to fetch your details.');
      return;
    }

    try {
      const response = await fetchPrefill(identifier).unwrap();
      applyPrefill(response.data);
      setPrefillSuccess(
        `Details found for ${response.data.companyName || 'your company'}. Review the auto-filled form and submit to register.`,
      );
    } catch (error) {
      setPrefillError(getApiErrorMessage(error));
    }
  };

  const submitProfile = async () => {
    setSubmitError('');

    if (!validateProfile(2)) {
      setSubmitError('Please fix the highlighted fields before submitting.');
      notify.warning('Please fix the highlighted fields before submitting.');
      return;
    }

    try {
      if (showSidebar && myEmployerProfileData?.data._id) {
        const {
          email,
          phoneNumber,
          ...editableProfile
        } = formData;

        void email;
        void phoneNumber;

        await updateEmployerProfile(editableProfile).unwrap();
        setSaveState('submitted');
        notify.success('Company profile updated successfully.');
        return;
      }

      await createEmployerProfile({
        ...formData,
        status: 'submitted',
      }).unwrap();

      localStorage.removeItem(STORAGE_KEY);
      setSaveState('submitted');
      notify.success('Company profile submitted successfully.');
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
    ? 'Maintain your company presence and hiring details in one place.'
    : 'Set up company information, hiring contact details and profile preview before posting jobs.';
  const logoImageUrl = logoPreviewUrl || formData.logoUrl;
  const submitButtonLabel = showSidebar ? 'Save Company Profile' : 'Submit Company Profile';
  const isSavingProfile = isSubmitting || isUpdating;
  const profileLoadMessage = getApiErrorMessage(profileLoadError);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh', bgcolor: 'background.default' }}>
      {showSidebar && <Sidebar type="employer" userName={formData.companyName || 'Employer'} userRole="Employer" />}

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2, md: 4 } }}>
        <PageHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          breadcrumbs={
            showSidebar
              ? [
                  { label: 'Employer', path: '/employer/dashboard' },
                  { label: 'Company Profile' },
                ]
              : [
                  { label: 'Signup', path: '/signup' },
                  { label: 'Employer Profile' },
                ]
          }
        />

        {isLoadingProfile && (
          <Alert sx={{ mb: 3 }} severity="info" icon={<CircularProgress size={18} />}>
            Loading saved company profile...
          </Alert>
        )}

        {isProfileLoadError && (
          <Alert sx={{ mb: 3 }} severity="error">
            {profileLoadMessage}
          </Alert>
        )}

        {showSidebar && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Company Profile Actions</Typography>
                <Typography variant="body2" color="text.secondary">
                  Update company details here or open the public profile candidates see.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={() => setActiveStep(0)}>Edit Profile</Button>
                <Button
                  variant="outlined"
                  disabled={!myEmployerProfileData?.data._id}
                  onClick={() => navigate(`/employer/profile/${myEmployerProfileData?.data._id}`)}
                >
                  View Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Profile Strength
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                  {profileStrength}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A stronger profile builds trust and helps jobs convert faster.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Hiring Footprint
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                  {formData.hiringRegions.length > 0 ? `${formData.hiringRegions.length} regions` : 'No regions added'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use this to signal where you actively recruit talent.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {saveState === 'saved' && (
          <Alert sx={{ mb: 3 }} icon={<CheckCircle fontSize="inherit" />} severity="success">
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
              {showSidebar
                ? 'Your company profile has been updated successfully.'
                : 'Your employer profile and account have been registered! You can now log in with your email to access your Employer Dashboard and post jobs.'}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              {!showSidebar && (
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
              )}
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

        {submitError && (
          <Alert sx={{ mb: 3 }} severity="error">
            {submitError}
          </Alert>
        )}

        {!showSidebar && (
          <Card
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'primary.light', borderRadius: 3, mb: 3 }}
          >
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Already listed with us?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your Contact Number, WhatsApp No. or Email and we will auto-fill your company
                details from our records.
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
        )}

        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 3,
              color: 'white',
              background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              Employer setup flow
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Company identity, hiring contact, logo and public preview all stay in one structured flow.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* alternativeLabel stacks the caption under the icon so 3 steps fit a phone width. */}
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                mb: 4,
                '& .MuiStepLabel-label': {
                  fontSize: { xs: 11, sm: 13, md: 14 },
                  mt: { xs: 0.5, md: 1 },
                },
                '& .MuiStepConnector-root': { top: { xs: 10, md: 12 } },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <Grid container spacing={3}>
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
                        disabled={showSidebar}
                        value={formData.phoneNumber}
                        error={Boolean(formErrors.phoneNumber)}
                        helperText={formErrors.phoneNumber || '10 digits, without +91'}
                        onChange={(event) => handleNumericFieldChange('phoneNumber', event.target.value)}
                        type="tel"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>+91</Box>
                              </InputAdornment>
                            ),
                          },
                          htmlInput: phoneHtmlInputProps,
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        disabled={showSidebar}
                        value={formData.email}
                        error={Boolean(formErrors.email)}
                        helperText={formErrors.email}
                        onChange={(event) => updateField('email', event.target.value)}
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
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent>
                          <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
                            <Grid size={{ xs: 12, sm: 5 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  aspectRatio: '4 / 3',
                                  borderRadius: 3,
                                  border: '1px dashed',
                                  borderColor: logoImageUrl ? 'divider' : 'primary.light',
                                  bgcolor: 'action.hover',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {logoImageUrl ? (
                                  <img
                                    src={logoImageUrl}
                                    alt="Company Logo Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                ) : (
                                  <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                                      {(formData.companyName || 'E').charAt(0)}
                                    </Avatar>
                                    <Typography variant="body2">Logo preview</Typography>
                                  </Box>
                                )}
                              </Box>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 7 }}>
                              <Box sx={{ display: 'grid', gap: 1.5 }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Company Logo
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Upload JPG, PNG, or WEBP logo up to 2MB.
                                  </Typography>
                                </Box>
                                {logoUploadError && (
                                  <Typography variant="body2" color="error">
                                    {logoUploadError}
                                  </Typography>
                                )}
                                {formData.logoUrl && (
                                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                    {formData.logoUrl}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                  <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={isUploadingLogo ? <CircularProgress size={18} /> : <PhotoCamera />}
                                    disabled={isUploadingLogo}
                                  >
                                    {isUploadingLogo ? 'Uploading' : logoImageUrl ? 'Change Logo' : 'Upload Logo'}
                                    <input
                                      hidden
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={handleLogoChange}
                                    />
                                  </Button>
                                  {logoImageUrl && (
                                    <Button
                                      variant="text"
                                      color="error"
                                      onClick={() => {
                                        updateField('logoUrl', '');
                                        setLogoPreviewUrl((currentPreviewUrl) => {
                                          if (currentPreviewUrl) {
                                            URL.revokeObjectURL(currentPreviewUrl);
                                          }

                                          return '';
                                        });
                                        setLogoUploadError('');
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
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
                        <Avatar
                          src={logoImageUrl || undefined}
                          sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
                        >
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4, flexWrap: 'wrap' }}>
              <Button variant="outlined" disabled={activeStep === 0} onClick={() => setActiveStep((step) => step - 1)}>
                Previous
              </Button>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={saveProfile}>
                  {showSidebar ? 'Save Changes' : 'Save Draft'}
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (validateProfile(activeStep)) {
                        setActiveStep((step) => step + 1);
                      }
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <>
                    <Button variant="contained" disabled={isSavingProfile} onClick={submitProfile}>
                      {isSavingProfile ? (
                        <>
                          <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                          Saving
                        </>
                      ) : (
                        submitButtonLabel
                      )}
                    </Button>
                    <Button variant="text" onClick={() => navigate('/employer/dashboard')}>
                      Open Dashboard
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
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
