import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccessTime,
  ArrowForward,
  AttachMoney,
  Bookmark,
  LocationOn,
  Verified,
  Work,
  WorkOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { PageHeader } from '../../components/common/PageHeader';
import { useGetMyCandidateProfileQuery } from '../../store/api/candidateProfileApi';
import { useGetMySavedJobsQuery, useUnsaveJobMutation } from '../../store/api/savedJobApi';

function formatSavedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const SavedJobs: React.FC = () => {
  const navigate = useNavigate();
  const { data: profileData } = useGetMyCandidateProfileQuery();
  const { data, isLoading, isFetching, isError } = useGetMySavedJobsQuery();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();

  const profile = profileData?.data;
  const candidateName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Candidate';
  const candidateRole = profile?.currentJobTitle || 'Candidate';

  const savedJobs = data?.data.items ?? [];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar type="candidate" userName={candidateName} userRole={candidateRole} />

      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, bgcolor: '#f4f8fc' }}>
        <PageHeader title="Saved Jobs" subtitle="Jobs you've bookmarked to revisit and apply later." />

        {isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            Unable to load your saved jobs. Please try again.
          </Alert>
        )}

        {(isLoading || isFetching) && savedJobs.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && !isFetching && !isError && savedJobs.length === 0 && (
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'rgba(12,82,131,0.10)' }}>
            <CardContent sx={{ textAlign: 'center', py: 7, color: 'text.secondary' }}>
              <Bookmark sx={{ fontSize: 48, color: 'rgba(10,182,162,0.4)', mb: 1 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary' }}>
                No saved jobs yet
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Tap the bookmark icon on any job to save it here for later.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Work />}
                onClick={() => navigate('/find-job')}
                sx={{
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                }}
              >
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        )}

        {savedJobs.length > 0 && (
          <Grid container spacing={3}>
            {savedJobs.map(({ _id, job, savedAt }) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={_id}>
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
                  <Box sx={{ height: 5, background: 'linear-gradient(90deg, #0c5283 0%, #0ab6a2 100%)' }} />

                  <Tooltip title="Remove from saved">
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        unsaveJob(job._id);
                      }}
                      disabled={isUnsaving}
                      aria-label="Remove from saved jobs"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 2,
                        width: 36,
                        height: 36,
                        bgcolor: 'rgba(10,182,162,0.14)',
                        color: '#0ab6a2',
                        border: '1px solid rgba(10,182,162,0.45)',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(10,182,162,0.22)', transform: 'scale(1.08)' },
                      }}
                    >
                      <Bookmark sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>

                  <CardContent sx={{ p: 2.75, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', gap: 1.75, mb: 2.25, pr: 5 }}>
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
                        <Typography variant="caption" color="text.secondary">Saved {formatSavedDate(savedAt)}</Typography>
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
                      <Chip
                        icon={<WorkOutlined sx={{ fontSize: 14 }} />}
                        label={job.type}
                        size="small"
                        sx={{ bgcolor: job.type === 'Full-time' ? 'rgba(10, 182, 162, 0.1)' : 'rgba(12, 82, 131, 0.1)', color: job.type === 'Full-time' ? '#0ab6a2' : '#0c5283', fontWeight: 700, fontSize: '0.7rem', '& .MuiChip-icon': { color: 'inherit' } }}
                      />
                      <Box className="view-cta" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0c5283', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.25s ease', flexShrink: 0 }}>
                        View
                        <ArrowForward sx={{ fontSize: 16 }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default SavedJobs;
