import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle, MarkEmailRead, Send, Sms } from '@mui/icons-material';
import {
  useConfirmEmailOtpMutation,
  useConfirmPhoneOtpMutation,
  useSendEmailOtpMutation,
  useSendPhoneOtpMutation,
  type OtpPhoneChannel,
} from '../../store/api/verificationApi';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
    const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];
    return validationMessages[0] ?? data?.message ?? fallback;
  }
  return fallback;
};

const CHANNELS: Array<{ value: OtpPhoneChannel; label: string }> = [
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

type Props = {
  kind: 'email' | 'phone';
  /** The email address, or the bare 10-digit mobile number. */
  value: string;
  verified: boolean;
  onVerified: () => void;
  /** False while the field itself is empty or malformed. */
  canSend: boolean;
  disabledReason?: string;
};

/**
 * "Verify Email" / "Verify Phone Number" — sends an OTP to the address typed
 * into the signup form, then takes the code back. Verification lives on the
 * server against the address itself, so the parent only tracks a boolean.
 */
const OtpVerifyControl: React.FC<Props> = ({
  kind,
  value,
  verified,
  onVerified,
  canSend,
  disabledReason,
}) => {
  const isEmail = kind === 'email';
  const [sendEmailOtp, { isLoading: isSendingEmail }] = useSendEmailOtpMutation();
  const [confirmEmailOtp, { isLoading: isConfirmingEmail }] = useConfirmEmailOtpMutation();
  const [sendPhoneOtp, { isLoading: isSendingPhone }] = useSendPhoneOtpMutation();
  const [confirmPhoneOtp, { isLoading: isConfirmingPhone }] = useConfirmPhoneOtpMutation();

  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [channel, setChannel] = useState<OtpPhoneChannel>('sms');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');

  const isSending = isEmail ? isSendingEmail : isSendingPhone;
  const isConfirming = isEmail ? isConfirmingEmail : isConfirmingPhone;

  // Editing the address invalidates whatever was sent for the previous one.
  useEffect(() => {
    setSent(false);
    setOtp('');
    setInfo('');
    setError('');
  }, [value]);

  const handleSend = async () => {
    setError('');
    setInfo('');

    try {
      const result = isEmail
        ? await sendEmailOtp({ email: value }).unwrap()
        : await sendPhoneOtp({ phone: value, channel }).unwrap();

      if (result.data.alreadyVerified) {
        onVerified();
        return;
      }

      setSent(true);
      setInfo(result.data.message || result.message);
    } catch (sendError) {
      setError(getApiErrorMessage(sendError, 'Could not send the verification code.'));
    }
  };

  const handleConfirm = async () => {
    setError('');

    try {
      if (isEmail) {
        await confirmEmailOtp({ email: value, otp: otp.trim() }).unwrap();
      } else {
        await confirmPhoneOtp({ phone: value, otp: otp.trim() }).unwrap();
      }

      setSent(false);
      setOtp('');
      setInfo('');
      onVerified();
    } catch (confirmError) {
      setError(getApiErrorMessage(confirmError, 'Could not verify the code.'));
    }
  };

  if (verified) {
    return (
      <Chip
        icon={<CheckCircle />}
        color="success"
        label={isEmail ? 'Email verified' : 'Phone number verified'}
        sx={{ mt: 1, fontWeight: 700 }}
      />
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      {!sent ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          {!isEmail && (
            <TextField
              select
              size="small"
              label="Send via"
              value={channel}
              onChange={(event) => setChannel(event.target.value as OtpPhoneChannel)}
              sx={{ minWidth: 140 }}
            >
              {CHANNELS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          )}
          <Button
            variant="outlined"
            size="medium"
            startIcon={
              isSending ? <CircularProgress size={16} color="inherit" /> : isEmail ? <MarkEmailRead /> : <Sms />
            }
            disabled={!canSend || isSending}
            onClick={handleSend}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            {isSending ? 'Sending…' : isEmail ? 'Verify Email' : 'Verify Phone Number'}
          </Button>
        </Stack>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <TextField
            size="small"
            label="Enter OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 8 } }}
            sx={{ maxWidth: 160 }}
          />
          <Button
            variant="contained"
            startIcon={isConfirming ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            disabled={otp.trim().length < 4 || isConfirming}
            onClick={handleConfirm}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            {isConfirming ? 'Verifying…' : 'Confirm'}
          </Button>
          <Button
            size="small"
            startIcon={<Send fontSize="small" />}
            disabled={isSending}
            onClick={handleSend}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Resend
          </Button>
        </Stack>
      )}

      {!canSend && disabledReason && !sent && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          {disabledReason}
        </Typography>
      )}
      {info && <Alert severity="info" sx={{ mt: 1, borderRadius: 2, py: 0 }}>{info}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 1, borderRadius: 2, py: 0 }}>{error}</Alert>}
    </Box>
  );
};

export default OtpVerifyControl;
