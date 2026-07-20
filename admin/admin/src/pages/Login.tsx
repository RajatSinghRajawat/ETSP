import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import LoginIllustration from '../components/LoginIllustration';
import { toaster } from '../components/Toaster';
import { api, extractErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { ApiResponse, AuthUser } from '../types';

type Step = 'email' | 'otp';

interface SendOtpResponse {
  message: string;
}

interface VerifyOtpResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

export default function Login() {
  const { isAuthenticated, isAdmin, signIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formPanelRef = useRef<HTMLDivElement | null>(null);

  // Entrance animation for the form side
  useEffect(() => {
    const root = formPanelRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.from('.form-anim', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.15,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/" replace />;
  }

  async function handleSendOtp(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<SendOtpResponse> & SendOtpResponse>('/auth/send-otp', {
        email: email.trim().toLowerCase(),
      });
      toaster.create({
        title: 'OTP sent',
        description: res.data.message ?? 'Check your inbox for the 6-digit code.',
        type: 'success',
      });
      setStep('otp');
    } catch (err) {
      toaster.create({
        title: 'Could not send OTP',
        description: extractErrorMessage(err, 'Please try again.'),
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    if (otp.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp,
      });
      const { accessToken, user } = res.data;
      if (user.role !== 'admin') {
        toaster.create({
          title: 'Access denied',
          description: 'This account does not have admin access.',
          type: 'error',
        });
        return;
      }
      signIn(accessToken, user);
      toaster.create({
        title: 'Welcome back',
        description: `Signed in as ${user.email}`,
        type: 'success',
      });
      navigate('/', { replace: true });
    } catch (err) {
      toaster.create({
        title: 'Verification failed',
        description: extractErrorMessage(err, 'Invalid or expired OTP.'),
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Flex minH="100vh" w="full" bg="gray.50">
      {/* LEFT — animated illustration (hidden on small screens) */}
      <Flex
        display={{ base: 'none', lg: 'flex' }}
        flex="1"
        position="relative"
        overflow="hidden"
        align="center"
        justify="center"
        direction="column"
        p={12}
        bgGradient="linear-gradient(150deg, #093d62 0%, #0c5283 45%, #0ab6a2 100%)"
      >
        {/* decorative soft glow */}
        <Box
          position="absolute"
          top="-120px"
          left="-120px"
          w="360px"
          h="360px"
          borderRadius="full"
          bg="whiteAlpha.100"
          filter="blur(8px)"
        />
        <Box
          position="absolute"
          bottom="-140px"
          right="-100px"
          w="380px"
          h="380px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />

        <Box position="relative" w="full" maxW="520px" flex="1" display="flex" alignItems="center">
          <LoginIllustration />
        </Box>

        <Stack gap={3} position="relative" color="white" textAlign="center" maxW="440px" mt={4}>
          <Heading size="xl" letterSpacing="-0.02em">
            Welcome to ETS Admin
          </Heading>
          <Text fontSize="md" color="whiteAlpha.800">
            Secure, passwordless access to your recruitment command center.
            Sign in with your admin email and a one-time code.
          </Text>
        </Stack>
      </Flex>

      {/* RIGHT — login form */}
      <Flex
        ref={formPanelRef}
        flex={{ base: '1', lg: '0 0 46%' }}
        align="center"
        justify="center"
        px={{ base: 6, md: 12 }}
        py={10}
        bg="white"
      >
        <Box w="full" maxW="400px">
          <Stack gap={2} mb={8} className="form-anim">
            <Flex align="center" gap={3} mb={2}>
              <Box
                w="48px"
                h="48px"
                borderRadius="xl"
                bgGradient="linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="black"
                fontSize="2xl"
                shadow="md"
              >
                E
              </Box>
              <Box>
                <Heading size="md" color="gray.800" lineHeight="1.1">
                  ETS Admin Console
                </Heading>
                <Text color="gray.400" fontSize="xs" fontWeight="medium">
                  Recruitment Management Suite
                </Text>
              </Box>
            </Flex>
            <Heading size="lg" color="gray.800" mt={2}>
              {step === 'email' ? 'Sign in' : 'Verify your identity'}
            </Heading>
            <Text color="gray.500" fontSize="sm">
              {step === 'email'
                ? 'Enter your admin email and we’ll send you a secure one-time code.'
                : `We sent a 6-digit code to ${email}.`}
            </Text>
          </Stack>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp}>
              <Stack gap={5}>
                <Field.Root required className="form-anim">
                  <Field.Label color="gray.700" fontWeight="semibold">
                    Email address
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                    borderRadius="xl"
                    bg="gray.50"
                    borderColor="gray.200"
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{
                      borderColor: 'accent.500',
                      bg: 'white',
                      boxShadow: '0 0 0 3px rgba(10,182,162,0.18)',
                    }}
                    autoFocus
                  />
                </Field.Root>
                <Button
                  type="submit"
                  size="lg"
                  borderRadius="xl"
                  loading={submitting}
                  className="form-anim"
                  bgGradient="linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)"
                  color="white"
                  fontWeight="semibold"
                  transition="all 0.2s"
                  _hover={{ opacity: 0.95, transform: 'translateY(-1px)', shadow: 'lg' }}
                  _active={{ transform: 'translateY(0)' }}
                >
                  Send OTP
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <Stack gap={5}>
                <Field.Root required className="form-anim">
                  <Field.Label color="gray.700" fontWeight="semibold">
                    6-digit OTP
                  </Field.Label>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    size="lg"
                    borderRadius="xl"
                    bg="gray.50"
                    letterSpacing="0.5em"
                    textAlign="center"
                    fontSize="2xl"
                    fontWeight="bold"
                    _focus={{
                      borderColor: 'accent.500',
                      bg: 'white',
                      boxShadow: '0 0 0 3px rgba(10,182,162,0.18)',
                    }}
                    autoFocus
                  />
                </Field.Root>
                <Button
                  type="submit"
                  size="lg"
                  borderRadius="xl"
                  loading={submitting}
                  className="form-anim"
                  bgGradient="linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)"
                  color="white"
                  fontWeight="semibold"
                  transition="all 0.2s"
                  _hover={{ opacity: 0.95, transform: 'translateY(-1px)', shadow: 'lg' }}
                  _active={{ transform: 'translateY(0)' }}
                >
                  Verify & sign in
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  color="gray.500"
                  className="form-anim"
                  onClick={() => {
                    setOtp('');
                    setStep('email');
                  }}
                >
                  ← Use a different email
                </Button>
              </Stack>
            </form>
          )}

          <Text mt={10} fontSize="xs" color="gray.400" textAlign="center" className="form-anim">
            Protected by one-time password authentication.
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
