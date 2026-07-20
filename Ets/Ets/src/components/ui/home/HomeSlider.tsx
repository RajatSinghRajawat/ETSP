import { useState, type FormEvent } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  InputBase,
  Chip,
  Avatar,
  AvatarGroup,
  Skeleton,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Verified,
  ArrowForward,
  AttachMoney,
  AccessTime,
  Bolt,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useGetJobsQuery, type JobResponse } from '../../../store/api/jobApi';
import HeroAnimation from './HeroAnimation';

const HomeSlider: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery({ limit: 1 });
  const previewJob: JobResponse | undefined = jobsData?.data?.items?.[0];
  const totalJobs = jobsData?.data?.pagination?.total ?? 0;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmedTerm = searchTerm.trim();
    const trimmedLocation = searchLocation.trim();
    if (trimmedTerm) params.set('q', trimmedTerm);
    if (trimmedLocation) params.set('loc', trimmedLocation);
    const query = params.toString();
    navigate(query ? `/jobs?${query}` : '/jobs');
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: { xs: 'auto', md: '92vh' },
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 20% 20%, #0e6a9b 0%, transparent 55%), radial-gradient(circle at 80% 80%, #0ab6a2 0%, transparent 50%), linear-gradient(135deg, #0a3f66 0%, #0c5283 60%, #0ab6a2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pt: { xs: 14, md: 12 },
        pb: { xs: 18, md: 18 }
      }}
    >
      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: { xs: '300px', md: '500px' },
          height: { xs: '300px', md: '500px' },
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'float 10s infinite alternate ease-in-out',
          '@keyframes float': {
            '0%': { transform: 'translate(0, 0)' },
            '100%': { transform: 'translate(-30px, 30px)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: { xs: '250px', md: '450px' },
          height: { xs: '250px', md: '450px' },
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'floatReverse 12s infinite alternate ease-in-out',
          '@keyframes floatReverse': {
            '0%': { transform: 'translate(0, 0)' },
            '100%': { transform: 'translate(40px, -40px)' }
          }
        }}
      />

      {/* Animated SVG layer (veterinary-themed, decorative) */}
      <HeroAnimation />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' },
            gap: { xs: 6, md: 8 },
            alignItems: 'center',
            animation: 'fadeInUp 0.9s ease-out',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(30px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          {/* LEFT COLUMN — Headline, search, trust */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, color: 'white' }}>
            {/* Badge */}
            <Stack direction="row" sx={{ justifyContent: { xs: 'center', md: 'flex-start' }, mb: 3 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  borderRadius: '100px',
                  px: 2.5,
                  py: 0.75,
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    letterSpacing: '0.4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.82rem'
                  }}
                >
                  <Bolt sx={{ fontSize: 16, color: '#ffd700' }} /> India's #1 Veterinary Job Portal
                </Typography>
              </Box>
            </Stack>

            {/* Main Heading */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                mb: 2.5,
                fontSize: { xs: '2.4rem', sm: '3rem', md: '3.4rem', lg: '3.9rem' },
                color: 'white',
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 12px rgba(0,0,0,0.15)'
              }}
            >
              Empowering Your{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(90deg, #ffd700 0%, #ffb347 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}
              >
                Veterinary
              </Box>{' '}
              Career
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.88)',
                maxWidth: '560px',
                mx: { xs: 'auto', md: 0 },
                fontSize: { xs: '1rem', md: '1.15rem' },
                lineHeight: 1.6
              }}
            >
              Connect with top clinics, hospitals, and specialized veterinary opportunities across India.
            </Typography>

            {/* Inline Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 1, sm: 0 },
                p: { xs: 1, sm: 0.75 },
                bgcolor: 'rgba(255,255,255,0.96)',
                borderRadius: { xs: 3, sm: 999 },
                boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                maxWidth: '600px',
                mx: { xs: 'auto', md: 0 },
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, px: 2, py: { xs: 0.5, sm: 0 } }}>
                <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 22 }} />
                <InputBase
                  placeholder="Job title, skill, or keyword"
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ fontSize: '0.95rem', '& input::placeholder': { color: 'text.secondary', opacity: 0.8 } }}
                />
              </Box>
              <Box
                sx={{
                  width: { xs: '100%', sm: '1px' },
                  height: { xs: '1px', sm: 28 },
                  bgcolor: 'divider',
                  flexShrink: 0
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, px: 2, py: { xs: 0.5, sm: 0 } }}>
                <LocationOn sx={{ color: 'text.secondary', mr: 1, fontSize: 22 }} />
                <InputBase
                  placeholder="Location"
                  fullWidth
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  sx={{ fontSize: '0.95rem', '& input::placeholder': { color: 'text.secondary', opacity: 0.8 } }}
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  px: 3.5,
                  py: 1.4,
                  borderRadius: { xs: 2, sm: 999 },
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  color: 'white',
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
                    boxShadow: '0 8px 18px rgba(10, 182, 162, 0.35)'
                  }
                }}
              >
                Search
              </Button>
            </Box>

            {/* Trust strip */}
            <Stack
              direction="row"
              spacing={3}
              sx={{
                justifyContent: { xs: 'center', md: 'flex-start' },
                color: 'rgba(255,255,255,0.85)',
                flexWrap: 'wrap',
                rowGap: 1,
                mb: 3
              }}
            >
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Verified sx={{ fontSize: 18, color: '#0ab6a2' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>Verified Clinics</Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Bolt sx={{ fontSize: 18, color: '#ffd700' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>Free for Candidates</Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <AccessTime sx={{ fontSize: 18, color: '#ffd700' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>24h Response</Typography>
              </Box>
            </Stack>
            {/* Hiring CTA */}
            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>
                Are you hiring?
              </Typography>
              <Button
                component={Link}
                to="/employer/post-job"
                variant="text"
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                sx={{
                  color: '#ffd700',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255,215,0,0.08)' }
                }}
              >
                Post a Job
              </Button>
            </Box>
          </Box>

          {/* RIGHT COLUMN — Floating live job preview */}
          <Box
            sx={{
              position: 'relative',
              display: { xs: 'none', md: 'block' },
              animation: 'fadeIn 1.1s ease-out 0.15s backwards',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            {/* Decorative glow behind card */}
            <Box
              sx={{
                position: 'absolute',
                inset: -20,
                background: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, transparent 65%)',
                filter: 'blur(20px)',
                zIndex: 0
              }}
            />

            {/* Main job preview card */}
            <Box
              sx={{
                position: 'relative',
                p: 3,
                bgcolor: 'white',
                borderRadius: 4,
                boxShadow: '0 30px 60px rgba(0,0,0,0.28)',
                transform: 'rotate(-1.5deg)',
                zIndex: 2,
                transition: 'transform 0.4s ease',
                '&:hover': { transform: 'rotate(0deg) translateY(-4px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: 'rgba(10, 182, 162, 0.12)',
                    color: '#0ab6a2',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    letterSpacing: 1,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      bgcolor: '#0ab6a2',
                      borderRadius: '50%',
                      animation: 'pulseDot 1.6s infinite',
                      '@keyframes pulseDot': {
                        '0%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.4, transform: 'scale(1.4)' },
                        '100%': { opacity: 1, transform: 'scale(1)' }
                      }
                    }}
                  />
                  LIVE
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {totalJobs > 0 ? `${totalJobs}+ open jobs` : 'Loading…'}
                </Typography>
              </Box>

              {jobsLoading || !previewJob ? (
                <>
                  <Skeleton variant="text" height={28} width="80%" />
                  <Skeleton variant="text" height={18} width="55%" sx={{ mb: 1 }} />
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Skeleton variant="text" width={80} />
                    <Skeleton variant="text" width={80} />
                  </Stack>
                  <Skeleton variant="rounded" height={40} />
                </>
              ) : (
                <>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: '#0c5283', lineHeight: 1.3, mb: 0.5 }}
                    noWrap
                  >
                    {previewJob.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }} noWrap>
                    {previewJob.companyName}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2.5, flexWrap: 'wrap', rowGap: 1 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {previewJob.location || 'Anywhere'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <AttachMoney sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.dark' }}>
                        {previewJob.salary || 'Negotiable'}
                      </Typography>
                    </Box>
                    {previewJob.type && (
                      <Chip
                        label={previewJob.type}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: 'rgba(12, 82, 131, 0.08)',
                          color: '#0c5283'
                        }}
                      />
                    )}
                  </Stack>
                  <Button
                    component={Link}
                    to={`/jobs/${previewJob._id}`}
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForward />}
                    sx={{
                      background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                      borderRadius: 2,
                      fontWeight: 700,
                      py: 1.2,
                      boxShadow: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
                        boxShadow: '0 8px 18px rgba(10, 182, 162, 0.35)'
                      }
                    }}
                  >
                    View Job
                  </Button>
                </>
              )}
            </Box>

            {/* Floating badge — top right */}
            <Box
              sx={{
                position: 'absolute',
                top: -22,
                right: -12,
                bgcolor: 'white',
                borderRadius: 3,
                p: 1.5,
                boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                transform: 'rotate(3deg)',
                zIndex: 3,
                animation: 'floatBadge 4s ease-in-out infinite alternate',
                '@keyframes floatBadge': {
                  '0%': { transform: 'rotate(3deg) translateY(0)' },
                  '100%': { transform: 'rotate(3deg) translateY(-8px)' }
                }
              }}
            >
              <AvatarGroup
                max={3}
                sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem', fontWeight: 800, border: '2px solid white' } }}
              >
                <Avatar sx={{ bgcolor: '#0c5283' }}>A</Avatar>
                <Avatar sx={{ bgcolor: '#0ab6a2' }}>P</Avatar>
                <Avatar sx={{ bgcolor: '#f59e0b' }}>K</Avatar>
              </AvatarGroup>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, lineHeight: 1.2, color: '#0c5283' }}>
                  Verified Vets
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.65rem' }}>
                  Aadhaar checked
                </Typography>
              </Box>
            </Box>

            {/* Floating badge — bottom left */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -18,
                left: -16,
                bgcolor: 'white',
                borderRadius: 3,
                p: 1.5,
                boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                transform: 'rotate(-2deg)',
                zIndex: 3,
                animation: 'floatBadge2 4.5s ease-in-out infinite alternate',
                '@keyframes floatBadge2': {
                  '0%': { transform: 'rotate(-2deg) translateY(0)' },
                  '100%': { transform: 'rotate(-2deg) translateY(8px)' }
                }
              }}
            >
              <Box sx={{ display: 'inline-flex', p: 1, borderRadius: 2, bgcolor: 'rgba(10, 182, 162, 0.12)' }}>
                <Verified sx={{ color: '#0ab6a2', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, lineHeight: 1.2, color: '#0c5283' }}>
                  100% Free
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.65rem' }}>
                  For job seekers
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Wave/Curve Bottom Divider */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          zIndex: 2,
          lineHeight: 0
        }}
      >
        <svg
          viewBox="0 0 1440 120"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </Box>
    </Box>
  );
};

export default HomeSlider;