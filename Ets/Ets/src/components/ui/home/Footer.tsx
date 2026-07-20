import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Button, Grid, Link as MuiLink, IconButton } from '@mui/material';
import { Facebook, Twitter, LinkedIn, Instagram, Smartphone } from '@mui/icons-material';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: '#0f172a', 
        color: 'white', 
        pt: 8, 
        pb: 4,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                component="img"
                src="/Logo.png"
                alt="Logo"
                sx={{ height: 45, width: 'auto', filter: 'brightness(0) invert(1)' }}
              />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 3, lineHeight: 1.8, maxWidth: 320 }}>
              {t('footer_desc')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[Facebook, Twitter, LinkedIn, Instagram].map((Icon, i) => (
                <IconButton 
                  key={i}
                  size="small" 
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: 'primary.main', transform: 'translateY(-3px)' },
                    transition: 'all 0.3s'
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
              {t('company')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['About Us', 'Careers', 'Press', 'Blog'].map((text) => (
                <MuiLink 
                  key={text}
                  href="#" 
                  color="inherit" 
                  underline="none"
                  sx={{ opacity: 0.7, fontSize: '0.9rem', '&:hover': { opacity: 1, color: 'secondary.main' } }}
                >
                  {text}
                </MuiLink>
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
              {t('jobs')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['Browse Jobs', 'Post a Job', 'Job Alerts', 'Salary Guide'].map((text) => (
                <MuiLink 
                  key={text}
                  href="#" 
                  color="inherit" 
                  underline="none"
                  sx={{ opacity: 0.7, fontSize: '0.9rem', '&:hover': { opacity: 1, color: 'secondary.main' } }}
                >
                  {text}
                </MuiLink>
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
              {t('support')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.9rem' }}>
                Phone: +91 123 456 7890
              </Typography>
              <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>
                  Mobile App coming soon
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<Smartphone />}
                    sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#eee' }, fontSize: '0.65rem', fontWeight: 700 }}
                  >
                    App Store
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<Smartphone />}
                    sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#eee' }, fontSize: '0.65rem', fontWeight: 700 }}
                  >
                    Play Store
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box 
          sx={{ 
            borderTop: '1px solid rgba(255,255,255,0.08)', 
            mt: 8, 
            pt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.5, fontSize: '0.8rem' }}>
            © {currentYear}. {t('all_rights')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((text) => (
              <MuiLink 
                key={text}
                href="#" 
                color="inherit" 
                sx={{ opacity: 0.5, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { opacity: 1 } }}
              >
                {text}
              </MuiLink>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
