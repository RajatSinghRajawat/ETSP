import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppBar, Toolbar, Box, Button, Tooltip, IconButton, Menu, MenuItem, Container, useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText, ListItemButton, Avatar, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Language as LanguageIcon, Brightness4, Brightness7, Menu as MenuIcon, Close, Work, Business, Info, Phone, Home, AccountCircle, Dashboard, Logout, SwapHoriz, People, KeyboardArrowDown, PrivacyTip } from '@mui/icons-material';
import HeaderChatButton from './common/HeaderChatButton';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { axiosInstance } from '../store/api/axiosInstance';
import { API_ENDPOINTS } from '../store/api/endpoints';

interface NavbarProps {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

interface StoredUser {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'candidate' | 'employer' | 'admin' | string;
}

const getStoredUser = (): StoredUser | null => {
  const token = localStorage.getItem('ets-access-token');
  const user = localStorage.getItem('user');

  if (!token) {
    return null;
  }

  if (!user) {
    return {};
  }

  try {
    return JSON.parse(user) as StoredUser;
  } catch {
    return {};
  }
};

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

const Navbar: React.FC<NavbarProps> = ({ mode, toggleMode }) => {
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
  const currentUser = getStoredUser();
  const switchTargetRole = currentUser?.role === 'employer' ? 'candidate' : 'employer';
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
    if (currentUser?.role === 'employer') {
      return '/employer/dashboard';
    }

    if (currentUser?.role === 'admin') {
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
    localStorage.removeItem('ets-access-token');
    localStorage.removeItem('user');
    handleProfileMenuClose();
    setMobileOpen(false);
    navigate('/');
  };

  const handleSwitchProfile = async () => {
    if (!currentUser || currentUser.role === 'admin') {
      return;
    }

    setSwitchError('');
    setSwitchingRole(switchTargetRole);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.auth.switchProfile, {
        role: switchTargetRole,
      });
      const { accessToken, user } = response.data;

      localStorage.setItem('ets-access-token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
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

  const isEmployer = currentUser?.role === 'employer';

  // Only these three sit in the header bar; the rest live behind "More" so the
  // bar stays uncluttered.
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

  // The drawer has room for everything, so mobile keeps a flat list.
  const navItems = [...mainNavItems, ...moreNavItems];

  const isActive = (path: string) => location.pathname === path;
  const userDisplayName =
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    currentUser?.email ||
    t('profile');
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  const drawer = (
    <Box sx={{ width: '100%', height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src="/Logo.png" alt="Logo" sx={{ height: 36, width: 'auto' }} />
        </Box>
        <IconButton onClick={() => setMobileOpen(false)}><Close /></IconButton>
      </Box>
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                py: 1.5,
                px: 3,
                bgcolor: isActive(item.path) ? 'primary.main' : 'transparent',
                color: isActive(item.path) ? 'white' : 'text.primary',
                '&:hover': { bgcolor: isActive(item.path) ? 'primary.dark' : 'action.hover' }
              }}
            >
              <Box sx={{ mr: 2, display: 'flex' }}>{item.icon}</Box>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
        {currentUser ? (
          <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
            <Button onClick={handleOpenProfile} variant="outlined" fullWidth size="small" startIcon={<AccountCircle />}>
              {userDisplayName}
            </Button>
            {currentUser.role !== 'admin' && (
              <Button
                onClick={handleSwitchProfile}
                variant="outlined"
                fullWidth
                size="small"
                startIcon={switchingRole ? <CircularProgress size={16} /> : <SwapHoriz />}
                disabled={Boolean(switchingRole)}
              >
                {switchingRole ? t('switching') : switchTargetLabel}
              </Button>
            )}
            <Button onClick={handleLogout} variant="text" color="error" fullWidth size="small" startIcon={<Logout />}>
              {t('logout')}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button component={Link} to="/login" variant="outlined" fullWidth size="small">{t('login')}</Button>
            <Button component={Link} to="/signup" variant="contained" fullWidth size="small">{t('signup')}</Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Tooltip title={t('language')}>
            <IconButton onClick={handleLanguageMenuOpen} size="small"><LanguageIcon /></IconButton>
          </Tooltip>
          <Tooltip title={t('theme_mode')}>
            <IconButton onClick={toggleMode} size="small">{mode === 'dark' ? <Brightness7 /> : <Brightness4 />}</IconButton>
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
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
          transition: 'all 0.4s ease',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64, md: 72 }, gap: 1 }}>
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                flexShrink: 0,
                mr: { xs: 0, md: 4 },
                ml: { xs: 0, md: -2 },
              }}
            >
              <Box component="img" src="/Logo.png" alt="Logo" sx={{ height: { xs: 32, sm: 40, md: 48 }, width: 'auto', display: 'block' }} />
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
                {mainNavItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: 'text.primary',
                      fontWeight: isActive(item.path) ? 700 : 600,
                      fontSize: '1rem',
                      px: 2.2,
                      py: 1,
                      borderRadius: 2,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.05)'
                      },
                      '&:after': isActive(item.path) ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 20,
                        height: 3,
                        bgcolor: 'primary.main',
                        borderRadius: 2
                      } : {}
                    }}
                  >
                    {item.label}
                  </Button>
                ))}

                <Button
                  onClick={handleMoreMenuOpen}
                  endIcon={
                    <KeyboardArrowDown
                      sx={{
                        transition: 'transform 0.2s ease',
                        transform: moreAnchorEl ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  }
                  sx={{
                    color: 'text.primary',
                    fontWeight: moreNavItems.some((item) => isActive(item.path)) ? 700 : 600,
                    fontSize: '1rem',
                    px: 2.2,
                    py: 1,
                    borderRadius: 2,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
                    '&:after': moreNavItems.some((item) => isActive(item.path))
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 20,
                          height: 3,
                          bgcolor: 'primary.main',
                          borderRadius: 2,
                        }
                      : {},
                  }}
                >
                  {t('more')}
                </Button>

                <Menu
                  anchorEl={moreAnchorEl}
                  open={Boolean(moreAnchorEl)}
                  onClose={handleMoreMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{ paper: { sx: { mt: 1, minWidth: 210, borderRadius: 2 } } }}
                >
                  {moreNavItems.map((item) => (
                    <MenuItem
                      key={item.path}
                      component={Link}
                      to={item.path}
                      onClick={handleMoreMenuClose}
                      selected={isActive(item.path)}
                      sx={{ py: 1.2, px: 2, fontWeight: isActive(item.path) ? 700 : 500 }}
                    >
                      <Box sx={{ mr: 1.5, display: 'flex', color: 'primary.main' }}>{item.icon}</Box>
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, ml: 'auto', flexShrink: 0 }}>
              {!isMobile && (
                <>
                  <Tooltip title={t('language')}>
                    <IconButton
                      onClick={handleLanguageMenuOpen}
                      size="small"
                      sx={{
                        color: 'text.primary',
                        transition: 'color 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.05)'
                        }
                      }}
                    >
                      <LanguageIcon />
                    </IconButton>
                  </Tooltip>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleLanguageMenuClose}>
                    <MenuItem onClick={() => changeLanguage('en')} selected={currentLang === 'en'}>English</MenuItem>
                    <MenuItem onClick={() => changeLanguage('hi')} selected={currentLang === 'hi'}>हिन्दी (Hindi)</MenuItem>
                  </Menu>

                  <Tooltip title={t('theme_mode')}>
                    <IconButton
                      onClick={toggleMode}
                      size="small"
                      sx={{
                        color: 'text.primary',
                        transition: 'color 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.05)'
                        }
                      }}
                    >
                      {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                  </Tooltip>

                  {currentUser ? (
                    <>
                      <HeaderChatButton />
                      {isEmployer && (
                        <Button
                          component={Link}
                          to="/employer/post-job"
                          variant="contained"
                          size="small"
                          startIcon={<Work fontSize="small" />}
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontWeight: 700,
                            borderRadius: 2,
                            ml: 1,
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'primary.dark' }
                          }}
                        >
                          {t('post_job_nav') || 'Post Job'}
                        </Button>
                      )}
                      <Tooltip title={userDisplayName}>
                        <IconButton onClick={handleProfileMenuOpen} size="small" sx={{ ml: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                            {userInitial || <AccountCircle fontSize="small" />}
                          </Avatar>
                        </IconButton>
                      </Tooltip>
                      <Menu anchorEl={profileAnchorEl} open={Boolean(profileAnchorEl)} onClose={handleProfileMenuClose}>
                        <MenuItem onClick={handleOpenProfile}>
                          <Dashboard fontSize="small" sx={{ mr: 1 }} />
                          {t('dashboard')}
                        </MenuItem>
                        {currentUser.role !== 'admin' && (
                          <MenuItem onClick={handleSwitchProfile} disabled={Boolean(switchingRole)}>
                            {switchingRole ? (
                              <CircularProgress size={18} sx={{ mr: 1 }} />
                            ) : (
                              <SwapHoriz fontSize="small" sx={{ mr: 1 }} />
                            )}
                            {switchingRole ? t('switching') : switchTargetLabel}
                          </MenuItem>
                        )}
                        <MenuItem onClick={handleLogout}>
                          <Logout fontSize="small" sx={{ mr: 1 }} />
                          {t('logout')}
                        </MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <>
                      <Button
                        component={Link}
                        to="/login"
                        variant="outlined"
                        size="small"
                        sx={{
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          ml: 1,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.05)',
                            borderColor: 'primary.main'
                          }
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
                          bgcolor: 'primary.main',
                          color: 'white',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        {t('signup')}
                      </Button>
                    </>
                  )}
                </>
              )}

              {isMobile && (
                <>
                  <Tooltip title={t('language')}>
                    <IconButton
                      onClick={handleLanguageMenuOpen}
                      size="small"
                      aria-label={t('language')}
                      sx={{ color: 'text.primary', p: 0.75 }}
                    >
                      <LanguageIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                  </Tooltip>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleLanguageMenuClose}>
                    <MenuItem onClick={() => changeLanguage('en')} selected={currentLang === 'en'}>English</MenuItem>
                    <MenuItem onClick={() => changeLanguage('hi')} selected={currentLang === 'hi'}>हिन्दी (Hindi)</MenuItem>
                  </Menu>

                  {!currentUser && (
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
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
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
                      p: 0.75,
                      transition: 'color 0.3s ease'
                    }}
                  >
                    <MenuIcon sx={{ fontSize: 26 }} />
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
          // Above the fixed AppBar, otherwise the drawer header hides behind it.
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': {
            width: { xs: '82vw', sm: 280 },
            maxWidth: 300,
            bgcolor: 'background.paper'
          }
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
