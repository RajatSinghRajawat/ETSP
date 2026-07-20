import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Close, FilterList } from '@mui/icons-material';
import { JobCard } from '../../components/common/JobCard';
import { useGetJobsQuery } from '../../store/api/jobApi';

const locations = ['Mumbai', 'Bangalore', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'];
const jobTypes = ['Full-time', 'Part-time', 'Contract'];
const experiences = ['0-2 years', '2-5 years', '5-10 years', '10+ years'];

const JobListing: React.FC = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    salaryMin: '',
    salaryMax: '',
    experience: '',
  });

  const { data, isLoading, isFetching, isError } = useGetJobsQuery({
    search: searchTerm || undefined,
    location: filters.location || locationTerm || undefined,
    type: filters.jobType || undefined,
    experience: filters.experience || undefined,
    page,
    limit: 6,
  });

  const jobs = data?.data.items ?? [];
  const pagination = data?.data.pagination;

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ location: '', jobType: '', salaryMin: '', salaryMax: '', experience: '' });
  };

  const renderFilterContent = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Filters</Typography>
        <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
      </Box>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Location</InputLabel>
        <Select value={filters.location} label="Location" onChange={(event) => handleFilterChange('location', event.target.value)}>
          <MenuItem value="">All Locations</MenuItem>
          {locations.map((location) => <MenuItem key={location} value={location}>{location}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Job Type</InputLabel>
        <Select value={filters.jobType} label="Job Type" onChange={(event) => handleFilterChange('jobType', event.target.value)}>
          <MenuItem value="">All Types</MenuItem>
          {jobTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Experience</InputLabel>
        <Select value={filters.experience} label="Experience" onChange={(event) => handleFilterChange('experience', event.target.value)}>
          <MenuItem value="">Any Experience</MenuItem>
          {experiences.map((experience) => <MenuItem key={experience} value={experience}>{experience}</MenuItem>)}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField label="Min Salary" type="number" size="small" fullWidth value={filters.salaryMin} onChange={(event) => handleFilterChange('salaryMin', event.target.value)} />
        <TextField label="Max Salary" type="number" size="small" fullWidth value={filters.salaryMax} onChange={(event) => handleFilterChange('salaryMax', event.target.value)} />
      </Box>

      <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)}>Apply Filters</Button>
      <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={clearFilters}>Clear All</Button>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>Find Your Perfect Veterinary Job</Typography>
          <Box sx={{ display: 'flex', gap: 2, maxWidth: 800, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              placeholder="Search jobs, skills..."
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
              slotProps={{ input: { sx: { bgcolor: 'white' } } }}
            />
            <TextField
              fullWidth
              placeholder="Location"
              value={locationTerm}
              onChange={(event) => {
                setPage(1);
                setLocationTerm(event.target.value);
              }}
              slotProps={{ input: { sx: { bgcolor: 'white' } } }}
            />
            <Button variant="contained" color="secondary" sx={{ px: 4 }} onClick={() => setPage(1)}>Search</Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>All Jobs ({pagination?.total ?? 0})</Typography>
          <Button startIcon={<FilterList />} variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ display: { md: 'none' } }}>Filters</Button>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 9 }}>
            {isError && <Alert severity="error" sx={{ mb: 3 }}>Unable to load jobs. Please try again.</Alert>}
            {(isLoading || isFetching) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            )}
            {!isLoading && !isFetching && !isError && jobs.length === 0 && (
              <Alert severity="info">No jobs found for the selected filters.</Alert>
            )}
            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid size={{ xs: 12, sm: 6 }} key={job._id}>
                  <JobCard
                    title={job.title}
                    clinic={job.companyName}
                    location={job.location}
                    salary={job.salary}
                    type={job.type}
                    skills={job.skills}
                    featured={Boolean(job.isFeatured)}
                    urgent={Boolean(job.isUrgent)}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pagination?.totalPages ?? 1} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', position: 'sticky', top: 20 }}>
              {renderFilterContent()}
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300 }}>
          {renderFilterContent()}
        </Box>
      </Drawer>
    </Box>
  );
};

export default JobListing;
