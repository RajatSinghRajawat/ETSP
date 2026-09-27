import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Avatar,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Person,
  Business,
  Pets,
  WorkOutlined,
  TrendingUp,
  Verified,
  LockOutlined,
  FormatQuote,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { RoleChoiceCard, type RoleChoice } from '../../components/common/RoleChoiceCard';

const BLUE = '#0c5283';
const TEAL = '#0ab6a2';

const ROLE_ROUTE: Record<RoleChoice, string> = {
  candidate: '/signup/candidate',
  employer: '/signup/employer',
};

const ROLE_CARDS: Array<{
  role: RoleChoice;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  features: string[];
  cta: string;
}> = [
  {
    role: 'candidate',
    icon: <Person />,
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
  { icon: <WorkOutlined />, title: '10,000+ job postings', text: 'Fresh openings from clinics every day' },
  { icon: <Verified />, title: 'Verified employers', text: 'Every organisation is reviewed by our team' },
  { icon: <TrendingUp />, title: 'Grow faster', text: 'Smart matching puts you in front of the right roles' },
];

const STEPS = ['Choose role', 'Basic info', 'Verification'];

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
        minHeight: 'var(--app-min-h)',
        display: 'flex',
        alignItems: 'center',
        bgcolor: isLight ? '#f6f8fb' : 'background.default',
        // A faint dot grid gives the page texture without competing with the card.
        backgroundImage: isLight
          ? `radial-gradient(${alpha(BLUE, 0.07)} 1px, transparent 1px)`
          : `radial-gradient(${alpha('#fff', 0.05)} 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
            borderRadius: { xs: '20px', sm: '24px' },
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: isLight ? alpha(BLUE, 0.08) : 'divider',
            boxShadow: isLight
              ? '0 1px 2px rgba(15,23,42,0.04), 0 30px 60px -30px rgba(12,82,131,0.28)'
              : 'none',
          }}
        >
          {/* LEFT — brand panel (desktop only; on phones the form is the page) */}
          {isMdUp && (
            <Box
              sx={{
                position: 'relative',
                p: 5,
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                background: `linear-gradient(155deg, ${BLUE} 0%, #0a6b8f 55%, ${TEAL} 130%)`,
                overflow: 'hidden',
              }}
            >
              {/* Soft glow + ring, purely decorative. */}
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  width: 380,
                  height: 380,
                  right: -160,
                  top: -140,
                  borderRadius: '50%',
                  border: `1px solid ${alpha('#fff', 0.14)}`,
                  boxShadow: `inset 0 0 0 60px ${alpha('#fff', 0.03)}`,
                  pointerEvents: 'none',
                }}
              />

              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', position: 'relative' }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    bgcolor: alpha('#fff', 0.16),
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Pets sx={{ fontSize: 22 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
                  VetsLinked
                </Typography>
              </Stack>

              <Box sx={{ position: 'relative' }}>
                <Typography
                  component="h2"
                  sx={{ fontWeight: 700, fontSize: 38, lineHeight: 1.15, letterSpacing: '-0.03em', mb: 1.5 }}
                >
                  Where vet careers begin.
                </Typography>
                <Typography sx={{ opacity: 0.82, fontSize: 16, lineHeight: 1.6, maxWidth: 380 }}>
                  Join the trusted community connecting veterinary professionals with leading
                  clinics and hospitals.
                </Typography>
              </Box>

              <Stack spacing={2.5} sx={{ position: 'relative' }}>
                {BRAND_POINTS.map((item) => (
                  <Stack key={item.title} direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha('#fff', 0.12),
                        border: `1px solid ${alpha('#fff', 0.16)}`,
                        '& svg': { fontSize: 19 },
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{item.title}</Typography>
                      <Typography sx={{ opacity: 0.72, fontSize: 13.5, lineHeight: 1.5 }}>{item.text}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>

              <Box
                sx={{
                  position: 'relative',
                  mt: 'auto',
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: alpha('#000', 0.14),
                  border: `1px solid ${alpha('#fff', 0.12)}`,
                }}
              >
                <FormatQuote sx={{ fontSize: 28, opacity: 0.5, mb: 0.5 }} />
                <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, opacity: 0.94 }}>
                  VetsLinked helped me find my dream role at a top clinic within two weeks. The
                  matching is incredibly accurate.
                </Typography>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 2 }}>
                  <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: alpha('#fff', 0.2) }}>
                    AS
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>Dr. Anya Sharma</Typography>
                    <Typography sx={{ opacity: 0.7, fontSize: 12.5 }}>Small Animal Vet</Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          )}

          {/* RIGHT — role selection */}
          <Box
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 2.5, sm: 4, md: 5.5 },
            }}
          >
            {/* Progress — three segments read faster than a numbered stepper. */}
            <Box sx={{ mb: { xs: 3, sm: 4 } }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                  Step 1 of {STEPS.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {STEPS[0]}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} aria-hidden>
                {STEPS.map((step, index) => (
                  <Box
                    key={step}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: index === 0 ? 'secondary.main' : alpha(BLUE, 0.1),
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Typography
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.65rem', sm: '2rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                color: 'text.primary',
                mb: 1,
              }}
            >
              Create your account
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: 14.5, sm: 15.5 }, mb: { xs: 3, sm: 4 } }}>
              How will you be using VetsLinked? Pick one to get started — you can change it later.
            </Typography>

            <Grid container spacing={{ xs: 1.75, sm: 2.25 }} sx={{ alignItems: 'stretch' }}>
              {ROLE_CARDS.map((card) => (
                <Grid key={card.role} size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', minWidth: 0 }}>
                  <RoleChoiceCard
                    {...card}
                    selected={role === card.role}
                    busy={role === card.role}
                    disabled={role !== null && role !== card.role}
                    onSelect={handleSelectRole}
                  />
                </Grid>
              ))}
            </Grid>

            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'center', mt: 3, mb: { md: 3 }, color: 'text.secondary' }}
            >
              <LockOutlined sx={{ fontSize: 15 }} />
              <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'center' }}>
                Free to join · Your details stay private until you choose to share them
              </Typography>
            </Stack>

            <Box
              sx={{
                mt: { xs: 3, md: 'auto' },
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  sx={{ fontWeight: 600, color: 'secondary.main' }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;
