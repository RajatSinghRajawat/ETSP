import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Button } from '@mui/material';
import { Verified, Pets, Speed, Support, EmojiEvents } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useLocalizedSiteContent } from '../hooks/useLocalizedSiteContent';

const VALUE_ICONS: Record<string, React.ReactNode> = {
  Verified: <Verified sx={{ fontSize: 40, color: '#0c5283' }} />,
  Speed: <Speed sx={{ fontSize: 40, color: '#0ab6a2' }} />,
  Pets: <Pets sx={{ fontSize: 40, color: '#0c5283' }} />,
  Support: <Support sx={{ fontSize: 40, color: '#0ab6a2' }} />,
};

const About: React.FC = () => {
  const { content } = useLocalizedSiteContent();
  const about = content?.about;
  const stats = about?.stats ?? [];
  const values = about?.values ?? [];
  const milestones = about?.milestones ?? [];
  const team = about?.team ?? [];
  const missionBody = about?.missionBody ?? [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
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
          {about?.heroOverline ? (
            <Typography variant="overline" sx={{ display: 'block', letterSpacing: 3, mb: 2, opacity: 0.8 }}>
              {about.heroOverline}
            </Typography>
          ) : null}
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 3 }}>
            {about?.heroTitle}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 700, mx: 'auto', mb: 4, lineHeight: 1.8 }}>
            {about?.heroSubtitle}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            {about?.primaryCtaLabel ? (
              <Button
                component={Link}
                to={about.primaryCtaPath || '/jobs'}
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                }}
              >
                {about.primaryCtaLabel}
              </Button>
            ) : null}
            {about?.secondaryCtaLabel ? (
              <Button
                component={Link}
                to={about.secondaryCtaPath || '/contact'}
                variant="outlined"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700,
                  borderWidth: 2,
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {about.secondaryCtaLabel}
              </Button>
            ) : null}
          </Box>
        </Container>
      </Box>

      {(about?.missionTitle || missionBody.length > 0) && (
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6 }}>
              {about?.missionTitle ? (
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'primary.main' }}>
                  {about.missionTitle}
                </Typography>
              ) : null}
              {missionBody.map((paragraph, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    mb: index < missionBody.length - 1 ? 3 : 0,
                    fontSize: '1.1rem',
                    lineHeight: 2,
                    color: 'text.secondary',
                  }}
                >
                  {paragraph}
                </Typography>
              ))}
            </Grid>
            {about?.missionImageUrl ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  component="img"
                  src={about.missionImageUrl}
                  alt={about.missionTitle || 'About'}
                  sx={{
                    width: '100%',
                    borderRadius: 4,
                    boxShadow: '0 20px 60px rgba(12, 82, 131, 0.15)',
                  }}
                />
              </Grid>
            ) : null}
          </Grid>
        </Container>
      )}

      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
            {about?.storyTitle}
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            {about?.storyBody}
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
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
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

      {values.length > 0 && (
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
            {about?.valuesTitle}
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            {about?.valuesSubtitle}
          </Typography>

          <Grid container spacing={4}>
            {values.map((value) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={value.id}>
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
                      borderColor: 'secondary.main',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: 'background.default',
                        mb: 3,
                      }}
                    >
                      {VALUE_ICONS[value.iconKey || ''] || (
                        <Verified sx={{ fontSize: 40, color: '#0c5283' }} />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {value.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {milestones.length > 0 && (
        <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
              {about?.journeyTitle}
            </Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
              {about?.journeySubtitle}
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
                  display: { xs: 'none', md: 'block' },
                }}
              />
              <Grid container spacing={3}>
                {milestones.map((milestone, index) => (
                  <Grid size={{ xs: 12, md: 4 }} key={`${milestone.year}-${index}`}>
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
                          boxShadow: '0 15px 30px rgba(12, 82, 131, 0.1)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'secondary.main', mb: 1 }}>
                          {milestone.year}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          {milestone.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {milestone.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Container>
        </Box>
      )}

      {team.length > 0 && (
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center', mb: 2, color: 'primary.main' }}>
            {about?.teamTitle}
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            {about?.teamSubtitle}
          </Typography>

          <Grid container spacing={4}>
            {team.map((member, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`${member.name}-${index}`}>
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
                        transform: 'scale(1.05)',
                      },
                    },
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
                        bgcolor: 'primary.50',
                      }}
                      className="team-avatar"
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {member.name}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      color="secondary"
                      sx={{
                        fontWeight: 600,
                        my: 1,
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        letterSpacing: 1,
                      }}
                    >
                      {member.role}
                    </Typography>
                    {member.experience ? (
                      <Typography variant="caption" color="text.secondary">
                        {member.experience}
                      </Typography>
                    ) : null}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {(about?.ctaTitle || about?.ctaSubtitle) && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
            color: 'white',
            py: 8,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <EmojiEvents sx={{ fontSize: 60, opacity: 0.9, mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              {about?.ctaTitle}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
              {about?.ctaSubtitle}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {about?.ctaPrimaryLabel ? (
                <Button
                  component={Link}
                  to={about.ctaPrimaryPath || '/signup'}
                  variant="contained"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 5,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  }}
                >
                  {about.ctaPrimaryLabel}
                </Button>
              ) : null}
              {about?.ctaSecondaryLabel ? (
                <Button
                  component={Link}
                  to={about.ctaSecondaryPath || '/contact'}
                  variant="outlined"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 5,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 700,
                    borderWidth: 2,
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  {about.ctaSecondaryLabel}
                </Button>
              ) : null}
            </Box>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default About;
