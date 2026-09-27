import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Card, CardActionArea, Avatar, Chip } from '@mui/material';
import {
  Search as SearchIcon,
  Work as WorkIcon,
  ArrowForward as ArrowIcon,
  CheckCircleRounded,
  VerifiedUserOutlined,
  BoltRounded,
  StarsRounded,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import SectionHeader from './SectionHeader';

const QuickActions: React.FC = () => {
  const { t } = useTranslation();

  const actions = [
    {
      badge: t('quick_candidate_badge', { defaultValue: 'FOR DOCTORS & SPECIALISTS' }),
      icon: <SearchIcon sx={{ fontSize: 32, color: '#ffffff' }} />,
      title: t('i_am_candidate'),
      desc: t('quick_candidate_desc'),
      btn: t('find_jobs'),
      features: [
        t('qa_cand_f1', { defaultValue: '1-Click Direct Clinic Applications' }),
        t('qa_cand_f2', { defaultValue: 'Verified Salaries & Work-Life Transparency' }),
        t('qa_cand_f3', { defaultValue: 'Direct Chat with Clinic Directors' }),
      ],
      link: '/jobs',
      themeColor: '#0c5283',
      accentColor: '#38bdf8',
      iconGradient: 'linear-gradient(135deg, #0c5283 0%, #0284c7 100%)',
      cardGlow: 'rgba(12, 82, 131, 0.12)',
      hoverBorder: 'rgba(12, 82, 131, 0.4)',
    },
    {
      badge: t('quick_employer_badge', { defaultValue: 'FOR CLINICS & HOSPITALS' }),
      icon: <WorkIcon sx={{ fontSize: 32, color: '#ffffff' }} />,
      title: t('i_am_employer'),
      desc: t('quick_employer_desc'),
      btn: t('post_job'),
      features: [
        t('qa_emp_f1', { defaultValue: 'Pre-screened Vets & Para-Vet Staff' }),
        t('qa_emp_f2', { defaultValue: 'Direct WhatsApp & Phone Connect' }),
        t('qa_emp_f3', { defaultValue: 'Fill Urgent Openings in Under 48 Hours' }),
      ],
      link: '/employer/post-job',
      themeColor: '#0ab6a2',
      accentColor: '#2dd4bf',
      iconGradient: 'linear-gradient(135deg, #0ab6a2 0%, #0d9488 100%)',
      cardGlow: 'rgba(10, 182, 162, 0.12)',
      hoverBorder: 'rgba(10, 182, 162, 0.4)',
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: '#e2e8f0',
      }}
    >
      {/* Background ambient lighting */}
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          left: '15%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12, 82, 131, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          right: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10, 182, 162, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <SectionHeader
          align="center"
          eyebrowIcon={<StarsRounded />}
          eyebrow={t('home_get_started_overline')}
          title={t('home_quick_title')}
          subtitle={t('home_quick_subtitle')}
          sx={{ mx: 'auto' }}
        />

        {/* Dual Gateways Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 3, md: 4 },
            maxWidth: 1050,
            mx: 'auto',
          }}
        >
          {actions.map((action, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                borderRadius: '20px',
                border: '1px solid',
                borderColor: 'rgba(226, 232, 240, 0.9)',
                bgcolor: '#ffffff',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 12px 28px -12px rgba(12, 82, 131, 0.08)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: action.iconGradient,
                  opacity: 0.95,
                },
                '&:hover': {
                  transform: 'translateY(-6px)',
                  borderColor: action.hoverBorder,
                  boxShadow: `0 24px 48px -12px ${action.cardGlow}`,
                  '& .qa-arrow': {
                    transform: 'translateX(4px)',
                  },
                  '& .qa-icon-wrap': {
                    transform: 'scale(1.06)',
                  },
                  '& .qa-btn-pill': {
                    bgcolor: action.themeColor,
                    color: '#ffffff',
                  },
                },
              }}
            >
              <CardActionArea
                component={Link}
                to={action.link}
                sx={{
                  p: { xs: 2.5, sm: 3.5, md: 4.5 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  height: '100%',
                  textAlign: 'left',
                }}
              >
                {/* Top Badge & Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    minWidth: 0,
                    mb: { xs: 2.25, sm: 3 },
                  }}
                >
                  <Chip
                    label={action.badge}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '0.66rem', sm: '0.72rem' },
                      letterSpacing: '0.04em',
                      bgcolor: `${action.themeColor}12`,
                      color: action.themeColor,
                      borderRadius: '8px',
                      px: 0.5,
                      height: 28,
                      minWidth: 0,
                      border: `1px solid ${action.themeColor}24`,
                    }}
                  />

                  <Avatar
                    className="qa-icon-wrap"
                    sx={{
                      background: action.iconGradient,
                      width: { xs: 46, sm: 54 },
                      height: { xs: 46, sm: 54 },
                      flexShrink: 0,
                      borderRadius: '16px',
                      boxShadow: `0 10px 20px -4px ${action.cardGlow}`,
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {action.icon}
                  </Avatar>
                </Box>

                {/* Title and Short Description */}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.35rem', md: '1.6rem' },
                    color: '#0f172a',
                    mb: 1.2,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {action.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    fontSize: '0.94rem',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  {action.desc}
                </Typography>

                {/* Feature Checklist */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.4,
                    mb: 4,
                    pt: 2.5,
                    borderTop: '1px dashed #e2e8f0',
                  }}
                >
                  {action.features.map((feat, fIdx) => (
                    <Box
                      key={fIdx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: `${action.themeColor}14`,
                          color: action.themeColor,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircleRounded sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          color: '#334155',
                        }}
                      >
                        {feat}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Bottom Action Strip */}
                <Box
                  sx={{
                    mt: 'auto',
                    pt: 2.5,
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box
                    className="qa-btn-pill"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.8,
                      px: 2,
                      py: 0.8,
                      borderRadius: '10px',
                      bgcolor: `${action.themeColor}12`,
                      color: action.themeColor,
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{action.btn}</span>
                    <ArrowIcon
                      className="qa-arrow"
                      sx={{
                        fontSize: 18,
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.6,
                      color: '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    {index === 0 ? (
                      <>
                        <VerifiedUserOutlined sx={{ fontSize: 16, color: '#0c5283' }} />
                        <span>{t('verified_listings')}</span>
                      </>
                    ) : (
                      <>
                        <BoltRounded sx={{ fontSize: 17, color: '#0ab6a2' }} />
                        <span>{t('daily_updates')}</span>
                      </>
                    )}
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default QuickActions;