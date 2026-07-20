import { useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Business,
  Lock,
  NotificationsActive,
  Verified,
  VisibilityOff,
  WorkspacePremium,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import {
  useGetMyCandidateProfileQuery,
  useGetMyFollowsQuery,
  useUnfollowEmployerMutation,
  useUpdateMyCandidateProfileMutation,
  useVerifyPhoneConfirmMutation,
  useVerifyPhoneMutation,
} from '../../store/api/candidateProfileApi';
import { useGetMyUsageQuery } from '../../store/api/subscriptionApi';

const apiMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    return (error as { data?: { message?: string } }).data?.message ?? fallback;
  }
  return fallback;
};

/**
 * Candidate dashboard card for the EXCEL membership features: verified badge
 * (email + phone verification), profile visibility, job alert emails and
 * followed employers. Free candidates see the locked state with upgrade CTAs.
 */
const ExcelMembershipCard = () => {
  const { data: profileData, refetch: refetchProfile } = useGetMyCandidateProfileQuery();
  const { data: usageData } = useGetMyUsageQuery();
  const [updateProfile] = useUpdateMyCandidateProfileMutation();
  const [verifyPhone, { isLoading: isSendingOtp }] = useVerifyPhoneMutation();
  const [verifyPhoneConfirm, { isLoading: isConfirmingOtp }] = useVerifyPhoneConfirmMutation();
  const { data: followsData } = useGetMyFollowsQuery();
  const [unfollowEmployer] = useUnfollowEmployerMutation();

  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [otpError, setOtpError] = useState('');
  const [toggleError, setToggleError] = useState('');

  const profile = profileData?.data;
  const features = usageData?.data.effectiveFeatures;

  if (!profile || !features) {
    return null;
  }

  const isExcel = profile.subscriptionTier === 'excel';
  const follows = followsData?.data.items ?? [];

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpHint('');
    try {
      const res = await verifyPhone().unwrap();
      if (res.data.alreadyVerified) {
        refetchProfile();
        return;
      }
      setOtpHint(res.data.message ?? 'Verification code sent to your registered phone.');
      setOtpDialogOpen(true);
    } catch (error) {
      setOtpError(apiMessage(error, 'Could not send the verification code.'));
      setOtpDialogOpen(true);
    }
  };

  const handleConfirmOtp = async () => {
    setOtpError('');
    try {
      await verifyPhoneConfirm({ otp: otp.trim() }).unwrap();
      setOtpDialogOpen(false);
      setOtp('');
      refetchProfile();
    } catch (error) {
      setOtpError(apiMessage(error, 'Invalid code. Please try again.'));
    }
  };

  const handleToggle = async (field: 'profileVisible' | 'jobAlertsEnabled', value: boolean) => {
    setToggleError('');
    try {
      await updateProfile({ [field]: value }).unwrap();
    } catch (error) {
      // The plan-gate dialog also opens for FEATURE_NOT_IN_PLAN.
      setToggleError(apiMessage(error, 'Could not update the setting.'));
    }
  };

  return (
    <Card elevation={1} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <WorkspacePremium color={isExcel ? 'warning' : 'disabled'} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              EXCEL Membership
            </Typography>
            {isExcel ? (
              <Chip size="small" color="warning" label="Active" sx={{ fontWeight: 700 }} />
            ) : (
              <Chip size="small" variant="outlined" label="Not active" />
            )}
          </Stack>
          {!isExcel && (
            <Button component={RouterLink} to="/pricing" size="small" variant="contained">
              Get EXCEL @ ₹199/mo
            </Button>
          )}
        </Stack>

        {!isExcel && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            EXCEL members get a verified badge, featured profile, higher search ranking, job alert
            emails, auto-apply, direct messaging to 3 employers/month, employer following and the
            resume builder included.
          </Typography>
        )}

        {toggleError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setToggleError('')}>
            {toggleError}
          </Alert>
        )}

        <Stack spacing={1.5}>
          {/* Verified badge */}
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Verified color={profile.verifiedBadge ? 'success' : 'disabled'} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Verified badge
              </Typography>
              {!features.verifiedBadgeEnabled && <Lock fontSize="small" color="disabled" />}
            </Stack>
            {profile.verifiedBadge ? (
              <Chip size="small" color="success" label="Verified" />
            ) : features.verifiedBadgeEnabled ? (
              profile.phoneVerified ? (
                <Chip size="small" variant="outlined" label={profile.emailVerified ? 'Almost there' : 'Sign in via email OTP to verify email'} />
              ) : (
                <Button size="small" variant="outlined" disabled={isSendingOtp} onClick={handleSendOtp}>
                  {isSendingOtp ? 'Sending…' : 'Verify phone'}
                </Button>
              )
            ) : (
              <Typography variant="caption" color="text.secondary">
                EXCEL feature
              </Typography>
            )}
          </Stack>

          {/* Profile visibility */}
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <VisibilityOff color="action" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Profile open to recruiters
              </Typography>
              {!features.visibilityToggleEnabled && <Lock fontSize="small" color="disabled" />}
            </Stack>
            <FormControlLabel
              sx={{ mr: 0 }}
              control={
                <Switch
                  size="small"
                  checked={profile.profileVisible !== false}
                  disabled={!features.visibilityToggleEnabled}
                  onChange={(event) => handleToggle('profileVisible', event.target.checked)}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">
                  {features.visibilityToggleEnabled
                    ? profile.profileVisible !== false ? 'Visible' : 'Hidden'
                    : 'Always visible on the free plan'}
                </Typography>
              }
            />
          </Stack>

          {/* Job alerts */}
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <NotificationsActive color="action" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Job alert emails
              </Typography>
              {!features.jobAlertsEnabled && <Lock fontSize="small" color="disabled" />}
            </Stack>
            <Switch
              size="small"
              checked={Boolean(profile.jobAlertsEnabled)}
              disabled={!features.jobAlertsEnabled}
              onChange={(event) => handleToggle('jobAlertsEnabled', event.target.checked)}
            />
          </Stack>
        </Stack>

        {/* Followed employers */}
        {features.followEmployersEnabled && follows.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Followed employers
            </Typography>
            <List dense disablePadding>
              {follows.map((follow) => (
                <ListItem
                  key={follow._id}
                  disableGutters
                  secondaryAction={
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() =>
                        follow.employerProfile?._id && unfollowEmployer(follow.employerProfile._id)
                      }
                    >
                      Unfollow
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={follow.employerProfile?.logoUrl || undefined} sx={{ width: 32, height: 32 }}>
                      <Business fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {follow.employerProfile?.companyName ?? 'Employer'}
                      </Typography>
                    }
                    secondary={
                      follow.employerProfile?.headquarters ? (
                        <Typography variant="caption" color="text.secondary">
                          {follow.employerProfile.headquarters}
                        </Typography>
                      ) : undefined
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </CardContent>

      {/* Phone OTP dialog */}
      <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Verify your phone number</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {otpHint || 'Enter the code sent to your registered phone number.'}
          </Typography>
          <TextField
            fullWidth
            autoFocus
            label="Verification code"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))}
          />
          {otpError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {otpError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOtpDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={otp.length < 4 || isConfirmingOtp}
            onClick={handleConfirmOtp}
          >
            {isConfirmingOtp ? 'Verifying…' : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ExcelMembershipCard;
