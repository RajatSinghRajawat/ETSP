import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
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
  MenuItem,
  Pagination,
  Paper,
  Select,
  Typography,
  TextField,
} from '@mui/material';
import {
  ArrowForward,
  Business,
  Close,
  FilterList,
  Groups,
  LocationOn,
  People,
  Search as SearchIcon,
  Star,
  Tune,
  Verified,
} from '@mui/icons-material';
import { useGetEmployerProfilesQuery } from '../../store/api/employerProfileApi';

const locations = ['Mumbai', 'Bangalore', 'Delhi NCR', 'Hyderabad', 'Pune'];
const organizationTypes = ['Hospital', 'Clinic', 'Organization', 'Pet Store'];
const teamSizes = ['1-10', '10-50', '50-100', '100+'];

// Shared rounded outline style for the filter drawer controls.
const selectSx = {
  borderRadius: 2.5,
  bgcolor: '#fff',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(12,82,131,0.16)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(12,82,131,0.4)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0ab6a2', borderWidth: 2 },
};

const filterLabelSx = {
  mb: 1,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
} as const;

const Employers: React.FC = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    size: '',
  });

  // Reveal a compact sticky search bar once the user scrolls past the hero.
  useEffect(() => {
    const handleScroll = () => setShowStickySearch(window.scrollY > 320);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data, isLoading, isFetching, isError } = useGetEmployerProfilesQuery({
    search: searchTerm || undefined,
    location: filters.location || undefined,
    type: filters.type || undefined,
    size: filters.size || undefined,
    page,
    limit: 9,
  });

  const employers = data?.data.items ?? [];
  const pagination = data?.data.pagination;

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ location: '', type: '', size: '' });
  };

  const renderFilterContent = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList sx={{ color: '#0ab6a2' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Filters</Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)} size="small"><Close /></IconButton>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={filterLabelSx}>
          <LocationOn sx={{ fontSize: 18, color: '#0ab6a2' }} /> Location
        </Typography>
        <FormControl fullWidth>
          <Select displayEmpty value={filters.location} onChange={(event) => updateFilter('location', event.target.value)} sx={selectSx}>
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((location) => <MenuItem key={location} value={location}>{location}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={filterLabelSx}>
          <Business sx={{ fontSize: 18, color: '#0ab6a2' }} /> Type
        </Typography>
        <FormControl fullWidth>
          <Select displayEmpty value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} sx={selectSx}>
            <MenuItem value="">All Types</MenuItem>
            {organizationTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={filterLabelSx}>
          <Groups sx={{ fontSize: 18, color: '#0ab6a2' }} /> Size
        </Typography>
        <FormControl fullWidth>
          <Select displayEmpty value={filters.size} onChange={(event) => updateFilter('size', event.target.value)} sx={selectSx}>
            <MenuItem value="">All Sizes</MenuItem>
            {teamSizes.map((size) => <MenuItem key={size} value={size}>{size} employees</MenuItem>)}
          </Select>
        </FormControl>
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
              placeholder="Search employers, clinics..."
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
      <Box sx={{ background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)', color: 'white', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Chip
              label="Employer Portal"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, mb: 2 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Hire Top Veterinary Candidates Across Cities
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.92, maxWidth: 650, mx: 'auto', fontWeight: 400, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 3 }}>
              Connect directly with verified veterinarians, pet groomers, trainers, and clinic staff
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/employer/post-job')}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#0c5283',
                  fontWeight: 800,
                  px: 4,
                  py: 1.5,
                  borderRadius: 999,
                  '&:hover': { bgcolor: '#f0f4f8' }
                }}
              >
                Post a Job for Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/signup/employer')}
                sx={{
                  borderColor: '#ffffff',
                  color: '#ffffff',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 999,
                  '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Register Clinic / Hospital
              </Button>
            </Box>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: 999, p: 0.75, maxWidth: 820, mx: 'auto', bgcolor: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.18)', mt: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="Search employers, clinics..."
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
                Search
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
        </Container>
      </Box>

      {/* Why Choose VetsLinked for Employers */}
      <Box sx={{ py: 6, bgcolor: 'rgba(12, 82, 131, 0.03)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 4, color: '#0c5283' }}>
            Why Choose VetsLinked for Employers?
          </Typography>
          <Grid container spacing={3}>
            {[
              { title: 'Easy Job Posting', desc: 'Create and publish job listings in under 2 minutes.', icon: '⚡' },
              { title: 'Specialized Profiles', desc: 'Profiles tailored exclusively for veterinary and pet care roles.', icon: '🐾' },
              { title: 'Verified Candidates', desc: 'Background-verified doctors and staff ready for hire.', icon: '✓' },
              { title: 'Direct Chat', desc: 'Instantly connect and message candidates directly.', icon: '💬' },
            ].map((feature, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid rgba(12,82,131,0.1)', bgcolor: 'white', textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>{feature.icon}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0c5283' }}>{feature.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{feature.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Quick Job Post by Role Icons */}
          <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(12,82,131,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', mb: 3, color: '#0c5283' }}>
              Hire Candidates for Any Role (Click to Post Job)
            </Typography>
            <Grid container spacing={2}>
              {[
                'Veterinarian', 'Veterinary Assistant', 'Ward Boy', 
                'Pet Trainer', 'Pet Groomer', 'Receptionist', 
                'Floor Manager', 'Sales Manager', 'Inventory Incharge'
              ].map((role) => (
                <Grid size={{ xs: 6, sm: 4, md: 2.66 }} key={role}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(`/employer/post-job?title=${encodeURIComponent(role)}`)}
                    sx={{
                      py: 1.5,
                      borderRadius: 2.5,
                      borderColor: 'rgba(12,82,131,0.2)',
                      color: '#0c5283',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      '&:hover': {
                        bgcolor: 'rgba(10,182,162,0.08)',
                        borderColor: '#0ab6a2'
                      }
                    }}
                  >
                    + {role}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 5, px: { xs: 2, md: 4 } }}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c5283' }}>
              Top Employers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing {employers.length} of {pagination?.total ?? 0} verified employers
            </Typography>
          </Box>
          <Button startIcon={<Tune />} variant="outlined" onClick={() => setDrawerOpen(true)} sx={{ borderWidth: 2, borderRadius: 2, fontWeight: 700 }}>
            Filters
          </Button>
        </Box>

        <Box>
          {isError && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>Unable to load employers. Please try again.</Alert>}
          {(isLoading || isFetching) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && !isFetching && !isError && employers.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No employers matched your filters.</Alert>
          )}

          <Grid container spacing={3}>
            {employers.map((employer) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={employer._id}>
                <Card
                  onClick={() => navigate(`/employer/profile/${employer._id}`)}
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'rgba(12,82,131,0.10)',
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
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

                  <CardContent sx={{ p: 2.75, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', gap: 1.75, mb: 2 }}>
                      <Avatar
                        src={employer.logoUrl || undefined}
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 3,
                          fontWeight: 800,
                          fontSize: '1.4rem',
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                          boxShadow: '0 8px 18px -6px rgba(10,182,162,0.6)',
                        }}
                      >
                        {employer.companyName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.02rem', lineHeight: 1.3 }} noWrap>
                            {employer.companyName}
                          </Typography>
                          <Verified sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {employer.headquarters}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Meta chips */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={employer.organizationType} size="small" sx={{ bgcolor: 'rgba(12, 82, 131, 0.1)', color: '#0c5283', fontWeight: 700, fontSize: '0.7rem' }} />
                      <Chip icon={<Business sx={{ fontSize: 14 }} />} label={`${employer.openJobs ?? 0} open jobs`} size="small" sx={{ bgcolor: 'rgba(10, 182, 162, 0.1)', color: '#0ab6a2', fontWeight: 700, fontSize: '0.7rem', '& .MuiChip-icon': { color: '#0ab6a2' } }} />
                      <Chip icon={<People sx={{ fontSize: 14 }} />} label={employer.teamSize} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </Box>

                    {/* Specialties */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2, minHeight: 26 }}>
                      {employer.specialties.slice(0, 3).map((specialty) => (
                        <Chip
                          key={specialty}
                          label={specialty}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, bgcolor: 'rgba(12,82,131,0.07)', color: '#0c5283' }}
                        />
                      ))}
                      {employer.specialties.length > 3 && (
                        <Chip
                          label={`+${employer.specialties.length - 3}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 700, borderRadius: 1.5, bgcolor: 'rgba(10,182,162,0.12)', color: '#0ab6a2' }}
                        />
                      )}
                    </Box>

                    {/* Footer */}
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.75, borderTop: '1px solid', borderColor: 'rgba(12,82,131,0.08)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Verified</Typography>
                      </Box>
                      <Box className="view-cta" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0c5283', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.25s ease' }}>
                        View Profile
                        <ArrowForward sx={{ fontSize: 16 }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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

export default Employers;
