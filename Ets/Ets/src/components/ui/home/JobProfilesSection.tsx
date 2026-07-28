import React from 'react';
import { useTranslation } from 'react-i18next';
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
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export interface JobProfileItem {
  id: string;
  titleKey: string;
  defaultTitle: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
}

export const jobProfilesList: JobProfileItem[] = [
  {
    id: 'veterinarian',
    titleKey: 'job_veterinarian',
    defaultTitle: 'Veterinarian',
    icon: <MedicalServices sx={{ fontSize: 44 }} />,
    description: 'Diagnosis, surgery, and comprehensive clinical pet care.',
    color: '#0c5283',
    bgColor: 'rgba(12, 82, 131, 0.08)'
  },
  {
    id: 'veterinary-assistant',
    titleKey: 'job_vet_assistant',
    defaultTitle: 'Veterinary Assistant',
    icon: <Healing sx={{ fontSize: 44 }} />,
    description: 'Assist doctors in clinical care, treatment, and diagnostics.',
    color: '#0ab6a2',
    bgColor: 'rgba(10, 182, 162, 0.08)'
  },
  {
    id: 'ward-boy',
    titleKey: 'job_ward_boy',
    defaultTitle: 'Ward Boy',
    icon: <Hotel sx={{ fontSize: 44 }} />,
    description: 'Inpatient ward management, animal handling, and sanitation.',
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.08)'
  },
  {
    id: 'pet-trainer',
    titleKey: 'job_pet_trainer',
    defaultTitle: 'Pet Trainer',
    icon: <Pets sx={{ fontSize: 44 }} />,
    description: 'Behavioral training, discipline, and agility instruction.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)'
  },
  {
    id: 'pet-groomer',
    titleKey: 'job_pet_groomer',
    defaultTitle: 'Pet Groomer',
    icon: <ContentCut sx={{ fontSize: 44 }} />,
    description: 'Professional bathing, styling, coat care, and hygiene.',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.08)'
  },
  {
    id: 'receptionist',
    titleKey: 'job_receptionist',
    defaultTitle: 'Receptionist',
    icon: <SupportAgent sx={{ fontSize: 44 }} />,
    description: 'Front desk management, appointment scheduling, and client handling.',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.08)'
  },
  {
    id: 'floor-manager',
    titleKey: 'job_floor_manager',
    defaultTitle: 'Floor Manager',
    icon: <BusinessCenter sx={{ fontSize: 44 }} />,
    description: 'Supervising clinic operations, staff coordination, and service flow.',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.08)'
  },
  {
    id: 'sales-manager',
    titleKey: 'job_sales_manager',
    defaultTitle: 'Sales Manager',
    icon: <TrendingUp sx={{ fontSize: 44 }} />,
    description: 'Business development, client growth, and pharma/vet product sales.',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.08)'
  },
  {
    id: 'inventory-incharge',
    titleKey: 'job_inventory_incharge',
    defaultTitle: 'Inventory Incharge',
    icon: <Inventory sx={{ fontSize: 44 }} />,
    description: 'Managing medicines, surgical supplies, and pet product stocks.',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.08)'
  }
];

const JobProfilesSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleProfileClick = (title: string) => {
    navigate(`/find-job?search=${encodeURIComponent(title)}`);
  };

  return (
    <Box sx={{ py: 9, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1.5,
              color: 'primary.main',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            {t('job_profiles_title') || 'Job Profiles'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', fontSize: '1.05rem' }}>
            {t('job_profiles_subtitle') || 'Explore specialized roles across veterinary hospitals, clinics, and pet care centers'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3.5
          }}
        >
          {jobProfilesList.map((profile) => (
            <Card
              key={profile.id}
              onClick={() => handleProfileClick(profile.defaultTitle)}
              sx={{
                cursor: 'pointer',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  borderColor: profile.color,
                  boxShadow: `0 12px 28px ${profile.bgColor}`,
                  transform: 'translateY(-6px)'
                }
              }}
            >
              <CardContent sx={{ p: 3.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 3,
                    bgcolor: profile.bgColor,
                    color: profile.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5
                  }}
                >
                  {profile.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                  {t(profile.titleKey) || profile.defaultTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, flexGrow: 1, lineHeight: 1.6 }}>
                  {profile.description}
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  sx={{
                    alignSelf: 'flex-start',
                    color: profile.color,
                    fontWeight: 600,
                    p: 0,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                  }}
                >
                  {t('explore_jobs') || 'Explore Jobs'}
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
