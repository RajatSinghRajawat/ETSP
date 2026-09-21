import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Business, Person, SwapHoriz } from '@mui/icons-material';
import { RoleChoiceCard, type RoleChoice } from './RoleChoiceCard';

export interface ProfileChooserDialogProps {
  open: boolean;
  /** Who is signing in — shown so the user can tell which account this is. */
  accountLabel?: string;
  /** The role the token currently carries; highlighted as the default. */
  currentRole?: RoleChoice | null;
  /** Which card is mid-switch, if any. */
  busyRole?: RoleChoice | null;
  error?: string;
  onChoose: (role: RoleChoice) => void;
}

const ROLE_CONTENT: Record<
  RoleChoice,
  { icon: React.ReactNode; title: string; subtitle: string; features: string[]; cta: string }
> = {
  candidate: {
    icon: <Person />,
    title: 'Candidate profile',
    subtitle: 'Search and apply for veterinary roles, and track every application.',
    features: ['Apply to jobs', 'Saved jobs & alerts', 'Chat with employers'],
    cta: 'Open candidate dashboard',
  },
  employer: {
    icon: <Business />,
    title: 'Employer profile',
    subtitle: 'Post openings, review applicants and manage your hiring pipeline.',
    features: ['Post & manage jobs', 'Review applicants', 'Search candidates'],
    cta: 'Open employer dashboard',
  },
};

/**
 * Shown right after login when the same email is registered as both a candidate
 * and an employer. Picking a card *is* the confirmation — there is no second
 * "Continue" step. No `onClose` is wired on purpose: backdrop clicks and Escape
 * are then no-ops, because the session has no meaningful destination until one
 * of the two profiles is chosen.
 */
export const ProfileChooserDialog: React.FC<ProfileChooserDialogProps> = ({
  open,
  accountLabel,
  currentRole = null,
  busyRole = null,
  error,
  onChoose,
}) => (
  <Dialog
    open={open}
    maxWidth="md"
    fullWidth
    aria-labelledby="profile-chooser-title"
    slotProps={{
      paper: {
        sx: {
          borderRadius: { xs: 3, sm: 4 },
          overflow: 'hidden',
          boxShadow: '0 40px 90px -40px rgba(12,82,131,0.65)',
        },
      },
      backdrop: {
        sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(8,24,40,0.55)' },
      },
    }}
  >
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 3, sm: 4.5 },
        py: { xs: 3, sm: 3.5 },
        color: '#fff',
        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -70,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <Stack direction="row" spacing={2} sx={{ position: 'relative', alignItems: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            '& svg': { fontSize: 26 },
          }}
        >
          <SwapHoriz />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography id="profile-chooser-title" variant="h5" sx={{ fontWeight: 800 }}>
            Which profile would you like to open?
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
            {accountLabel
              ? `${accountLabel} is registered as both a candidate and an employer.`
              : 'This account is registered as both a candidate and an employer.'}
          </Typography>
        </Box>
      </Stack>
    </Box>

    <DialogContent sx={{ px: { xs: 2.5, sm: 4.5 }, py: { xs: 3, sm: 3.5 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ alignItems: 'stretch' }}>
        {(['candidate', 'employer'] as RoleChoice[]).map((role) => (
          <Grid key={role} size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
            <RoleChoiceCard
              role={role}
              selected={currentRole === role}
              busy={busyRole === role}
              disabled={busyRole !== null && busyRole !== role}
              onSelect={onChoose}
              {...ROLE_CONTENT[role]}
            />
          </Grid>
        ))}
      </Grid>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2.5, textAlign: 'center' }}
      >
        You can switch between them any time from the{' '}
        <Box component="span" sx={{ fontWeight: 700, color: alpha('#0c5283', 0.9) }}>
          profile menu
        </Box>{' '}
        in the header.
      </Typography>
    </DialogContent>
  </Dialog>
);

export default ProfileChooserDialog;
