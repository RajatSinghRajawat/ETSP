import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  ClickAwayListener,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import {
  ArrowForwardRounded,
  AutoAwesomeRounded,
  BoltRounded,
  BusinessCenterRounded,
  CloseRounded,
  LocationOnRounded,
  MyLocationRounded,
  PsychologyAltRounded,
  RestartAltRounded,
  SearchOffRounded,
  SearchRounded,
  TrendingUpRounded,
  TuneRounded,
  VerifiedRounded,
  WorkOutlineRounded,
} from '@mui/icons-material';
import { JobCard } from '../../components/common/JobCard';
import { formatRelativeDate } from '../../components/employer/jobStatus';
import AdBanner from '../../components/common/AdBanner';
import { useGetJobsQuery, type CandidateApplicationStatus, type JobAppliedFilter } from '../../store/api/jobApi';
import { useGetJobTypesQuery, useGetLookupsQuery, useGetSkillsQuery } from '../../store/api/lookupApi';
import { useGetMyApplicationsQuery } from '../../store/api/applicationApi';
import { useGetMySavedJobsQuery, useSaveJobMutation, useUnsaveJobMutation } from '../../store/api/savedJobApi';
import { detectCurrentLocation, fetchCitySuggestions, POPULAR_CITIES } from '../../utils/locationService';
import notify from '../../utils/toast';

const cities = POPULAR_CITIES.slice(0, 12);
const experiences = ['0-2 years', '2-5 years', '5-10 years', '10+ years'];
const popularSearches = ['Veterinarian', 'Pet Groomer', 'Receptionist', 'Surgery', 'Pet Trainer', 'Sales'];

/** Jobs per page — 9 fills three full rows on a wide screen. */
const PAGE_SIZE = 9;

/** The hero band's brand gradient, layered so it reads as depth, not a flat fill. */
const HERO_GRADIENT = 'linear-gradient(125deg, #0c5283 0%, #0a4570 46%, rgba(10, 182, 162, 0.92) 132%)';

/** Reads the signed-in role without pulling the whole auth slice into this page. */
function getCurrentUserRole(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return (JSON.parse(raw) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

/** A labelled block inside the filter rail. */
const FilterSection: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon,
  label,
  children,
}) => (
  <Box sx={{ mb: 2.75 }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
      <Box sx={{ display: 'flex', color: 'secondary.main', '& svg': { fontSize: 17 } }}>{icon}</Box>
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: 'text.secondary' }}
      >
        {label}
      </Typography>
    </Stack>
    {children}
  </Box>
);

/**
 * A row of chips behaving as one exclusive choice — clicking the active chip
 * clears it, so there is never a filter the user cannot undo.
 */
const ChipChoice: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}> = ({ options, value, onChange }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
    {options.map((option) => {
      const selected = value.toLowerCase() === option.value.toLowerCase();

      return (
        <Chip
          key={option.value}
          label={option.label}
          size="small"
          onClick={() => onChange(selected ? '' : option.value)}
          sx={{
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
            ...(selected
              ? {
                  color: 'primary.contrastText',
                  bgcolor: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                }
              : {
                  color: 'text.secondary',
                  bgcolor: 'transparent',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.1),
                    borderColor: 'secondary.main',
                    color: 'secondary.dark',
                  },
                }),
          }}
        />
      );
    })}
  </Box>
);

/**
 * Interactive City filter block with custom search input, live maps suggestions,
 * GPS location detection, and popular quick-select city chips.
 */
