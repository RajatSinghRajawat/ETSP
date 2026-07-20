import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { CheckCircleOutlined, HourglassTop } from '@mui/icons-material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  useConfirmCheckoutMutation,
  useGetMySubscriptionQuery,
} from '../../store/api/subscriptionApi';
import {
  usePurchaseConfirmMutation,
  type Purchase,
  type PurchaseType,
} from '../../store/api/purchaseApi';

const MAX_POLLS = 5;

const PURCHASE_SUCCESS_COPY: Record<PurchaseType, string> = {
  pay_per_job:
    'Your Pay Per Job credit is ready — post a job with a 14-day listing and 15 profile unlocks.',
  unlock_credits_20: '20 profile unlock credits have been added to your account.',
  cv_unlock_1: '1 CV unlock credit has been added to your account.',
  cv_unlock_3: '3 CV unlock credits have been added to your account.',
  urgent_tag: 'Your job now carries the Urgent Hiring tag.',
  resume_builder: 'Your resume builder credit is ready — build your resume any time.',
};

/**
 * Landing page after Stripe Checkout. Handles both flows:
 *  - subscriptions (no `kind` param): confirm the session, then poll
 *    /subscriptions/me until active (server also reconciles lazily);
 *  - one-time purchases (`kind=purchase`): confirm via /purchases/confirm.
 */
const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isPurchase = searchParams.get('kind') === 'purchase';

  const [confirmCheckout] = useConfirmCheckoutMutation();
  const [purchaseConfirm] = usePurchaseConfirmMutation();
  const confirmStarted = useRef(false);
  const [polls, setPolls] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [purchaseFailed, setPurchaseFailed] = useState(false);

  const { data, refetch } = useGetMySubscriptionQuery(undefined, { skip: isPurchase });

  const subscription = data?.data;
  const isActive = isPurchase ? purchase?.status === 'paid' : subscription?.status === 'active';

  const dashboardPath = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? 'null') as { role?: string } | null;
      return user?.role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard';
    } catch {
      return '/';
    }
  }, []);

  // Fast path: verify the session with Stripe via the backend right away.
  useEffect(() => {
    if (!sessionId || confirmStarted.current) {
      return;
    }
    confirmStarted.current = true;

    if (isPurchase) {
      purchaseConfirm(sessionId)
        .unwrap()
        .then((res) => setPurchase(res.data))
        .catch(() => setPurchaseFailed(true));
      return;
    }

    confirmCheckout(sessionId)
      .unwrap()
      .catch(() => {
        // Confirmation failed (e.g. Stripe still settling) — the polling
        // below re-reads /subscriptions/me, which also reconciles pending
        // checkouts server-side.
      })
      .finally(() => refetch());
  }, [sessionId, isPurchase, purchaseConfirm, confirmCheckout, refetch]);

  // Fallback polling (subscriptions only): /subscriptions/me lazily
  // reconciles the payment server-side.
  useEffect(() => {
    if (isPurchase || isActive || polls >= MAX_POLLS) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      refetch();
      setPolls((count) => count + 1);
    }, 2500 + polls * 500);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isPurchase, isActive, polls, refetch]);

  const stalled = isPurchase ? purchaseFailed : polls >= MAX_POLLS;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: 'center' }}>
        {isActive ? (
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <CheckCircleOutlined color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Payment successful!
            </Typography>
            <Typography color="text.secondary">
              {isPurchase && purchase
                ? PURCHASE_SUCCESS_COPY[purchase.type]
                : (
                  <>
                    Your <strong>{subscription?.plan?.name}</strong> plan is now active. All plan
                    features are unlocked immediately.
                  </>
                )}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Button component={RouterLink} to={dashboardPath} variant="contained" size="large">
                Go to dashboard
              </Button>
              <Button component={RouterLink} to="/pricing" variant="outlined" size="large">
                {isPurchase ? 'Back to pricing' : 'View my plan'}
              </Button>
            </Stack>
          </Stack>
        ) : stalled ? (
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <HourglassTop color="warning" sx={{ fontSize: 64 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Payment received — activation in progress
            </Typography>
            <Typography color="text.secondary">
              Your payment went through, but activation is taking a little longer than usual. Open
              your dashboard in a minute — it unlocks automatically.
            </Typography>
            <Button component={RouterLink} to={dashboardPath} variant="contained">
              Go to dashboard
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <CircularProgress size={56} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Confirming your payment…
            </Typography>
            <Typography color="text.secondary">
              This usually takes just a few seconds. Please don't close this page.
            </Typography>
          </Stack>
        )}
      </Paper>
    </Container>
  );
};

export default BillingSuccess;
