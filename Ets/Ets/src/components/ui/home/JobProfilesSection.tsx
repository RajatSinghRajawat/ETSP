import React from 'react';
import { Box, Container, Typography, Card, CardContent, Chip } from '@mui/material';
import {
  MedicalServices,
  Healing,
  Hotel,
  Pets,
  ContentCut,
  SupportAgent,
  BusinessCenter,
  TrendingUp,
  Inventory,
  ArrowForwardRounded,
  CategoryRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedSiteContent } from '../../../hooks/useLocalizedSiteContent';
import SectionHeader from './SectionHeader';

const ICON_MAP: Record<string, React.ReactNode> = {
  MedicalServices: <MedicalServices sx={{ fontSize: 32 }} />,
  Healing: <Healing sx={{ fontSize: 32 }} />,
  Hotel: <Hotel sx={{ fontSize: 32 }} />,
  Pets: <Pets sx={{ fontSize: 32 }} />,
  ContentCut: <ContentCut sx={{ fontSize: 32 }} />,
  SupportAgent: <SupportAgent sx={{ fontSize: 32 }} />,
  BusinessCenter: <BusinessCenter sx={{ fontSize: 32 }} />,
  TrendingUp: <TrendingUp sx={{ fontSize: 32 }} />,
  Inventory: <Inventory sx={{ fontSize: 32 }} />,
};

const JobProfilesSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { content } = useLocalizedSiteContent();
  const section = content?.jobProfiles;

  // CMS copy wins; i18n strings cover the API-loading window / blank fields.
  const title = section?.title || t('job_profiles_title');
  const subtitle = section?.subtitle || t('job_profiles_subtitle');
  const exploreLabel = section?.exploreLabel || t('explore_jobs');
  const items = section?.items ?? [];

  const handleProfileClick = (query: string) => {
    navigate(`/find-job?search=${encodeURIComponent(query)}`);
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <SectionHeader
          align="center"
          eyebrowIcon={<CategoryRounded />}
          eyebrow={t('job_profiles_overline', { defaultValue: 'EXPLORE SPECIALIZATIONS' })}
          title={title}
          subtitle={subtitle}
          sx={{ mx: 'auto' }}
        />

        {/* Profiles Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {items.map((profile) => {
            const accentColor = profile.color || '#0c5283';

            return (
              <Card
                key={profile.id}
                elevation={0}
                onClick={() => handleProfileClick(profile.searchQuery || profile.title)}
                sx={{
                  borderRadius: '18px',
                  border: '1px solid',
                  borderColor: 'rgba(226, 232, 240, 0.9)',
                  bgcolor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 10px 24px -10px rgba(12, 82, 131, 0.06)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 20px 35px -8px ${accentColor}25`,
                    borderColor: `${accentColor}55`,
                    '& .profile-title': {
                      color: accentColor,
                    },
                    '& .profile-icon-plate': {
                      transform: 'scale(1.06)',
                    },
                    '& .profile-arrow': {
                      transform: 'translateX(4px)',
                      color: accentColor,
                    },
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 3, sm: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  {/* Top Icon Plate & Tag */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box
                      className="profile-icon-plate"
                      sx={{
                        width: 54,
                        height: 54,
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accentColor,
                        bgcolor: `${accentColor}12`,
                        border: `1px solid ${accentColor}25`,
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      {ICON_MAP[profile.iconKey || ''] || <MedicalServices sx={{ fontSize: 30 }} />}
                    </Box>

                    <Chip
                      label="Active Hiring"
                      size="small"
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '20px',
                        height: 24,
                      }}
                    />
                  </Box>

                  {/* Profile Title */}
                  <Typography
                    variant="h5"
                    className="profile-title"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.18rem',
                      color: '#0f172a',
                      mb: 1,
                      letterSpacing: '-0.01em',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {profile.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      mb: 3,
                      flex: 1,
                    }}
                  >
                    {profile.description}
                  </Typography>

                  {/* Action Link with animated arrow */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      pt: 2,
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <span>{exploreLabel}</span>
                    <ArrowForwardRounded
                      className="profile-arrow"
                      sx={{
                        fontSize: 18,
                        color: '#64748b',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default JobProfilesSection;
