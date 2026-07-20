import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppBar, Toolbar, Box, Button, Tooltip, IconButton, Menu, MenuItem, Container, useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText, ListItemButton, Avatar, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Language as LanguageIcon, Brightness4, Brightness7, Menu as MenuIcon, Close, Work, Business, Info, Phone, Home, AccountCircle, Dashboard, Logout, SwapHoriz, People, WorkspacePremium } from '@mui/icons-material';
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
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const currentUser = getStoredUser();
  const switchTargetRole = currentUser?.role === 'employer' ? 'candidate' : 'employer';
  const switchTargetLabel = switchTargetRole === 'employer' ? 'Switch to Employer' : 'Switch to Candidate';

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
      setSwitchError(getApiErrorMessage(error, `Unable to switch to ${switchTargetRole} profile`));
    } finally {
      setSwitchingRole(null);
    }
  };

  const isEmployer = currentUser?.role === 'employer';

  const navItems = [
    { label: t('home'), path: '/', icon: <Home /> },
    ...(isEmployer
      ? [{ label: t('candidates'), path: '/employer/employees', icon: <People /> }]
      : [
          { label: t('find_job'), path: '/find-job', icon: <Work /> },
          { label: t('employers'), path: '/employers', icon: <Business /> },
        ]),
    { label: 'Pricing', path: '/pricing', icon: <WorkspacePremium /> },
    { label: t('about'), path: '/about', icon: <Info /> },
    { label: t('contact'), path: '/contact', icon: <Phone /> },
  ];

  const isActive = (path: string) => location.pathname === path;
  const userDisplayName =
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    currentUser?.email ||
    'Profile';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  const drawer = (
    <Box sx={{ width: 280, height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
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
                {switchingRole ? 'Switching' : switchTargetLabel}
              </Button>
            )}
            <Button onClick={handleLogout} variant="text" color="error" fullWidth size="small" startIcon={<Logout />}>
              Logout
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
        <Container maxWidth="lg">
          <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 0 } }}>
            <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 1.5, mr: { xs: 1, md: 4 } }}>
              <Box component="img" src="/Logo.png" alt="Logo" sx={{ height: { xs: 32, md: 40 }, width: 'auto' }} />
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: 'text.primary',
                      fontWeight: isActive(item.path) ? 600 : 500,
                      px: 2,
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
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    <MenuItem onClick={() => changeLanguage('en')} selected={i18n.language === 'en'}>English</MenuItem>
                    <MenuItem onClick={() => changeLanguage('hi')} selected={i18n.language === 'hi'}>हिन्दी (Hindi)</MenuItem>
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
                          Dashboard
                        </MenuItem>
                        {currentUser.role !== 'admin' && (
                          <MenuItem onClick={handleSwitchProfile} disabled={Boolean(switchingRole)}>
                            {switchingRole ? (
                              <CircularProgress size={18} sx={{ mr: 1 }} />
                            ) : (
                              <SwapHoriz fontSize="small" sx={{ mr: 1 }} />
                            )}
                            {switchingRole ? 'Switching' : switchTargetLabel}
                          </MenuItem>
                        )}
                        <MenuItem onClick={handleLogout}>
                          <Logout fontSize="small" sx={{ mr: 1 }} />
                          Logout
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
                <IconButton
                  onClick={() => setMobileOpen(true)}
                sx={{
                    color: 'text.primary',
                    transition: 'color 0.3s ease'
                  }}
                >
                  <MenuIcon />
                </IconButton>
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
          '& .MuiDrawer-paper': {
            width: 280,
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
