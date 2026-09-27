import { useState, useEffect, type FormEvent } from 'react';
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
  IconButton,
  CircularProgress,
  Tooltip,
  Paper,
  Divider,
  ClickAwayListener,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Verified,
  ArrowForward,
  ArrowForwardRounded,
  CurrencyRupee,
  Bolt,
  MyLocationRounded,
  CloseRounded,
  LocationOnRounded,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetJobsQuery, type JobResponse } from '../../../store/api/jobApi';
import { useLocalizedSiteContent } from '../../../hooks/useLocalizedSiteContent';
import { detectCurrentLocation, fetchCitySuggestions } from '../../../utils/locationService';
import notify from '../../../utils/toast';
import { translateJobType } from '../../../i18n';
import HeroAnimation from './HeroAnimation';

const QUICK_SEARCH_TAGS = [
  'Veterinary Surgeon',
  'Clinic Manager',
  'Emergency Care',
  'Veterinary Nurse',
  'Small Animal',
];

const HomeSlider: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  useEffect(() => {
    let active = true;
    if (searchLocation.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const results = await fetchCitySuggestions(searchLocation);
        if (active) {
          setLocationSuggestions(results);
          if (results.length > 0) setShowLocationSuggestions(true);
        }
      }, 200);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
    return () => {
      active = false;
    };
  }, [searchLocation]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectCurrentLocation();
      const detectedCity = loc.city || loc.state || loc.label;
      if (detectedCity) {
        setSearchLocation(detectedCity);
        notify.success(`Location detected: ${detectedCity}`);
      } else {
        notify.info('Could not resolve your city. Please enter it manually.');
      }
    } catch (err: any) {
      console.warn('Location detection failed:', err);
      if (err?.code === 1) {
        notify.error('Location permission was denied. Please enter your city manually.');
      } else {
        notify.info('Unable to detect location automatically. Please enter your city manually.');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery({ limit: 1 });
  const { content } = useLocalizedSiteContent();
  const hero = content?.hero;
  const previewJob: JobResponse | undefined = jobsData?.data?.items?.[0];
  const totalJobs = jobsData?.data?.pagination?.total ?? 0;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    executeSearch(searchTerm, searchLocation);
  };

  const executeSearch = (term: string, loc = '') => {
    const params = new URLSearchParams();
    const trimmedTerm = term.trim();
    const trimmedLocation = loc.trim();
    if (trimmedTerm) params.set('q', trimmedTerm);
    if (trimmedLocation) params.set('loc', trimmedLocation);
    const query = params.toString();
    navigate(query ? `/jobs?${query}` : '/jobs');
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchTerm(tag);
    executeSearch(tag, searchLocation);
  };

  const badge = hero?.badge || t('hero_badge');
  const headlinePrefix = hero?.headlinePrefix || t('hero_headline_prefix');
  const headlineAccent = hero?.headlineAccent || t('hero_headline_accent');
  const headlineSuffix = hero?.headlineSuffix || t('hero_headline_suffix');
  const subtitle = hero?.subtitle || t('hero_headline_updated');
  const keywordPlaceholder = hero?.searchKeywordPlaceholder || t('hero_search_keyword_placeholder');
  const locationPlaceholder = hero?.searchLocationPlaceholder || t('hero_search_location_placeholder');
  const searchButtonLabel = hero?.searchButtonLabel || t('search');
  const trustLine = hero?.trustLine || t('verified_employers_badge');
  const hiringPrompt = hero?.hiringPrompt || t('hiring_prompt');
  const hiringCtaLabel = hero?.hiringCtaLabel || t('hero_hiring_cta');
  const hiringCtaPath = hero?.hiringCtaPath || '/employer/post-job';
  const badge1Title = hero?.floatingBadge1Title || t('verified_candidates');
  const badge1Subtitle = hero?.floatingBadge1Subtitle || t('identity_checked');
  const badge2Title = hero?.floatingBadge2Title || t('hundred_percent_free');
  const badge2Subtitle = hero?.floatingBadge2Subtitle || t('for_job_seekers');

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: { xs: 'auto', md: '92vh' },
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse 90% 70% at 50% -15%, rgba(10, 182, 162, 0.28), transparent 70%), radial-gradient(ellipse 65% 55% at 90% 60%, rgba(12, 82, 131, 0.42), transparent 70%), linear-gradient(145deg, #051a2a 0%, #092f4c 42%, #0c5283 80%, #086b60 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // The fixed navbar already reserves its own height above this section,
        // so the phone breakpoints only need breathing room, not a second offset.
        pt: { xs: 6, sm: 10, md: 15 },
        pb: { xs: 7, sm: 11, md: 18 },
      }}
    >
      {/* Decorative Aurora Ambient Orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          right: '-5%',
          width: { xs: '320px', md: '560px' },
          height: { xs: '320px', md: '560px' },
          background: 'radial-gradient(circle, rgba(10, 182, 162, 0.22) 0%, transparent 68%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 12s infinite alternate ease-in-out',
          '@keyframes float': {
            '0%': { transform: 'translate(0, 0)' },
            '100%': { transform: 'translate(-35px, 35px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-8%',
          width: { xs: '280px', md: '480px' },
          height: { xs: '280px', md: '480px' },
          background: 'radial-gradient(circle, rgba(12, 82, 131, 0.35) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(55px)',
          animation: 'floatReverse 14s infinite alternate ease-in-out',
          '@keyframes floatReverse': {
            '0%': { transform: 'translate(0, 0)' },
            '100%': { transform: 'translate(45px, -45px)' },
          },
        }}
      />

      {/* Decorative animated mesh background */}
      <HeroAnimation />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, px: { xs: 2.5, sm: 3.5, md: 5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.18fr 0.95fr' },
            gap: { xs: 4, sm: 5, md: 7, lg: 9 },
            alignItems: 'center',
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(28px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {/* LEFT COLUMN — Headline, interactive search, trending tags, trust */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, color: 'white' }}>
            {/* Luminous Trust Pill */}
            <Stack direction="row" sx={{ justifyContent: { xs: 'center', md: 'flex-start' }, mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '100px',
                  px: 2.2,
                  py: 0.75,
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'scale(1.02)' },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#2dd4bf',
                    boxShadow: '0 0 10px #2dd4bf',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <Bolt sx={{ fontSize: 16, color: '#2dd4bf' }} /> {badge}
                </Typography>
              </Box>
            </Stack>

            {/* Main Hero Heading */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                mb: 2.5,
                fontSize: { xs: '2.5rem', sm: '3.2rem', md: '3.6rem', lg: '4.2rem' },
                color: '#ffffff',
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
              }}
            >
              {headlinePrefix}{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(90deg, #38bdf8 0%, #2dd4bf 50%, #a7f3d0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  filter: 'drop-shadow(0 2px 10px rgba(45, 212, 191, 0.2))',
                }}
              >
                {headlineAccent}
              </Box>{' '}
              {headlineSuffix}
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                fontWeight: 400,
                color: 'rgba(241, 245, 249, 0.9)',
                maxWidth: '640px',
                mx: { xs: 'auto', md: 0 },
                fontSize: { xs: '1.05rem', md: '1.22rem' },
                lineHeight: 1.65,
                letterSpacing: '-0.01em',
              }}
            >
              {subtitle}
            </Typography>

            {/* Floating Glassmorphic Search Hub */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 1.5, sm: 0 },
                p: { xs: 1.2, sm: 0.9 },
                bgcolor: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(20px)',
                borderRadius: { xs: 4, sm: '32px' },
                boxShadow:
                  '0 24px 60px -8px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
                maxWidth: '640px',
                mx: { xs: 'auto', md: 0 },
                mb: 2.2,
                transition: 'box-shadow 0.25s ease',
                '&:focus-within': {
                  boxShadow:
                    '0 30px 70px -8px rgba(10, 182, 162, 0.35), 0 0 0 2px #0ab6a2, inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1.15, px: 2, py: { xs: 0.75, sm: 0.2 } }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'rgba(12, 82, 131, 0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    mr: 1.5,
                    flexShrink: 0,
                  }}
                >
                  <Search sx={{ color: '#0c5283', fontSize: 18 }} />
                </Box>
                <InputBase
                  placeholder={keywordPlaceholder}
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    fontSize: '0.96rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    // Without this the field itself is only ~24px tall, so most
                    // of the search strip is dead space to a thumb.
                    py: { xs: 0.75, sm: 1 },
                    '& input::placeholder': { color: '#64748b', opacity: 0.9 },
                  }}
                />
              </Box>

              <Box
                sx={{
                  width: { xs: '100%', sm: '1px' },
                  height: { xs: '1px', sm: 30 },
                  bgcolor: '#e2e8f0',
                  flexShrink: 0,
                }}
              />

              <ClickAwayListener onClickAway={() => setShowLocationSuggestions(false)}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    px: 2,
                    py: { xs: 0.75, sm: 0.2 },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'rgba(10, 182, 162, 0.08)',
                      display: 'grid',
                      placeItems: 'center',
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <LocationOn sx={{ color: '#0ab6a2', fontSize: 18 }} />
                  </Box>
                  <InputBase
                    placeholder={locationPlaceholder}
                    fullWidth
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onFocus={() => {
                      if (locationSuggestions.length > 0) setShowLocationSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setShowLocationSuggestions(false);
                    }}
                    sx={{
                      fontSize: '0.96rem',
                      fontWeight: 500,
                      color: '#0f172a',
                      py: { xs: 0.75, sm: 1 },
                      '& input::placeholder': { color: '#64748b', opacity: 0.9 },
                    }}
                  />
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', ml: 1 }}>
                    {searchLocation && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchLocation('');
                          setShowLocationSuggestions(false);
                        }}
                        aria-label="Clear location"
                        sx={{ p: 0.5, color: '#94a3b8' }}
                      >
                        <CloseRounded sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                    <Tooltip title="Detect current location via GPS" arrow>
                      <span>
                        <IconButton
                          size="small"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          aria-label="Detect GPS location"
                          sx={{
                            p: 0.6,
                            width: 36,
                            height: 36,
                            color: '#0ab6a2',
                            bgcolor: 'rgba(10, 182, 162, 0.1)',
                            '&:hover': { bgcolor: 'rgba(10, 182, 162, 0.2)' },
                          }}
                        >
                          {isDetectingLocation ? (
                            <CircularProgress size={16} sx={{ color: '#0ab6a2' }} />
                          ) : (
                            <MyLocationRounded sx={{ fontSize: 17 }} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>

                  {/* Floating Suggestions Dropdown */}
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <Paper
                      elevation={10}
                      sx={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        left: 0,
                        right: 0,
                        minWidth: 260,
                        zIndex: 1400,
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 18px 42px -10px rgba(12, 82, 131, 0.32), 0 6px 16px rgba(0,0,0,0.08)',
                        p: 1,
                        maxHeight: 280,
                        overflowY: 'auto',
                        bgcolor: '#ffffff',
                      }}
                    >
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            letterSpacing: 0.5,
                            fontSize: '0.68rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          Suggested Cities
                        </Typography>
                        <Button
                          size="small"
                          startIcon={
                            isDetectingLocation ? (
                              <CircularProgress size={11} sx={{ color: '#0ab6a2' }} />
                            ) : (
                              <MyLocationRounded sx={{ fontSize: 13 }} />
                            )
                          }
                          onClick={() => {
                            handleDetectLocation();
                            setShowLocationSuggestions(false);
                          }}
                          disabled={isDetectingLocation}
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            p: 0.2,
                            textTransform: 'none',
                            color: '#0ab6a2',
                          }}
                        >
                          Use GPS
                        </Button>
                      </Box>
                      <Divider sx={{ mb: 0.5 }} />
                      {locationSuggestions.map((city) => (
                        <Box
                          key={city}
                          onClick={() => {
                            setSearchLocation(city);
                            setShowLocationSuggestions(false);
                            executeSearch(searchTerm, city);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            px: 1.5,
                            py: 1,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            color: '#0f172a',
                            '&:hover': {
                              bgcolor: 'rgba(10, 182, 162, 0.08)',
                              color: '#0c5283',
                              transform: 'translateX(3px)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: '8px',
                              display: 'grid',
                              placeItems: 'center',
                              bgcolor: 'rgba(10, 182, 162, 0.12)',
                              color: '#0ab6a2',
                              flexShrink: 0,
                            }}
                          >
                            <LocationOnRounded sx={{ fontSize: 15 }} />
                          </Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.84rem', flex: 1 }}>
                            {city}
                          </Typography>
                          <ArrowForwardRounded sx={{ fontSize: 13, opacity: 0.35 }} />
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>

              <Button
                type="submit"
                variant="contained"
                sx={{
                  px: 4,
                  py: 1.4,
                  borderRadius: { xs: 3, sm: '26px' },
                  fontWeight: 800,
                  fontSize: '0.96rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(12, 82, 131, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #094066 0%, #089c8b 100%)',
                    boxShadow: '0 8px 24px rgba(10, 182, 162, 0.45)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {searchButtonLabel}
              </Button>
            </Box>

            {/* Trending Quick Search Chips */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', md: 'flex-start' },
                mb: 3.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600, fontSize: '0.8rem', mr: 0.5 }}
              >
                Trending:
              </Typography>
              {QUICK_SEARCH_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => handleQuickTagClick(tag)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.22)',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                />
              ))}
            </Box>

            {/* Below Job Search Trust & Employer Gateway Banner */}
            <Box
              sx={{
                // On a phone the trust line and the employer CTA stack: side by
                // side they squeezed the button down to one word per line.
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: { xs: 1.25, sm: 2 },
                width: { xs: '100%', sm: 'auto' },
                maxWidth: { xs: 420, sm: 'none' },
                mx: { xs: 'auto', md: 0 },
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                p: { xs: '12px 16px', sm: '8px 18px' },
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              }}
            >
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Verified sx={{ color: '#2dd4bf', fontSize: 18 }} />
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>
                  {trustLine}
                </Typography>
              </Stack>
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  width: { xs: '100%', sm: '1px' },
                  height: { xs: '1px', sm: 16 },
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.72)',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {hiringPrompt}
              </Typography>
              <Button
                component={Link}
                to={hiringCtaPath}
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                sx={{
                  color: '#2dd4bf',
                  fontWeight: 750,
                  fontSize: '0.86rem',
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  '&:hover': { color: 'white', bgcolor: 'transparent' },
                }}
              >
                {hiringCtaLabel}
              </Button>
            </Box>
          </Box>

          {/* RIGHT COLUMN — Executive Live Job Preview Card & Proof Badges */}
          <Box
            sx={{
              position: 'relative',
              display: { xs: 'none', md: 'block' },
              animation: 'fadeIn 1s ease-out 0.1s backwards',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(24px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* Ambient Backlight Glow */}
            <Box
              sx={{
                position: 'absolute',
                inset: -25,
                background: 'radial-gradient(circle, rgba(10, 182, 162, 0.28) 0%, transparent 65%)',
                filter: 'blur(30px)',
                zIndex: 0,
              }}
            />

            {/* Main Job Showcase Card */}
            <Box
              sx={{
                position: 'relative',
                p: { md: 3.5, lg: 4 },
                bgcolor: '#ffffff',
                borderRadius: '24px',
                boxShadow:
                  '0 28px 70px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.25)',
                zIndex: 2,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow:
                    '0 34px 80px -12px rgba(10, 182, 162, 0.25), 0 0 0 1px rgba(10, 182, 162, 0.3)',
                },
              }}
            >
              {/* Header: Live Pill & Total Jobs count */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.85,
                    bgcolor: 'rgba(10, 182, 162, 0.1)',
                    color: '#0ab6a2',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '20px',
                    border: '1px solid rgba(10, 182, 162, 0.2)',
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      bgcolor: '#0ab6a2',
                      borderRadius: '50%',
                      boxShadow: '0 0 8px #0ab6a2',
                      animation: 'pulseDot 1.6s infinite',
                      '@keyframes pulseDot': {
                        '0%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.3, transform: 'scale(1.4)' },
                        '100%': { opacity: 1, transform: 'scale(1)' },
                      },
                    }}
                  />
                  {t('live')}
                </Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.82rem' }}
                >
                  {totalJobs > 0 ? t('open_jobs_count', { count: totalJobs }) : t('loading')}
                </Typography>
              </Box>

              {jobsLoading || !previewJob ? (
                <>
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={20} width="55%" sx={{ mb: 1.5 }} />
                  <Stack direction="row" spacing={2} sx={{ mb: 2.5 }}>
                    <Skeleton variant="text" width={90} />
                    <Skeleton variant="text" width={90} />
                  </Stack>
                  <Skeleton variant="rounded" height={44} sx={{ borderRadius: 2.5 }} />
                </>
              ) : (
                <>
                  {/* Header: Company Avatar & Job Title */}
                  <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        boxShadow: '0 4px 14px rgba(12, 82, 131, 0.18)',
                        flexShrink: 0,
                      }}
                    >
                      {(previewJob.companyName || previewJob.title || 'V').charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 850,
                          color: '#0f172a',
                          lineHeight: 1.3,
                          mb: 0.35,
                          fontSize: { md: '1.18rem', lg: '1.32rem' },
                        }}
                        noWrap
                      >
                        {previewJob.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 650, color: 'primary.main', fontSize: '0.88rem' }}
                        noWrap
                      >
                        {previewJob.companyName}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Metadata Chips: Type & Location */}
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 0.75 }}>
                    {previewJob.type && (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.1,
                          py: 0.35,
                          borderRadius: '8px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          color: '#077a6d',
                          bgcolor: 'rgba(10, 182, 162, 0.11)',
                          border: '1px solid rgba(10, 182, 162, 0.24)',
                        }}
                      >
                        {translateJobType(previewJob.type)}
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: '#f1f5f9',
                        px: 1.1,
                        py: 0.35,
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <LocationOn sx={{ fontSize: 14, color: '#64748b' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                        {previewJob.location || t('anywhere')}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Dedicated Compensation Spotlight */}
                  <Box
                    sx={{
                      mb: 2.75,
                      p: 1.25,
                      px: 1.5,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'rgba(10, 182, 162, 0.06)',
                      border: '1px solid rgba(10, 182, 162, 0.2)',
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: 'rgba(10, 182, 162, 0.15)',
                          color: '#0ab6a2',
                          flexShrink: 0,
                        }}
                      >
                        <CurrencyRupee sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                        {previewJob.salary || t('negotiable')}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.675rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'secondary.main',
                        bgcolor: 'rgba(10, 182, 162, 0.1)',
                        px: 0.85,
                        py: 0.25,
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    >
                      Verified
                    </Typography>
                  </Box>

                  {/* Action Button */}
                  <Button
                    component={Link}
                    to={`/jobs/${previewJob._id}`}
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForward sx={{ transition: 'transform 0.2s ease' }} />}
                    sx={{
                      background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                      borderRadius: '14px',
                      fontWeight: 800,
                      py: 1.3,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(12, 82, 131, 0.25)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #094066 0%, #089c8b 100%)',
                        boxShadow: '0 8px 24px rgba(10, 182, 162, 0.4)',
                        transform: 'translateY(-1px)',
                        '& .MuiButton-endIcon': { transform: 'translateX(4px)' },
                      },
                    }}
                  >
                    {t('view_job')}
                  </Button>
                </>
              )}
            </Box>

            {/* Floating Proof Badge 1: Top Right */}
            <Box
              sx={{
                position: 'absolute',
                top: -24,
                right: -16,
                bgcolor: 'white',
                borderRadius: '16px',
                p: '10px 14px',
                boxShadow: '0 18px 36px -6px rgba(0, 0, 0, 0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                zIndex: 3,
                border: '1px solid rgba(226, 232, 240, 0.9)',
                animation: 'floatBadge 4.5s ease-in-out infinite alternate',
                '@keyframes floatBadge': {
                  '0%': { transform: 'translateY(0)' },
                  '100%': { transform: 'translateY(-8px)' },
                },
              }}
            >
              <AvatarGroup
                max={3}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 28,
                    height: 28,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    border: '2px solid white',
                  },
                }}
              >
                <Avatar sx={{ bgcolor: '#0c5283' }}>A</Avatar>
                <Avatar sx={{ bgcolor: '#0ab6a2' }}>P</Avatar>
                <Avatar sx={{ bgcolor: '#f59e0b' }}>K</Avatar>
              </AvatarGroup>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', fontWeight: 800, lineHeight: 1.2, color: '#0c5283', fontSize: '0.76rem' }}
                >
                  {badge1Title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 500 }}
                >
                  {badge1Subtitle}
                </Typography>
              </Box>
            </Box>

            {/* Floating Proof Badge 2: Bottom Left */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -20,
                left: -18,
                bgcolor: 'white',
                borderRadius: '16px',
                p: '10px 14px',
                boxShadow: '0 18px 36px -6px rgba(0, 0, 0, 0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                zIndex: 3,
                border: '1px solid rgba(226, 232, 240, 0.9)',
                animation: 'floatBadge2 5s ease-in-out infinite alternate',
                '@keyframes floatBadge2': {
                  '0%': { transform: 'translateY(0)' },
                  '100%': { transform: 'translateY(8px)' },
                },
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 0.8,
                  borderRadius: '10px',
                  bgcolor: 'rgba(10, 182, 162, 0.12)',
                }}
              >
                <Verified sx={{ color: '#0ab6a2', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', fontWeight: 800, lineHeight: 1.2, color: '#0c5283', fontSize: '0.76rem' }}
                >
                  {badge2Title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 500 }}
                >
                  {badge2Subtitle}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Modern Wave Curved Bottom Divider */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          zIndex: 2,
          lineHeight: 0,
        }}
      >
        <svg viewBox="0 0 1440 90" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,45L60,49.2C120,53.3,240,61.7,360,60C480,58.3,600,46.7,720,41.7C840,36.7,960,38.3,1080,43.3C1200,48.3,1320,56.7,1380,60.8L1440,65L1440,90L1380,90C1320,90,1200,90,1080,90C960,90,840,90,720,90C600,90,480,90,360,90C240,90,120,90,60,90L0,90Z"></path>
        </svg>
      </Box>
    </Box>
  );
};

export default HomeSlider;