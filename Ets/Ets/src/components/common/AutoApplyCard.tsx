import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  useGetAutoApplyStatusQuery,
  useSetAutoApplyMutation,
  type AutoApplyResult,
} from '../../store/api/applicationApi';
import { openUpgradePrompt } from '../../hooks/useAiEntitlement';

/**
 * Candidate dashboard card for the AI auto-apply plan feature: jobs matching
 * the candidate's skills and locations are applied to automatically with an
 * AI-written cover letter — both existing jobs (on enable) and new postings.
 */
const AutoApplyCard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetAutoApplyStatusQuery();
  const [setAutoApply, { isLoading: isSaving }] = useSetAutoApplyMutation();
  const [lastResult, setLastResult] = useState<AutoApplyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !data) {
    return null;
  }

  const { enabled, allowedByPlan, planName } = data.data;

  const handleToggle = async (nextEnabled: boolean) => {
    setErrorMessage(null);
    setLastResult(null);

    if (nextEnabled && !allowedByPlan) {
      openUpgradePrompt('AI auto job apply is not included in your current plan. Upgrade to unlock it.');
      return;
    }

    try {
      const res = await setAutoApply(nextEnabled).unwrap();
      setLastResult(res.data);
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      setErrorMessage(apiError?.data?.message ?? 'Could not update auto apply. Please try again.');
    }
  };

  return (
    <Card elevation={1} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AutoAwesome color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              AI Auto Apply
            </Typography>
            {!allowedByPlan && <Chip size="small" variant="outlined" color="warning" label="Upgrade required" />}
            {allowedByPlan && enabled && <Chip size="small" color="success" label="On" />}
          </Stack>

          {allowedByPlan ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {isSaving && <CircularProgress size={18} />}
              <Switch
                checked={enabled}
                onChange={(_e, checked) => handleToggle(checked)}
                disabled={isSaving}
              />
            </Stack>
          ) : (
            <Button size="small" variant="contained" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          When on, the platform automatically applies to every active job matching your skills and
          preferred locations — with a professional AI-written cover letter — and keeps applying as
          new matching jobs are posted. Your plan's application limit is always respected.
        </Typography>

        {!allowedByPlan && planName && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Your current plan "{planName}" does not include this feature.
          </Typography>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {lastResult?.enabled && (
          <Alert severity={lastResult.applied > 0 ? 'success' : 'info'} sx={{ mt: 2 }}>
            {lastResult.applied > 0
              ? `Applied to ${lastResult.applied} matching job(s) with AI cover letters.`
              : lastResult.matched > 0 && lastResult.quotaExhausted
                ? 'Matching jobs found, but your plan\'s application limit for this period is used up.'
                : 'Auto apply is on — no new matching jobs right now. New postings that match your skills and area will be applied to automatically.'}
            {lastResult.jobs.length > 0 && (
              <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: 13 }}>
                {lastResult.jobs.map((job) => `${job.title} — ${job.companyName} (${job.location})`).join(' · ')}
              </Box>
            )}
          </Alert>
        )}

        {lastResult && !lastResult.enabled && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Auto apply is off. Jobs will no longer be applied to automatically.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoApplyCard;
