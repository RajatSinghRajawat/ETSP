import React from 'react';
import { Box, Container, Typography, Card, CardContent, Button } from '@mui/material';
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
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLocalizedSiteContent } from '../../../hooks/useLocalizedSiteContent';

const ICON_MAP: Record<string, React.ReactNode> = {
  MedicalServices: <MedicalServices sx={{ fontSize: 44 }} />,
  Healing: <Healing sx={{ fontSize: 44 }} />,
  Hotel: <Hotel sx={{ fontSize: 44 }} />,
  Pets: <Pets sx={{ fontSize: 44 }} />,
  ContentCut: <ContentCut sx={{ fontSize: 44 }} />,
  SupportAgent: <SupportAgent sx={{ fontSize: 44 }} />,
  BusinessCenter: <BusinessCenter sx={{ fontSize: 44 }} />,
  TrendingUp: <TrendingUp sx={{ fontSize: 44 }} />,
  Inventory: <Inventory sx={{ fontSize: 44 }} />,
};

const JobProfilesSection: React.FC = () => {
  const navigate = useNavigate();
  const { content } = useLocalizedSiteContent();
  const section = content?.jobProfiles;

  const title = section?.title || 'Job Profiles';
  const subtitle =
    section?.subtitle || 'Explore specialized roles across clinics, hospitals and pet-care businesses.';
  const exploreLabel = section?.exploreLabel || 'Explore Jobs';
  const items = section?.items ?? [];

  const handleProfileClick = (query: string) => {
    navigate(`/find-job?search=${encodeURIComponent(query)}`);
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, fontSize: { xs: 28, md: 36 } }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
            {subtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {items.map((profile) => (
            <Card
              key={profile.id}
              elevation={0}
              onClick={() => handleProfileClick(profile.searchQuery || profile.title)}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 28px rgba(12,82,131,0.12)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: profile.color || '#0c5283',
                    bgcolor: profile.bgColor || 'rgba(12, 82, 131, 0.08)',
                  }}
                >
                  {ICON_MAP[profile.iconKey || ''] || <MedicalServices sx={{ fontSize: 44 }} />}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {profile.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 44 }}>
                  {profile.description}
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {exploreLabel}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default JobProfilesSection;
