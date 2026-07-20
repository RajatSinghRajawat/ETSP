import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Card, CardContent, Avatar, IconButton, Chip } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { LinkedIn, Twitter, Language, Star, Verified } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const DoctorsGallery: React.FC = () => {
  const { t } = useTranslation();

  const doctors = [
    {
      name: 'Dr. Rahul Sharma',
      specialty: 'Veterinary Surgeon',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
      desc: 'Expert in complex animal surgeries with 10+ years of experience.',
      rating: 4.9,
      patients: '2,500+'
    },
    {
      name: 'Dr. Anjali Gupta',
      specialty: 'Pet Nutritionist',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400',
      desc: 'Dedicated to providing the best dietary plans for small animals.',
      rating: 4.8,
      patients: '1,800+'
    },
    {
      name: 'Dr. Michael Chen',
      specialty: 'Livestock Specialist',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      desc: 'Specializes in cattle health and large farm animal management.',
      rating: 4.7,
      patients: '3,200+'
    },
    {
      name: 'Dr. Sarah Wilson',
      specialty: 'Emergency Care',
      image: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=400',
      desc: '24/7 emergency response expert for critical animal care.',
      rating: 4.9,
      patients: '4,100+'
    },
    {
      name: 'Dr. Amit Patel',
      specialty: 'Avian Specialist',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      desc: 'Expert care for exotic birds and companion avian species.',
      rating: 4.6,
      patients: '1,500+'
    }
  ];

  return (
    <Box sx={{ py: 10, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(10, 182, 162, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Verified sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                letterSpacing: 2,
                fontSize: '0.85rem'
              }}
            >
              TOP PROFESSIONALS
            </Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: 'primary.main',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Meet Our Experts
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Connect with highly qualified and experienced veterinary professionals ready to help
          </Typography>
        </Box>

        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          breakpoints={{
            640: { slidesPerView: 2 },
            900: { slidesPerView: 3 },
            1200: { slidesPerView: 4 },
          }}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true
          }}
          navigation
          modules={[Autoplay, Pagination, Navigation]}
          className="doctorsSwiper"
          style={{ paddingBottom: '50px' }}
        >
          {doctors.map((doc, index) => (
            <SwiperSlide key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    boxShadow: '0 20px 40px rgba(10, 182, 162, 0.1)',
                    transform: 'translateY(-8px)',
                    '& .doctor-avatar': {
                      transform: 'scale(1.05)',
                      borderColor: 'secondary.main'
                    },
                    '& .doctor-social': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      mb: 3
                    }}
                  >
                    <Avatar
                      src={doc.image}
                      sx={{
                        width: 130,
                        height: 130,
                        mx: 'auto',
                        border: '4px solid',
                        borderColor: 'primary.200',
                        transition: 'all 0.4s ease',
                        bgcolor: 'primary.50'
                      }}
                      className="doctor-avatar"
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 5,
                        right: 5,
                        bgcolor: 'success.main',
                        borderRadius: '50%',
                        p: 0.5,
                        border: '2px solid',
                        borderColor: 'background.default'
                      }}
                    >
                      <Verified sx={{ fontSize: 16, color: 'white' }} />
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {doc.name}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="secondary"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      letterSpacing: 1.5
                    }}
                  >
                    {doc.specialty}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Chip
                      icon={<Star sx={{ fontSize: 14 }} />}
                      label={doc.rating}
                      size="small"
                      sx={{
                        bgcolor: 'warning.50',
                        color: 'warning.dark',
                        fontWeight: 700,
                        '& .MuiChip-icon': { color: 'warning.main' }
                      }}
                    />
                    <Chip
                      label={`${doc.patients} patients`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, minHeight: '40px', lineHeight: 1.6 }}
                  >
                    {doc.desc}
                  </Typography>

                  <Box
                    className="doctor-social"
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 1,
                      opacity: 0.6,
                      transform: 'translateY(10px)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'primary.50',
                        '&:hover': { bgcolor: 'primary.100' }
                      }}
                    >
                      <LinkedIn sx={{ fontSize: 18, color: 'primary.main' }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'info.50',
                        '&:hover': { bgcolor: 'info.100' }
                      }}
                    >
                      <Twitter sx={{ fontSize: 18, color: 'info.main' }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'secondary.50',
                        '&:hover': { bgcolor: 'secondary.100' }
                      }}
                    >
                      <Language sx={{ fontSize: 18, color: 'secondary.main' }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body2" color="text.secondary">
            Join 10,000+ veterinary professionals on VetJobs
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DoctorsGallery;