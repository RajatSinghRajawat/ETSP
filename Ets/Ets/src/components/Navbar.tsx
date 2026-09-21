import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Container,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Menu as MenuIcon,
  Close,
  Work,
  Business,
  Info,
  Phone,
  Home,
  AccountCircle,
  Dashboard,
  Logout,
  SwapHoriz,
  People,
  KeyboardArrowDown,
  PrivacyTip,
} from '@mui/icons-material';
import HeaderChatButton from './common/HeaderChatButton';
import NotificationBell from './common/NotificationBell';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { axiosInstance } from '../store/api/axiosInstance';
import { API_ENDPOINTS } from '../store/api/endpoints';
import { clearAuthSession, setAuthSession, useAuth } from '../hooks/useAuth';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message ?? fallback;
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
};

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase().startsWith('hi') ? 'hi' : 'en';
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { role, isLoggedIn, displayName } = useAuth();
  const switchTargetRole = role === 'employer' ? 'candidate' : 'employer';
  const switchTargetLabel = switchTargetRole === 'employer' ? t('switch_to_employer') : t('switch_to_candidate');

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleLanguageMenuClose();
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreAnchorEl(null);
  };

  const getProfilePath = () => {
    if (role === 'employer') {
      return '/employer/dashboard';
    }

    if (role === 'admin') {
      return '/';
    }

    return '/candidate/dashboard';
  };

  const handleOpenProfile = () => {
    handleProfileMenuClose();
    setMobileOpen(false);
    navigate(getProfilePath());
  };

  const handleLogout = () => {
    clearAuthSession();
    handleProfileMenuClose();
    setMobileOpen(false);
    navigate('/');
  };

  const handleSwitchProfile = async () => {
    if (!isLoggedIn || role === 'admin') {
      return;
    }

    setSwitchError('');
    setSwitchingRole(switchTargetRole);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.auth.switchProfile, {
        role: switchTargetRole,
      });
      const { accessToken, user } = response.data;

      setAuthSession(accessToken, user);
      handleProfileMenuClose();
      setMobileOpen(false);
      navigate(switchTargetRole === 'employer' ? '/employer/dashboard' : '/candidate/dashboard');
    } catch (error) {
      setSwitchError(
        getApiErrorMessage(
          error,
          t('switch_profile_error', { role: t(switchTargetRole === 'employer' ? 'role_employer' : 'role_candidate') })
        )
      );
    } finally {
      setSwitchingRole(null);
    }
  };

  const isEmployer = role === 'employer';

  // Desktop mid navigation items
  const mainNavItems = [
    { label: t('home'), path: '/', icon: <Home /> },
    ...(isEmployer
      ? [
          { label: t('candidates'), path: '/employer/employees', icon: <People /> },
          { label: t('post_job_nav') || 'Post Job', path: '/employer/post-job', icon: <Work /> },
        ]
      : [
          { label: t('find_job'), path: '/find-job', icon: <Work /> },
          { label: t('employers'), path: '/employers', icon: <Business /> },
        ]),
  ];

  const moreNavItems = [
    { label: t('about'), path: '/about', icon: <Info /> },
    { label: t('contact'), path: '/contact', icon: <Phone /> },
    { label: t('privacy_policy'), path: '/privacy-policy', icon: <PrivacyTip /> },
  ];

  // Mobile flat nav items
  const navItems = [...mainNavItems, ...moreNavItems];

  const isActive = (path: string) => location.pathname === path;
  const userDisplayName = displayName || t('profile');
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  const drawer = (
    <Box sx={{ width: '100%', height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src="/Logo.png" alt="Logo" sx={{ height: 36, width: 'auto' }} />
        </Box>
        <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
          <Close />
        </IconButton>
      </Box>

      {/* User summary card in drawer if logged in */}
      {isLoggedIn && (
        <Box sx={{ p: 2, mx: 2, mt: 2, borderRadius: 2.5, bgcolor: 'rgba(12, 82, 131, 0.04)', border: '1px solid rgba(12, 82, 131, 0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700, fontSize: 16 }}>
              {userInitial || <AccountCircle />}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: 'text.primary', noWrap: true }}>
                {userDisplayName}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'secondary.main', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {role ? (role === 'employer' ? t('role_employer') : t('role_candidate')) : 'User'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <List sx={{ px: 1.5, py: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                sx={{
                  py: 1.2,
                  px: 2,
                  borderRadius: 2,
                  bgcolor: active ? 'rgba(12, 82, 131, 0.08)' : 'transparent',
                  color: active ? 'primary.main' : 'text.primary',
                  fontWeight: active ? 700 : 500,
                  borderLeft: active ? '4px solid' : '4px solid transparent',
                  borderColor: 'primary.main',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: active ? 'rgba(12, 82, 131, 0.12)' : 'action.hover',
                  },
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', color: active ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </Box>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
        {isLoggedIn ? (
          <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
            <Button
              onClick={handleOpenProfile}
              variant="outlined"
              fullWidth
              size="small"
              startIcon={<Dashboard />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1 }}
            >
              {t('dashboard')}
            </Button>
            {role !== 'admin' && (
              <Button
                onClick={handleSwitchProfile}
                variant="outlined"
                fullWidth
                size="small"
                startIcon={switchingRole ? <CircularProgress size={16} /> : <SwapHoriz />}
                disabled={Boolean(switchingRole)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1 }}
              >
                {switchingRole ? t('switching') : switchTargetLabel}
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="text"
              color="error"
              fullWidth
              size="small"
              startIcon={<Logout />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {t('logout')}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              fullWidth
              size="small"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {t('login')}
            </Button>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              fullWidth
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
              }}
            >
              {t('signup')}
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Tooltip title={t('language')}>
            <Button
              onClick={handleLanguageMenuOpen}
              size="small"
              startIcon={<LanguageIcon />}
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
            >
              {currentLang === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
            </Button>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 2px 14px -2px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.02)',
          transition: 'all 0.3s ease',
          borderBottom: '1px solid',
          borderColor: 'rgba(226, 232, 240, 0.85)',
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 2.5, md: 3, lg: 3.5 } }}>
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: 56, sm: 64, md: 72 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              width: '100%',
            }}
          >
            {/* ZONE 1: LEFT - BRAND LOGO */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                flexShrink: 0,
                transition: 'transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.03)',
                  opacity: 0.92,
                },
              }}
            >
              <Box
                component="img"
                src="/Logo.png"
                alt="Vets Linked"
                sx={{
                  height: { xs: 34, sm: 40, md: 46 },
                  width: 'auto',
                  display: 'block',
                }}
              />
            </Box>

            {/* ZONE 2: MID - CENTERED PAGE NAVIGATION */}
            {!isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  mx: { md: 1, lg: 3 },
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    p: '5px',
                    borderRadius: '30px',
                    bgcolor: 'rgba(241, 245, 249, 0.75)',
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  {mainNavItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Button
                        key={item.path}
                        component={Link}
                        to={item.path}
                        sx={{
                          color: active ? 'primary.main' : 'text.primary',
                          fontWeight: active ? 750 : 600,
                          fontSize: '0.92rem',
                          px: 2.2,
                          py: 0.7,
                          borderRadius: '24px',
                          textTransform: 'none',
                          letterSpacing: '-0.01em',
                          bgcolor: active ? 'white' : 'transparent',
                          boxShadow: active ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
                          '&:hover': {
                            bgcolor: active ? 'white' : 'rgba(255, 255, 255, 0.7)',
                            color: 'primary.main',
                          },
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}

                  <Button
                    onClick={handleMoreMenuOpen}
                    endIcon={
                      <KeyboardArrowDown
                        sx={{
                          fontSize: '18px !important',
                          transition: 'transform 0.25s ease',
                          transform: moreAnchorEl ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    }
                    sx={{
                      color: moreNavItems.some((item) => isActive(item.path)) ? 'primary.main' : 'text.primary',
                      fontWeight: moreNavItems.some((item) => isActive(item.path)) ? 750 : 600,
                      fontSize: '0.92rem',
                      px: 2,
                      py: 0.7,
                      borderRadius: '24px',
                      textTransform: 'none',
                      letterSpacing: '-0.01em',
                      bgcolor: moreNavItems.some((item) => isActive(item.path)) ? 'white' : 'transparent',
                      boxShadow: moreNavItems.some((item) => isActive(item.path)) ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
                      '&:hover': {
                        bgcolor: moreNavItems.some((item) => isActive(item.path)) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                        color: 'primary.main',
                      },
                    }}
                  >
                    {t('more')}
                  </Button>
                </Box>

                <Menu
                  anchorEl={moreAnchorEl}
                  open={Boolean(moreAnchorEl)}
                  onClose={handleMoreMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.5,
                        minWidth: 220,
                        borderRadius: 3,
                        p: 0.75,
                        boxShadow: '0 14px 40px -4px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.05)',
                        border: '1px solid rgba(226, 232, 240, 0.9)',
                      },
                    },
                  }}
                >
                  {moreNavItems.map((item) => (
                    <MenuItem
                      key={item.path}
                      component={Link}
                      to={item.path}
                      onClick={handleMoreMenuClose}
                      selected={isActive(item.path)}
                      sx={{
                        py: 1.1,
                        px: 2,
                        borderRadius: 2,
                        fontWeight: isActive(item.path) ? 700 : 500,
                        fontSize: '0.9rem',
                        gap: 1.5,
                        '&:hover': { bgcolor: 'rgba(12, 82, 131, 0.06)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', color: 'primary.main' }}>{item.icon}</Box>
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}

            {/* ZONE 3: RIGHT - OTHER CONTROLS & USER ACTIONS */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.75, sm: 1.25 },
                flexShrink: 0,
                ml: isMobile ? 'auto' : 0,
              }}
            >
              {/* Desktop view controls on right */}
              {!isMobile && (
                <>
                  {/* Language Selector */}
                  <Tooltip title={t('language')}>
                    <IconButton
                      onClick={handleLanguageMenuOpen}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        border: '1px solid',
                        borderColor: 'rgba(226, 232, 240, 0.9)',
                        borderRadius: '12px',
                        p: 0.8,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          color: 'primary.main',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <LanguageIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleLanguageMenuClose}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 1.5,
                          minWidth: 160,
                          borderRadius: 2.5,
                          p: 0.5,
                          boxShadow: '0 10px 30px -4px rgba(15, 23, 42, 0.12)',
                          border: '1px solid rgba(226, 232, 240, 0.9)',
                        },
                      },
                    }}
                  >
                    <MenuItem
                      onClick={() => changeLanguage('en')}
                      selected={currentLang === 'en'}
                      sx={{ borderRadius: 1.5, fontWeight: currentLang === 'en' ? 700 : 500 }}
                    >
                      English
                    </MenuItem>
                    <MenuItem
                      onClick={() => changeLanguage('hi')}
                      selected={currentLang === 'hi'}
                      sx={{ borderRadius: 1.5, fontWeight: currentLang === 'hi' ? 700 : 500 }}
                    >
                      हिन्दी (Hindi)
                    </MenuItem>
                  </Menu>

                  {isLoggedIn ? (
                    <>
                      {/* Notifications bell */}
                      <NotificationBell />

                      {/* Live chat */}
                      <HeaderChatButton />

                      {/* Employer Quick Action Button */}
                      {isEmployer && (
                        <Button
                          component={Link}
                          to="/employer/post-job"
                          variant="contained"
                          size="small"
                          startIcon={<Work sx={{ fontSize: '16px !important' }} />}
                          sx={{
                            background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            borderRadius: '20px',
                            px: 2,
                            py: 0.65,
                            textTransform: 'none',
                            boxShadow: '0 3px 10px rgba(12, 82, 131, 0.22)',
                            transition: 'all 0.25s ease',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #094066 0%, #089c8b 100%)',
                              boxShadow: '0 5px 15px rgba(12, 82, 131, 0.32)',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          {t('post_job_nav') || 'Post Job'}
                        </Button>
                      )}

                      {/* Profile Avatar Button (R only) */}
                      <Tooltip title={userDisplayName}>
                        <IconButton
                          onClick={handleProfileMenuOpen}
                          size="small"
                          sx={{
                            p: 0.3,
                            border: '2px solid',
                            borderColor: profileAnchorEl ? 'primary.main' : 'rgba(226, 232, 240, 0.9)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              transform: 'scale(1.05)',
                              boxShadow: '0 2px 8px rgba(12, 82, 131, 0.2)',
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              bgcolor: 'primary.main',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              boxShadow: '0 2px 6px rgba(12, 82, 131, 0.25)',
                            }}
                          >
                            {userInitial || <AccountCircle sx={{ fontSize: 20 }} />}
                          </Avatar>
                        </IconButton>
                      </Tooltip>

                      {/* Profile Dropdown Menu */}
                      <Menu
                        anchorEl={profileAnchorEl}
                        open={Boolean(profileAnchorEl)}
                        onClose={handleProfileMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{
                          paper: {
                            sx: {
                              mt: 1.5,
                              minWidth: 230,
                              borderRadius: 3,
                              p: 0.75,
                              boxShadow: '0 14px 40px -4px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.05)',
                              border: '1px solid rgba(226, 232, 240, 0.9)',
                            },
                          },
                        }}
                      >
                        <Box sx={{ px: 1.5, py: 1, mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: 'text.primary', lineHeight: 1.2 }}>
                            {userDisplayName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.6 }}>
                            <Box
                              component="span"
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                px: 1,
                                py: 0.25,
                                borderRadius: '8px',
                                bgcolor: isEmployer ? 'rgba(12, 82, 131, 0.1)' : 'rgba(10, 182, 162, 0.12)',
                                color: isEmployer ? 'primary.main' : 'secondary.main',
                              }}
                            >
                              {role ? (role === 'employer' ? t('role_employer') : t('role_candidate')) : 'User'}
                            </Box>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 0.75 }} />

                        <MenuItem
                          onClick={handleOpenProfile}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            px: 1.5,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            gap: 1.5,
                            '&:hover': { bgcolor: 'rgba(12, 82, 131, 0.06)' },
                          }}
                        >
                          <Dashboard fontSize="small" sx={{ color: 'primary.main' }} />
                          {t('dashboard')}
                        </MenuItem>

                        {role !== 'admin' && (
                          <MenuItem
                            onClick={handleSwitchProfile}
                            disabled={Boolean(switchingRole)}
                            sx={{
                              borderRadius: 2,
                              py: 1,
                              px: 1.5,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              gap: 1.5,
                              '&:hover': { bgcolor: 'rgba(12, 82, 131, 0.06)' },
                            }}
                          >
                            {switchingRole ? (
                              <CircularProgress size={18} sx={{ color: 'primary.main' }} />
                            ) : (
                              <SwapHoriz fontSize="small" sx={{ color: 'secondary.main' }} />
                            )}
                            {switchingRole ? t('switching') : switchTargetLabel}
                          </MenuItem>
                        )}

                        <Divider sx={{ my: 0.75 }} />

                        <MenuItem
                          onClick={handleLogout}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            px: 1.5,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            gap: 1.5,
                            color: 'error.main',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)', color: 'error.dark' },
                          }}
                        >
                          <Logout fontSize="small" />
                          {t('logout')}
                        </MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <>
                      {/* Logged-out buttons */}
                      <Button
                        component={Link}
                        to="/login"
                        variant="outlined"
                        size="small"
                        sx={{
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          borderRadius: '20px',
                          px: 2.2,
                          py: 0.6,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textTransform: 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(12, 82, 131, 0.05)',
                            borderColor: 'primary.dark',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        {t('login')}
                      </Button>
                      <Button
                        component={Link}
                        to="/signup"
                        variant="contained"
                        size="small"
                        sx={{
                          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                          color: 'white',
                          borderRadius: '20px',
                          px: 2.4,
                          py: 0.65,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textTransform: 'none',
                          boxShadow: '0 3px 10px rgba(12, 82, 131, 0.2)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #094066 0%, #089c8b 100%)',
                            boxShadow: '0 5px 14px rgba(12, 82, 131, 0.3)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        {t('signup')}
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Mobile view controls on the right */}
              {isMobile && (
                <>
                  <Tooltip title={t('language')}>
                    <IconButton
                      onClick={handleLanguageMenuOpen}
                      size="small"
                      aria-label={t('language')}
                      sx={{ color: 'text.primary', p: 0.75 }}
                    >
                      <LanguageIcon sx={{ fontSize: 21 }} />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleLanguageMenuClose}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 1.5,
                          minWidth: 160,
                          borderRadius: 2.5,
                          p: 0.5,
                        },
                      },
                    }}
                  >
                    <MenuItem onClick={() => changeLanguage('en')} selected={currentLang === 'en'}>English</MenuItem>
                    <MenuItem onClick={() => changeLanguage('hi')} selected={currentLang === 'hi'}>हिन्दी (Hindi)</MenuItem>
                  </Menu>

                  {isLoggedIn && (
                    <>
                      <NotificationBell />
                      <HeaderChatButton />
                    </>
                  )}

                  {!isLoggedIn && (
                    <Button
                      component={Link}
                      to="/login"
                      variant="outlined"
                      size="small"
                      startIcon={<AccountCircle sx={{ fontSize: '18px !important' }} />}
                      sx={{
                        py: 0.4,
                        px: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        borderRadius: '16px',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        fontWeight: 600,
                        '& .MuiButton-startIcon': { mr: 0.5 },
                      }}
                    >
                      {t('login')}
                    </Button>
                  )}

                  <IconButton
                    onClick={() => setMobileOpen(true)}
                    edge="end"
                    aria-label={t('menu')}
                    sx={{
                      color: 'text.primary',
                      p: 0.8,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'rgba(226, 232, 240, 0.9)',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <MenuIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': {
            width: { xs: '84vw', sm: 300 },
            maxWidth: 320,
            bgcolor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Snackbar
        open={Boolean(switchError)}
        autoHideDuration={5000}
        onClose={() => setSwitchError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setSwitchError('')}>
          {switchError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;
