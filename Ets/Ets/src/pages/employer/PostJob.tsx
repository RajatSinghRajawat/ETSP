import { useEffect, useMemo, useState } from 'react';
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
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  Bolt,
  Delete,
  Description,
  LocationOn,
  Lock,
  Payments,
  Save,
  School,
  Star,
  Title as TitleIcon,
  Tune,
  Visibility,
  WorkOutlined,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { indiaCityOptions, filterCityOptions } from '../../data/indiaCities';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
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
  useGetSkillsQuery,
} from '../../store/api/lookupApi';

type JobFormErrors = Partial<Record<keyof JobPayload, string>>;
type SalaryRangeErrors = Partial<Record<'salaryMin' | 'salaryMax', string>>;

const BRAND_GRADIENT = 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)';

// One sx applied to the form wrapper — themes every field inside without touching each one.
const modernFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fff',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '& fieldset': { borderColor: 'rgba(12,82,131,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(10,182,162,0.55)' },
    '&.Mui-focused fieldset': { borderColor: '#0ab6a2', borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0ab6a2' },
} as const;

const STATUS_META: Record<JobPayload['status'], { label: string; color: string }> = {
  active: { label: 'Active', color: '#0ab6a2' },
  draft: { label: 'Draft', color: '#64748b' },
  closed: { label: 'Closed', color: '#ef4444' },
  expired: { label: 'Expired', color: '#b45309' },
};

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

const FormSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  caption: string;
  color: string;
  children: React.ReactNode;
}> = ({ icon, title, caption, color, children }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          boxShadow: `0 8px 16px -6px ${color}66`,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {caption}
        </Typography>
      </Box>
    </Box>
    {children}
  </Box>
);

