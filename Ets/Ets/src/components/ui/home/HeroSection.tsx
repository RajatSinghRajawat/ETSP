import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, TextField, Chip, Paper, Grid } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CustomButton } from '../../common';

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const [searchJob, setSearchJob] = useState('');
  const [location, setLocation] = useState('');

  const popularTags = ['Vet Doctor', 'Animal Surgeon', 'Pet Care', 'Livestock Specialist'];

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
        color: 'white',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '2.25rem', md: '3.5rem' },
              lineHeight: 1.2
            }}
          >
            {t('hero_title')}
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              opacity: 0.9, 
              fontWeight: 400,
              mb: 5,
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            {t('hero_subtitle')}
          </Typography>

          <Paper 
            elevation={10} 
            sx={{ 
              maxWidth: 900, 
              mx: 'auto', 
              p: { xs: 2, md: 1 },
              borderRadius: 4,
              display: 'flex',
              gap: 1,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              bgcolor: 'background.paper'
            }}
          >
            <TextField
              fullWidth
              placeholder={t('search_placeholder')}
              value={searchJob}
              onChange={(e) => setSearchJob(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                }
              }}
              sx={{ 
                flex: 1.5,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiOutlinedInput-root': { px: 2 }
              }}
            />
            <Box sx={{ width: '1px', height: '30px', bgcolor: 'divider', display: { xs: 'none', md: 'block' } }} />
            <TextField
              fullWidth
              placeholder={t('location_placeholder')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiOutlinedInput-root': { px: 2 }
              }}
            />
            <CustomButton 
              color="primary" 
              sx={{ 
                py: 1.5,
                px: 5,
                borderRadius: 3,
                height: { xs: 50, md: 56 },
                width: { xs: '100%', md: 'auto' },
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {t('search')}
            </CustomButton>
          </Paper>

          <Box sx={{ mt: 4, display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              {t('popular_tags')}:
            </Typography>
            {popularTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                clickable
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                }}
              />
            ))}
          </Box>
        </Box>
      </Container>
      
      {/* Decorative circles */}
      <Box sx={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
    </Box>
  );
};

export default HeroSection;
