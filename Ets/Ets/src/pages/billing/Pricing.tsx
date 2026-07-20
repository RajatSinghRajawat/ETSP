import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { CheckCircle, Cancel, ShoppingCart } from '@mui/icons-material';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  useCreateCheckoutMutation,
  useGetMySubscriptionQuery,
  useGetPlansQuery,
  type BillingInterval,
  type PlanAudience,
  type PlanFeatures,
  type PublicPlan,
} from '../../store/api/subscriptionApi';
import {
  useGetAddonsQuery,
  usePurchaseCheckoutMutation,
  type PurchaseType,
} from '../../store/api/purchaseApi';

type StoredUser = { role?: string } | null;

function readUser(): StoredUser {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

type FeatureLine = { label: string; included: boolean };

/** Renders the real plan matrix from the xlsx-derived PlanFeatures. */
function featureLines(plan: PublicPlan): FeatureLine[] {
  const f: PlanFeatures = plan.features;

  if (plan.audience === 'employer') {
    return [
      {
        label:
          f.maxActiveJobs === null
            ? 'Unlimited active jobs'
            : `${f.maxActiveJobs} active job${f.maxActiveJobs === 1 ? '' : 's'} at a time`,
        included: f.maxActiveJobs === null || f.maxActiveJobs > 0,
      },
      {
        label:
          f.jobValidityDays === null
            ? 'Jobs never expire'
            : `Jobs stay live for ${f.jobValidityDays} days`,
        included: true,
      },
      {
        label: f.featuredJobs > 0 ? `${f.featuredJobs} featured job${f.featuredJobs === 1 ? '' : 's'}` : 'Featured jobs',
        included: f.featuredJobs > 0,
      },
      {
        label:
          f.visibleExcelProfilesPerJob === null
            ? 'All EXCEL applicant profiles visible'
            : f.unlockCreditsPerJob > 0
              ? `${f.unlockCreditsPerJob} applicant unlock credits per job`
              : f.visibleExcelProfilesPerJob > 0
                ? `${f.visibleExcelProfilesPerJob} EXCEL applicant profiles visible per job`
                : 'EXCEL applicant profiles visible',
        included:
          f.visibleExcelProfilesPerJob === null ||
          f.visibleExcelProfilesPerJob > 0 ||
          f.unlockCreditsPerJob > 0,
      },
      { label: 'Candidate screening filters (location, experience, salary)', included: f.searchFiltersEnabled },
      { label: 'Chat with candidates', included: f.chatEnabled },
      { label: 'Screening questions on job posts', included: f.screeningQuestionsEnabled },
      { label: 'AI assistance', included: f.aiEnabled },
      { label: 'Dedicated account manager', included: f.dedicatedAccountManager },
      { label: 'Helpline support', included: true },
    ];
  }

  return [
    { label: 'Verified badge', included: f.verifiedBadgeEnabled },
    { label: 'Featured profile', included: f.featuredProfileEnabled },
    { label: 'Higher ranking in employer searches', included: f.searchBoostEnabled },
    { label: 'Job alert emails', included: f.jobAlertsEnabled },
    { label: 'Auto-apply to matching jobs', included: f.autoApplyEnabled },
    { label: 'Profile boosting', included: f.profileBoostEnabled },
    {
      label:
        f.directMessageEmployersPerMonth > 0
          ? `Message employers directly (${f.directMessageEmployersPerMonth}/month)`
          : 'Message employers directly',
      included: f.directMessageEmployersPerMonth > 0,
    },
    { label: 'Follow employers', included: f.followEmployersEnabled },
    { label: 'Choose profile visibility', included: f.visibilityToggleEnabled },
    { label: 'Resume builder included', included: f.resumeBuilderIncluded },
  ];
}

const ADDON_META: Record<PurchaseType, { title: string; caption: string }> = {
  pay_per_job: { title: 'Pay Per Job credit', caption: 'Post one job (14-day listing) without a subscription.' },
  unlock_credits_20: { title: '+20 unlock credits', caption: 'Top up your applicant unlock credit balance.' },
  cv_unlock_1: { title: 'Unlock 1 CV', caption: 'One-off unlock of a single candidate profile.' },
  cv_unlock_3: { title: 'Unlock 3 CVs', caption: 'Bundle of three candidate profile unlocks.' },
  urgent_tag: { title: 'Urgent Hiring tag', caption: 'Highlight one of your jobs as urgent. Bought from My Jobs.' },
  resume_builder: { title: 'Resume builder', caption: 'One AI resume build credit for candidates.' },
};

const ADDON_ORDER: PurchaseType[] = [
  'pay_per_job',
  'unlock_credits_20',
  'cv_unlock_1',
  'cv_unlock_3',
  'urgent_tag',
  'resume_builder',
];

const Pricing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useMemo(readUser, []);
  const isLoggedIn = Boolean(localStorage.getItem('ets-access-token')) && Boolean(user?.role);
  const userRole = user?.role === 'employer' || user?.role === 'candidate' ? user.role : null;

  const [audience, setAudience] = useState<PlanAudience>(userRole ?? 'candidate');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [checkoutAddon, setCheckoutAddon] = useState<PurchaseType | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { data: plansData, isLoading } = useGetPlansQuery(audience);
  const { data: subscriptionData } = useGetMySubscriptionQuery(undefined, {
    skip: !isLoggedIn || userRole !== audience,
  });
  const { data: addonsData } = useGetAddonsQuery();
  const [createCheckout] = useCreateCheckoutMutation();
  const [purchaseCheckout] = usePurchaseCheckoutMutation();

  const plans = plansData?.data.items ?? [];
  const addons = addonsData?.data.addons ?? {};
  const currentPlanId = userRole === audience ? subscriptionData?.data.plan?._id : undefined;
  const canceled = searchParams.get('canceled') === '1';

  // Support /pricing#addons deep links (from the upgrade dialog).
  useEffect(() => {
    if (location.hash === '#addons') {
      const timer = window.setTimeout(() => {
        document.getElementById('addons')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, [location.hash, addonsData]);

  const requireLogin = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleChoose = async (plan: PublicPlan) => {
    setCheckoutError(null);
    if (!requireLogin()) return;

    if (userRole !== plan.audience) {
      setCheckoutError(
        `This plan is for ${plan.audience}s. Switch to your ${plan.audience} profile to purchase it.`,
      );
      return;
    }

    setCheckoutPlanId(plan._id);
    try {
      if (plan.interval === 'one_time') {
        // Pay Per Job is a one-time purchase, not a subscription.
        const res = await purchaseCheckout({ type: 'pay_per_job' }).unwrap();
        window.location.href = res.data.url;
        return;
      }
      const res = await createCheckout({
        planId: plan._id,
        billingInterval: plan.annualPriceInr !== null ? billingInterval : undefined,
      }).unwrap();
      window.location.href = res.data.url;
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      setCheckoutError(apiError?.data?.message ?? 'Could not start the checkout. Please try again.');
      setCheckoutPlanId(null);
    }
  };

  const handleBuyAddon = async (type: PurchaseType) => {
    setCheckoutError(null);
    if (!requireLogin()) return;

    setCheckoutAddon(type);
    try {
      const res = await purchaseCheckout({ type }).unwrap();
      window.location.href = res.data.url;
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      setCheckoutError(apiError?.data?.message ?? 'Could not start the checkout. Please try again.');
      setCheckoutAddon(null);
    }
  };

  const renderPrice = (plan: PublicPlan) => {
    if (plan.interval === 'one_time') {
      return (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            ₹{plan.priceInr.toLocaleString('en-IN')}
          </Typography>
          <Typography color="text.secondary">/job post</Typography>
        </Stack>
      );
    }

    const annual = plan.annualPriceInr;
    const showAnnual = annual !== null && billingInterval === 'year';
    const savings = annual !== null ? plan.priceInr * 12 - annual : 0;

    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            ₹{(showAnnual ? (annual as number) : plan.priceInr).toLocaleString('en-IN')}
          </Typography>
          <Typography color="text.secondary">{showAnnual ? '/year' : '/month'}</Typography>
        </Stack>
        {annual !== null && !plan.isFree && (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={billingInterval}
              onChange={(_e, value: BillingInterval | null) => {
                if (value) setBillingInterval(value);
              }}
            >
              <ToggleButton value="month" sx={{ px: 2, textTransform: 'none', fontWeight: 700 }}>
                Monthly ₹{plan.priceInr.toLocaleString('en-IN')}
              </ToggleButton>
              <ToggleButton value="year" sx={{ px: 2, textTransform: 'none', fontWeight: 700 }}>
                Annual ₹{annual.toLocaleString('en-IN')}
              </ToggleButton>
            </ToggleButtonGroup>
            {savings > 0 && (
              <Typography
                variant="caption"
                color={showAnnual ? 'success.main' : 'text.secondary'}
                sx={{ fontWeight: 600 }}
              >
                {showAnnual
                  ? `You save ₹${savings.toLocaleString('en-IN')} a year`
                  : `Save ₹${savings.toLocaleString('en-IN')} with annual billing`}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Plans & Pricing
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
          Subscriptions, one-time job credits and add-ons. Upgrade when you need more — cancel any
          time and keep your benefits until the end of the billing period.
        </Typography>
      </Stack>

      {canceled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Checkout was canceled — you have not been charged.
        </Alert>
      )}

      {checkoutError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setCheckoutError(null)}>
          {checkoutError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Tabs value={audience} onChange={(_e, value: PlanAudience) => setAudience(value)}>
          <Tab label="For Candidates" value="candidate" />
          <Tab label="For Employers" value="employer" />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : plans.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 8 }} color="text.secondary">
          No plans are available right now. Please check back soon.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
            },
            gap: 3,
            justifyContent: 'center',
          }}
        >
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan._id;
            const isPayPerJob = plan.interval === 'one_time';
            const highlight = !plan.isFree && !isPayPerJob;
            const busy = checkoutPlanId === plan._id;

            return (
              <Card
                key={plan._id}
                elevation={highlight ? 6 : 1}
                sx={{
                  borderRadius: 3,
                  border: isCurrent ? 2 : 1,
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {plan.name}
                    </Typography>
                    {isCurrent ? (
                      <Chip label="Current plan" color="primary" size="small" />
                    ) : plan.isFree ? (
                      <Chip label="Free" color="success" size="small" variant="outlined" />
                    ) : isPayPerJob ? (
                      <Chip label="One-time" color="info" size="small" variant="outlined" />
                    ) : null}
                  </Stack>

                  {plan.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.description}
                    </Typography>
                  )}

                  {renderPrice(plan)}

                  <Stack spacing={1.2} sx={{ mb: 3, flex: 1 }}>
                    {featureLines(plan).map((feature) => (
                      <Stack key={feature.label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        {feature.included ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Cancel color="disabled" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          color={feature.included ? 'text.primary' : 'text.disabled'}
                        >
                          {feature.label}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  {plan.isFree ? (
                    <Button variant="outlined" disabled fullWidth>
                      {isCurrent ? 'Your current plan' : 'Included by default'}
                    </Button>
                  ) : isCurrent && !isPayPerJob ? (
                    <Button variant="outlined" disabled fullWidth>
                      Your current plan
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={() => handleChoose(plan)}
                      disabled={busy}
                      startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                      {!isLoggedIn
                        ? 'Sign in to continue'
                        : isPayPerJob
                          ? 'Buy a job credit'
                          : 'Choose plan'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Add-ons */}
      <Box id="addons" sx={{ mt: 8, scrollMarginTop: 96 }}>
        <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Add-ons
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
            One-time purchases that work with any plan — job credits, CV unlocks and more.
          </Typography>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {ADDON_ORDER.filter((type) => addons[type]).map((type) => {
            const addon = addons[type];
            const meta = ADDON_META[type];
            const busy = checkoutAddon === type;
            return (
              <Card key={type} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {meta.title}
                    </Typography>
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`₹${(addon?.amountInr ?? 0).toLocaleString('en-IN')}`}
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                    {meta.caption}
                  </Typography>
                  {type === 'urgent_tag' ? (
                    <Typography variant="caption" color="text.secondary">
                      Applied to a specific job — buy it from your My Jobs list on the employer
                      dashboard.
                    </Typography>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={busy ? <CircularProgress size={14} /> : <ShoppingCart fontSize="small" />}
                      onClick={() => handleBuyAddon(type)}
                      disabled={busy}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      {isLoggedIn ? 'Buy now' : 'Sign in to buy'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {ADDON_ORDER.every((type) => !addons[type]) && (
            <Typography color="text.secondary" sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 3 }}>
              Add-ons are not available right now.
            </Typography>
          )}
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 4 }}
      >
        Payments are processed securely by Stripe. Subscriptions renew automatically and can be
        canceled any time; add-ons are one-time purchases.
      </Typography>
    </Container>
  );
};

export default Pricing;