const PreviewRow: React.FC<{ icon: React.ReactNode; text: string; filled: boolean }> = ({ icon, text, filled }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box sx={{ color: filled ? 'primary.main' : 'text.disabled', display: 'flex' }}>{icon}</Box>
    <Typography variant="body2" color={filled ? 'text.primary' : 'text.secondary'} noWrap sx={{ flex: 1 }}>
      {text}
    </Typography>
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
  const { data: employerData } = useGetMyEmployerProfileQuery();
  const { data: usageData } = useGetMyUsageQuery();
  const companyName = employerData?.data.companyName || 'Employer';
  const companyLogo = employerData?.data.logoUrl || '';
  const isLoading = isCreating || isUpdating;

  const effectiveFeatures = usageData?.data.effectiveFeatures;
  const activeJobsMeter = usageData?.data.usage.activeJobs;
  const featuredMeter = usageData?.data.usage.featuredJobs;
  const jobCreditsAvailable = usageData?.data.usage.jobCredits?.available ?? 0;
  const useJobCredit = Boolean(formData.useJobCredit);
  const quotaExhausted =
    !isEdit &&
    !useJobCredit &&
    Boolean(activeJobsMeter && activeJobsMeter.limit !== null && activeJobsMeter.used >= activeJobsMeter.limit);
  const canFeature = (effectiveFeatures?.featuredJobs ?? 0) > 0;
  const canScreen = Boolean(effectiveFeatures?.screeningQuestionsEnabled) || useJobCredit;
  const validityDays = useJobCredit ? 14 : effectiveFeatures?.jobValidityDays ?? null;

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

  const { data: jobTypesData, isLoading: jobTypesLoading } = useGetJobTypesQuery();
  const { data: skillsData, isLoading: skillsLoading } = useGetSkillsQuery();
  const { data: educationsData, isLoading: educationsLoading } = useGetEducationsQuery();
  const { data: salaryUnitsData, isLoading: salaryUnitsLoading } = useGetSalaryUnitsQuery();

  const jobTypeOptions = useMemo(() => jobTypesData?.data ?? [], [jobTypesData]);
  const skillOptions = useMemo(() => skillsData?.data ?? [], [skillsData]);
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
    const requiredFields: Array<keyof JobPayload> = ['title', 'type', 'location', 'description', 'experience', 'education'];

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (typeof value === 'string' && !value.trim()) {
        nextErrors[field] = 'This field is required';
      }
    });

    if (formData.skills.length === 0) {
      nextErrors.skills = 'Select at least one skill';
    }

    const nextSalaryErrors: SalaryRangeErrors = {};
    if (salaryRange.min && salaryRange.max && Number(salaryRange.max) < Number(salaryRange.min)) {
      nextSalaryErrors.salaryMax = 'Max salary must be greater than min salary';
    }

    setFormErrors(nextErrors);
    setSalaryErrors(nextSalaryErrors);
    return Object.keys(nextErrors).length === 0 && Object.keys(nextSalaryErrors).length === 0;
  };

  const handleSkillToggle = (skill: string) => {
    updateField(
      'skills',
      formData.skills.includes(skill)
        ? formData.skills.filter((item) => item !== skill)
        : [...formData.skills, skill],
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitError(`Please fix the highlighted fields before ${isEdit ? 'updating' : 'posting'}.`);
      return;
    }

    const payload: JobPayload = {
      ...formData,
      salary: getSalaryLabel(),
      screeningQuestions: (formData.screeningQuestions ?? []).filter((entry) => entry.question.trim()),
    };

    try {
      if (isEdit && id) {
        const response = await updateJob({ id, job: payload }).unwrap();
        setSuccessMessage(response.message);
        setTimeout(() => navigate(`/jobs/${id}`), 800);
        return;
      }

      const response = await createJob(payload).unwrap();
      setFormData({
        ...defaultJobForm,
        type: jobTypeOptions[0]?.value ?? '',
        education: educationOptions[0]?.value ?? '',
      });
      setSalaryRange({ min: '', max: '', unit: salaryUnitOptions[0]?.value ?? '' });
      setFormErrors({});
      setSalaryErrors({});
      setSuccessMessage(response.message);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, isEdit ? 'Unable to update job.' : 'Unable to post job.'));
    }
  };

  // Derived values for the live preview and completion meter.
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
  const educationName = educationOptions.find((option) => option.value === formData.education)?.name || formData.education;
  const skillNames = formData.skills.map(
    (value) => skillOptions.find((option) => option.value === value)?.name || value,
  );
  const salaryLabel = getSalaryLabel();
  const statusMeta = STATUS_META[formData.status];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} />

      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHeader
          title={isEdit ? 'Edit Job' : 'Post a New Job'}
          subtitle={isEdit ? 'Update the details of your job opening' : 'Fill in the details to post a new job opening'}
          breadcrumbs={[
            { label: 'Employer', path: '/employer/dashboard' },
            { label: isEdit ? 'Edit Job' : 'Post Job' },
          ]}
        />

        {isEdit && isJobLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">Loading job details...</Typography>
          </Box>
        )}

        {!isEdit && activeJobsMeter && activeJobsMeter.limit !== null && (
          <Alert
            severity={quotaExhausted ? 'warning' : 'info'}
            sx={{ mb: 3, borderRadius: 3 }}
            action={
              quotaExhausted && jobCreditsAvailable === 0 ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    color="inherit"
                    size="small"
                    disabled={isBuyingCredit}
                    onClick={async () => {
                      try {
                        const res = await purchaseCheckout({ type: 'pay_per_job' }).unwrap();
                        window.location.href = res.data.url;
                      } catch {
                        /* interceptor surfaces the error */
                      }
                    }}
                  >
                    Buy job credit
                  </Button>
                  <Button color="inherit" size="small" onClick={() => navigate('/pricing')}>
                    Upgrade
                  </Button>
                </Stack>
              ) : undefined
            }
          >
            {quotaExhausted
              ? jobCreditsAvailable > 0
                ? `All ${activeJobsMeter.limit} active job slots are in use — tick "Use a Pay Per Job credit" below to post this job anyway.`
                : `All ${activeJobsMeter.limit} active job slots on your plan are in use. Close a job, buy a Pay Per Job credit (₹499) or upgrade.`
              : `${activeJobsMeter.used} of ${activeJobsMeter.limit} active job slots in use on your plan.`}
          </Alert>
        )}

        {!isEdit && (jobCreditsAvailable > 0 || useJobCredit) && (
          <Alert severity="info" icon={<Bolt fontSize="inherit" />} sx={{ mb: 3, borderRadius: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useJobCredit}
                  onChange={(event) => updateField('useJobCredit', event.target.checked)}
                />
              }
              label={`Use a Pay Per Job credit (${jobCreditsAvailable} available) — 14-day listing with 15 profile unlocks`}
            />
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" variant="filled" sx={{ mb: 3, borderRadius: 3 }}>
            {successMessage}
          </Alert>
        )}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Form */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper
              elevation={0}
              sx={{
                border: '1px solid rgba(12,82,131,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 24px 60px -34px rgba(12,82,131,0.4)',
              }}
            >
              {/* Gradient header */}
              <Box
                sx={{
                  position: 'relative',
                  px: { xs: 2.5, md: 4 },
                  py: { xs: 3, md: 3.5 },
                  color: '#fff',
                  background: BRAND_GRADIENT,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    right: -70,
                    top: -70,
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '& svg': { fontSize: 28 },
                    }}
                  >
                    <WorkOutlined />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                      {isEdit ? 'Edit Job Opening' : 'Create a Job Opening'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                      Share the role details — candidates see this instantly once published.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ position: 'relative', mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.9 }}>
                      Required fields completed
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {completedCount}/{requiredChecks.length}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={completionPct}
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 5 },
                    }}
                  />
                </Box>
              </Box>

              {/* Form body */}
              <Box sx={{ p: { xs: 2.5, md: 4 }, ...modernFieldSx }}>
                <FormSection
                  icon={<WorkOutlined />}
                  color="#0c5283"
                  title="Job Overview"
                  caption="The headline details candidates scan first."
                >
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Job Title"
                        placeholder="e.g. Veterinary Surgeon"
                        value={formData.title}
                        error={Boolean(formErrors.title)}
                        helperText={formErrors.title}
                        onChange={(event) => updateField('title', event.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <TitleIcon sx={{ color: '#0c5283', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth disabled={jobTypesLoading} error={Boolean(formErrors.type)}>
                        <InputLabel>Job Type</InputLabel>
                        <Select
                          label="Job Type"
                          value={formData.type}
                          onChange={(event) => updateField('type', event.target.value)}
                        >
                          {jobTypeOptions.map((option) => (
                            <MenuItem key={option._id} value={option.value}>
                              {option.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.type && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {formErrors.type}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        options={indiaCityOptions}
                        filterOptions={filterCityOptions}
                        value={formData.location || null}
                        onChange={(_event, value) => updateField('location', value ?? '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            label="Location"
                            placeholder="Search Indian cities"
                            error={Boolean(formErrors.location)}
                            helperText={
                              formErrors.location || `${indiaCityOptions.length.toLocaleString()} Indian cities available`
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth error={Boolean(formErrors.experience)}>
                        <InputLabel>Experience Required</InputLabel>
                        <Select
                          label="Experience Required"
                          value={formData.experience}
                          onChange={(event) => updateField('experience', event.target.value)}
                        >
                          <MenuItem value="0-2">0-2 years</MenuItem>
                          <MenuItem value="2-5">2-5 years</MenuItem>
                          <MenuItem value="5-10">5-10 years</MenuItem>
                          <MenuItem value="10+">10+ years</MenuItem>
                        </Select>
                        {formErrors.experience && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {formErrors.experience}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </FormSection>

                <Divider sx={{ my: 4 }} />

                <FormSection
                  icon={<Payments />}
                  color="#0ab6a2"
                  title="Compensation"
                  caption="Transparent pay attracts stronger applicants."
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Min Salary"
                        inputMode="numeric"
                        value={salaryRange.min}
                        error={Boolean(salaryErrors.salaryMin)}
                        helperText={salaryErrors.salaryMin}
                        onChange={(event) => updateSalaryRange('min', event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Max Salary"
                        inputMode="numeric"
                        value={salaryRange.max}
                        error={Boolean(salaryErrors.salaryMax)}
                        helperText={salaryErrors.salaryMax}
                        onChange={(event) => updateSalaryRange('max', event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth disabled={salaryUnitsLoading}>
                        <InputLabel>Salary Unit</InputLabel>
                        <Select
                          label="Salary Unit"
                          value={salaryRange.unit}
                          onChange={(event) => updateSalaryRange('unit', event.target.value)}
                        >
                          {salaryUnitOptions.map((option) => (
                            <MenuItem key={option._id} value={option.value}>
                              {option.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: salaryLabel ? 'rgba(10,182,162,0.08)' : 'action.hover',
                      border: '1px solid',
                      borderColor: salaryLabel ? 'rgba(10,182,162,0.25)' : 'divider',
                    }}
                  >
                    <Payments sx={{ fontSize: 18, color: salaryLabel ? '#0ab6a2' : 'text.disabled' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: salaryLabel ? '#0c5283' : 'text.secondary' }}>
                      {salaryLabel ? `Candidates will see: ${salaryLabel}` : 'Add a range to display salary (optional).'}
                    </Typography>
                  </Box>
                </FormSection>

                <Divider sx={{ my: 4 }} />

                <FormSection
                  icon={<Description />}
                  color="#7c3aed"
                  title="Role Description"
                  caption="Describe the responsibilities and the skills you need."
                >
                  <TextField
                    fullWidth
                    label="Job Description"
                    multiline
                    minRows={6}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    value={formData.description}
                    error={Boolean(formErrors.description)}
                    helperText={formErrors.description || `${formData.description.length}/5000 characters`}
                    onChange={(event) => updateField('description', event.target.value)}
                  />

                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Required Skills
                      </Typography>
                      <Chip
                        size="small"
                        label={`${formData.skills.length} selected`}
                        sx={{
                          fontWeight: 700,
                          bgcolor: formData.skills.length ? 'rgba(10,182,162,0.12)' : 'action.hover',
                          color: formData.skills.length ? '#0ab6a2' : 'text.secondary',
                        }}
                      />
                    </Box>
                    {skillsLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption" color="text.secondary">
                          Loading skills...
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {skillOptions.map((option) => {
                          const selected = formData.skills.includes(option.value);
                          return (
                            <Chip
                              key={option._id}
                              label={option.name}
                              color={selected ? 'primary' : 'default'}
                              variant={selected ? 'filled' : 'outlined'}
                              clickable
                              onClick={() => handleSkillToggle(option.value)}
                              sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                transition: 'transform 0.15s ease',
                                '&:hover': { transform: 'translateY(-2px)' },
                              }}
                            />
                          );
                        })}
                      </Box>
                    )}
                    {formErrors.skills && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        {formErrors.skills}
                      </Typography>
                    )}
                  </Box>
                </FormSection>

                <Divider sx={{ my: 4 }} />

                <FormSection
                  icon={<Tune />}
                  color="#f59e0b"
                  title="Requirements & Visibility"
                  caption="Set the education bar, perks and who can see this job."
                >
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth disabled={educationsLoading} error={Boolean(formErrors.education)}>
                        <InputLabel>Education</InputLabel>
                        <Select
                          label="Education"
                          value={formData.education}
                          onChange={(event) => updateField('education', event.target.value)}
                        >
                          {educationOptions.map((option) => (
                            <MenuItem key={option._id} value={option.value}>
                              {option.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.education && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {formErrors.education}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Job Status</InputLabel>
                        <Select
                          label="Job Status"
                          value={formData.status}
                          onChange={(event) => updateField('status', event.target.value as JobPayload['status'])}
                        >
                          <MenuItem value="active">Active — visible to candidates</MenuItem>
                          <MenuItem value="draft">Draft — hidden from candidates</MenuItem>
                          <MenuItem value="closed">Closed — not accepting applications</MenuItem>
                          {formData.status === 'expired' && (
                            <MenuItem value="expired">Expired — choose Active to republish</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Benefits"
                        multiline
                        minRows={4}
                        placeholder="Health cover, flexible hours, learning stipend..."
                        value={formData.benefits}
                        onChange={(event) => updateField('benefits', event.target.value)}
                      />
                    </Grid>
                  </Grid>
                </FormSection>

                <Divider />

                <FormSection
                  icon={<Star />}
                  color="#8b5cf6"
                  title="Boost & Screening"
                  caption="Plan features: featured placement, screening questions and listing validity."
                >
                  <Stack spacing={2.5}>
                    {validityDays !== null && (
                      <Alert severity="info" variant="outlined" sx={{ borderRadius: 2.5 }}>
                        This job will stay live for {validityDays} days after posting
                        {useJobCredit ? ' (Pay Per Job credit)' : ' on your current plan'}.
                      </Alert>
                    )}

                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(formData.isFeatured)}
                            disabled={!canFeature}
                            onChange={(event) => updateField('isFeatured', event.target.checked)}
                          />
                        }
                        label={
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 600 }}>Feature this job</Typography>
                            {!canFeature && <Lock fontSize="small" color="disabled" />}
                            {canFeature && featuredMeter && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`${featuredMeter.used} of ${featuredMeter.limit} featured slots used`}
                              />
                            )}
                          </Stack>
                        }
                      />
                      {!canFeature && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 6 }}>
                          Featured jobs are pinned to the top of listings — included with the Premium
                          plan.{' '}
                          <Button size="small" onClick={() => navigate('/pricing')} sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>
                            Upgrade
                          </Button>
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>Screening questions</Typography>
                        {!canScreen && <Lock fontSize="small" color="disabled" />}
                        <Typography variant="caption" color="text.secondary">
                          (up to 5 — candidates must answer while applying)
                        </Typography>
                      </Stack>

                      {!canScreen ? (
                        <Typography variant="caption" color="text.secondary">
                          Screening questions are available on Pay Per Job and Premium plans.{' '}
                          <Button size="small" onClick={() => navigate('/pricing')} sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>
                            View plans
                          </Button>
                        </Typography>
                      ) : (
                        <Stack spacing={1.5}>
                          {(formData.screeningQuestions ?? []).map((entry, index) => (
                            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <TextField
                                fullWidth
                                size="small"
                                label={`Question ${index + 1}`}
                                value={entry.question}
                                slotProps={{ htmlInput: { maxLength: 300 } }}
                                onChange={(event) => {
                                  const next = [...(formData.screeningQuestions ?? [])];
                                  next[index] = { question: event.target.value };
                                  updateField('screeningQuestions', next);
                                }}
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  updateField(
                                    'screeningQuestions',
                                    (formData.screeningQuestions ?? []).filter((_q, i) => i !== index),
                                  )
                                }
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          ))}
                          {(formData.screeningQuestions ?? []).length < 5 && (
                            <Button
                              size="small"
                              startIcon={<Add />}
                              onClick={() =>
                                updateField('screeningQuestions', [
                                  ...(formData.screeningQuestions ?? []),
                                  { question: '' },
                                ])
                              }
                              sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
                            >
                              Add question
                            </Button>
                          )}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </FormSection>
              </Box>

              {/* Action bar */}
              <Box
                sx={{
                  px: { xs: 2.5, md: 4 },
                  py: 2.5,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'rgba(12,82,131,0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="text"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/employer/dashboard')}
                  sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                  Cancel
                </Button>
                <Button
                  size="large"
                  startIcon={isLoading ? <CircularProgress color="inherit" size={18} /> : <Save />}
                  disabled={isLoading || quotaExhausted}
                  onClick={handleSubmit}
                  sx={{
                    px: 4,
                    py: 1.1,
                    fontWeight: 800,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    color: '#fff',
                    background: BRAND_GRADIENT,
                    boxShadow: '0 12px 24px -10px rgba(12,82,131,0.6)',
                    '&:hover': {
                      background: BRAND_GRADIENT,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 16px 30px -10px rgba(12,82,131,0.7)',
                    },
                    '&.Mui-disabled': { background: 'rgba(12,82,131,0.4)', color: '#fff', opacity: 0.85 },
                  }}
                >
                  {isLoading
                    ? isEdit
                      ? 'Updating Job…'
                      : 'Posting Job…'
                    : isEdit
                      ? 'Update Job'
                      : 'Post Job'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Live preview */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                overflow: 'hidden',
                position: { lg: 'sticky' },
                top: 24,
              }}
            >
              <Box sx={{ px: 2.5, py: 2, background: BRAND_GRADIENT, color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility sx={{ fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.6 }}>
                    LIVE PREVIEW
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  How candidates will see this job
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar
                    src={companyLogo || undefined}
                    sx={{ width: 50, height: 50, borderRadius: 2, bgcolor: 'primary.main', fontWeight: 800 }}
                  >
                    {companyName.charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap color={formData.title ? 'text.primary' : 'text.secondary'}>
                      {formData.title || 'Job title preview'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {companyName}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gap: 1.25, mb: 2 }}>
                  <PreviewRow icon={<LocationOn fontSize="small" />} text={formData.location || 'Location'} filled={Boolean(formData.location)} />
                  <PreviewRow icon={<WorkOutlined fontSize="small" />} text={jobTypeName || 'Job type'} filled={Boolean(jobTypeName)} />
                  <PreviewRow
                    icon={<Bolt fontSize="small" />}
                    text={formData.experience ? `${formData.experience} years experience` : 'Experience level'}
                    filled={Boolean(formData.experience)}
                  />
                  <PreviewRow
                    icon={<Payments fontSize="small" />}
                    text={salaryLabel || 'Salary not disclosed'}
                    filled={Boolean(salaryLabel)}
                  />
                  <PreviewRow icon={<School fontSize="small" />} text={educationName || 'Education'} filled={Boolean(educationName)} />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
                  SKILLS
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1, mb: 2 }}>
                  {skillNames.length > 0 ? (
                    skillNames.map((skill) => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" color="primary" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No skills selected yet
                    </Typography>
                  )}
                </Box>

                <Chip
                  size="small"
                  label={`${statusMeta.label} listing`}
                  sx={{
                    fontWeight: 700,
                    bgcolor: `${statusMeta.color}1f`,
                    color: statusMeta.color,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PostJob;
