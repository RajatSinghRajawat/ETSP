import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Card, CardActionArea, Avatar } from '@mui/material';
import { Search as SearchIcon, Work as WorkIcon, ArrowForward as ArrowIcon, TrendingUp, Verified } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const { t } = useTranslation();

  const actions = [
    {
      icon: <SearchIcon sx={{ fontSize: 52, color: '#0c5283' }} />,
      title: t('quick_vet'),
      btn: t('find_jobs'),
      bgColor: 'linear-gradient(135deg, rgba(12, 82, 131, 0.08) 0%, rgba(12, 82, 131, 0.02) 100%)',
      borderColor: 'rgba(12, 82, 131, 0.2)',
      hoverBorderColor: '#0c5283',
      iconBg: 'rgba(12, 82, 131, 0.1)',
      link: '/jobs'
    },
    {
      icon: <WorkIcon sx={{ fontSize: 52, color: '#0ab6a2' }} />,
      title: t('quick_employer'),
      btn: t('post_job'),
      bgColor: 'linear-gradient(135deg, rgba(10, 182, 162, 0.08) 0%, rgba(10, 182, 162, 0.02) 100%)',
      borderColor: 'rgba(10, 182, 162, 0.2)',
      hoverBorderColor: '#0ab6a2',
      iconBg: 'rgba(10, 182, 162, 0.1)',
      link: '/employer/post-job'
    }
  ];

  return (
    <Box sx={{ py: 8, bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(12, 82, 131, 0.05) 0%, rgba(10, 182, 162, 0.05) 100%)',
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
          background: 'linear-gradient(135deg, rgba(10, 182, 162, 0.05) 0%, rgba(12, 82, 131, 0.05) 100%)',
        }}
      />

      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'secondary.main',
              fontWeight: 600,
              letterSpacing: 2,
              fontSize: '0.85rem'
            }}
          >
            GET STARTED
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: 'primary.main',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            What are you looking for?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Choose from our options to either find your dream veterinary job or hire the best talent for your clinic
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            maxWidth: 900,
            mx: 'auto'
          }}
        >
          {actions.map((action, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                bgcolor: action.bgColor,
                borderRadius: 4,
                border: '2px solid',
                borderColor: action.borderColor,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: index === 0
                    ? 'linear-gradient(90deg, #0c5283, #0ab6a2)'
                    : 'linear-gradient(90deg, #0ab6a2, #0c5283)',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.4s ease'
                },
                '&:hover': {
                  transform: 'translateY(-8px)',
                  borderColor: action.hoverBorderColor,
                  boxShadow: `0 20px 40px ${index === 0 ? 'rgba(12, 82, 131, 0.15)' : 'rgba(10, 182, 162, 0.15)'}`,
                  '&::before': {
                    transform: 'scaleX(1)'
                  }
                }
              }}
            >
              <CardActionArea component={Link} to={action.link} sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: action.iconBg,
                      width: 80,
                      height: 80,
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  >
                    {action.icon}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: index === 0 ? '#0c5283' : '#0ab6a2'
                      }}
                    >
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                      {index === 0
                        ? 'Browse thousands of veterinary jobs that match your skills and preferences'
                        : 'Post your job opening and connect with qualified veterinary professionals'}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: index === 0 ? '#0c5283' : '#0ab6a2',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        transition: 'gap 0.3s ease'
                      }}
                    >
                      {action.btn}
                      <ArrowIcon sx={{ fontSize: 20, transition: 'transform 0.3s ease' }} />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Verified sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">Verified Listings</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="caption" color="text.secondary">Daily Updates</Typography>
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