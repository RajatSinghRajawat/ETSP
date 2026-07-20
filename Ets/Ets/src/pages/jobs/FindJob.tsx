import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  AccessTime,
  ArrowForward,
  AttachMoney,
  Bookmark,
  BookmarkBorder,
  BusinessCenter,
  CheckCircle,
  Close,
  CurrencyRupee,
  FilterList,
  Insights,
  LocationOn,
  Search as SearchIcon,
  Tune,
  Verified,
  WorkOutlined,
} from '@mui/icons-material';
import { useGetJobsQuery, type CandidateApplicationStatus, type JobAppliedFilter } from '../../store/api/jobApi';
import { useGetJobTypesQuery, useGetSkillsQuery } from '../../store/api/lookupApi';
import { useGetMyApplicationsQuery } from '../../store/api/applicationApi';
import { useGetMySavedJobsQuery, useSaveJobMutation, useUnsaveJobMutation } from '../../store/api/savedJobApi';

const locations = ['Mumbai', 'Bangalore', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Gujarat'];
const experiences = ['0-2 years', '2-5 years', '5-10 years', '10+ years'];

const statusMeta: Record<CandidateApplicationStatus, { label: string; color: string }> = {
  new: { label: 'Applied', color: '#0c5283' },
  reviewing: { label: 'Under Review', color: '#d97706' },
  shortlisted: { label: 'Shortlisted', color: '#0ab6a2' },
  rejected: { label: 'Not Selected', color: '#dc2626' },
  hired: { label: 'Hired', color: '#10b981' },
};

// Shared rounded outline style for the filter drawer controls.
const selectSx = {
  borderRadius: 2.5,
  bgcolor: '#fff',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(12,82,131,0.16)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(12,82,131,0.4)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0ab6a2', borderWidth: 2 },
};

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fff',
    '& fieldset': { borderColor: 'rgba(12,82,131,0.16)' },
    '&:hover fieldset': { borderColor: 'rgba(12,82,131,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#0ab6a2', borderWidth: 2 },
  },
};

const filterLabelSx = {
  mb: 1,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
} as const;

function formatPostedDate(value: string) {
  const createdAt = new Date(value).getTime();
  const days = Math.floor((Date.now() - createdAt) / 86400000);

  if (Number.isNaN(createdAt) || days <= 0) {
    return 'Just now';
  }

  return days === 1 ? '1 day ago' : `${days} days ago`;
}

