import { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Avatar,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Work,
  Description,
  Person,
  Business,
  People,
  Campaign,
  Pets,
  BookmarkBorder,
  Menu as MenuIcon,
  Close,
  SupportAgent,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  type: 'employer' | 'candidate' | 'admin';
  userName?: string;
  userRole?: string;
}

const SIDEBAR_WIDTH = 272;
const PANEL_BG = 'linear-gradient(185deg, #0c5283 0%, #0a466e 55%, #083a5c 100%)';

const Sidebar: React.FC<SidebarProps> = ({ type, userName = 'User', userRole = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Route changes close the drawer so the new page is not hidden behind it.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const employerMenu = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/employer/dashboard' },
    { label: 'Company Profile', icon: <Business />, path: '/employer/profile' },
    { label: 'Post a Job', icon: <Work />, path: '/employer/post-job' },
    { label: 'Employees', icon: <People />, path: '/employer/employees' },
    { label: 'Applications', icon: <Description />, path: '/employer/applications' },
    { label: 'Employers Directory', icon: <Description />, path: '/employers' },
    { label: 'Support', icon: <SupportAgent />, path: '/employer/support' },
  ];

  const candidateMenu = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/candidate/dashboard' },
    { label: 'Find Jobs', icon: <Work />, path: '/find-job' },
    { label: 'Saved Jobs', icon: <BookmarkBorder />, path: '/candidate/saved-jobs' },
    { label: 'My Profile', icon: <Person />, path: '/candidate/profile' },
    { label: 'Browse Employers', icon: <Business />, path: '/employers' },
    { label: 'Support', icon: <SupportAgent />, path: '/candidate/support' },
  ];

  const adminMenu = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { label: 'Job Approval', icon: <Work />, path: '/admin/jobs' },
    { label: 'Candidates', icon: <People />, path: '/admin/candidates' },
    { label: 'Employers', icon: <Business />, path: '/admin/employers' },
    { label: 'Analytics', icon: <Campaign />, path: '/admin/analytics' },
    { label: 'Ads', icon: <Campaign />, path: '/admin/ads' },
  ];

  const menu = type === 'employer' ? employerMenu : type === 'candidate' ? candidateMenu : adminMenu;
  const roleLabel = userRole || (type === 'employer' ? 'Employer' : type === 'candidate' ? 'Candidate' : 'Admin');
  const initial = userName.charAt(0).toUpperCase();

  // Shared panel body — identical on desktop (sticky column) and mobile (drawer).
  const panel = (
    <>
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0ab6a2 0%, #1ec19a 100%)',
            boxShadow: '0 8px 18px -6px rgba(10,182,162,0.7)',
          }}
        >
          <Pets sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.3 }}>
          VetsLinked
        </Typography>
        {isMobile && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            sx={{ ml: 'auto', color: 'rgba(255,255,255,0.8)' }}
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {/* User card */}
      <Box sx={{ px: 2.5, mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Avatar
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              fontWeight: 800,
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: '#fff' }}>
              {userName}
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.25,
                px: 1,
                py: 0.1,
                borderRadius: 999,
                bgcolor: 'rgba(10,182,162,0.25)',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3fd0ad' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                {roleLabel}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Typography
        variant="caption"
        sx={{ px: 3.5, pt: 2, pb: 1, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 1.2 }}
      >
        MENU
      </Typography>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, py: 0 }}>
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  setMobileOpen(false);
                  navigate(item.path);
                }}
                sx={{
                  borderRadius: 2.5,
                  py: 1.1,
                  px: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                  background: isActive
                    ? 'linear-gradient(135deg, #0ab6a2 0%, #0c8a7a 100%)'
                    : 'transparent',
                  boxShadow: isActive ? '0 8px 20px -8px rgba(10,182,162,0.8)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(135deg, #0ab6a2 0%, #0c8a7a 100%)'
                      : 'rgba(255,255,255,0.10)',
                    color: '#fff',
                    transform: 'translateX(3px)',
                  },
                  // Active indicator bar
                  '&::before': isActive
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '22%',
                        bottom: '22%',
                        width: 4,
                        borderRadius: 4,
                        bgcolor: '#fff',
                      }
                    : undefined,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 38,
                    '& svg': { fontSize: 22 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: isActive ? 700 : 500, fontSize: 14.5 } } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2.5, mt: 'auto' }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(10,182,162,0.25) 0%, rgba(255,255,255,0.06) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
            Need help?
          </Typography>
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, wordBreak: 'break-word' }}>
            support@vetslinked.com
          </Typography>
        </Box>
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Compact bar that replaces the column below md; opens the drawer. */}
        <Box
          sx={{
            position: 'sticky',
            top: { xs: '56px', sm: '64px' },
            zIndex: theme.zIndex.appBar - 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1,
            color: '#fff',
            background: PANEL_BG,
            boxShadow: '0 6px 18px -10px rgba(12,82,131,0.8)',
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            aria-label="Open dashboard menu"
            sx={{ color: '#fff', p: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              fontSize: 15,
              fontWeight: 800,
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.4)',
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {userName}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            // Sits above the fixed navbar so the drawer header stays reachable.
            zIndex: theme.zIndex.appBar + 1,
            '& .MuiDrawer-paper': {
              width: { xs: '84vw', sm: SIDEBAR_WIDTH },
              maxWidth: SIDEBAR_WIDTH,
              display: 'flex',
              flexDirection: 'column',
              color: '#fff',
              background: PANEL_BG,
              backgroundImage: PANEL_BG,
            },
          }}
        >
          {panel}
        </Drawer>
      </>
    );
  }

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        background: PANEL_BG,
        boxShadow: '4px 0 24px -10px rgba(12,82,131,0.5)',
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
      }}
    >
      {panel}
    </Box>
  );
};

export default Sidebar;
