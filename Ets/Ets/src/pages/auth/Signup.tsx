import { useState } from 'react';
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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Business,
  ArrowForward,
  ArrowBack,
  CheckCircle,
  Pets,
  WorkOutlined,
  TrendingUp,
  Verified,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [role, setRole] = useState<'candidate' | 'employer' | null>(null);

  const handleContinue = () => {
    if (role === 'candidate') {
      navigate('/signup/candidate');
    } else if (role === 'employer') {
      navigate('/signup/employer');
    }
  };

  const candidateFeatures = [
    'Browse 1000+ verified vet jobs',
    'AI-powered job matching',
    'Direct chat with employers',
  ];

  const employerFeatures = [
    'Access to 50k+ qualified vets',
    'Smart applicant filtering',
    'Verified candidate profiles',
  ];

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 72px)',
        position: 'relative',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #f0f7ff 0%, #e6fffa 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
      }}
    >
      {/* Decorative floating shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(10,182,162,0.25) 0%, rgba(10,182,162,0) 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(12,82,131,0.25) 0%, rgba(12,82,131,0) 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 4, md: 6 } }}>
        <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
          {/* LEFT — Brand / Image panel */}
          {isMdUp && (
            <Grid size={{ md: 5 }}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 5,
                  overflow: 'hidden',
                  boxShadow: '0 30px 60px -20px rgba(12,82,131,0.35)',
                  minHeight: 580,
                  background:
                    'linear-gradient(160deg, #0c5283 0%, #0ab6a2 100%)',
                  p: 4,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Image background */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.28,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(160deg, rgba(12,82,131,0.85) 0%, rgba(10,182,162,0.75) 100%)',
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 3 }}>
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
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                      VetJobs
                    </Typography>
                  </Stack>

                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, lineHeight: 1.15, mb: 2 }}
                  >
                    Where vet careers begin.
                  </Typography>
                  <Typography sx={{ opacity: 0.9, mb: 4, fontSize: 17, lineHeight: 1.6 }}>
                    Join the trusted community connecting veterinary professionals with
                    leading clinics and hospitals worldwide.
                  </Typography>

                  <Stack spacing={1.8}>
                    {[
                      { icon: <WorkOutlined />, label: '10,000+ active job postings' },
                      { icon: <Verified />, label: 'Verified, trusted employers' },
                      { icon: <TrendingUp />, label: 'Grow your career, faster' },
                    ].map((item) => (
                      <Stack
                        key={item.label}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
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
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Typography sx={{ fontStyle: 'italic', fontSize: 15, lineHeight: 1.5 }}>
                    "VetJobs helped me find my dream role at a top clinic within two
                    weeks. The matching is incredibly accurate."
                  </Typography>
                  <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: 14 }}>
                    Dr. Anya Sharma — Small Animal Vet
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* RIGHT — Signup card */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 5,
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(30,41,59,0.85)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${
                  theme.palette.mode === 'light'
                    ? 'rgba(255,255,255,0.6)'
                    : 'rgba(255,255,255,0.08)'
                }`,
                boxShadow: '0 20px 50px -20px rgba(12,82,131,0.25)',
              }}
            >
              <Box sx={{ textAlign: { xs: 'center', md: 'left' }, mb: 3 }}>
                <Chip
                  label="Step 1 of 3"
                  size="small"
                  sx={{
                    mb: 1.5,
                    bgcolor: 'rgba(10,182,162,0.12)',
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
                    background:
                      'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Create your account
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tell us how you'll be using VetJobs — you can change this later.
                </Typography>
              </Box>

              <Stepper
                activeStep={0}
                alternativeLabel
                sx={{
                  mb: 4,
                  '& .MuiStepLabel-label': { fontSize: 13, fontWeight: 600 },
                  '& .MuiStepIcon-root.Mui-active': { color: 'secondary.main' },
                }}
              >
                <Step><StepLabel>Choose Role</StepLabel></Step>
                <Step><StepLabel>Basic Info</StepLabel></Step>
                <Step><StepLabel>Verification</StepLabel></Step>
              </Stepper>

              <Stack spacing={2.5} sx={{ mb: 4 }}>
                <RoleCard
                  selected={role === 'candidate'}
                  onClick={() => setRole('candidate')}
                  icon={<Person sx={{ fontSize: 30 }} />}
                  title="I'm a Candidate"
                  subtitle="Find veterinary jobs that fit your skills and goals"
                  features={candidateFeatures}
                  accent="#0c5283"
                />
                <RoleCard
                  selected={role === 'employer'}
                  onClick={() => setRole('employer')}
                  icon={<Business sx={{ fontSize: 30 }} />}
                  title="I'm an Employer"
                  subtitle="Hire qualified veterinary professionals quickly"
                  features={employerFeatures}
                  accent="#0ab6a2"
                />
              </Stack>

              <Stack
                direction={{ xs: 'column-reverse', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems="center"
              >
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  startIcon={<ArrowBack />}
                  sx={{ fontWeight: 600 }}
                >
                  Back to Login
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  disabled={!role}
                  onClick={handleContinue}
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 4,
                    py: 1.3,
                    fontWeight: 700,
                    borderRadius: 2.5,
                    background:
                      'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                    boxShadow: '0 10px 25px -8px rgba(12,82,131,0.5)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 14px 30px -8px rgba(12,82,131,0.6)',
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(0,0,0,0.08)',
                      color: 'rgba(0,0,0,0.35)',
                    },
                  }}
                >
                  Continue
                </Button>
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 3, textAlign: 'center' }}
              >
                Already have an account?{' '}
                <Box
                  component="span"
                  onClick={() => navigate('/login')}
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
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

interface RoleCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  features: string[];
  accent: string;
}

const RoleCard: React.FC<RoleCardProps> = ({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  features,
  accent,
}) => {
  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      sx={{
        position: 'relative',
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        cursor: 'pointer',
        border: '2px solid',
        borderColor: selected ? accent : 'divider',
        bgcolor: selected ? `${accent}0D` : 'background.paper',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          borderColor: accent,
          transform: 'translateY(-3px)',
          boxShadow: `0 14px 30px -10px ${accent}55`,
        },
        '&:focus-visible': {
          outline: `2px solid ${accent}`,
          outlineOffset: 2,
        },
      }}
    >
      {selected && (
        <CheckCircle
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            color: accent,
            fontSize: 24,
          }}
        />
      )}

      <Stack direction="row" spacing={2.5} alignItems="flex-start">
        <Box
          sx={{
            flexShrink: 0,
            width: 60,
            height: 60,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: selected
              ? `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`
              : `${accent}15`,
            color: selected ? '#fff' : accent,
            transition: 'all 0.3s ease',
          }}
        >
          {icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {subtitle}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap', gap: 0.8, rowGap: 0.8 }}
            useFlexGap
          >
            {features.map((f) => (
              <Chip
                key={f}
                label={f}
                size="small"
                sx={{
                  bgcolor: selected ? `${accent}1f` : 'action.hover',
                  color: selected ? accent : 'text.secondary',
                  fontWeight: 500,
                  fontSize: 12,
                  height: 24,
                }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default Signup;
