import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  useUpdateEmployerApplicationMutation,
  type ApplicationStatus,
  type InterviewMode,
} from '../../store/api/applicationApi';

export type DecisionKind = 'accept' | 'reject';

export const INTERVIEW_MODES: Array<{ value: InterviewMode; label: string }> = [
  { value: '', label: 'Not specified' },
  { value: 'in_person', label: 'In person' },
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Phone call' },
];

const ACCEPT_STAGES: Array<{ value: 'shortlisted' | 'hired'; label: string }> = [
  { value: 'shortlisted', label: 'Shortlisted — invite to interview' },
  { value: 'hired', label: 'Hired — offer the role' },
];

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } }).data;
    const validationMessages = data?.errors ? Object.values(data.errors).flat().filter(Boolean) : [];
    return validationMessages[0] ?? data?.message ?? fallback;
  }
  return fallback;
};

/** `datetime-local` gives a wall-clock string; send the browser's absolute time. */
const toIsoOrNull = (localValue: string) => {
  if (!localValue) return null;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

type Props = {
  /** Which flow to show; `null` keeps the dialog closed. */
  decision: DecisionKind | null;
  applicationId: string;
  candidateName?: string;
  /** Pre-selected stage when accepting. */
  currentStatus?: ApplicationStatus;
  onClose: () => void;
  onDone?: (message: string) => void;
};

/**
 * The employer's accept / reject flow.
 *
 * Accepting optionally books an interview slot; rejecting always requires a
 * message. Either way the candidate is notified with what was written here.
 */
const ApplicationDecisionDialog: React.FC<Props> = ({
  decision,
  applicationId,
  candidateName,
  currentStatus,
  onClose,
  onDone,
}) => {
  const [updateApplication, { isLoading }] = useUpdateEmployerApplicationMutation();
  const [acceptStage, setAcceptStage] = useState<'shortlisted' | 'hired'>('shortlisted');
  const [interviewAt, setInterviewAt] = useState('');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Reset the form each time a dialog is opened for a (possibly new) application.
  useEffect(() => {
    if (!decision) return;
    setAcceptStage(currentStatus === 'hired' ? 'hired' : 'shortlisted');
    setInterviewAt('');
    setInterviewMode('');
    setInterviewLocation('');
    setMessage('');
    setError('');
  }, [decision, applicationId, currentStatus]);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    setError('');

    if (decision === 'reject' && !trimmed) {
      setError('Please write a message for the candidate explaining the rejection.');
      return;
    }

    const isoInterview = decision === 'accept' ? toIsoOrNull(interviewAt) : null;

    if (decision === 'accept' && interviewAt && !isoInterview) {
      setError('The interview date is not valid.');
      return;
    }

    try {
      await updateApplication({
        id: applicationId,
        status: decision === 'reject' ? 'rejected' : acceptStage,
        message: trimmed,
        interviewAt: isoInterview,
        interviewMode: decision === 'accept' ? interviewMode : '',
        interviewLocation: decision === 'accept' ? interviewLocation.trim() : '',
      }).unwrap();

      onDone?.(
        decision === 'reject'
          ? 'Application rejected. The candidate has been notified with your message.'
          : isoInterview
            ? 'Candidate accepted and the interview invite has been sent.'
            : 'Candidate accepted. They have been notified.',
      );
      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to update the application.'));
    }
  };

  return (
    <Dialog
      open={decision !== null}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {decision === 'reject' ? 'Reject this application' : 'Accept this candidate'}
        {candidateName && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {candidateName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}

        {decision === 'accept' && (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Stage</InputLabel>
              <Select
                label="Stage"
                value={acceptStage}
                onChange={(event) => setAcceptStage(event.target.value as 'shortlisted' | 'hired')}
              >
                {ACCEPT_STAGES.map((stage) => (
                  <MenuItem key={stage.value} value={stage.value}>{stage.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="datetime-local"
              label="Interview date & time"
              helperText="Optional — leave empty to accept without booking a slot."
              value={interviewAt}
              onChange={(event) => setInterviewAt(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <FormControl fullWidth>
              <InputLabel>Interview mode</InputLabel>
              <Select
                label="Interview mode"
                value={interviewMode}
                onChange={(event) => setInterviewMode(event.target.value as InterviewMode)}
              >
                {INTERVIEW_MODES.map((mode) => (
                  <MenuItem key={mode.value || 'none'} value={mode.value}>{mode.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Interview location / meeting link"
              placeholder="e.g. Office, 2nd floor — or a video call link"
              value={interviewLocation}
              onChange={(event) => setInterviewLocation(event.target.value)}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Message to the candidate"
              placeholder="Share interview instructions, documents to bring, or anything else."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
          </Stack>
        )}

        {decision === 'reject' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              The candidate sees this message on their dashboard, so keep it clear and respectful.
            </Typography>
            <TextField
              fullWidth
              required
              multiline
              minRows={4}
              label="Reason for rejection"
              placeholder="e.g. We are looking for more hands-on large-animal experience for this role."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={decision === 'reject' ? 'error' : 'success'}
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 3 }}
        >
          {decision === 'reject' ? 'Reject & notify' : 'Accept & notify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationDecisionDialog;