const CityFilterBlock: React.FC<{
  value: string;
  onChange: (city: string) => void;
  isDetecting: boolean;
  onDetect: () => void;
}> = ({ value, onChange, isDetecting, onDetect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const results = await fetchCitySuggestions(searchTerm);
        if (active) {
          setSuggestions(results);
        }
      }, 250);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else {
      setSuggestions([]);
    }
    return () => {
      active = false;
    };
  }, [searchTerm]);

  const filteredPopular = useMemo(() => {
    if (!searchTerm.trim()) return POPULAR_CITIES.slice(0, 12);
    return POPULAR_CITIES.filter((c) =>
      c.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [searchTerm]);

  const handleSelect = (city: string) => {
    if (value.toLowerCase() === city.toLowerCase()) {
      onChange('');
    } else {
      onChange(city);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        onChange(searchTerm.trim());
      }
    }
  };

  return (
    <Box>
      {/* Search Input for custom city search */}
      <Box sx={{ mb: 1.25 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search or type city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          slotProps={{
            input: {
              startAdornment: (
                <SearchRounded sx={{ fontSize: 18, color: 'text.disabled', mr: 0.75 }} />
              ),
              endAdornment: (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  {searchTerm && (
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.25 }}>
                      <CloseRounded sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                  <Tooltip title="Detect GPS location" arrow>
                    <span>
                      <IconButton
                        size="small"
                        onClick={onDetect}
                        disabled={isDetecting}
                        sx={{
                          p: 0.4,
                          color: 'secondary.main',
                          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                          '&:hover': { bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.2) },
                        }}
                      >
                        {isDetecting ? (
                          <CircularProgress size={13} sx={{ color: 'secondary.main' }} />
                        ) : (
                          <MyLocationRounded sx={{ fontSize: 15 }} />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ),
              sx: {
                borderRadius: '10px',
                fontSize: '0.8125rem',
                bgcolor: (theme) =>
                  theme.palette.mode === 'light'
                    ? 'rgba(248, 250, 252, 0.95)'
                    : 'rgba(255, 255, 255, 0.04)',
                '& fieldset': { borderColor: 'divider' },
              },
            },
          }}
        />
      </Box>

      {/* GPS Location Button */}
      <Button
        fullWidth
        size="small"
        startIcon={
          isDetecting ? (
            <CircularProgress size={13} sx={{ color: 'inherit' }} />
          ) : (
            <MyLocationRounded sx={{ fontSize: 15 }} />
          )
        }
        onClick={onDetect}
        disabled={isDetecting}
        sx={{
          mb: 1.5,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.75rem',
          py: 0.6,
          borderRadius: '8px',
          color: 'secondary.dark',
          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.09),
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.secondary.main, 0.24),
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.18),
          },
        }}
      >
        {isDetecting ? 'Detecting GPS location...' : 'Use my current location'}
      </Button>

      {/* Currently Selected Location Indicator */}
      {value && (
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem' }}>
              Selected City:
            </Typography>
          </Stack>
          <Chip
            label={`📍 ${value}`}
            size="small"
            onDelete={() => onChange('')}
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              color: '#ffffff',
              bgcolor: 'primary.main',
              maxWidth: '100%',
              '& .MuiChip-deleteIcon': { color: '#ffffff', '&:hover': { color: '#e2e8f0' } },
            }}
          />
        </Box>
      )}

      {/* Custom match prompt if user typed something not in list */}
      {searchTerm.trim() &&
        !filteredPopular.some((c) => c.toLowerCase() === searchTerm.toLowerCase().trim()) && (
          <Box sx={{ mb: 1.25 }}>
            <Chip
              label={`+ Filter by "${searchTerm.trim()}"`}
              size="small"
              onClick={() => onChange(searchTerm.trim())}
              sx={{
                fontWeight: 700,
                fontSize: '0.74rem',
                color: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                border: '1px dashed',
                borderColor: 'primary.main',
                cursor: 'pointer',
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2) },
              }}
            />
          </Box>
        )}

      {/* Live Map Suggestions (if searching) */}
      {suggestions.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.68rem', display: 'block', mb: 0.5 }}>
            MAP SUGGESTIONS:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {suggestions.map((item) => (
              <Chip
                key={item}
                label={item}
                size="small"
                onClick={() => {
                  onChange(item);
                  setSearchTerm('');
                }}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.secondary.main, 0.3),
                  color: 'secondary.dark',
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.16),
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Popular City Chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {filteredPopular.map((city) => {
          const selected = value.toLowerCase() === city.toLowerCase();
          return (
            <Chip
              key={city}
              label={city}
              size="small"
              onClick={() => handleSelect(city)}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
                ...(selected
                  ? {
                      color: 'primary.contrastText',
                      bgcolor: 'primary.main',
                      borderColor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }
                  : {
                      color: 'text.secondary',
                      bgcolor: 'transparent',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.1),
                        borderColor: 'secondary.main',
                        color: 'secondary.dark',
                      },
                    }),
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

interface TopLocationSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (city: string) => void;
  isDetecting: boolean;
  onDetect: () => void;
  placeholder?: string;
  sx?: any;
  inputSx?: any;
  searchFieldSx?: any;
  size?: 'small' | 'medium';
}

/**
 * Top location search field with floating autocomplete suggestions dropdown,
 * GPS location detection, and clear button.
 */
const TopLocationSearchField: React.FC<TopLocationSearchFieldProps> = ({
  value,
  onChange,
  onSelect,
  isDetecting,
  onDetect,
  placeholder = 'City or state',
  sx,
  inputSx,
  searchFieldSx,
  size = 'medium',
}) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (value.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const results = await fetchCitySuggestions(value);
        if (active) {
          setSuggestions(results);
          if (results.length > 0) {
            setOpen(true);
          }
        }
      }, 200);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else {
      setSuggestions([]);
      setOpen(false);
    }
    return () => {
      active = false;
    };
  }, [value]);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: '100%', ...sx }}>
        <TextField
          fullWidth
          size={size}
          placeholder={placeholder}
          aria-label={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setOpen(false);
            }
          }}
          slotProps={{
            input: {
              startAdornment: <LocationOnRounded sx={{ color: 'secondary.main', mr: 1.25 }} />,
              endAdornment: (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  {value && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        onChange('');
                        setOpen(false);
                      }}
                      aria-label="Clear location"
                      sx={{ p: 0.5, color: 'text.disabled' }}
                    >
                      <CloseRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                  <Tooltip title="Detect current location via GPS" arrow>
                    <span>
                      <IconButton
                        size="small"
                        onClick={onDetect}
                        disabled={isDetecting}
                        aria-label="Detect current location"
                        sx={{
                          color: 'secondary.main',
                          bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.12),
                          mr: 0.5,
                          '&:hover': {
                            bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.22),
                          },
                        }}
                      >
                        {isDetecting ? (
                          <CircularProgress size={16} sx={{ color: 'secondary.main' }} />
                        ) : (
                          <MyLocationRounded sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ),
              sx: { fontWeight: 600, ...inputSx },
            },
          }}
          sx={searchFieldSx}
        />

        {/* Dropdown Suggestions Popover right beneath the input */}
        {open && suggestions.length > 0 && (
          <Paper
            elevation={10}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              minWidth: 260,
              zIndex: 1400,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 18px 42px -10px rgba(12, 82, 131, 0.32), 0 6px 16px rgba(0,0,0,0.08)',
              p: 1,
              maxHeight: 280,
              overflowY: 'auto',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ px: 1.25, py: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: 'text.secondary',
                  letterSpacing: 0.5,
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                }}
              >
                Suggested Cities
              </Typography>
              <Button
                size="small"
                startIcon={isDetecting ? <CircularProgress size={11} /> : <MyLocationRounded sx={{ fontSize: 13 }} />}
                onClick={() => {
                  onDetect();
                  setOpen(false);
                }}
                disabled={isDetecting}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  p: 0.2,
                  textTransform: 'none',
                  color: 'secondary.main',
                }}
              >
                Use GPS
              </Button>
            </Box>
            <Divider sx={{ mb: 0.5 }} />
            {suggestions.map((city) => (
              <Box
                key={city}
                onClick={() => {
                  onSelect(city);
                  setOpen(false);
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
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
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
                    bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.12),
                    color: 'secondary.main',
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
  );
};

/** Card-shaped placeholder so the grid keeps its rhythm while jobs load. */
const JobCardSkeleton: React.FC = () => (
  <Paper
    elevation={0}
    sx={{
      height: '100%',
      borderRadius: '18px',
      border: '1px solid',
      borderColor: 'divider',
      p: 2.5,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
      <Skeleton variant="rounded" width={50} height={50} sx={{ borderRadius: '14px', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="80%" height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="text" width="45%" height={18} sx={{ borderRadius: 1, mt: 0.5 }} />
      </Box>
      <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px' }} />
    </Stack>
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: '8px' }} />
      <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '8px' }} />
      <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: '8px' }} />
    </Stack>
    <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: '12px', mt: 2 }} />
    <Stack direction="row" spacing={0.75} sx={{ mt: 2 }}>
      <Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: '8px' }} />
      <Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: '8px' }} />
      <Skeleton variant="rounded" width={32} height={24} sx={{ borderRadius: '8px' }} />
    </Stack>
    <Divider sx={{ my: 2, mt: 'auto' }} />
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton variant="text" width={70} height={16} />
      <Skeleton variant="rounded" width={90} height={32} sx={{ borderRadius: '9px' }} />
    </Stack>
  </Paper>
);

