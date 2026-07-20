import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Button } from '@mui/material';
import { Verified, Pets, Speed, Support, EmojiEvents } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  const stats = [
    { value: '10,000+', label: 'Active Professionals' },
    { value: '5,000+', label: 'Jobs Posted' },
    { value: '2,000+', label: 'Partner Clinics' },
    { value: '98%', label: 'Satisfaction Rate' }
  ];

  const values = [
    { icon: <Verified sx={{ fontSize: 40, color: '#0c5283' }} />, title: 'Trust & Verification', desc: 'Every professional and employer goes through our rigorous verification process to ensure authenticity.' },
    { icon: <Speed sx={{ fontSize: 40, color: '#0ab6a2' }} />, title: 'Fast & Efficient', desc: 'Our streamlined process helps you find or hire the right veterinary professional in minimal time.' },
    { icon: <Pets sx={{ fontSize: 40, color: '#0c5283' }} />, title: 'Pet-Centric', desc: 'We are dedicated to improving animal healthcare by connecting pet owners with the best care providers.' },
    { icon: <Support sx={{ fontSize: 40, color: '#0ab6a2' }} />, title: '24/7 Support', desc: 'Our dedicated support team is always available to help you with any queries or concerns.' }
  ];

  const team = [
    { name: 'Dr. Rahul Sharma', role: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', exp: '15+ years' },
    { name: 'Dr. Priya Mehta', role: 'Chief Veterinary Officer', image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200', exp: '12+ years' },
    { name: 'Vikram Singh', role: 'Head of Technology', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', exp: '10+ years' },
    { name: 'Anita Desai', role: 'Operations Lead', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200', exp: '8+ years' }
  ];

  const milestones = [
    { year: '2020', title: 'VetJobs Founded', desc: 'Started with a mission to transform veterinary hiring' },
    { year: '2021', title: '10,000 Users', desc: 'Reached our first major milestone of 10,000 users' },
    { year: '2022', title: 'Pan-India Launch', desc: 'Expanded operations across all major Indian cities' },
    { year: '2023', title: 'Mobile App Launch', desc: 'Released our mobile app for easier access' },
    { year: '2024', title: 'AI Matching', desc: 'Introduced AI-powered job matching technology' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
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
            background: 'rgba(255,255,255,0.05)',
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

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{ display: 'block', letterSpacing: 3, mb: 2, opacity: 0.8 }}>
            ABOUT US
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 3 }}>
            Revolutionizing Veterinary Hiring
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 700, mx: 'auto', mb: 4, lineHeight: 1.8 }}>
            VetJobs is India's leading veterinary job portal, connecting talented professionals with top animal hospitals, clinics, and pet care organizations.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/jobs"
              variant="contained"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
            >
              Find Jobs
            </Button>
            <Button
              component={Link}
              to="/contact"
              variant="outlined"
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                borderWidth: 2,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Contact Us
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'primary.main' }}>
              Our Mission
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 2, color: 'text.secondary' }}>
              To create a seamless connection between veterinary professionals and animal healthcare organizations across India. We believe that every pet deserves the best care, and that starts with connecting them with qualified and passionate professionals.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 2, color: 'text.secondary' }}>
              Through our innovative platform, we are building a community where veterinary talent meets opportunity, ultimately enhancing the quality of animal healthcare nationwide.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=600"
              alt="Veterinary care"
              sx={{
                width: '100%',
                borderRadius: 4,
                boxShadow: '0 20px 60px rgba(12, 82, 131, 0.15)'
              }}
            />
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
            Our Impact
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            Numbers that reflect our commitment to transforming veterinary hiring in India
          </Typography>

          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(12, 82, 131, 0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
          What We Stand For
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          Our core values guide everything we do at VetJobs
        </Typography>

        <Grid container spacing={4}>
          {values.map((value, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(10, 182, 162, 0.1)',
                    borderColor: 'secondary.main'
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: 'background.default',
                      mb: 3
                    }}
                  >
                    {value.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {value.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
            Our Journey
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            Key milestones in our mission to transform veterinary hiring
          </Typography>

          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 4,
                bgcolor: 'divider',
                transform: 'translateY(-50%)',
                display: { xs: 'none', md: 'block' }
              }}
            />
            <Grid container spacing={3}>
              {milestones.map((milestone, index) => (
                <Grid size={{ xs: 12, md: 4 }} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 15px 30px rgba(12, 82, 131, 0.1)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color: 'secondary.main',
                          mb: 1
                        }}
                      >
                        {milestone.year}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {milestone.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
          Meet Our Team
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          The passionate individuals behind VetJobs who are committed to transforming veterinary hiring
        </Typography>

        <Grid container spacing={4}>
          {team.map((member, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(12, 82, 131, 0.12)',
                    borderColor: 'primary.main',
                    '& .team-avatar': {
                      transform: 'scale(1.05)'
                    }
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    src={member.image}
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      border: '4px solid',
                      borderColor: 'primary.100',
                      transition: 'transform 0.3s ease',
                      bgcolor: 'primary.50'
                    }}
                    className="team-avatar"
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {member.name}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="secondary"
                    sx={{ fontWeight: 600, my: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}
                  >
                    {member.role}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.exp} experience
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box
        sx={{
          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <EmojiEvents sx={{ fontSize: 60, opacity: 0.9, mb: 3 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Ready to Join the VetJobs Family?
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
            Whether you're a veterinary professional looking for your dream job or an employer seeking top talent, we're here to help.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 5,
                py: 2,
                borderRadius: 3,
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              to="/contact"
              variant="outlined"
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 5,
                py: 2,
                borderRadius: 3,
                fontWeight: 700,
                borderWidth: 2,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default About;