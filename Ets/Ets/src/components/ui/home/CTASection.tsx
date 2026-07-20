import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: 10, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
            borderRadius: 5,
            p: { xs: 4, md: 8 },
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'inline-block',
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                mb: 3,
                letterSpacing: 2,
                fontSize: '0.8rem'
              }}
            >
              🚀 GET STARTED TODAY
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', md: '3rem' },
                lineHeight: 1.2
              }}
            >
              Ready to Transform Your
              <br />
              Veterinary Career?
            </Typography>

            <Typography
              variant="h6"
              sx={{
                mb: 5,
                opacity: 0.95,
                fontWeight: 400,
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Join thousands of veterinary professionals who have found their dream jobs through VetJobs
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 5,
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.25)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t('cta_signup')}
              </Button>

            </Box>

            <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                Trusted by leading veterinary clinics and hospitals
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', opacity: 0.7 }}>
                {['PetCare Hospital', 'Animal Health Co', 'VetFirst Clinic', 'PetMed Plus'].map((name) => (
                  <Typography key={name} variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {name}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CTASection;