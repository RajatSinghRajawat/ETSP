import { Alert, Box, Typography } from '@mui/material';
import { HourglassTop } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useProfileApproval } from '../../hooks/useProfileApproval';

const ProfileApprovalBanner: React.FC = () => {
  const { t } = useTranslation();
  const { role, isApprovalPending, isLoading } = useProfileApproval();

  if (isLoading || !isApprovalPending) {
    return null;
  }

  const restriction =
    role === 'employer'
      ? t('approval_restriction_employer')
      : t('approval_restriction_candidate');

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
          {t('approval_pending_title')}
        </Typography>{' '}
        <Typography component="span" variant="body2">
          {t('approval_pending_body')} {restriction}
        </Typography>
      </Alert>
    </Box>
  );
};

export default ProfileApprovalBanner;
