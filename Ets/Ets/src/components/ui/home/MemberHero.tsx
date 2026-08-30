import { useState, type FormEvent, type ReactNode } from 'react';
import { Box, Button, Chip, Container, InputBase, Skeleton, Stack, Typography } from '@mui/material';
import {
  ArrowForward,
  BookmarkBorder,
  Business,
  CheckCircle,
  Dashboard as DashboardIcon,
  Description,
  HourglassEmpty,
  LocationOn,
  People,
  Search,
  Work,
  WorkOutlined,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import { useCandidateHomeData, useEmployerHomeData } from '../../../hooks/useRoleHomeData';

type Stat = { label: string; value: number; icon: ReactNode; to: string };
type Action = { label: string; to: string; icon: ReactNode; primary?: boolean };

/**
 * The signed-in replacement for the marketing hero: greets the user by name and
 * opens with the numbers and shortcuts that matter for *their* role, so the home
 * page stops selling the product to someone who already bought it.
 */
const MemberHero: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isCandidate, isEmployer, isAdmin, displayName } = useAuth();
  const candidate = useCandidateHomeData(isCandidate);
  const employer = useEmployerHomeData(isEmployer);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

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

  // The stored session only carries id/email/role, so the greeting name comes
  // from the role's own profile and falls back to the email.
  const profileName = isCandidate ? candidate.displayName : isEmployer ? employer.displayName : '';
  const name = profileName || displayName;
  const approvalStatus = isCandidate
    ? candidate.approvalStatus
    : isEmployer
      ? employer.approvalStatus
      : undefined;
  const isLoading = isCandidate ? candidate.isLoading : isEmployer ? employer.isLoading : false;

  const roleBadge = isEmployer
    ? t('member_badge_employer')
    : isAdmin
      ? t('member_badge_admin')
      : t('member_badge_candidate');

  const subtitle = isEmployer
    ? t('member_subtitle_employer')
    : isAdmin
      ? t('member_subtitle_admin')
      : t('member_subtitle_candidate');

  const stats: Stat[] = isEmployer
    ? [
        {
          label: t('member_stat_active_jobs'),
          value: employer.activeJobCount,
          icon: <Work sx={{ fontSize: 20 }} />,
          to: '/employer/dashboard',
        },
        {
          label: t('member_stat_applications_received'),
          value: employer.applicationCount,
          icon: <Description sx={{ fontSize: 20 }} />,
          to: '/employer/applications',
        },
        {
          label: t('member_stat_new_applications'),
          value: employer.newApplicationCount,
          icon: <People sx={{ fontSize: 20 }} />,
          to: '/employer/applications',
        },
      ]
    : isCandidate
      ? [
          {
            label: t('member_stat_applications_sent'),
            value: candidate.applicationCount,
            icon: <Description sx={{ fontSize: 20 }} />,
            to: '/candidate/dashboard',
          },
          {
            label: t('member_stat_shortlisted'),
            value: candidate.shortlistedCount,
            icon: <CheckCircle sx={{ fontSize: 20 }} />,
            to: '/candidate/dashboard',
          },
          {
            label: t('member_stat_saved_jobs'),
            value: candidate.savedCount,
            icon: <BookmarkBorder sx={{ fontSize: 20 }} />,
            to: '/candidate/saved-jobs',
          },
        ]
      : [];

  const actions: Action[] = isEmployer
    ? [
        { label: t('post_job'), to: '/employer/post-job', icon: <Work />, primary: true },
        { label: t('member_action_view_applications'), to: '/employer/applications', icon: <Description /> },
        { label: t('member_action_browse_candidates'), to: '/employer/employees', icon: <People /> },
        { label: t('dashboard'), to: '/employer/dashboard', icon: <DashboardIcon /> },
      ]
    : isCandidate
      ? [
          { label: t('find_jobs'), to: '/find-job', icon: <WorkOutlined />, primary: true },
          { label: t('member_action_my_applications'), to: '/candidate/dashboard', icon: <Description /> },
          { label: t('member_stat_saved_jobs'), to: '/candidate/saved-jobs', icon: <BookmarkBorder /> },
        ]
      : [
          { label: t('browse_jobs'), to: '/jobs', icon: <WorkOutlined />, primary: true },
          { label: t('employers'), to: '/employers', icon: <Business /> },
        ];

  const approvalChip =
    approvalStatus === 'approved' ? (
      <Chip
        size="small"
        icon={<CheckCircle sx={{ fontSize: 16 }} />}
        label={t('member_approval_approved')}
        sx={{ bgcolor: 'rgba(46, 204, 113, 0.22)', color: '#eafff5', fontWeight: 700 }}
      />
    ) : approvalStatus ? (
      <Chip
        size="small"
        icon={<HourglassEmpty sx={{ fontSize: 16 }} />}
        label={approvalStatus === 'rejected' ? t('member_approval_rejected') : t('member_approval_pending')}
        sx={{ bgcolor: 'rgba(255, 215, 0, 0.22)', color: '#fff8dc', fontWeight: 700 }}
      />
    ) : null;

  const inputSx = {
    flex: 1,
    minWidth: 0,
    px: 2,
    py: 1.4,
    fontSize: '0.95rem',
    color: 'text.primary',
  };

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
        py: { xs: 5, md: 7 },
        background:
          'radial-gradient(circle at 15% 20%, #0e6a9b 0%, transparent 55%), radial-gradient(circle at 85% 80%, #0ab6a2 0%, transparent 50%), linear-gradient(135deg, #0a3f66 0%, #0c5283 60%, #0ab6a2 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: { xs: 240, md: 420 },
          height: { xs: 240, md: 420 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Chip
            size="small"
            label={roleBadge}
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 700, letterSpacing: 0.4 }}
          />
          {approvalChip}
        </Stack>

        <Typography
          variant="h3"
          sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.6rem' }, lineHeight: 1.2, mb: 1 }}
        >
          {name ? t('member_welcome_named', { name }) : t('member_welcome')}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 620, mb: 3.5 }}>
          {subtitle}
        </Typography>

        {stats.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(3, 1fr)' },
              gap: { xs: 1.5, md: 2.5 },
              mb: 3.5,
              maxWidth: 720,
            }}
          >
            {stats.map((stat) => (
              <Box
                key={stat.label}
                component={Link}
                to={stat.to}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  p: { xs: 1.5, md: 2 },
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.25s ease, background-color 0.25s ease',
                  '&:hover': { transform: 'translateY(-3px)', bgcolor: 'rgba(255,255,255,0.22)' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, opacity: 0.9, mb: 0.5 }}>
                  {stat.icon}
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.72rem', lineHeight: 1.2 }}>
                    {stat.label}
                  </Typography>
                </Box>
                {isLoading ? (
                  <Skeleton variant="text" width={44} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
                ) : (
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.9rem' }, lineHeight: 1.1 }}>
                    {stat.value}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {isCandidate && (
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'stretch',
              gap: 1,
              p: 1,
              mb: 3.5,
              maxWidth: 720,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: '0 18px 40px -20px rgba(0,0,0,0.55)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <Search sx={{ color: 'text.secondary', ml: 1 }} />
              <InputBase
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('hero_search_keyword_placeholder')}
                sx={inputSx}
                inputProps={{ 'aria-label': t('hero_search_keyword_placeholder') }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <LocationOn sx={{ color: 'text.secondary', ml: 1 }} />
              <InputBase
                value={searchLocation}
                onChange={(event) => setSearchLocation(event.target.value)}
                placeholder={t('hero_search_location_placeholder')}
                sx={inputSx}
                inputProps={{ 'aria-label': t('hero_search_location_placeholder') }}
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 4,
                py: 1.3,
                borderRadius: 2.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
              }}
            >
              {t('search')}
            </Button>
          </Box>
        )}

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          {actions.map((action) => (
            <Button
              key={action.to}
              component={Link}
              to={action.to}
              variant={action.primary ? 'contained' : 'outlined'}
              startIcon={action.icon}
              endIcon={action.primary ? <ArrowForward /> : undefined}
              sx={
                action.primary
                  ? {
                      bgcolor: '#ffd700',
                      color: '#0a3f66',
                      fontWeight: 800,
                      px: 3,
                      py: 1.2,
                      borderRadius: 2.5,
                      boxShadow: '0 8px 20px -8px rgba(255,215,0,0.8)',
                      '&:hover': { bgcolor: '#ffca00' },
                    }
                  : {
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.55)',
                      fontWeight: 700,
                      px: 3,
                      py: 1.2,
                      borderRadius: 2.5,
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' },
                    }
              }
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default MemberHero;
