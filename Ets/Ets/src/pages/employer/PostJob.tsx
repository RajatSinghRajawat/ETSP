import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  ArrowBack,
  Bolt,
  Business,
  CheckCircle,
  Delete,
  Description,
  LocationOn,
  Payments,
  Psychology,
  RocketLaunchOutlined,
  School,
  Stars,
  Tune,
  Visibility,
  Work,
  WorkOutlined,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { indiaCityOptions, filterCityOptions } from '../../data/indiaCities';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import { JOB_STATUS_META } from '../../components/employer/jobStatus';
import {
  useCreateJobMutation,
  useGetJobQuery,
  useUpdateJobMutation,
  type JobPayload,
} from '../../store/api/jobApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import { usePurchaseCheckoutMutation } from '../../store/api/purchaseApi';
import {
  useGetEducationsQuery,
  useGetJobTypesQuery,
  useGetSalaryUnitsQuery,
} from '../../store/api/lookupApi';
import LookupSelect, { LookupChipPicker } from '../../components/common/LookupSelect';
import notify from '../../utils/toast';

type JobFormErrors = Partial<Record<keyof JobPayload, string>>;
type SalaryRangeErrors = Partial<Record<'salaryMin' | 'salaryMax', string>>;

interface StoredUser {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'candidate' | 'employer' | 'admin' | string;
}

const getStoredUser = (): StoredUser | null => {
  const token = localStorage.getItem('ets-access-token');
  const user = localStorage.getItem('user');

  if (!token) {
    return null;
  }

  if (!user) {
    return {};
  }

  try {
    return JSON.parse(user) as StoredUser;
  } catch {
    return {};
  }
};

const actionAlertSx = {
  mb: 2.5,
  borderRadius: 3,
  flexWrap: 'wrap',
  '& .MuiAlert-action': {
    width: { xs: '100%', sm: 'auto' },
    ml: { xs: 0, sm: 'auto' },
    pl: { xs: 0, sm: 2 },
    pt: { xs: 1, sm: 0.5 },
  },
} as const;

const modernFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.75,
    bgcolor: '#ffffff',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '& fieldset': { borderColor: 'rgba(226, 232, 240, 0.9)' },
    '&:hover fieldset': { borderColor: 'rgba(10, 182, 162, 0.55)' },
    '&.Mui-focused fieldset': { borderColor: '#0ab6a2', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': {
    color: '#64748b',
    '&.Mui-focused': { color: '#0c5283', fontWeight: 700 },
  },
} as const;

const defaultJobForm: JobPayload = {
  title: '',
  type: '',
  location: '',
  salary: '',
  description: '',
  skills: [],
  experience: '',
  education: '',
  benefits: '',
  status: 'active',
  screeningQuestions: [],
};

const parseSalary = (label?: string) => {
  const result = { min: '', max: '', unit: '' };
  if (!label) {
    return result;
  }

  const range = label.match(/^(\d+)\s*-\s*(\d+)\s+(.*)$/);
  const from = label.match(/^From\s+(\d+)\s+(.*)$/i);
  const upTo = label.match(/^Up to\s+(\d+)\s+(.*)$/i);

  if (range) {
    return { min: range[1], max: range[2], unit: range[3].trim() };
  }
  if (from) {
    return { min: from[1], max: '', unit: from[2].trim() };
  }
  if (upTo) {
    return { min: '', max: upTo[1], unit: upTo[2].trim() };
  }

  return result;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
    const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];
    return validationMessages[0] ?? data?.message ?? fallback;
  }

  return fallback;
};

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color?: string;
}> = ({ icon, title, subtitle, color = '#0c5283' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 2.5 }}>
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2.5,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
        boxShadow: `0 8px 18px -6px ${alpha(color, 0.5)}`,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', lineHeight: 1.25 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