const JobListing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Active applied search & filter state (drives API query & URL address)
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [locationTerm, setLocationTerm] = useState(() => searchParams.get('loc') ?? '');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<JobAppliedFilter>('');
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [filters, setFilters] = useState({
    jobType: searchParams.get('type') ?? '',
    experience: searchParams.get('exp') ?? '',
    skill: searchParams.get('skill') ?? '',
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Draft inputs for Hero and Sticky search consoles
  // (Typing here does NOT auto-trigger search or populate the sidebar filter)
  const [topKeyword, setTopKeyword] = useState(() => searchParams.get('q') ?? '');
  const [topLocation, setTopLocation] = useState(() => searchParams.get('loc') ?? '');

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectCurrentLocation();
      const detectedCity = loc.city || loc.state || loc.label;
      if (detectedCity) {
        setPage(1);
        setTopLocation(detectedCity);
        setLocationTerm(detectedCity);
        notify.success(`Location detected: ${detectedCity}`);
      } else {
        notify.info('Could not resolve your city name. Please enter it manually.');
      }
    } catch (err: any) {
      console.warn('Location detection failed:', err);
      if (err?.code === 1) {
        notify.error('Location permission was denied. Please allow location access in your browser or type your city.');
      } else {
        notify.info('Unable to detect location automatically. Please enter your city manually.');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSelectTopCity = (city: string) => {
    setPage(1);
    setTopLocation(city);
    setLocationTerm(city);
  };

  const handleSidebarCityChange = (city: string) => {
    setPage(1);
    setLocationTerm(city);
    setTopLocation(city);
  };

  // Reveal a compact search bar once the hero has scrolled away.
  useEffect(() => {
    const handleScroll = () => setShowStickySearch(window.scrollY > 300);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mirror the live query into the address bar so a result set can be shared
  // and the browser's back button steps through searches.
  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    if (locationTerm) next.set('loc', locationTerm);
    if (filters.jobType) next.set('type', filters.jobType);
    if (filters.experience) next.set('exp', filters.experience);
    if (filters.skill) next.set('skill', filters.skill);
    if (page > 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [search, locationTerm, filters, page, setSearchParams]);

  const isCandidate = getCurrentUserRole() === 'candidate';

  const { data, isLoading, isFetching, isError, refetch } = useGetJobsQuery({
    search: search || undefined,
    location: locationTerm || undefined,
    type: filters.jobType || undefined,
    experience: filters.experience || undefined,
    skill: filters.skill || undefined,
    applied: isCandidate ? appliedFilter || undefined : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { data: jobTypesData } = useGetJobTypesQuery();
  const { data: skillsData } = useGetSkillsQuery();
  const jobTypeOptions = jobTypesData?.data ?? [];
  const skillOptions = skillsData?.data ?? [];

  // "Applied" badges stay correct even when the job list cache is stale.
  const { data: myApplicationsData } = useGetMyApplicationsQuery(undefined, { skip: !isCandidate });
  const appliedStatusMap = useMemo(() => {
    const map = new Map<string, CandidateApplicationStatus>();
    (myApplicationsData?.data.items ?? []).forEach((application) => {
      map.set(application.job._id, application.status);
    });
    return map;
  }, [myApplicationsData]);

  const { data: savedJobsData } = useGetMySavedJobsQuery(undefined, { skip: !isCandidate });
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();
  const savedJobIds = useMemo(
    () => new Set((savedJobsData?.data.items ?? []).map((entry) => entry.job._id)),
    [savedJobsData],
  );

  const jobs = data?.data.items ?? [];
  const pagination = data?.data.pagination;
  const total = pagination?.total ?? 0;
  // Skeletons only when there is nothing to show yet. A refetch behind an
  // already-rendered grid dims it instead, so the page never flashes empty
  // while the debounced search catches up.
  const showSkeletons = isLoading || (isFetching && jobs.length === 0);
  const refreshing = isFetching && !showSkeletons;

  const toggleSave = async (jobId: string) => {
    // Saving needs a candidate profile, so say why instead of leaving the
    // bookmark silently unchanged.
    if (!isCandidate) {
      notify.info('Sign in with a candidate account to save jobs.');
      return;
    }

    const wasSaved = savedJobIds.has(jobId);
    try {
      if (wasSaved) {
        await unsaveJob(jobId).unwrap();
        notify.success('Removed from saved jobs.');
      } else {
        await saveJob(jobId).unwrap();
        notify.success('Job saved. Find it under Saved Jobs.');
      }
    } catch (error) {
      notify.apiError(error, wasSaved ? 'Could not remove this job.' : 'Could not save this job.');
    }
  };

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setTopKeyword('');
    setTopLocation('');
    setSearch('');
    setLocationTerm('');
    setAppliedFilter('');
    setFilters({ jobType: '', experience: '', skill: '' });
  };

  const { data: expLookupsData } = useGetLookupsQuery({ category: 'experience_band' });
  const experienceOptions = useMemo(() => {
    if (expLookupsData?.data && expLookupsData.data.length > 0) {
      return expLookupsData.data
        .filter((item) => item.isActive !== false)
        .map((item) => ({ value: item.value, label: item.name }));
    }
    return [
      { value: '0-1', label: 'Fresher / 0-1 yr' },
      { value: '0-2', label: '0-2 years' },
      { value: '1-2', label: '1-2 years' },
      { value: '2-5', label: '2-5 years' },
      { value: '3-5', label: '3-5 years' },
      { value: '5-10', label: '5-10 years' },
      { value: '10+', label: '10+ years' },
    ];
  }, [expLookupsData]);

  const jobTypeLabel = (value: string) =>
    jobTypeOptions.find((option) => option.value.toLowerCase() === value.toLowerCase())?.name ?? value;
  const expLabel = (value: string) =>
    experienceOptions.find((option) => option.value.toLowerCase() === value.toLowerCase() || option.label.toLowerCase() === value.toLowerCase())?.label ?? value;
  const skillLabel = (value: string) => skillOptions.find((option) => option.value === value)?.name ?? value;

  /** Every filter currently narrowing the list, as removable chips. */
  const activeFilters = [
    search && {
      key: 'q',
      label: `"${search}"`,
      clear: () => {
        setSearch('');
        setTopKeyword('');
      },
    },
    locationTerm && {
      key: 'loc',
      label: locationTerm,
      clear: () => {
        setLocationTerm('');
        setTopLocation('');
      },
    },
    filters.jobType && {
      key: 'type',
      label: jobTypeLabel(filters.jobType),
      clear: () => updateFilter('jobType', ''),
    },
    filters.experience && {
      key: 'exp',
      label: expLabel(filters.experience),
      clear: () => updateFilter('experience', ''),
    },
    filters.skill && {
      key: 'skill',
      label: skillLabel(filters.skill),
      clear: () => updateFilter('skill', ''),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    const top = resultsRef.current?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: top + window.scrollY - 110, behavior: 'smooth' });
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setPage(1);
    setSearch(topKeyword.trim());
    setLocationTerm(topLocation.trim());
  };

  // The hero's fields sit inside one white pill, so they drop their own outline.
  const searchFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 999,
      bgcolor: 'background.paper',
      '& fieldset': { border: 'none' },
      '&.Mui-focused': { boxShadow: 'none' },
    },
  } as const;

  const renderFilterContent = (variant: 'rail' | 'drawer') => (
    <Box sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
              border: '1px solid',
              borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.2),
              '& svg': { fontSize: 18 },
            }}
          >
            <TuneRounded />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Filters</Typography>
            <Typography variant="caption" color="text.secondary">
              {activeFilters.length ? `${activeFilters.length} active` : 'Narrow your search'}
            </Typography>
          </Box>
        </Stack>
        {variant === 'drawer' ? (
          <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close filters">
            <CloseRounded />
          </IconButton>
        ) : (
          activeFilters.length > 0 && (
            <Button size="small" startIcon={<RestartAltRounded />} onClick={clearFilters} sx={{ fontWeight: 700 }}>
              Clear
            </Button>
          )
        )}
      </Stack>

      <Divider sx={{ mb: 2.5 }} />

      <FilterSection icon={<LocationOnRounded />} label="City / Location">
        <CityFilterBlock
          value={locationTerm}
          onChange={handleSidebarCityChange}
          isDetecting={isDetectingLocation}
          onDetect={handleDetectLocation}
        />
      </FilterSection>

      {jobTypeOptions.length > 0 && (
        <FilterSection icon={<WorkOutlineRounded />} label="Job type">
          <ChipChoice
            options={jobTypeOptions.map((option) => ({ value: option.value, label: option.name }))}
            value={filters.jobType}
            onChange={(next) => updateFilter('jobType', next)}
          />
        </FilterSection>
      )}

      <FilterSection icon={<BusinessCenterRounded />} label="Experience">
        <ChipChoice
          options={experienceOptions}
          value={filters.experience}
          onChange={(next) => updateFilter('experience', next)}
        />
      </FilterSection>

      {skillOptions.length > 0 && (
        <FilterSection icon={<PsychologyAltRounded />} label="Skill">
          <ChipChoice
            options={skillOptions.slice(0, 14).map((option) => ({ value: option.value, label: option.name }))}
            value={filters.skill}
            onChange={(next) => updateFilter('skill', next)}
          />
        </FilterSection>
      )}

      {variant === 'drawer' && (
        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)}>
            Show {total} job{total === 1 ? '' : 's'}
          </Button>
          <Button fullWidth variant="outlined" onClick={clearFilters}>
            Clear
          </Button>
        </Stack>
      )}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Compact search bar — slides in under the navbar once the hero leaves */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 64, md: 72 },
          left: 0,
          right: 0,
          zIndex: 1099,
          bgcolor: (theme: Theme) => alpha(theme.palette.background.paper, 0.88),
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: showStickySearch ? '0 10px 30px -18px rgba(12, 82, 131, 0.55)' : 'none',
          transform: showStickySearch ? 'translateY(0)' : 'translateY(-130%)',
          opacity: showStickySearch ? 1 : 0,
          transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease',
          pointerEvents: showStickySearch ? 'auto' : 'none',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.25 }}>
          <Stack
            component="form"
            onSubmit={handleSearchSubmit}
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Search roles, clinics, skills"
              aria-label="Search jobs"
              value={topKeyword}
              onChange={(event) => setTopKeyword(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchRounded sx={{ color: 'text.disabled', mr: 1 }} />,
                  sx: { borderRadius: 999 },
                },
              }}
            />
            <TopLocationSearchField
              size="small"
              placeholder="City"
              value={topLocation}
              onChange={(val) => setTopLocation(val)}
              onSelect={handleSelectTopCity}
              isDetecting={isDetectingLocation}
              onDetect={handleDetectLocation}
              inputSx={{ borderRadius: 999 }}
              sx={{ width: { xs: '100%', sm: 220 }, display: { xs: 'none', sm: 'block' } }}
            />
            <Button type="submit" variant="contained" sx={{ borderRadius: 999, px: 3, flexShrink: 0 }}>
              Search
            </Button>
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open filters"
              sx={{
                display: { md: 'none' },
                flexShrink: 0,
                border: '1px solid',
                borderColor: 'divider',
                color: 'primary.main',
              }}
            >
              <TuneRounded />
            </IconButton>
          </Stack>
        </Container>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: '#ffffff',
          background: HERO_GRADIENT,
          py: { xs: 6, md: 9 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -180,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha('#ffffff', 0.18)} 0%, ${alpha('#ffffff', 0)} 70%)`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 20% 0%, #000 0%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 20% 0%, #000 0%, transparent 65%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={2.5} sx={{ maxWidth: 860 }}>
            <Chip
              size="small"
              icon={<AutoAwesomeRounded />}
              label={total > 0 ? `${total} live veterinary roles` : 'India’s veterinary job network'}
              sx={{
                alignSelf: 'flex-start',
                fontWeight: 700,
                color: '#ffffff',
                bgcolor: alpha('#ffffff', 0.16),
                border: '1px solid',
                borderColor: alpha('#ffffff', 0.26),
                '& .MuiChip-icon': { color: '#ffffff', fontSize: 16 },
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.03em',
                fontSize: { xs: '2.1rem', sm: '2.7rem', md: '3.3rem' },
                lineHeight: 1.1,
              }}
            >
              Find your next role in{' '}
              <Box component="span" sx={{ color: '#7ff3e4' }}>
                veterinary care
              </Box>
            </Typography>
            <Typography
              sx={{
                maxWidth: 620,
                fontSize: { xs: '1rem', md: '1.125rem' },
                color: alpha('#ffffff', 0.86),
                fontWeight: 400,
              }}
            >
              Clinics, hospitals and pet-care brands hiring veterinarians, groomers, trainers and support
              staff — apply directly, no middlemen.
            </Typography>
          </Stack>

          {/* Search console */}
          <Paper
            component="form"
            onSubmit={handleSearchSubmit}
            elevation={0}
            sx={{
              mt: { xs: 3.5, md: 4.5 },
              p: { xs: 1.5, sm: 1 },
              borderRadius: { xs: 4, sm: 999 },
              maxWidth: 940,
              boxShadow: '0 26px 60px -26px rgba(3, 32, 54, 0.65)',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.25, sm: 0 }}
              sx={{ alignItems: 'center' }}
            >
              <TextField
                fullWidth
                placeholder="Job title, skill or clinic"
                aria-label="Search jobs by title, skill or clinic"
                value={topKeyword}
                onChange={(event) => setTopKeyword(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <SearchRounded sx={{ color: 'secondary.main', mr: 1.25 }} />,
                    sx: { fontWeight: 600 },
                  },
                }}
                sx={searchFieldSx}
              />
              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: 'none', sm: 'block' }, my: 1.25 }}
              />
              <TopLocationSearchField
                value={topLocation}
                onChange={(val) => setTopLocation(val)}
                onSelect={handleSelectTopCity}
                isDetecting={isDetectingLocation}
                onDetect={handleDetectLocation}
                placeholder="City or state"
                searchFieldSx={searchFieldSx}
                sx={{ maxWidth: { sm: 300 } }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRounded />}
                sx={{ borderRadius: 999, px: 4, flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
              >
                Search
              </Button>
            </Stack>
          </Paper>

          {/* Popular searches */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 2.5, flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: alpha('#ffffff', 0.7) }}>
              Popular:
            </Typography>
            {popularSearches.map((term) => (
              <Chip
                key={term}
                label={term}
                size="small"
                onClick={() => {
                  setPage(1);
                  setTopKeyword(term);
                  setSearch(term);
                }}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#ffffff',
                  bgcolor: alpha('#ffffff', 0.12),
                  border: '1px solid',
                  borderColor: alpha('#ffffff', 0.22),
                  '&:hover': { bgcolor: alpha('#ffffff', 0.24) },
                }}
              />
            ))}
          </Stack>

          {/* Trust strip */}
          <Stack
            direction="row"
            spacing={{ xs: 2, sm: 4 }}
            sx={{ mt: { xs: 3, md: 4 }, flexWrap: 'wrap', rowGap: 1.5 }}
          >
            {[
              { icon: <VerifiedRounded />, label: 'Admin-verified clinics' },
              { icon: <BoltRounded />, label: 'One-click apply' },
              { icon: <TrendingUpRounded />, label: 'New roles every day' },
            ].map((item) => (
              <Stack key={item.label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ display: 'flex', color: '#7ff3e4', '& svg': { fontSize: 19 } }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: alpha('#ffffff', 0.9) }}>
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      <AdBanner placement="jobs_list" />

      <Container maxWidth="lg" sx={{ py: { xs: 3.5, md: 5 } }}>
        <Grid container spacing={{ xs: 2.5, md: 3.5 }}>
          {/* Filter rail */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper
              elevation={0}
              sx={{
                position: 'sticky',
                top: 96,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {renderFilterContent('rail')}
            </Paper>
          </Grid>

          {/* Results */}
          <Grid size={{ xs: 12, md: 9 }} ref={resultsRef}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                rowGap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.015em' }}>
                  {search || locationTerm ? 'Search results' : 'All open jobs'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {showSkeletons
                    ? 'Finding the best matches…'
                    : `${total} job${total === 1 ? '' : 's'}${locationTerm ? ` in ${locationTerm}` : ''}${
                        search ? ` for “${search}”` : ''
                      }`}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {isCandidate && (
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={appliedFilter}
                    onChange={(_, value: JobAppliedFilter | null) => {
                      setPage(1);
                      setAppliedFilter(value ?? '');
                    }}
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 999,
                        px: 1.75,
                        border: '1px solid',
                        borderColor: 'divider',
                      },
                      '& .MuiToggleButton-root.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    <ToggleButton value="">All</ToggleButton>
                    <ToggleButton value="unapplied">Not applied</ToggleButton>
                    <ToggleButton value="applied">Applied</ToggleButton>
                  </ToggleButtonGroup>
                )}
                <Button
                  startIcon={<TuneRounded />}
                  variant="outlined"
                  onClick={() => setDrawerOpen(true)}
                  sx={{ display: { md: 'none' } }}
                >
                  Filters{activeFilters.length ? ` (${activeFilters.length})` : ''}
                </Button>
              </Stack>
            </Stack>

            {activeFilters.length > 0 && (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ flexWrap: 'wrap', rowGap: 0.75, alignItems: 'center', mb: 2.5 }}
              >
                {activeFilters.map((filter) => (
                  <Chip
                    key={filter.key}
                    label={filter.label}
                    onDelete={filter.clear}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
                      border: '1px solid',
                      borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.2),
                    }}
                  />
                ))}
                <Button size="small" onClick={clearFilters} sx={{ fontWeight: 700 }}>
                  Clear all
                </Button>
              </Stack>
            )}

            {isError && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                action={
                  <Button color="inherit" size="small" onClick={() => refetch()}>
                    Retry
                  </Button>
                }
              >
                Unable to load jobs. Please try again.
              </Alert>
            )}

            {/* A hairline that keeps the page honest while a refetch runs. */}
            <Box sx={{ height: 3, mb: 1.5 }}>
              {refreshing && <LinearProgress color="secondary" sx={{ height: 3, borderRadius: 999 }} />}
            </Box>

            {showSkeletons && (
              <Grid container spacing={{ xs: 2, md: 2.5 }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={index}>
                    <JobCardSkeleton />
                  </Grid>
                ))}
              </Grid>
            )}

            {!showSkeletons && !isFetching && !isError && jobs.length === 0 && (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px dashed',
                  borderColor: 'divider',
                  py: { xs: 6, md: 8 },
                  px: 3,
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'secondary.main',
                    bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.12),
                    '& svg': { fontSize: 30 },
                  }}
                >
                  <SearchOffRounded />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  No jobs match this search
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2.5 }}>
                  Try a broader keyword, remove a filter, or browse every open role across India.
                </Typography>
                <Button variant="contained" startIcon={<RestartAltRounded />} onClick={clearFilters}>
                  Clear filters
                </Button>
              </Paper>
            )}

            {!showSkeletons && jobs.length > 0 && (
              <Grid
                container
                spacing={{ xs: 2, md: 2.5 }}
                sx={{
                  transition: 'opacity 200ms ease',
                  opacity: refreshing ? 0.55 : 1,
                  pointerEvents: refreshing ? 'none' : 'auto',
                }}
              >
                {jobs.map((job) => {
                  const hasApplied = Boolean(job.hasApplied) || appliedStatusMap.has(job._id);

                  return (
                    <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={job._id}>
                      <JobCard
                        title={job.title}
                        clinic={job.companyName}
                        location={job.location}
                        salary={job.salary}
                        type={job.type}
                        skills={job.skills}
                        experience={job.experience}
                        postedAt={formatRelativeDate(job.createdAt)}
                        applied={hasApplied}
                        featured={Boolean(job.isFeatured)}
                        urgent={Boolean(job.isUrgent)}
                        saved={savedJobIds.has(job._id)}
                        onSave={() => void toggleSave(job._id)}
                        onClick={() => navigate(`/jobs/${job._id}`)}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {!showSkeletons && pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, md: 5 } }}>
                <Pagination
                  count={pagination.totalPages}
                  page={page}
                  onChange={(_, nextPage) => handlePageChange(nextPage)}
                  color="primary"
                  shape="rounded"
                  sx={{ '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: 2 } }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { borderTopRightRadius: 18, borderBottomRightRadius: 18 } } }}
      >
        <Box sx={{ width: { xs: '86vw', sm: 380 } }}>{renderFilterContent('drawer')}</Box>
      </Drawer>
    </Box>
  );
};

export default JobListing;
