import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useNavigate } from 'react-router-dom';

export type PlanGateCode =
  | 'PLAN_LIMIT_REACHED'
  | 'FEATURE_NOT_IN_PLAN'
  | 'NO_UNLOCK_CREDITS'
  | 'NO_JOB_CREDIT'
  | 'NO_RESUME_CREDITS'
  | 'PROFILE_LOCKED';

type PlanGateDetail = {
  code: PlanGateCode;
  message?: string;
  errors?: Record<string, unknown>;
};

type GateCopy = {
  title: string;
  fallbackBody: string;
  actionLabel: string;
  actionPath: string;
};

const GATE_COPY: Record<PlanGateCode, GateCopy> = {
  PLAN_LIMIT_REACHED: {
    title: 'Plan limit reached',
    fallbackBody: 'You have reached a limit of your current plan. Upgrade to continue.',
    actionLabel: 'View plans',
    actionPath: '/pricing',
  },
  FEATURE_NOT_IN_PLAN: {
    title: 'Upgrade to unlock this feature',
    fallbackBody: 'This feature is not included in your current plan. Upgrade to continue.',
    actionLabel: 'View plans',
    actionPath: '/pricing',
  },
  NO_UNLOCK_CREDITS: {
    title: "You're out of unlock credits",
    fallbackBody:
      'You have no unlock credits left for this candidate. Buy more credits to keep unlocking profiles.',
    actionLabel: 'Buy credits',
    actionPath: '/pricing#addons',
  },
  NO_JOB_CREDIT: {
    title: 'No job credits available',
    fallbackBody: 'You need a Pay Per Job credit to post this job. Buy one to publish instantly.',
    actionLabel: 'Buy Pay Per Job',
    actionPath: '/pricing#addons',
  },
  NO_RESUME_CREDITS: {
    title: 'No resume credits left',
    fallbackBody: 'Buy a resume credit (₹25) to build your resume, or upgrade to EXCEL.',
    actionLabel: 'Buy resume credit',
    actionPath: '/pricing#addons',
  },
  PROFILE_LOCKED: {
    title: 'This profile is locked',
    fallbackBody:
      'You are not entitled to view this candidate yet. Unlock the profile with a credit or upgrade your plan.',
    actionLabel: 'View plans',
    actionPath: '/pricing',
  },
};

/**
 * Global upgrade prompt. The axios interceptor dispatches an `ets:plan-gate`
 * CustomEvent whenever the API rejects a request with a plan-gating error
 * code; this dialog listens and offers the pricing page (or the add-ons
 * section for credit purchases).
 */
const UpgradeDialog = () => {
  const [detail, setDetail] = useState<PlanGateDetail | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<PlanGateDetail>;
      if (custom.detail?.code) {
        setDetail(custom.detail);
      }
    };

    window.addEventListener('ets:plan-gate', handler);
    return () => window.removeEventListener('ets:plan-gate', handler);
  }, []);

  const close = () => setDetail(null);

  const copy = detail ? GATE_COPY[detail.code] ?? GATE_COPY.FEATURE_NOT_IN_PLAN : null;

  return (
    <Dialog open={Boolean(detail)} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <WorkspacePremiumIcon color="primary" />
        {copy?.title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {detail?.message ?? copy?.fallbackBody}
        </Typography>
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            {detail?.code === 'NO_UNLOCK_CREDITS' ||
            detail?.code === 'NO_JOB_CREDIT' ||
            detail?.code === 'NO_RESUME_CREDITS'
              ? 'One-time purchases apply instantly after payment — no subscription needed.'
              : 'Compare plans and upgrade any time — changes apply immediately after payment.'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close} color="inherit">
          Not now
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            close();
            if (copy) navigate(copy.actionPath);
          }}
        >
          {copy?.actionLabel ?? 'View plans'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeDialog;