function getCurrentUserRole(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return (JSON.parse(raw) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

const FindJob: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialLocation = searchParams.get('loc') ?? '';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [appliedFilter, setAppliedFilter] = useState<JobAppliedFilter>('');
  const [filters, setFilters] = useState({
    location: initialLocation,
    jobType: '',
    salaryMin: '',
    salaryMax: '',
    experience: '',
    skills: '',
  });

  const [showStickySearch, setShowStickySearch] = useState(false);

  // Reveal a compact sticky search bar once the user scrolls past the hero.
  useEffect(() => {
    const handleScroll = () => setShowStickySearch(window.scrollY > 320);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCandidate = getCurrentUserRole() === 'candidate';

  const { data, isLoading, isFetching, isError } = useGetJobsQuery({
    search: searchTerm || undefined,
    location: filters.location || undefined,
    type: filters.jobType || undefined,
    experience: filters.experience || undefined,
    skill: filters.skills || undefined,
    applied: isCandidate ? appliedFilter : undefined,
    page,
    limit: 9,
  });

  // Keep "Applied" badges fresh even if the job list cache is stale — this query
  // is invalidated whenever the candidate submits a new application.
  const { data: myAppsData } = useGetMyApplicationsQuery(undefined, { skip: !isCandidate });
  const appliedStatusMap = useMemo(() => {
    const map = new Map<string, CandidateApplicationStatus>();
    (myAppsData?.data.items ?? []).forEach((application) => {
      map.set(application.job._id, application.status);
    });
    return map;
  }, [myAppsData]);

  // Saved jobs — bookmark state for candidates.
  const { data: savedJobsData } = useGetMySavedJobsQuery(undefined, { skip: !isCandidate });
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();
  const savedJobIds = useMemo(
    () => new Set((savedJobsData?.data.items ?? []).map((entry) => entry.job._id)),
    [savedJobsData],
  );

  const toggleSave = (event: React.MouseEvent, jobId: string) => {
    event.stopPropagation();
    if (savedJobIds.has(jobId)) {
      unsaveJob(jobId);
    } else {
      saveJob(jobId);
    }
  };

  const { data: jobTypesData } = useGetJobTypesQuery();
  const { data: skillsData } = useGetSkillsQuery();
  const jobTypeOptions = jobTypesData?.data ?? [];
  const skillOptions = skillsData?.data ?? [];

  const jobs = data?.data.items ?? [];
  const pagination = data?.data.pagination;
  const appliedCount = appliedStatusMap.size;

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleAppliedFilterChange = (value: JobAppliedFilter | null) => {
    setPage(1);
    setAppliedFilter(value ?? '');
  };

  const clearFilters = () => {
    setPage(1);
    setAppliedFilter('');
    setFilters({ location: '', jobType: '', salaryMin: '', salaryMax: '', experience: '', skills: '' });
  };

  const getJobApplication = (job: (typeof jobs)[number]) => {
    const status = job.applicationStatus ?? appliedStatusMap.get(job._id) ?? null;
    const hasApplied = Boolean(job.hasApplied) || appliedStatusMap.has(job._id);
    return { hasApplied, status };
  };

  const statusToggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={appliedFilter}
      onChange={(_, value) => handleAppliedFilterChange(value)}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2.5,
        p: 0.5,
        '& .MuiToggleButton-root': {
          border: 0,
          borderRadius: '8px !important',
          px: 2,
          py: 0.6,
          fontWeight: 700,
          textTransform: 'none',
          color: 'text.secondary',
          '&.Mui-selected': {
            color: '#fff',
            background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)' },
          },
        },
      }}
    >
      <ToggleButton value="">All Jobs</ToggleButton>
      <ToggleButton value="applied">Applied{appliedCount ? ` (${appliedCount})` : ''}</ToggleButton>
      <ToggleButton value="unapplied">Not Applied</ToggleButton>
    </ToggleButtonGroup>
  );

  const renderFilterContent = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList sx={{ color: '#0ab6a2' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Filters</Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ display: { md: 'none' } }}><Close /></IconButton>
      </Box>

      {isCandidate && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.2, fontWeight: 700 }}>Application Status</Typography>
          <Stack spacing={1}>
            {([
              { value: '', label: 'All Jobs' },
              { value: 'applied', label: `Applied${appliedCount ? ` (${appliedCount})` : ''}` },
              { value: 'unapplied', label: 'Not Applied' },
            ] as { value: JobAppliedFilter; label: string }[]).map((option) => {
              const selected = appliedFilter === option.value;
              return (
                <Button
                  key={option.value || 'all'}
                  fullWidth
                  onClick={() => handleAppliedFilterChange(option.value)}
                  sx={{
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    py: 1,
                    px: 1.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    color: selected ? '#fff' : 'text.primary',
                    border: '1px solid',
                    borderColor: selected ? 'transparent' : 'rgba(12,82,131,0.16)',
                    background: selected ? 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)' : 'transparent',
                    '&:hover': { borderColor: '#0ab6a2', bgcolor: selected ? undefined : 'rgba(10,182,162,0.06)' },
                  }}
                >
                  {option.label}
                </Button>
              );
            })}
          </Stack>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={filterLabelSx}>
          <LocationOn sx={{ fontSize: 18, color: '#0ab6a2' }} /> Location
        </Typography>
        <FormControl fullWidth>
          <Select displayEmpty value={filters.location} onChange={(event) => handleFilterChange('location', event.target.value)} sx={selectSx}>
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((location) => <MenuItem key={location} value={location}>{location}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={filterLabelSx}>
          <BusinessCenter sx={{ fontSize: 18, color: '#0ab6a2' }} /> Job Type
        </Typography>
        <FormControl fullWidth>
          <Select displayEmpty value={filters.jobType} onChange={(event) => handleFilterChange('jobType', event.target.value)} sx={selectSx}>
            <MenuItem value="">All Types</MenuItem>
            {jobTypeOptions.map((option) => <MenuItem key={option._id} value={option.value}>{option.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={filterLabelSx}>
          <Insights sx={{ fontSize: 18, color: '#0ab6a2' }} /> Experience
        </Typography>
        <FormControl fullWidth>
          <Select displayEmpty value={filters.experience} onChange={(event) => handleFilterChange('experience', event.target.value)} sx={selectSx}>
            <MenuItem value="">Any Experience</MenuItem>
            {experiences.map((experience) => <MenuItem key={experience} value={experience}>{experience}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Typography variant="subtitle2" sx={filterLabelSx}>
        <CurrencyRupee sx={{ fontSize: 18, color: '#0ab6a2' }} /> Salary Range (LPA)
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Min"
          type="number"
          fullWidth
          value={filters.salaryMin}
          onChange={(event) => handleFilterChange('salaryMin', event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment> } }}
          sx={textFieldSx}
        />
        <TextField
          placeholder="Max"
          type="number"
          fullWidth
          value={filters.salaryMax}
          onChange={(event) => handleFilterChange('salaryMax', event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment> } }}
          sx={textFieldSx}
        />
      </Box>

      <Typography variant="subtitle2" sx={filterLabelSx}>
        <Tune sx={{ fontSize: 18, color: '#0ab6a2' }} /> Skills
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {skillOptions.map((skill) => (
          <Chip
            key={skill._id}
            label={skill.name}
            variant={filters.skills === skill.value ? 'filled' : 'outlined'}
            onClick={() => handleFilterChange('skills', filters.skills === skill.value ? '' : skill.value)}
            color={filters.skills === skill.value ? 'primary' : 'default'}
            size="small"
            sx={{ borderRadius: 1.5 }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, fontWeight: 700 }}>Apply</Button>
        <Button fullWidth variant="outlined" onClick={clearFilters} sx={{ borderRadius: 2, fontWeight: 700 }}>Clear</Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f8fc' }}>
      {/* Sticky compact search bar — slides in below the navbar on scroll */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 64, md: 72 },
          left: 0,
          right: 0,
          zIndex: 1099,
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: showStickySearch ? '0 6px 20px rgba(12,82,131,0.12)' : 'none',
          transform: showStickySearch ? 'translateY(0)' : 'translateY(-120%)',
          opacity: showStickySearch ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease, box-shadow 0.3s ease',
          pointerEvents: showStickySearch ? 'auto' : 'none',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search by job title, skills, or clinic..."
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                  sx: { borderRadius: 999, bgcolor: 'background.paper' },
                },
              }}
              sx={{ width: '100%', maxWidth: 640 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setPage(1)}
              sx={{ borderRadius: 999, fontWeight: 700, px: 3, flexShrink: 0, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Search
            </Button>
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open filters"
              sx={{
                flexShrink: 0,
                border: '1px solid',
                borderColor: 'divider',
                color: '#0c5283',
                '&:hover': { bgcolor: 'rgba(10,182,162,0.08)', borderColor: '#0ab6a2' },
              }}
            >
              <Tune />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)', color: 'white', py: { xs: 6, md: 9 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Find Your Dream Veterinary Job
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.92, maxWidth: 620, mx: 'auto', fontWeight: 400, fontSize: { xs: '1rem', md: '1.15rem' } }}>
              Search from {pagination?.total ?? 0}+ veterinary jobs from top animal hospitals and clinics across India
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: 999, p: 0.75, maxWidth: 820, mx: 'auto', bgcolor: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="Search by job title, skills, or clinic..."
                value={searchTerm}
                onChange={(event) => {
                  setPage(1);
                  setSearchTerm(event.target.value);
                }}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    startAdornment: <SearchIcon sx={{ color: 'action.active', mx: 1.5 }} />,
                  },
                }}
                sx={{ flex: 1, '& input': { py: 1.2 } }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ px: 4, py: 1.5, borderRadius: 999, fontWeight: 700, flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
                startIcon={<SearchIcon />}
                onClick={() => setPage(1)}
              >
                Search Jobs
              </Button>
              <IconButton
                onClick={() => setDrawerOpen(true)}
                aria-label="Open filters"
                sx={{
                  flexShrink: 0,
                  width: 48,
                  height: 48,
                  border: '1px solid',
                  borderColor: 'divider',
                  color: '#0c5283',
                  '&:hover': { bgcolor: 'rgba(10,182,162,0.08)', borderColor: '#0ab6a2' },
                }}
              >
                <Tune />
              </IconButton>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            {skillOptions.slice(0, 6).map((skill) => (
              <Chip
                key={skill._id}
                label={skill.name}
                clickable
                onClick={() => handleFilterChange('skills', skill.value)}
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 2, px: 1, fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 5, px: { xs: 2, md: 4 } }}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c5283' }}>
              {appliedFilter === 'applied' ? 'Your Applied Jobs' : appliedFilter === 'unapplied' ? 'Jobs To Explore' : 'Search Results'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing {jobs.length} of {pagination?.total ?? 0} jobs found
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isCandidate && <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{statusToggle}</Box>}
            <Button startIcon={<Tune />} variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ borderWidth: 2, borderRadius: 2, fontWeight: 700 }}>
              Filters
            </Button>
          </Box>
        </Box>

        {isCandidate && (
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, mb: 3, justifyContent: 'center' }}>{statusToggle}</Box>
        )}

        <Box>
            {isError && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>Unable to load jobs. Please try again.</Alert>}
            {(isLoading || isFetching) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            )}
            {!isLoading && !isFetching && !isError && jobs.length === 0 && (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                {appliedFilter === 'applied'
                  ? "You haven't applied to any jobs matching these filters yet."
                  : 'No jobs matched your search filters.'}
              </Alert>
            )}
            <Grid container spacing={3}>
              {jobs.map((job) => {
                const { hasApplied, status } = getJobApplication(job);
                const meta = status ? statusMeta[status] : null;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={job._id}>
                    <Card
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: hasApplied ? 'rgba(10,182,162,0.45)' : 'rgba(12,82,131,0.10)',
                        bgcolor: 'background.paper',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          boxShadow: '0 24px 48px -20px rgba(12, 82, 131, 0.45)',
                          borderColor: '#0ab6a2',
                        },
                        '&:hover .view-cta': { gap: 1, color: '#0ab6a2' },
                      }}
                    >
                      {/* Top accent strip */}
                      <Box sx={{ height: 5, background: 'linear-gradient(90deg, #0c5283 0%, #0ab6a2 100%)' }} />

                      {isCandidate && (
                        <IconButton
                          onClick={(event) => toggleSave(event, job._id)}
                          aria-label={savedJobIds.has(job._id) ? 'Remove from saved jobs' : 'Save job'}
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 2,
                            width: 36,
                            height: 36,
                            bgcolor: savedJobIds.has(job._id) ? 'rgba(10,182,162,0.14)' : 'rgba(255,255,255,0.9)',
                            color: savedJobIds.has(job._id) ? '#0ab6a2' : '#94a3b8',
                            border: '1px solid',
                            borderColor: savedJobIds.has(job._id) ? 'rgba(10,182,162,0.45)' : 'rgba(12,82,131,0.12)',
                            transition: 'all 0.2s ease',
                            '&:hover': { bgcolor: 'rgba(10,182,162,0.2)', color: '#0ab6a2', transform: 'scale(1.08)' },
                          }}
                        >
                          {savedJobIds.has(job._id) ? <Bookmark sx={{ fontSize: 20 }} /> : <BookmarkBorder sx={{ fontSize: 20 }} />}
                        </IconButton>
                      )}

                      <CardContent sx={{ p: 2.75, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', gap: 1.75, mb: 2.25, pr: isCandidate ? 5 : 0 }}>
                          <Box
                            sx={{
                              width: 54,
                              height: 54,
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                              color: 'white',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              fontSize: '1.35rem',
                              flexShrink: 0,
                              boxShadow: '0 8px 18px -6px rgba(10,182,162,0.6)',
                            }}
                          >
                            {job.companyName.charAt(0).toUpperCase()}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              title={job.title}
                              sx={{
                                fontWeight: 800,
                                fontSize: '1.02rem',
                                mb: 0.4,
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {job.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }} noWrap>
                                {job.companyName}
                              </Typography>
                              <Verified sx={{ fontSize: 15, color: 'success.main', flexShrink: 0 }} />
                            </Box>
                            {(job.isFeatured || job.isUrgent) && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                {job.isFeatured && (
                                  <Chip label="Featured" size="small" color="secondary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                )}
                                {job.isUrgent && (
                                  <Chip label="Urgent" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>

                        {/* Salary highlight */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 1,
                            mb: 2,
                            borderRadius: 2.5,
                            bgcolor: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.18)',
                          }}
                        >
                          <Box sx={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(16,185,129,0.18)' }}>
                            <AttachMoney sx={{ fontSize: 18, color: '#059669' }} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#047857' }} noWrap>
                            {job.salary || 'Negotiable'}
                          </Typography>
                        </Box>

                        {/* Meta row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                            <LocationOn sx={{ fontSize: 17, color: 'text.secondary', flexShrink: 0 }} />
                            <Typography variant="body2" color="text.secondary" noWrap>{job.location}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                            <AccessTime sx={{ fontSize: 15, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">{formatPostedDate(job.createdAt)}</Typography>
                          </Box>
                        </Box>

                        {/* Skills */}
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2, minHeight: 26 }}>
                          {job.skills.slice(0, 3).map((skill) => (
                            <Chip
                              key={skill}
                              label={skill}
                              size="small"
                              sx={{ fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, bgcolor: 'rgba(12,82,131,0.07)', color: '#0c5283' }}
                            />
                          ))}
                          {job.skills.length > 3 && (
                            <Chip
                              label={`+${job.skills.length - 3}`}
                              size="small"
                              sx={{ fontSize: '0.7rem', fontWeight: 700, borderRadius: 1.5, bgcolor: 'rgba(10,182,162,0.12)', color: '#0ab6a2' }}
                            />
                          )}
                        </Box>

                        {/* Footer */}
                        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.75, borderTop: '1px solid', borderColor: 'rgba(12,82,131,0.08)' }}>
                          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip
                              icon={<WorkOutlined sx={{ fontSize: 14 }} />}
                              label={job.type}
                              size="small"
                              sx={{ bgcolor: job.type === 'Full-time' ? 'rgba(10, 182, 162, 0.1)' : 'rgba(12, 82, 131, 0.1)', color: job.type === 'Full-time' ? '#0ab6a2' : '#0c5283', fontWeight: 700, fontSize: '0.7rem', '& .MuiChip-icon': { color: 'inherit' } }}
                            />
                            {hasApplied && (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                label={meta?.label ?? 'Applied'}
                                size="small"
                                sx={{ bgcolor: meta?.color ?? '#0ab6a2', color: '#fff', fontWeight: 700, fontSize: '0.68rem', '& .MuiChip-icon': { color: '#fff' } }}
                              />
                            )}
                          </Box>
                          <Box className="view-cta" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0c5283', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.25s ease', flexShrink: 0 }}>
                            View
                            <ArrowForward sx={{ fontSize: 16 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Pagination count={pagination.totalPages} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" size="large" />
              </Box>
            )}
        </Box>
      </Container>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { borderTopLeftRadius: 16, borderBottomLeftRadius: 16 } } }}
      >
        <Box sx={{ width: { xs: '88vw', sm: 440 } }}>
          {renderFilterContent()}
        </Box>
      </Drawer>
    </Box>
  );
};

export default FindJob;
