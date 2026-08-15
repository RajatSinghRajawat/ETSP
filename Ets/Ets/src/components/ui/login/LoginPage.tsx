import { type ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
  Alert,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Phone,
  Email,
  ArrowBack,
  Pets,
  Verified,
  WorkOutlined,
  TrendingUp,
  LockOutlined,
  Sms,
  WhatsApp,
} from '@mui/icons-material';
import { Toast } from '../../common';
import LoginAnimation from './LoginAnimation';
import { axiosInstance } from '../../../store/api/axiosInstance';
import { API_ENDPOINTS } from '../../../store/api/endpoints';
import { isValidPhone, phoneHtmlInputProps, sanitizePhone } from '../../../utils/phone';

type LoginStep = 'method' | 'phone_otp' | 'email_otp';
type LoginMethod = 'phone' | 'email';

/**
 * Where the OTP is delivered. Exactly one channel is used per request — the
 * backend sends the code to the email / mobile registered on the account, so
 * the choice is independent of which identifier the user typed.
 */
type OtpChannel = 'email' | 'sms' | 'whatsapp';
type ChannelAvailability = Record<OtpChannel, boolean>;

const OTP_CHANNELS: OtpChannel[] = ['email', 'sms', 'whatsapp'];

const OTP_CHANNEL_META: Record<OtpChannel, { labelKey: string; icon: React.ReactNode }> = {
  email: { labelKey: 'otp_channel_email', icon: <Email fontSize="small" /> },
  sms: { labelKey: 'otp_channel_sms', icon: <Sms fontSize="small" /> },
  whatsapp: { labelKey: 'otp_channel_whatsapp', icon: <WhatsApp fontSize="small" /> },
};

const isOtpChannel = (value: unknown): value is OtpChannel =>
  typeof value === 'string' && (OTP_CHANNELS as string[]).includes(value);

