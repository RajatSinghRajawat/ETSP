import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Link as RouterLink } from 'react-router-dom';
import {
  useCancelSubscriptionMutation,
  useGetMyUsageQuery,
  type UsageMeter,
} from '../../store/api/subscriptionApi';

function Meter({ label, meter }: { label: string; meter: UsageMeter }) {
  const unlimited = meter.limit === null;
  const percent = unlimited ? 0 : Math.min((meter.used / Math.max(meter.limit as number, 1)) * 100, 100);
  const exhausted = !unlimited && meter.used >= (meter.limit as number);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} color={exhausted ? 'error.main' : 'text.primary'}>
          {unlimited ? `${meter.used} used · Unlimited` : `${meter.used} of ${meter.limit} used`}
        </Typography>
      </Stack>
      {!unlimited && (
        <LinearProgress
          variant="determinate"
          value={percent}
          color={exhausted ? 'error' : percent >= 80 ? 'warning' : 'primary'}
          sx={{ height: 8, borderRadius: 4 }}
        />
      )}
    </Box>
  );
}

/** Current plan + usage meters, embedded in both dashboards. */
const SubscriptionCard = () => {
  const { data, isLoading } = useGetMyUsageQuery();
  const [cancelSubscription, { isLoading: canceling }] = useCancelSubscriptionMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (isLoading || !data) {
    return null;
  }

  const { plan, status, cancelAtPeriodEnd, periodEnd, usage } = data.data;
  const isPaid = Boolean(plan && !plan.isFree);
  const renewDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const handleCancel = async () => {
    setCancelError(null);
    try {
      await cancelSubscription().unwrap();
      setConfirmOpen(false);
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      setCancelError(apiError?.data?.message ?? 'Could not cancel the subscription. Please try again.');
    }
  };

  return (
    <Card elevation={1} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <WorkspacePremiumIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {plan ? plan.name : 'No plan'}
            </Typography>
            {isPaid ? (
              <Chip size="small" color={status === 'past_due' ? 'warning' : 'primary'} label={status === 'past_due' ? 'Payment due' : 'Active'} />
            ) : (
              <Chip size="small" variant="outlined" label="Free plan" />
            )}
          </Stack>
          <Button component={RouterLink} to="/pricing" size="small" variant={isPaid ? 'text' : 'contained'}>
            {isPaid ? 'View plans' : 'Upgrade'}
          </Button>
        </Stack>

        {cancelAtPeriodEnd && renewDate && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Your subscription is set to cancel on {renewDate}. You keep all benefits until then.
          </Alert>
        )}

        <Stack spacing={2}>
          {usage.activeJobs && <Meter label="Active job posts" meter={usage.activeJobs} />}
          {usage.featuredJobs && usage.featuredJobs.limit > 0 && (
            <Meter label="Featured jobs" meter={usage.featuredJobs} />
          )}
          {usage.applications && <Meter label="Job applications this period" meter={usage.applications} />}
          {usage.directMessages && usage.directMessages.limit > 0 && (
            <Meter label="Employer messages this month" meter={usage.directMessages} />
          )}

          {(usage.jobCredits || usage.unlockCredits || usage.resumeCredits) && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {usage.jobCredits && usage.jobCredits.available > 0 && (
                <Chip
                  size="small"
                  color="info"
                  variant="outlined"
                  label={`${usage.jobCredits.available} job credit${usage.jobCredits.available === 1 ? '' : 's'}`}
                />
              )}
              {usage.unlockCredits && (
                <Chip
                  size="small"
                  color="secondary"
                  variant="outlined"
                  label={`${usage.unlockCredits.accountBalance} unlock credit${usage.unlockCredits.accountBalance === 1 ? '' : 's'}`}
                />
              )}
              {usage.resumeCredits && usage.resumeCredits.available > 0 && (
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  label={`${usage.resumeCredits.available} resume credit${usage.resumeCredits.available === 1 ? '' : 's'}`}
                />
              )}
            </Stack>
          )}

          {isPaid && renewDate && !cancelAtPeriodEnd && (
            <Typography variant="caption" color="text.secondary">
              Renews on {renewDate}.
            </Typography>
          )}

          {isPaid && !cancelAtPeriodEnd && (
            <Box>
              <Button size="small" color="error" onClick={() => setConfirmOpen(true)}>
                Cancel subscription
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel subscription?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Your plan stays active until {renewDate ?? 'the end of the current billing period'}, then
            you will move to the free plan. You can re-subscribe any time.
          </Typography>
          {cancelError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {cancelError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} color="inherit" disabled={canceling}>
            Keep plan
          </Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={canceling}>
            {canceling ? 'Canceling…' : 'Cancel subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SubscriptionCard;
