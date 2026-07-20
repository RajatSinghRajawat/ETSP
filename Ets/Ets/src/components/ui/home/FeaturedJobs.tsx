import { Box, Container, Typography, Card, CardContent, Chip, Button, Avatar, IconButton, Skeleton } from '@mui/material';
import { LocationOn, AttachMoney, ArrowForward, AccessTime, Verified, BookmarkBorder, WorkOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useGetJobsQuery, type JobResponse } from '../../../store/api/jobApi';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const FeaturedJobs: React.FC = () => {
  const { data, isLoading } = useGetJobsQuery({ limit: 4 });
  const jobs: JobResponse[] = data?.data?.items ?? [];
  const skeletonCount = 4;

  return (
    <Box sx={{ py: 10, bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'linear-gradient(180deg, rgba(12, 82, 131, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Verified sx={{ color: 'secondary.main', fontSize: 24 }} />
            <Typography
              variant="overline"
              sx={{
                color: 'secondary.main',
                fontWeight: 600,
                letterSpacing: 2,
                fontSize: '0.85rem'
              }}
            >
              FEATURED
            </Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: 'primary.main',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Latest Job Opportunities
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Discover the most recent openings from top veterinary clinics and hospitals across India
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3
          }}
        >
          {isLoading &&
            Array.from({ length: skeletonCount }).map((_, idx) => (
              <Card key={`sk-${idx}`} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Skeleton variant="rounded" width={56} height={56} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" height={22} />
                      <Skeleton variant="text" height={16} width="60%" />
                    </Box>
                  </Box>
                  <Skeleton variant="text" height={18} />
                  <Skeleton variant="text" height={18} width="80%" />
                  <Skeleton variant="text" height={18} width="50%" />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Skeleton variant="rounded" width={70} height={26} />
                    <Skeleton variant="rounded" width={70} height={26} />
                  </Box>
                </CardContent>
              </Card>
            ))}

          {!isLoading && jobs.length === 0 && (
            <Box
              sx={{
                gridColumn: '1 / -1',
                py: 6,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                color: 'text.secondary'
              }}
            >
              <WorkOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                No active jobs right now
              </Typography>
              <Typography variant="body2">
                Check back soon — new opportunities are posted every day.
              </Typography>
            </Box>
          )}

          {!isLoading && jobs.map((job) => (
            <Card
              key={job._id}
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'visible',
                background: 'linear-gradient(180deg, #ffffff 0%, #fbfdfe 100%)',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 20px 40px rgba(12, 82, 131, 0.12)',
                  borderColor: 'primary.main',
                  '& .job-card-arrow': {
                    transform: 'translateX(5px)',
                    opacity: 1
                  },
                  '& .job-card-logo': {
                    transform: 'scale(1.08)'
                  }
                }
              }}
            >
              <Box sx={{ position: 'absolute', top: -10, right: -10, zIndex: 1 }}>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'primary.50', color: 'primary.main' }
                  }}
                >
                  <BookmarkBorder sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 56,
                      height: 56,
                      border: '2px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.3s ease',
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                      fontWeight: 800
                    }}
                    className="job-card-logo"
                  >
                    {(job.companyName || job.title || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        lineHeight: 1.3,
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {job.title}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {job.companyName || '—'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      {job.location || 'Remote / Anywhere'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.dark', fontSize: '0.9rem' }}>
                      {job.salary || 'Negotiable'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {timeAgo(job.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={job.type || 'Full-time'}
                    size="small"
                    sx={{
                      bgcolor: job.type === 'Full-time' ? 'rgba(10, 182, 162, 0.1)' : 'rgba(12, 82, 131, 0.1)',
                      color: job.type === 'Full-time' ? '#0ab6a2' : '#0c5283',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 26
                    }}
                  />
                  <Button
                    component={Link}
                    to={`/jobs/${job._id}`}
                    variant="text"
                    color="primary"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      transition: 'all 0.3s ease',
                      '& .job-card-arrow': {
                        transition: 'all 0.3s ease',
                        transform: 'translateX(-5px)',
                        opacity: 0
                      }
                    }}
                  >
                    View
                    <ArrowForward className="job-card-arrow" sx={{ fontSize: 18 }} />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Button
            component={Link}
            to="/jobs"
            variant="outlined"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              px: 5,
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: '1rem',
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(12, 82, 131, 0.15)'
              }
            }}
          >
            View All Jobs
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedJobs;