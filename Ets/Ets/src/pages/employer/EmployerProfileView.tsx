import { Link, useNavigate, useParams } from 'react-router-dom';
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
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import { Business, ChatBubbleOutlineOutlined as ChatBubbleOutline, Favorite, FavoriteBorder, LocationOn, Star, TrendingUp, Verified } from '@mui/icons-material';
import { JobCard } from '../../components/common/JobCard';
import { useGetEmployerProfileQuery } from '../../store/api/employerProfileApi';
import { useGetJobsQuery } from '../../store/api/jobApi';
import {
  useFollowEmployerMutation,
  useGetMyFollowsQuery,
  useUnfollowEmployerMutation,
} from '../../store/api/candidateProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';
import { useChat } from '../../context/ChatContext';

const EmployerProfileView: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { myRole, startChatWith } = useChat();
  const { data, isLoading, isError } = useGetEmployerProfileQuery(id, { skip: !id });
  const employer = data?.data;
  const { data: jobsData } = useGetJobsQuery({
    employerProfile: id || undefined,
    limit: 3,
  }, { skip: !id });
  const jobs = jobsData?.data.items ?? [];

  const isCandidate = myRole === 'candidate';
  const { data: usageData } = useGetMyUsageQuery(undefined, { skip: !isCandidate });
  const { data: followsData } = useGetMyFollowsQuery(undefined, { skip: !isCandidate });
  const [followEmployer, { isLoading: isFollowingReq }] = useFollowEmployerMutation();
  const [unfollowEmployer, { isLoading: isUnfollowingReq }] = useUnfollowEmployerMutation();

  const dmMeter = usageData?.data.usage.directMessages;
  const isFollowing = (followsData?.data.items ?? []).some(
    (follow) => follow.employerProfile?._id === id,
  );

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowEmployer(id).unwrap();
      } else {
        await followEmployer(id).unwrap();
      }
    } catch {
      // FEATURE_NOT_IN_PLAN opens the global upgrade dialog.
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !employer) {
    return (
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Employer profile not found.
        </Alert>
        <Button component={Link} to="/employers" variant="contained">
          Back to Employers
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ py: { xs: 6, md: 9 }, color: 'white', background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
                <Avatar src={employer.logoUrl || undefined} sx={{ width: 92, height: 92, borderRadius: 3, bgcolor: 'primary.dark', fontSize: 34, fontWeight: 800 }}>
                  {employer.companyName.charAt(0)}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {employer.companyName}
                    </Typography>
                    <Verified sx={{ color: '#d1fae5' }} />
                  </Box>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    {employer.organizationType} hiring across veterinary and care operations
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 720 }}>
                    {employer.overview}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip label={employer.headquarters} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }} />
                <Chip label={`${employer.openJobs ?? 0} open jobs`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }} />
                <Chip label={employer.teamSize} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }} />
                {myRole === 'candidate' && (
                  <>
                    <Button
                      startIcon={<ChatBubbleOutline />}
                      onClick={() =>
                        startChatWith({ peerProfileId: employer._id, peerName: employer.companyName })
                      }
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: '#fff',
                        color: '#0c5283',
                        borderRadius: 2,
                        px: 2,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                      }}
                    >
                      Message Employer
                      {dmMeter && dmMeter.limit > 0
                        ? ` (${Math.max(dmMeter.limit - dmMeter.used, 0)} of ${dmMeter.limit} left)`
                        : ''}
                    </Button>
                    <Button
                      startIcon={isFollowing ? <Favorite /> : <FavoriteBorder />}
                      disabled={isFollowingReq || isUnfollowingReq}
                      onClick={handleFollowToggle}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.5)',
                        borderRadius: 2,
                        px: 2,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                      }}
                    >
                      {isFollowing ? 'Following' : 'Follow for job updates'}
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.14)', color: 'white', backdropFilter: 'blur(12px)' }}>
                <CardContent>
                  <Typography variant="overline" sx={{ opacity: 0.75 }}>
                    Employer Snapshot
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                    {employer.openJobs ?? 0}
                    <Typography component="span" sx={{ ml: 1, fontSize: '1rem', opacity: 0.85 }}>
                      live roles
                    </Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Founded {employer.foundedYear || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
                    Hiring priority: {employer.hiringUrgency}
                  </Typography>
                  <Button component={Link} to="/jobs" fullWidth variant="contained" sx={{ bgcolor: 'white', color: 'primary.main', mb: 1.5 }}>
                    Browse Jobs
                  </Button>
                  <Button component={Link} to="/signup/employer" fullWidth variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                    Create Company Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  What this employer is known for
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {employer.specialties.map((specialty) => (
                    <Chip key={specialty} label={specialty} color="primary" variant="outlined" />
                  ))}
                  {employer.specialties.length === 0 && <Typography color="text.secondary">No specialties added yet.</Typography>}
                </Box>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Employer Value Proposition
                </Typography>
                <Grid container spacing={2}>
                  {employer.benefits.map((benefit) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={benefit}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(12, 82, 131, 0.05)', border: '1px solid rgba(12, 82, 131, 0.08)' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{benefit}</Typography>
                      </Box>
                    </Grid>
                  ))}
                  {employer.benefits.length === 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Typography color="text.secondary">No benefits added yet.</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Open Jobs
                </Typography>
                <Grid container spacing={2}>
                  {jobs.map((job) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={job._id}>
                      <JobCard
                        title={job.title}
                        clinic={job.companyName}
                        location={job.location}
                        salary={job.salary}
                        type={job.type}
                        skills={job.skills}
                        onClick={() => navigate(`/jobs/${job._id}`)}
                      />
                    </Grid>
                  ))}
                  {jobs.length === 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Typography color="text.secondary">No active jobs posted by this employer.</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, position: 'sticky', top: 24 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Quick Facts
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="primary" fontSize="small" />
                    <Typography variant="body2">{employer.headquarters}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business color="primary" fontSize="small" />
                    <Typography variant="body2">{employer.organizationType}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="primary" fontSize="small" />
                    <Typography variant="body2">{employer.openJobs ?? 0} live roles</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star color="primary" fontSize="small" />
                    <Typography variant="body2">{employer.workplaceModel}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Looking to create your own branded employer presence with job management?
                </Typography>
                <Button component={Link} to="/employer/profile" fullWidth variant="contained" sx={{ mb: 1.5 }}>
                  Build Company Profile
                </Button>
                <Button component={Link} to="/employers" fullWidth variant="outlined">
                  Back to Directory
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EmployerProfileView;
