import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Person,
  Business,
  ArrowBack,
  Pets,
  WorkOutlined,
  TrendingUp,
  Verified,
  BoltOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { RoleChoiceCard, type RoleChoice } from '../../components/common/RoleChoiceCard';

const ROLE_ROUTE: Record<RoleChoice, string> = {
  candidate: '/signup/candidate',
  employer: '/signup/employer',
};

const ROLE_CARDS: Array<{
  role: RoleChoice;
  icon: React.ReactNode;
  badge: string;
  title: string;
  subtitle: string;
  features: string[];
  cta: string;
}> = [
  {
    role: 'candidate',
    icon: <Person />,
    badge: 'For Doctors & Job Seekers',
    title: "I'm a Candidate",
    subtitle: 'Find veterinary jobs that fit your skills, location and career goals.',
    features: [
      'Browse 1000+ verified vet jobs',
      'AI-powered job matching',
      'Direct chat with employers',
    ],
    cta: 'Continue as candidate',
  },
  {
    role: 'employer',
    icon: <Business />,
    badge: 'For Clinics & Hospitals',
    title: "I'm an Employer",
    subtitle: 'Hire qualified veterinary professionals quickly and confidently.',
    features: [
      'Access to 50k+ qualified vets',
      'Smart applicant filtering',
      'Verified candidate profiles',
    ],
    cta: 'Continue as employer',
  },
];

const BRAND_POINTS = [
  { icon: <WorkOutlined />, label: '10,000+ active job postings' },
  { icon: <Verified />, label: 'Verified, trusted employers' },
  { icon: <TrendingUp />, label: 'Grow your career, faster' },
];

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLight = theme.palette.mode === 'light';
  const [role, setRole] = useState<RoleChoice | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current);
      }
    },
    [],
  );

  /**
   * Picking a card *is* the commit — there is no second "Continue" button to
   * hunt for. The short delay only exists so the tick and the lift animation
   * land before the route changes; it is not a confirmation step.
   */
  const handleSelectRole = (next: RoleChoice) => {
    if (navigationTimer.current) {
      return;
    }

    setRole(next);
    navigationTimer.current = setTimeout(() => navigate(ROLE_ROUTE[next]), 220);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 72px)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        background: isLight
          ? 'linear-gradient(135deg, #f4f9ff 0%, #eefbf8 55%, #f7fbff 100%)'
          : 'linear-gradient(135deg, #0b1424 0%, #0f2f36 100%)',
      }}
    >
      {/* Ambient wash — kept behind everything and non-interactive. */}
      <Box
        sx={{
          position: 'absolute',
          top: -140,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#0ab6a2', 0.28)} 0%, ${alpha('#0ab6a2', 0)} 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -170,
          left: -120,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#0c5283', 0.24)} 0%, ${alpha('#0c5283', 0)} 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 4, md: 6 } }}>
        {/* `stretch` is what makes the brand panel and the form card end on the
            same baseline instead of the panel floating centred against a taller
            neighbour. */}
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'stretch' }}>
          {/* LEFT — brand panel */}
          {isMdUp && (
            <Grid size={{ md: 5 }} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  position: 'relative',
                  flex: 1,
                  borderRadius: 5,
                  overflow: 'hidden',
                  boxShadow: '0 40px 80px -40px rgba(12,82,131,0.6)',
                  background: 'linear-gradient(160deg, #0c5283 0%, #0ab6a2 100%)',
                  p: 4,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.26,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(160deg, rgba(12,82,131,0.88) 0%, rgba(10,182,162,0.76) 100%)',
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Pets sx={{ color: '#fff' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.4 }}>
                      VetsLinked
                    </Typography>
                  </Stack>

                  <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.12, mb: 2 }}>
                    Where vet careers begin.
                  </Typography>
                  <Typography sx={{ opacity: 0.92, mb: 4, fontSize: 17, lineHeight: 1.6 }}>
                    Join the trusted community connecting veterinary professionals with leading
                    clinics and hospitals worldwide.
                  </Typography>

                  <Stack spacing={1.8}>
                    {BRAND_POINTS.map((item) => (
                      <Stack
                        key={item.label}
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: 'center' }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            flexShrink: 0,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '& svg': { fontSize: 18 },
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Typography sx={{ fontWeight: 500 }}>{item.label}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    mt: 4,
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.22)',
                  }}
                >
                  <Typography sx={{ fontStyle: 'italic', fontSize: 15, lineHeight: 1.55 }}>
                    “VetsLinked helped me find my dream role at a top clinic within two weeks. The
                    matching is incredibly accurate.”
                  </Typography>
                  <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: 14 }}>
                    Dr. Anya Sharma — Small Animal Vet
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* RIGHT — role selection */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex' }}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 2.5, sm: 3.5, md: 4.5 },
                borderRadius: 5,
                bgcolor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(17,27,44,0.9)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isLight ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: '0 30px 70px -35px rgba(12,82,131,0.45)',
              }}
            >
              <Box sx={{ textAlign: { xs: 'center', md: 'left' }, mb: 3 }}>
                <Chip
                  label="Step 1 of 3"
                  size="small"
                  sx={{
                    mb: 1.5,
                    bgcolor: alpha('#0ab6a2', 0.12),
                    color: 'secondary.main',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: '1.9rem', sm: '2.3rem', md: '2.6rem' },
                    background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Create your account
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tell us how you'll be using VetsLinked — you can change this later.
                </Typography>
              </Box>

              <Stepper
                activeStep={0}
                alternativeLabel
                sx={{
                  mb: 3.5,
                  '& .MuiStepLabel-label': { fontSize: 13, fontWeight: 600, mt: 1 },
                  '& .MuiStepIcon-root.Mui-active': { color: 'secondary.main' },
                  '& .MuiStepConnector-line': { borderColor: alpha('#0c5283', 0.16), borderTopWidth: 2 },
                }}
              >
                <Step><StepLabel>Choose Role</StepLabel></Step>
                <Step><StepLabel>Basic Info</StepLabel></Step>
                <Step><StepLabel>Verification</StepLabel></Step>
              </Stepper>

              {/* One tap opens the matching form — spelled out so nobody waits
                  for a Continue button that is no longer there. */}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  mb: 2,
                  color: 'secondary.main',
                }}
              >
                <BoltOutlined sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Tap a card to continue — no extra step
                </Typography>
              </Stack>

              {/* Stacked full-width role cards — "upper neeche", generous width, zero squishing */}
              <Stack spacing={2.25} sx={{ width: '100%' }}>
                {ROLE_CARDS.map((card) => (
                  <RoleChoiceCard
                    key={card.role}
                    {...card}
                    layout="horizontal"
                    selected={role === card.role}
                    busy={role === card.role}
                    disabled={role !== null && role !== card.role}
                    onSelect={handleSelectRole}
                  />
                ))}
              </Stack>

              <Box sx={{ mt: 'auto' }}>
                <Divider sx={{ my: 3 }} />

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Button
                    variant="text"
                    onClick={() => navigate('/login')}
                    startIcon={<ArrowBack />}
                    sx={{ fontWeight: 700 }}
                  >
                    Back to Login
                  </Button>

                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Box
                      component="span"
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate('/login')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate('/login');
                        }
                      }}
                      sx={{
                        color: 'secondary.main',
                        fontWeight: 700,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Sign in
                    </Box>
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Signup;