const PostJob: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState<JobPayload>(defaultJobForm);
  const [salaryRange, setSalaryRange] = useState({
    min: '',
    max: '',
    unit: '',
  });
  const [prefilled, setPrefilled] = useState(false);
  const [formErrors, setFormErrors] = useState<JobFormErrors>({});
  const [salaryErrors, setSalaryErrors] = useState<SalaryRangeErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
  const [purchaseCheckout, { isLoading: isBuyingCredit }] = usePurchaseCheckoutMutation();
  const { data: jobData, isLoading: isJobLoading } = useGetJobQuery(id ?? '', { skip: !id });
  const { data: employerData, isLoading: isProfileApprovalLoading } = useGetMyEmployerProfileQuery();
  const { data: usageData } = useGetMyUsageQuery();
  const companyName = employerData?.data.companyName || 'Employer';
  const companyLogo = employerData?.data.logoUrl || '';
  const isApprovalPending = Boolean(
    employerData?.data.approvalStatus && employerData.data.approvalStatus !== 'approved',
  );
  const isLoading = isCreating || isUpdating;

  const effectiveFeatures = usageData?.data?.effectiveFeatures;
  const activeJobsMeter = usageData?.data?.usage?.activeJobs;
  const jobCreditsAvailable = usageData?.data?.usage?.jobCredits?.available ?? 0;
  const useJobCredit = Boolean(formData.useJobCredit);
  const quotaExhausted =
    !isEdit &&
    !useJobCredit &&
    Boolean(activeJobsMeter && activeJobsMeter.limit !== null && activeJobsMeter.used >= activeJobsMeter.limit);
  const canFeature = (effectiveFeatures?.featuredJobs ?? 0) > 0;
  const canScreen = Boolean(effectiveFeatures?.screeningQuestionsEnabled) || useJobCredit;

  useEffect(() => {
    if (!isEdit || prefilled || !jobData?.data) {
      return;
    }

    const job = jobData.data;
    setFormData({
      title: job.title,
      type: job.type,
      location: job.location,
      salary: job.salary,
      description: job.description,
      skills: job.skills ?? [],
      experience: job.experience,
      education: job.education,
      benefits: job.benefits ?? '',
      status: job.status,
      isFeatured: Boolean(job.isFeatured),
      screeningQuestions: job.screeningQuestions ?? [],
    });
    setSalaryRange(parseSalary(job.salary));
    setPrefilled(true);
  }, [isEdit, prefilled, jobData]);

  const { data: jobTypesData } = useGetJobTypesQuery();
  const { data: educationsData } = useGetEducationsQuery();
  const { data: salaryUnitsData } = useGetSalaryUnitsQuery();

  const jobTypeOptions = useMemo(() => jobTypesData?.data ?? [], [jobTypesData]);
  const educationOptions = useMemo(() => educationsData?.data ?? [], [educationsData]);
  const salaryUnitOptions = useMemo(() => salaryUnitsData?.data ?? [], [salaryUnitsData]);

  useEffect(() => {
    if (!formData.type && jobTypeOptions.length > 0) {
      setFormData((current) => ({ ...current, type: jobTypeOptions[0].value }));
    }
  }, [jobTypeOptions, formData.type]);

  useEffect(() => {
    if (!formData.education && educationOptions.length > 0) {
      setFormData((current) => ({ ...current, education: educationOptions[0].value }));
    }
  }, [educationOptions, formData.education]);

  useEffect(() => {
    if (!salaryRange.unit && salaryUnitOptions.length > 0) {
      setSalaryRange((current) => ({ ...current, unit: salaryUnitOptions[0].value }));
    }
  }, [salaryUnitOptions, salaryRange.unit]);

  const updateField = <K extends keyof JobPayload>(field: K, value: JobPayload[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: '' }));
    setSubmitError('');
    setSuccessMessage('');
  };

  const updateSalaryRange = (field: keyof typeof salaryRange, value: string) => {
    const nextValue = field === 'unit' ? value : value.replace(/\D/g, '');
    setSalaryRange((current) => ({ ...current, [field]: nextValue }));
    setSalaryErrors((current) => ({
      ...current,
      [field === 'min' ? 'salaryMin' : field === 'max' ? 'salaryMax' : 'salaryMin']: '',
      ...(field === 'unit' ? { salaryMax: '' } : {}),
    }));
    setSubmitError('');
    setSuccessMessage('');
  };

  const getSalaryLabel = () => {
    if (!salaryRange.min && !salaryRange.max) {
      return '';
    }

    if (salaryRange.min && salaryRange.max) {
      return `${salaryRange.min} - ${salaryRange.max} ${salaryRange.unit}`;
    }

    if (salaryRange.min) {
      return `From ${salaryRange.min} ${salaryRange.unit}`;
    }

    return `Up to ${salaryRange.max} ${salaryRange.unit}`;
  };

  const validateForm = () => {
    const nextErrors: JobFormErrors = {};
    const nextSalaryErrors: SalaryRangeErrors = {};

    if (!formData.title.trim()) nextErrors.title = 'Job title is required';
    if (!formData.type.trim()) nextErrors.type = 'Job type is required';
    if (!formData.location.trim()) nextErrors.location = 'Job location is required';
    if (!formData.experience.trim()) nextErrors.experience = 'Experience level is required';
    if (!formData.description.trim()) nextErrors.description = 'Job description is required';
    if (!formData.education.trim()) nextErrors.education = 'Minimum education is required';

    if (formData.skills.length === 0) {
      nextErrors.skills = 'Select at least one skill or specialization';
    }

    if (salaryRange.min && salaryRange.max && Number(salaryRange.max) < Number(salaryRange.min)) {
      nextSalaryErrors.salaryMax = 'Maximum salary must be greater than minimum salary';
    }

    setFormErrors(nextErrors);
    setSalaryErrors(nextSalaryErrors);

    if (Object.keys(nextErrors).length > 0 || Object.keys(nextSalaryErrors).length > 0) {
      notify.warning('Please complete all required fields highlighted in red.');
      return false;
    }

    return true;
  };

  const currentUser = getStoredUser();
  const isGuest = !currentUser;
  const isCandidate = currentUser?.role === 'candidate';
  const hasNoEmployerProfile = currentUser?.role === 'employer' && employerData && !employerData.data?._id;

  const handleSubmit = async (statusOverride?: JobPayload['status']) => {
    if (isApprovalPending) {
      const message = 'Your profile approval is pending. You can post jobs after admin approval.';
      setSubmitError(message);
      notify.warning(message);
      return;
    }

    if (!validateForm()) {
      setSubmitError(`Please fix the highlighted fields before ${isEdit ? 'updating' : 'publishing'}.`);
      return;
    }

    const targetStatus = statusOverride ?? formData.status ?? 'active';

    const payload: JobPayload = {
      ...formData,
      status: targetStatus,
      salary: getSalaryLabel(),
      screeningQuestions: (formData.screeningQuestions ?? []).filter((entry) => entry.question.trim()),
    };

    try {
      if (isEdit && id) {
        const response = await updateJob({ id, job: payload }).unwrap();
        setSuccessMessage(response.message);
        notify.success(response.message || 'Job updated successfully.');
        setTimeout(() => navigate(`/jobs/${id}`), 800);
        return;
      }

      const response = await createJob(payload).unwrap();
      setSuccessMessage(response.message);
      notify.success(response.message || 'Job posted successfully.');
      setTimeout(() => navigate('/employer/dashboard'), 900);
    } catch (error) {
      const message = getApiErrorMessage(error, isEdit ? 'Unable to update job.' : 'Unable to post job.');
      setSubmitError(message);
      notify.error(message);
    }
  };

  // Completion calculation
  const requiredChecks = [
    formData.title.trim(),
    formData.type.trim(),
    formData.location.trim(),
    formData.description.trim(),
    formData.experience.trim(),
    formData.education.trim(),
    formData.skills.length > 0 ? 'ok' : '',
  ];
  const completedCount = requiredChecks.filter(Boolean).length;
  const completionPct = Math.round((completedCount / requiredChecks.length) * 100);

  const jobTypeName = jobTypeOptions.find((option) => option.value === formData.type)?.name || formData.type;
  const benefitNames = useMemo(() => {
    return (formData.benefits || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [formData.benefits]);
  const salaryLabel = getSalaryLabel();
  const isSubmitBlocked = isLoading || isProfileApprovalLoading || isApprovalPending;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'var(--app-min-h)', bgcolor: '#f8fafc' }}>
      <Sidebar type="employer" userName={companyName} />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4.5 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        {/* Navigation / Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/employer/dashboard')}
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
                },
              }}
            >
              Back to Dashboard
            </Button>

            <Chip
              icon={<Work sx={{ fontSize: '1.05rem !important' }} />}
              label={isEdit ? 'Editing Existing Job' : 'All-in-One Job Creator'}
              variant="outlined"
              sx={{
                fontWeight: 700,
                fontSize: '0.875rem',
                borderColor: 'rgba(12, 82, 131, 0.3)',
                bgcolor: '#ffffff',
                color: '#0c5283',
              }}
            />
          </Stack>
        </Box>

        <PageHeader
          title={isEdit ? 'Edit Job Opening' : 'Post a New Job'}
          subtitle={
            isEdit
              ? 'Update all specifications for this veterinary role in one place.'
              : 'Complete all job details on this single page and publish immediately to attract qualified veterinary talent.'
          }
          breadcrumbs={[
            { label: 'Employer Dashboard', path: '/employer/dashboard' },
            { label: isEdit ? 'Edit Job' : 'Post Job' },
          ]}
        />

        {/* Global Notifications & Quota Banners */}
        {isGuest && (
          <Alert severity="warning" sx={actionAlertSx} action={<Button color="inherit" size="small" onClick={() => navigate('/login')}>Login</Button>}>
            Please sign in as an employer to post jobs and receive applications.
          </Alert>
        )}

        {isCandidate && (
          <Alert severity="warning" sx={actionAlertSx} action={<Button color="inherit" size="small" onClick={() => navigate('/signup/employer')}>Create Employer Profile</Button>}>
            You are currently signed in with a candidate account. An employer profile is required to post jobs.
          </Alert>
        )}

        {hasNoEmployerProfile && (
          <Alert severity="warning" sx={actionAlertSx} action={<Button color="inherit" size="small" onClick={() => navigate('/employer/profile')}>Set Up Company Profile</Button>}>
            Please complete your company profile before posting a job.
          </Alert>
        )}

        {isEdit && isJobLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Loading existing job details…</Typography>
          </Box>
        )}

        {!isEdit && activeJobsMeter && activeJobsMeter.limit !== null && (
          <Alert severity={quotaExhausted ? 'warning' : 'info'} sx={actionAlertSx}>
            {quotaExhausted
              ? `All ${activeJobsMeter.limit} active job slots on your plan are in use.`
              : `${activeJobsMeter.used} of ${activeJobsMeter.limit} active job slots currently in use.`}
          </Alert>
        )}

        {!isEdit && (jobCreditsAvailable > 0 || useJobCredit) && (
          <Alert severity="info" icon={<Bolt fontSize="inherit" />} sx={{ mb: 3, borderRadius: 3 }}>
            <FormControlLabel
              control={<Checkbox checked={useJobCredit} onChange={(e) => updateField('useJobCredit', e.target.checked)} />}
              label={`Use a Pay Per Job credit (${jobCreditsAvailable} available) — 14-day listing with 15 profile unlocks`}
            />
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}>
            {successMessage}
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }} onClose={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}

        {/* ALL IN ONE FORM GRID */}
        <Grid container spacing={3.5}>
          {/* MAIN FORM COLUMN (Left 8 Cols) - All fields visible together! */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3.5}>
              {/* SECTION 1: ROLE BASICS */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'rgba(226, 232, 240, 0.9)',
                  background: '#ffffff',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  ...modernFieldSx,
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                  <SectionHeader
                    icon={<WorkOutlined />}
                    title="1. Role Basics & Headline"
                    subtitle="Key details veterinary professionals scan first."
                    color="#0c5283"
                  />

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12 }}>
                      <LookupSelect
                        category="job_title"
                        label="Job Title"
                        value={formData.title}
                        onChange={(v) => updateField('title', v)}
                        valueMode="name"
                        required
                        error={Boolean(formErrors.title)}
                        helperText={
                          formErrors.title ||
                          'Choose standard veterinary job title or type a new one'
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <LookupSelect
                        category="job_type"
                        label="Job Type"
                        value={formData.type}
                        onChange={(v) => updateField('type', v)}
                        required
                        error={Boolean(formErrors.type)}
                        helperText={formErrors.type}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <LookupSelect
                        category="experience_band"
                        label="Experience Level Required"
                        value={formData.experience}
                        onChange={(v) => updateField('experience', v)}
                        required
                        error={Boolean(formErrors.experience)}
                        helperText={formErrors.experience || 'Select required experience (e.g. 0-2, 2-5 years)'}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Autocomplete
                        options={indiaCityOptions}
                        filterOptions={filterCityOptions}
                        value={formData.location || null}
                        onChange={(_, newValue) => updateField('location', newValue || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Job Location (City)"
                            required
                            placeholder="Search Indian cities"
                            error={Boolean(formErrors.location)}
                            helperText={
                              formErrors.location || `${indiaCityOptions.length.toLocaleString()} Indian cities available`
                            }
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* SECTION 2: COMPENSATION & ROLE DESCRIPTION */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'rgba(226, 232, 240, 0.9)',
                  background: '#ffffff',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  ...modernFieldSx,
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                  <SectionHeader
                    icon={<Payments />}
                    title="2. Compensation & Role Description"
                    subtitle="Remuneration package and comprehensive role expectations."
                    color="#0ab6a2"
                  />

                  <Grid container spacing={2.5}>
                    {/* Salary Range */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Minimum Pay (₹)"
                        placeholder="e.g. 500000"
                        value={salaryRange.min}
                        error={Boolean(salaryErrors.salaryMin)}
                        helperText={salaryErrors.salaryMin || 'Optional minimum'}
                        onChange={(e) => updateSalaryRange('min', e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Maximum Pay (₹)"
                        placeholder="e.g. 900000"
                        value={salaryRange.max}
                        error={Boolean(salaryErrors.salaryMax)}
                        helperText={salaryErrors.salaryMax || 'Optional maximum'}
                        onChange={(e) => updateSalaryRange('max', e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <LookupSelect
                        category="salary_unit"
                        label="Pay Frequency"
                        value={salaryRange.unit}
                        onChange={(v) => updateSalaryRange('unit', v)}
                      />
                    </Grid>

                    {salaryLabel && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            bgcolor: 'rgba(10, 182, 162, 0.08)',
                            border: '1px solid rgba(10, 182, 162, 0.25)',
                          }}
                        >
                          <Payments sx={{ fontSize: 20, color: '#0ab6a2' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0c5283' }}>
                            Candidates will see: {salaryLabel}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* Detailed Job Description */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Detailed Job Description *
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<Bolt />}
                          variant="outlined"
                          onClick={() => {
                            const title = formData.title || 'Veterinary Professional';
                            const generated = `Key Responsibilities:\n• Deliver high quality clinical care and patient management for ${title} role.\n• Perform routine health examinations, diagnostic procedures, and client communication.\n• Maintain accurate medical records, hygiene standards, and team collaboration.\n• Ensure patient safety, comfort, and follow animal welfare protocols.\n\nQualifications & Requirements:\n• Professional degree or certification relevant to ${title}.\n• Strong clinical skills, empathy, and effective communication.\n• Dedicated team player with problem solving mindset.`;
                            updateField('description', generated);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                          Role Description AI
                        </Button>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        minRows={6}
                        placeholder="Provide details about daily clinical responsibilities, surgical procedures, patient caseload, working shifts, and clinic equipment."
                        value={formData.description}
                        error={Boolean(formErrors.description)}
                        helperText={formErrors.description || `${formData.description.length}/5000 characters`}
                        onChange={(e) => updateField('description', e.target.value)}
                        slotProps={{
                          input: {
                            sx: { fontSize: '1rem', lineHeight: 1.7 },
                          },
                        }}
                      />
                    </Grid>

                    {/* Required Skills Picker */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Clinical & Professional Skills Required *
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                          Select or type key skills (e.g., Small Animal Surgery, Ultrasonography, Critical Care, Dermatology).
                        </Typography>
                      </Box>

                      <LookupChipPicker
                        category="skill"
                        label="Required Skills"
                        hideHeader={true}
                        placeholder="Search skills or type custom skill..."
                        values={formData.skills || []}
                        value={formData.skills || []}
                        valueMode="name"
                        required
                        onChange={(skills) => updateField('skills', skills)}
                        helperText={formErrors.skills || 'Select one or more skills. Use Add new to propose custom skills.'}
                        error={Boolean(formErrors.skills)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* SECTION 3: EDUCATION, BENEFITS & SCREENING */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'rgba(226, 232, 240, 0.9)',
                  background: '#ffffff',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  ...modernFieldSx,
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                  <SectionHeader
                    icon={<School />}
                    title="3. Qualifications, Perks & Screening"
                    subtitle="Educational baseline, employee benefits, and applicant questions."
                    color="#f59e0b"
                  />

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <LookupSelect
                        category="education"
                        label="Minimum Education Qualification"
                        value={formData.education}
                        onChange={(v) => updateField('education', v)}
                        required
                        error={Boolean(formErrors.education)}
                        helperText={formErrors.education}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <LookupChipPicker
                        category="benefit"
                        label="Benefits & Perks"
                        hideHeader={true}
                        placeholder="Search or add perks..."
                        values={benefitNames}
                        valueMode="name"
                        helperText="Select multiple benefits. Use Add new to propose a perk."
                        onChange={(next) => updateField('benefits', next.join(', '))}
                      />
                    </Grid>

                    {/* Screening Questions (if enabled) */}
                    {canScreen && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: 'rgba(248, 250, 252, 0.85)',
                            border: '1px dashed rgba(12, 82, 131, 0.25)',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                Applicant Screening Questions
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Candidates will be asked to answer these questions when submitting their application.
                              </Typography>
                            </Box>

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Add />}
                              onClick={() => {
                                const list = formData.screeningQuestions ?? [];
                                updateField('screeningQuestions', [...list, { question: '', required: false }]);
                              }}
                              sx={{ fontWeight: 700, borderRadius: 2 }}
                            >
                              Add Question
                            </Button>
                          </Box>

                          {(formData.screeningQuestions ?? []).length === 0 ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
                              No screening questions added. Click "Add Question" to set custom filters.
                            </Typography>
                          ) : (
                            <Stack spacing={2}>
                              {(formData.screeningQuestions ?? []).map((entry, qIndex) => (
                                <Box
                                  key={qIndex}
                                  sx={{
                                    display: 'flex',
                                    gap: 1.5,
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: '#ffffff',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                  }}
                                >
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Question ${qIndex + 1}: e.g. Do you have veterinary surgery experience?`}
                                    value={entry.question}
                                    onChange={(e) => {
                                      const updated = [...(formData.screeningQuestions ?? [])];
                                      updated[qIndex] = { ...updated[qIndex], question: e.target.value };
                                      updateField('screeningQuestions', updated);
                                    }}
                                  />
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={entry.required}
                                        onChange={(e) => {
                                          const updated = [...(formData.screeningQuestions ?? [])];
                                          updated[qIndex] = { ...updated[qIndex], required: e.target.checked };
                                          updateField('screeningQuestions', updated);
                                        }}
                                      />
                                    }
                                    label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Mandatory</Typography>}
                                  />
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      const updated = (formData.screeningQuestions ?? []).filter((_, idx) => idx !== qIndex);
                                      updateField('screeningQuestions', updated);
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* SECTION 4: VISIBILITY, BOOSTING & PUBLICATION STATUS */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'rgba(226, 232, 240, 0.9)',
                  background: '#ffffff',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  ...modernFieldSx,
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                  <SectionHeader
                    icon={<RocketLaunchOutlined />}
                    title="4. Visibility, Boost & Status"
                    subtitle="Feature placement and publication options."
                    color="#7c3aed"
                  />

                  <Grid container spacing={2.5}>
                    {canFeature && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: formData.isFeatured ? 'rgba(124, 58, 237, 0.08)' : 'rgba(241, 245, 249, 0.65)',
                            border: '1px solid',
                            borderColor: formData.isFeatured ? '#7c3aed' : 'rgba(226, 232, 240, 0.9)',
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Stars sx={{ color: '#7c3aed' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                Featured Job Badge
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                              Pin this role at the top of candidate search results with prominent badge highlight.
                            </Typography>
                          </Box>

                          <Switch
                            checked={Boolean(formData.isFeatured)}
                            onChange={(e) => updateField('isFeatured', e.target.checked)}
                            color="secondary"
                          />
                        </Box>
                      </Grid>
                    )}

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel id="job-status-label">Publication Status</InputLabel>
                        <Select
                          labelId="job-status-label"
                          label="Publication Status"
                          value={formData.status}
                          onChange={(e) => updateField('status', e.target.value as JobPayload['status'])}
                        >
                          <MenuItem value="active">Active (Visible to Candidates)</MenuItem>
                          <MenuItem value="draft">Draft (Private, not published yet)</MenuItem>
                          {isEdit && <MenuItem value="closed">Closed (Applications paused)</MenuItem>}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* SECTION 5: BOTTOM ACTION & PUBLISH BAR */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: submitError || Object.keys(formErrors).length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(226, 232, 240, 0.9)',
                  background: submitError || Object.keys(formErrors).length > 0 ? 'rgba(254, 242, 242, 0.65)' : '#ffffff',
                  p: { xs: 2.5, sm: 3.5 },
                  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
                }}
              >
                {submitError && (
                  <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                    {submitError}
                  </Alert>
                )}

                {successMessage && (
                  <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                    {successMessage}
                  </Alert>
                )}

                {isApprovalPending && (
                  <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                    Your employer profile approval is pending. Job postings will go live after admin approval.
                  </Alert>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ color: completionPct === 100 ? '#10b981' : '#0c5283', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                        Ready to {isEdit ? 'Update' : 'Post'} Job?
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      Form is {completionPct}% complete. {completionPct < 100 ? 'Ensure all required fields marked with * are filled.' : 'All mandatory fields are satisfied.'}
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      size="large"
                      disabled={isSubmitBlocked}
                      onClick={() => handleSubmit('draft')}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        px: 3.5,
                        py: 1.25,
                        borderRadius: 3,
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        borderColor: 'rgba(12, 82, 131, 0.3)',
                        color: '#0c5283',
                        '&:hover': {
                          borderColor: '#0c5283',
                          bgcolor: 'rgba(12, 82, 131, 0.05)',
                        },
                      }}
                    >
                      Save as Draft
                    </Button>

                    <Button
                      variant="contained"
                      size="large"
                      disabled={isSubmitBlocked}
                      onClick={() => handleSubmit('active')}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <RocketLaunchOutlined />}
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        px: 4,
                        py: 1.25,
                        borderRadius: 3,
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                        boxShadow: '0 8px 24px -6px rgba(12, 82, 131, 0.5)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 12px 28px -6px rgba(12, 82, 131, 0.65)',
                        },
                      }}
                    >
                      {isLoading
                        ? (isEdit ? 'Updating Job…' : 'Posting Job…')
                        : (isEdit ? 'Update Job' : 'Post Job')}
                    </Button>
                  </Stack>
                </Box>
              </Card>
            </Stack>
          </Grid>

          {/* STICKY LIVE PREVIEW & ACTION PANEL (Right 4 Cols) */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
              <Stack spacing={3}>
                {/* 1. REAL-TIME JOB CARD PREVIEW */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'rgba(226, 232, 240, 0.9)',
                    background: '#ffffff',
                    boxShadow: '0 8px 24px rgba(12, 82, 131, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(12, 82, 131, 0.05)',
                      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0c5283', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      Live Candidate Preview
                    </Typography>
                    <Chip
                      size="small"
                      label={formData.status === 'active' ? 'Live' : 'Draft'}
                      color={formData.status === 'active' ? 'success' : 'default'}
                      sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                    />
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        src={companyLogo || undefined}
                        sx={{ width: 52, height: 52, bgcolor: '#0c5283', borderRadius: 2.5, fontWeight: 800 }}
                      >
                        {companyName.charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', lineHeight: 1.3 }}>
                          {formData.title || 'Role Title Preview'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {companyName}
                        </Typography>
                      </Box>
                    </Box>

                    <Stack spacing={1.2} sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn sx={{ fontSize: 18, color: '#0c5283' }} />
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                          {formData.location || 'Location not selected'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work sx={{ fontSize: 18, color: '#0ab6a2' }} />
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                          {jobTypeName || 'Employment type'} • {formData.experience || 'Experience unspecified'}
                        </Typography>
                      </Box>

                      {salaryLabel && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Payments sx={{ fontSize: 18, color: '#10b981' }} />
                          <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>
                            {salaryLabel}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {formData.skills.length > 0 && (
                      <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                          Required Skills ({formData.skills.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {formData.skills.slice(0, 4).map((s) => (
                            <Chip key={s} label={s} size="small" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
                          ))}
                          {formData.skills.length > 4 && (
                            <Chip label={`+${formData.skills.length - 4} more`} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                          )}
                        </Box>
                      </Box>
                    )}
                    {/* Form Readiness Indicator inside Preview Card */}
                    <Box sx={{ pt: 2, mt: 2, borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          Job Post Readiness
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0c5283' }}>
                          {completionPct}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={completionPct}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(12, 82, 131, 0.08)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #0c5283 0%, #0ab6a2 100%)',
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PostJob;
