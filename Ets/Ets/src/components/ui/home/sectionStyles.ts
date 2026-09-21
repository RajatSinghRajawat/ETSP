import type { SxProps, Theme } from '@mui/material/styles';

/** The shared style for a home section's "view all" pill. */
export const sectionActionSx: SxProps<Theme> = {
  display: { xs: 'none', md: 'inline-flex' },
  borderRadius: 999,
  borderColor: '#cbd5e1',
  color: '#0c5283',
  fontWeight: 700,
  textTransform: 'none',
  px: 3,
  py: 1.15,
  whiteSpace: 'nowrap',
  '& .MuiSvgIcon-root': { transition: 'transform 200ms ease' },
  '&:hover': {
    borderColor: '#0c5283',
    bgcolor: 'rgba(12, 82, 131, 0.04)',
    '& .MuiSvgIcon-root': { transform: 'translateX(4px)' },
  },
};
