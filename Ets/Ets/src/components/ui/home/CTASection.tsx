import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowForward, CheckCircleRounded, StarsRounded } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#ffffff' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            background: 'linear-gradient(135deg, #051a2a 0%, #0c5283 50%, #0ab6a2 100%)',
            borderRadius: { xs: 4, md: 6 },
            p: { xs: 4, sm: 6, md: 8 },
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 24px 60px -12px rgba(12, 82, 131, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Ambient Glows */}
          <Box
            sx={{
              position: 'absolute',
              top: -120,
              right: -100,
              width: 380,
              height: 380,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -100,
              left: -80,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(10, 182, 162, 0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 780, mx: 'auto' }}>
            {/* Overline Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 10,
                px: 2.2,
                py: 0.6,
                mb: 3,
              }}
            >
              <StarsRounded sx={{ fontSize: 18, color: '#fef08a' }} />
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: 1.5,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {t('cta_overline')}
              </Typography>
            </Box>

            {/* Main Headline */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 2.5,
                fontSize: { xs: '2rem', sm: '2.8rem', md: '3.4rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              {t('cta_headline_line1')} {t('cta_headline_line2')}
            </Typography>

            {/* Description Subtext */}
            <Typography
              variant="body1"
              sx={{
                mb: 4.5,
                opacity: 0.92,
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.15rem' },
                lineHeight: 1.6,
                maxWidth: 640,
                mx: 'auto',
                color: '#e2e8f0',
              }}
            >
              {t('cta_desc')}
            </Typography>

            {/* Dual CTA Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
                mb: 5,
              }}
            >
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="large"
                endIcon={<ArrowForward sx={{ transition: 'transform 0.2s' }} />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#0c5283',
                  px: 4.5,
                  py: 1.6,
                  borderRadius: 3,
                  fontWeight: 800,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
                    '& .MuiSvgIcon-root': { transform: 'translateX(4px)' },
                  },
                  transition: 'all 0.25s ease',
                }}
              >
                {t('signup')}
              </Button>

              <Button
                component={Link}
                to="/jobs"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  color: '#ffffff',
                  px: 4,
                  py: 1.6,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.25s ease',
                }}
              >
                {t('explore_jobs', { defaultValue: 'Explore All Jobs' })}
              </Button>
            </Box>

            {/* Trust and Feature Bullets */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 2, sm: 4 },
                flexWrap: 'wrap',
                mb: 4,
                color: '#cbd5e1',
                fontSize: '0.86rem',
                fontWeight: 600,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckCircleRounded sx={{ fontSize: 18, color: '#34d399' }} />
                <span>100% Free for Candidates</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckCircleRounded sx={{ fontSize: 18, color: '#34d399' }} />
                <span>Verified Veterinary Clinics</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CheckCircleRounded sx={{ fontSize: 18, color: '#34d399' }} />
                <span>Fast Direct Contact</span>
              </Box>
            </Box>

            {/* Bottom Trusted By Subtext */}
            <Box sx={{ pt: 3.5, borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.75,
                  mb: 1.5,
                  fontSize: '0.82rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {t('trusted_by')}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: { xs: 2.5, sm: 4 },
                  flexWrap: 'wrap',
                  opacity: 0.85,
                }}
              >
                {[
                  t('trusted_org_clinics'),
                  t('trusted_org_animal_health'),
                  t('trusted_org_research'),
                  t('trusted_org_petcare'),
                ].map((name) => (
                  <Typography
                    key={name}
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      color: '#ffffff',
                    }}
                  >
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