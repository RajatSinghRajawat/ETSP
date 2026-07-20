import { useTranslation } from 'react-i18next';
import { Box, Container, Typography } from '@mui/material';
import { VerifiedUser, FlashOn, Pets, Chat } from '@mui/icons-material';

const WhyChooseUs: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <VerifiedUser sx={{ fontSize: 48, color: '#0c5283' }} />,
      title: t('why_verified'),
      desc: t('why_verified_desc'),
      color: '#0c5283',
      bgColor: 'rgba(12, 82, 131, 0.08)'
    },
    {
      icon: <FlashOn sx={{ fontSize: 48, color: '#0ab6a2' }} />,
      title: t('why_easy'),
      desc: t('why_easy_desc'),
      color: '#0ab6a2',
      bgColor: 'rgba(10, 182, 162, 0.08)'
    },
    {
      icon: <Pets sx={{ fontSize: 48, color: '#0c5283' }} />,
      title: t('why_specialized'),
      desc: t('why_specialized_desc'),
      color: '#0c5283',
      bgColor: 'rgba(12, 82, 131, 0.08)'
    },
    {
      icon: <Chat sx={{ fontSize: 48, color: '#0ab6a2' }} />,
      title: t('why_chat'),
      desc: t('why_chat_desc'),
      color: '#0ab6a2',
      bgColor: 'rgba(10, 182, 162, 0.08)'
    }
  ];

  return (
    <Box sx={{ py: 10, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12, 82, 131, 0.03) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: 'primary.main',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Why Choose VetJobs?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            We provide the best platform for veterinary professionals and employers to connect
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 4
          }}
        >
          {features.map((feature, index) => (
            <Box
              key={index}
              sx={{
                textAlign: 'center',
                p: 4,
                borderRadius: 4,
                bgcolor: feature.bgColor,
                border: '1px solid',
                borderColor: 'transparent',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: feature.color,
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.4s ease'
                },
                '&:hover': {
                  borderColor: `${feature.color}30`,
                  boxShadow: `0 15px 30px ${feature.bgColor}`,
                  transform: 'translateY(-8px)',
                  '&::before': {
                    transform: 'scaleX(1)'
                  }
                }
              }}
            >
              <Box
                sx={{
                  mb: 3,
                  display: 'inline-flex',
                  p: 2.5,
                  borderRadius: '20px',
                  bgcolor: 'background.paper',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1) rotate(5deg)'
                  }
                }}
              >
                {feature.icon}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  fontSize: '1.15rem',
                  color: feature.color
                }}
              >
                {feature.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.7 }}
              >
                {feature.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default WhyChooseUs;