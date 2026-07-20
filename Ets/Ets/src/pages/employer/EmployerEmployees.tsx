import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Pagination,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { LocationOn, Lock, LockOpen, Search, Work } from '@mui/icons-material';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import {
  useGetCandidateProfilesQuery,
  useUnlockCandidateMutation,
} from '../../store/api/candidateProfileApi';
import { useGetMyEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';

const EmployerEmployees: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [salary, setSalary] = useState('');
  const { data: employerData } = useGetMyEmployerProfileQuery();
  const { data: usageData, refetch: refetchUsage } = useGetMyUsageQuery();

  const filtersAllowed = Boolean(usageData?.data.effectiveFeatures?.searchFiltersEnabled);
  const unlockBalance = usageData?.data.usage.unlockCredits?.accountBalance ?? 0;

  const { data, isLoading, isFetching, isError, refetch } = useGetCandidateProfilesQuery({
    search: search || undefined,
    // The backend rejects screening filters for un-entitled plans — don't send them.
    location: filtersAllowed && location ? location : undefined,
    experience: filtersAllowed && experience ? experience : undefined,
    salary: filtersAllowed && salary ? salary : undefined,
    page,
    limit: 9,
  });
  const [unlockCandidate] = useUnlockCandidateMutation();
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const companyName = employerData?.data.companyName || 'Employer';
  const candidates = data?.data.items ?? [];
  const pagination = data?.data.pagination;

  const handleUnlock = async (candidateProfileId: string) => {
    setUnlockingId(candidateProfileId);
    try {
      await unlockCandidate({ id: candidateProfileId }).unwrap();
      refetch();
      refetchUsage();
    } catch {
      // Plan-gate interceptor shows the buy-credits dialog on 402.
    } finally {
      setUnlockingId(null);
    }
  };

  const lockedFilterProps = filtersAllowed
    ? {}
    : {
        disabled: true,
        slotProps: {
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Lock fontSize="small" color="disabled" />
              </InputAdornment>
            ),
          },
        },
      };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="employer" userName={companyName} userRole="Employer" />
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        <PageHeader title="Employees" subtitle="Browse candidate profiles available for hiring and outreach." />

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Search candidates"
                  placeholder="Name, title, skill or organization"
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip title={filtersAllowed ? '' : 'Screening filters are available on paid plans'}>
                  <TextField
                    fullWidth
                    label="Location"
                    placeholder="City or preferred location"
                    value={location}
                    onChange={(event) => {
                      setPage(1);
                      setLocation(event.target.value);
                    }}
                    {...lockedFilterProps}
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Tooltip title={filtersAllowed ? '' : 'Screening filters are available on paid plans'}>
                  <TextField
                    fullWidth
                    label="Experience"
                    placeholder="e.g. surgeon"
                    value={experience}
                    onChange={(event) => {
                      setPage(1);
                      setExperience(event.target.value);
                    }}
                    {...lockedFilterProps}
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Tooltip title={filtersAllowed ? '' : 'Screening filters are available on paid plans'}>
                  <TextField
                    fullWidth
                    label="Salary expectation"
                    placeholder="e.g. 30000"
                    value={salary}
                    onChange={(event) => {
                      setPage(1);
                      setSalary(event.target.value);
                    }}
                    {...lockedFilterProps}
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Button fullWidth variant="contained" sx={{ height: '100%' }}><Search /></Button>
              </Grid>
              {!filtersAllowed && (
                <Grid size={{ xs: 12 }}>
                  <Alert
                    severity="info"
                    sx={{ borderRadius: 2.5 }}
                    action={
                      <Button color="inherit" size="small" onClick={() => navigate('/pricing')}>
                        View plans
                      </Button>
                    }
                  >
                    Screening filters (location, experience, salary) are included with Pay Per Job
                    and Premium plans.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Chip
            size="small"
            variant="outlined"
            color="secondary"
            icon={<LockOpen fontSize="small" />}
            label={`${unlockBalance} unlock credit${unlockBalance === 1 ? '' : 's'}`}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {isError && <Alert severity="error" sx={{ mb: 3 }}>Unable to load employees.</Alert>}
        {(isLoading || isFetching) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        <Grid container spacing={3}>
          {candidates.map((candidate) => {
            const locked = Boolean(candidate.locked);

            return (
              <Grid size={{ xs: 12, md: 6, xl: 4 }} key={candidate._id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: locked ? 'warning.light' : 'divider',
                    borderRadius: 3,
                    ...(locked ? { bgcolor: 'action.hover' } : {}),
                  }}
                >
                  <CardActionArea onClick={() => navigate(`/employer/employees/${candidate._id}`)} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Avatar
                          src={locked ? undefined : candidate.photoUrl || undefined}
                          sx={{ width: 64, height: 64, bgcolor: locked ? 'grey.400' : 'primary.main' }}
                        >
                          {locked ? <Lock /> : candidate.firstName.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, ...(locked ? { color: 'text.secondary' } : {}) }}>
                            {candidate.firstName} {candidate.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{candidate.currentJobTitle}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {candidate.excelMember && (
                              <Chip label="EXCEL" size="small" color="warning" sx={{ fontWeight: 700, height: 20 }} />
                            )}
                            {candidate.verifiedBadge && (
                              <Chip label="Verified" size="small" color="success" variant="outlined" sx={{ fontWeight: 700, height: 20 }} />
                            )}
                            {locked && (
                              <Chip label="Locked" size="small" variant="outlined" sx={{ height: 20 }} />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn color="primary" fontSize="small" />
                          <Typography variant="body2">{candidate.currentLocation}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Work color="primary" fontSize="small" />
                          <Typography variant="body2">{candidate.degree} - {candidate.educationLevel}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                        {candidate.skills.slice(0, 4).map((skill) => (
                          <Chip key={skill} label={skill} size="small" variant="outlined" />
                        ))}
                      </Box>
                      {locked ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          fullWidth
                          startIcon={<LockOpen fontSize="small" />}
                          disabled={unlockingId === candidate._id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleUnlock(candidate._id);
                          }}
                        >
                          {unlockingId === candidate._id ? 'Unlocking…' : 'Unlock (1 credit)'}
                        </Button>
                      ) : (
                        <Button size="small" variant="outlined" fullWidth>View Details</Button>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {!isLoading && !isFetching && candidates.length === 0 && (
          <Alert severity="info">No employees matched your search.</Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={pagination?.totalPages ?? 1} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
        </Box>
      </Box>
    </Box>
  );
};

export default EmployerEmployees;
