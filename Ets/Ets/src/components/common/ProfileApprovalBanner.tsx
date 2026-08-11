import { Alert, Box, Typography } from '@mui/material';
import { HourglassTop } from '@mui/icons-material';
import { useProfileApproval } from '../../hooks/useProfileApproval';

const ProfileApprovalBanner: React.FC = () => {
  const { role, isApprovalPending, isLoading } = useProfileApproval();

  if (isLoading || !isApprovalPending) {
    return null;
  }

  const restriction =
    role === 'employer'
      ? 'You cannot post jobs until the admin approves it.'
      : 'You cannot apply for jobs until the admin approves it.';

  return (
    <Box sx={{ bgcolor: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
      <Alert
        severity="warning"
        icon={<HourglassTop />}
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          borderRadius: 0,
          bgcolor: 'transparent',
          color: '#9a3412',
          py: 0.75,
          '& .MuiAlert-icon': { color: '#ea580c' },
        }}
      >
        <Typography component="span" variant="body2" sx={{ fontWeight: 800 }}>
          Your profile is pending approval.
        </Typography>{' '}
        <Typography component="span" variant="body2">
          You can use your dashboard and manage your profile, but it is hidden from other users. {restriction}
        </Typography>
      </Alert>
    </Box>
  );
};

export default ProfileApprovalBanner;