/** First channel from `preferred` that is available (all count as available until we know). */
const pickChannel = (
  preferred: OtpChannel[],
  availability: ChannelAvailability | null,
): OtpChannel => preferred.find((c) => !availability || availability[c]) ?? preferred[0];

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    return data?.message ?? fallback;
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
};

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [step, setStep] = useState<LoginStep>('method');
  const [method, setMethod] = useState<LoginMethod | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [availability, setAvailability] = useState<ChannelAvailability | null>(null);
  const [sentInfo, setSentInfo] = useState<{ channel: OtpChannel; destination?: string } | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Ask the API which delivery options the admin has switched on so the page
  // only offers channels that can actually deliver. If the call fails, every
  // option stays selectable and the send request reports the real problem.
  useEffect(() => {
    let cancelled = false;

    axiosInstance
      .get(API_ENDPOINTS.auth.otpChannels)
      .then((response) => {
        const channels = response.data?.channels;
        if (cancelled || !channels) return;
        setAvailability({
          email: Boolean(channels.email),
          sms: Boolean(channels.sms),
          whatsapp: Boolean(channels.whatsapp),
        });
      })
      .catch(() => {
        /* keep every option enabled */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEmailLogin = () => {
    setMethod('email');
    setStep('email_otp');
    setChannel(pickChannel(['email', 'sms', 'whatsapp'], availability));
    setSentInfo(null);
    setAuthError('');
  };

  const handlePhoneLogin = () => {
    setMethod('phone');
    setStep('phone_otp');
    setChannel(pickChannel(['sms', 'whatsapp', 'email'], availability));
    setSentInfo(null);
    setAuthError('');
  };

  /**
   * The API takes either identifier; the backend resolves a mobile number to the
   * account it was registered with and keys the OTP off that account either way.
   */
  const identifier = method === 'email' ? { email } : { phone };
  const identifierLabel = method === 'email' ? email : phone;

  const handleSendOtp = async () => {
    setAuthError('');

    if (method === 'phone' && !isValidPhone(phone)) {
      showToast('Please enter a valid 10 digit mobile number', 'error');
      return;
    }
    if (method === 'email' && !email.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.auth.sendOtp, {
        ...identifier,
        channel,
      });
      const sentChannel = isOtpChannel(response.data?.channel) ? response.data.channel : channel;
      const destination =
        typeof response.data?.destination === 'string' ? response.data.destination : undefined;
      setSentInfo({ channel: sentChannel, destination });
      setOtp('');
      showToast(response.data?.message || t('otp_sent', { method: identifierLabel }), 'success');
    } catch (error) {
      const errorMsg = getApiErrorMessage(error, 'Failed to send OTP');
      setAuthError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthError('');

    if (otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.auth.verifyOtp, {
        ...identifier,
        otp,
      });
      const { accessToken, user } = response.data;
      localStorage.setItem('ets-access-token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      const roleLabel =
        user.role === 'employer' ? 'Employer' : user.role === 'admin' ? 'Admin' : 'Candidate';
      showToast(`Login successful — signed in as ${roleLabel}`, 'success');

      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (user.role === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      const errorMsg = getApiErrorMessage(error, 'Invalid OTP');
      setAuthError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('method');
    setMethod(null);
    setPhone('');
    setEmail('');
    setOtp('');
    setSentInfo(null);
    setAuthError('');
  };

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      bgcolor: theme.palette.mode === 'light' ? '#fff' : 'rgba(255,255,255,0.04)',
      transition: 'all 0.2s ease',
      '& fieldset': { borderColor: 'rgba(12,82,131,0.18)' },
      '&:hover fieldset': { borderColor: 'rgba(12,82,131,0.4)' },
      '&.Mui-focused fieldset': { borderColor: '#0ab6a2', borderWidth: 2 },
    },
  };

  const primaryButtonSx = {
    py: 1.5,
    borderRadius: 2.5,
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0.3,
    textTransform: 'none' as const,
    background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
    boxShadow: '0 10px 25px -8px rgba(12,82,131,0.45)',
    transition: 'all 0.25s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 14px 30px -8px rgba(12,82,131,0.55)',
      background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
    },
    '&.Mui-disabled': {
      background: 'rgba(0,0,0,0.08)',
      color: 'rgba(0,0,0,0.35)',
      boxShadow: 'none',
    },
  };

  const channelGroupSx = {
    gap: 1,
    '& .MuiToggleButtonGroup-grouped': {
      flex: 1,
      py: 1.1,
      borderRadius: '10px !important',
      border: '1.5px solid rgba(12,82,131,0.18) !important',
      textTransform: 'none' as const,
      fontWeight: 600,
      fontSize: 13.5,
      color: 'text.primary',
      transition: 'all 0.2s ease',
      '& svg': { color: '#0c5283' },
      '&:hover': { borderColor: '#0ab6a2 !important', bgcolor: 'rgba(10,182,162,0.06)' },
      '&.Mui-selected': {
        borderColor: '#0ab6a2 !important',
        bgcolor: 'rgba(10,182,162,0.12)',
        color: '#0c5283',
        boxShadow: '0 6px 16px -10px rgba(10,182,162,0.6)',
        '& svg': { color: '#0ab6a2' },
        '&:hover': { bgcolor: 'rgba(10,182,162,0.16)' },
      },
      '&.Mui-disabled': {
        borderColor: 'rgba(0,0,0,0.08) !important',
        color: 'rgba(0,0,0,0.3)',
        '& svg': { color: 'rgba(0,0,0,0.26)' },
      },
    },
  };

  const renderMethodSelection = () => (
    <Box>
      <Chip
        label="Welcome back"
        size="small"
        sx={{
          mb: 1.5,
          bgcolor: 'rgba(10,182,162,0.12)',
          color: '#0ab6a2',
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      />
      <Typography
        variant="h3"
        sx={{
          fontWeight: 800,
          mb: 1,
          fontSize: { xs: 28, md: 36 },
          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {t('login_title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('login_subtitle')}
      </Typography>

      <Stack spacing={1.8} sx={{ mb: 3 }}>
        <MethodButton
          icon={<Phone />}
          label={t('phone_login')}
          onClick={handlePhoneLogin}
          recommended
        />
        <MethodButton
          icon={<Email />}
          label={t('email_login')}
          onClick={handleEmailLogin}
        />
      </Stack>

      <Divider sx={{ my: 3, '&::before, &::after': { borderColor: 'rgba(12,82,131,0.12)' } }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 600 }}>
          SECURE OTP LOGIN
        </Typography>
      </Divider>

      <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
        <LockOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          Your data is encrypted and protected
        </Typography>
      </Stack>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'inline' }}>
          {t('dont_have_account')}
        </Typography>
        <Button
          component={Link}
          to="/signup"
          size="small"
          sx={{
            ml: 0.5,
            fontWeight: 700,
            textTransform: 'none',
            color: '#0ab6a2',
            '&:hover': { bgcolor: 'rgba(10,182,162,0.08)' },
          }}
        >
          {t('sign_up')}
        </Button>
      </Box>
    </Box>
  );

  const renderOtpForm = (mode: LoginMethod) => {
    const isEmail = mode === 'email';
    const value = isEmail ? email : phone;
    const setValue = isEmail ? setEmail : setPhone;
    const placeholder = isEmail ? t('email_placeholder') : t('phone_placeholder');
    const title = isEmail ? t('email_login') : t('phone_login');
    const isValid = isEmail ? email.includes('@') : isValidPhone(phone);
    const showOtpField = step === `${mode}_otp` && method === mode && isValid && sentInfo !== null;
    const channelLabel = (c: OtpChannel) => t(OTP_CHANNEL_META[c].labelKey);

    return (
      <Box>
        <Button
          variant="text"
          onClick={handleBack}
          startIcon={<ArrowBack />}
          sx={{
            mb: 2,
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(12,82,131,0.06)' },
          }}
        >
          {t('back_to_login')}
        </Button>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            fontSize: { xs: 24, md: 30 },
            background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {channel === 'email'
            ? t('otp_hint_email')
            : t('otp_hint_phone', { channel: channelLabel(channel) })}
        </Typography>

        <TextField
          fullWidth
          type={isEmail ? 'email' : 'tel'}
          placeholder={placeholder}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const next = isEmail ? e.target.value : sanitizePhone(e.target.value);
            setValue(next);
            setSentInfo(null);
            setAuthError('');
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {isEmail ? <Email sx={{ color: '#0c5283' }} /> : <Phone sx={{ color: '#0c5283' }} />}
                </InputAdornment>
              ),
            },
            htmlInput: isEmail ? undefined : phoneHtmlInputProps,
          }}
          sx={{ mb: 2, ...fieldSx }}
        />

        <Typography
          variant="caption"
          sx={{ display: 'block', mb: 1, fontWeight: 700, color: 'text.secondary', letterSpacing: 0.4 }}
        >
          {t('otp_channel_label')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={channel}
          onChange={(_event, next: OtpChannel | null) => {
            if (!next) return;
            setChannel(next);
            setSentInfo(null);
            setAuthError('');
          }}
          aria-label={t('otp_channel_label')}
          sx={{ mb: 2.5, ...channelGroupSx }}
        >
          {OTP_CHANNELS.map((option) => {
            const unavailable = availability !== null && !availability[option];
            const button = (
              <ToggleButton
                key={option}
                value={option}
                disabled={unavailable}
                aria-label={channelLabel(option)}
              >
                {OTP_CHANNEL_META[option].icon}
                <Box component="span" sx={{ ml: 0.8 }}>
                  {channelLabel(option)}
                </Box>
              </ToggleButton>
            );

            return unavailable ? (
              <Tooltip key={option} title={t('otp_channel_unavailable')} arrow>
                <span style={{ display: 'flex', flex: 1 }}>{button}</span>
              </Tooltip>
            ) : (
              button
            );
          })}
        </ToggleButtonGroup>

        {authError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {authError}
          </Alert>
        )}

        {sentInfo && !authError && (
          <Alert severity="success" icon={OTP_CHANNEL_META[sentInfo.channel].icon} sx={{ mb: 2, borderRadius: 2 }}>
            {sentInfo.destination
              ? t('otp_sent_via', {
                  channel: channelLabel(sentInfo.channel),
                  destination: sentInfo.destination,
                })
              : t('otp_sent_generic', { channel: channelLabel(sentInfo.channel) })}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSendOtp}
          disabled={loading || !isValid}
          sx={primaryButtonSx}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : sentInfo ? (
            t('resend_otp')
          ) : (
            t('send_otp')
          )}
        </Button>

        {showOtpField && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                ENTER OTP
              </Typography>
            </Divider>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder={t('otp_placeholder')}
              value={otp}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: '#0c5283' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2, ...fieldSx }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              sx={primaryButtonSx}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : t('verify_otp')}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        position: 'relative',
        overflow: 'hidden',
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #f0f7ff 0%, #e6fffa 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
        py: { xs: 4, md: 6 },
      }}
    >
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

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Grid
          container
          spacing={0}
          sx={{
            alignItems: 'stretch',
            borderRadius: 5,
            overflow: 'hidden',
            boxShadow: '0 30px 60px -20px rgba(12,82,131,0.35)',
          }}
        >
          {isMdUp && (
            <Grid size={{ md: 6 }} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  flex: 1,
                  minHeight: 600,
                  background: 'linear-gradient(160deg, #0c5283 0%, #0ab6a2 100%)',
                  p: 5,
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
                    backgroundImage: `url(${HERO_IMAGE})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.32,
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

                {/* Animated SVG layer (veterinary-themed, decorative) */}
                <LoginAnimation />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 4 }}>
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
                      VetsLinked
                    </Typography>
                  </Stack>

                  <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 2 }}>
                    Welcome back to your vet community.
                  </Typography>
                  <Typography sx={{ opacity: 0.92, mb: 4, fontSize: 17, lineHeight: 1.6 }}>
                    Sign in to manage applications, chat with employers, and discover roles
                    matched to your expertise.
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
                    "VetsLinked helped me find my dream role at a top clinic within two
                    weeks. The matching is incredibly accurate."
                  </Typography>
                  <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: 14 }}>
                    Dr. Anya Sharma — Small Animal Vet
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
            <Box
              sx={{
                flex: 1,
                p: { xs: 3, sm: 4, md: 5 },
                minHeight: { md: 600 },
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(30,41,59,0.9)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
                <Box
                  component="img"
                  src="/Logo.png"
                  alt="VetsLinked"
                  sx={{ height: 64, width: 'auto' }}
                />
              </Box>

              {step === 'method' && renderMethodSelection()}
              {step === 'phone_otp' && renderOtpForm('phone')}
              {step === 'email_otp' && renderOtpForm('email')}
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

interface MethodButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  recommended?: boolean;
}

const MethodButton: React.FC<MethodButtonProps> = ({
  icon,
  label,
  onClick,
  disabled,
  recommended,
}) => (
  <Button
    fullWidth
    onClick={onClick}
    disabled={disabled}
    sx={{
      position: 'relative',
      py: 1.8,
      px: 2.5,
      borderRadius: 2.5,
      border: '1.5px solid',
      borderColor: recommended ? '#0ab6a2' : 'rgba(12,82,131,0.18)',
      bgcolor: recommended ? 'rgba(10,182,162,0.06)' : 'transparent',
      color: 'text.primary',
      fontWeight: 600,
      fontSize: 15,
      textTransform: 'none',
      justifyContent: 'flex-start',
      transition: 'all 0.25s ease',
      '& .MuiButton-startIcon': { mr: 2, color: recommended ? '#0ab6a2' : '#0c5283' },
      '&:hover': {
        borderColor: '#0ab6a2',
        bgcolor: 'rgba(10,182,162,0.08)',
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 25px -10px rgba(10,182,162,0.4)',
      },
      '&.Mui-disabled': {
        borderColor: 'rgba(0,0,0,0.12)',
        bgcolor: 'rgba(0,0,0,0.02)',
        color: 'rgba(0,0,0,0.38)',
      },
    }}
    startIcon={icon}
  >
    {label}
    {recommended && (
      <Chip
        label="Recommended"
        size="small"
        sx={{
          position: 'absolute',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 22,
          fontSize: 10,
          fontWeight: 700,
          bgcolor: '#0ab6a2',
          color: '#fff',
        }}
      />
    )}
  </Button>
);

export default LoginPage;
