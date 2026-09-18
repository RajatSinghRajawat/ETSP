import { alpha, type SxProps, type Theme } from '@mui/material/styles';

/**
 * The shared surface language for the employer "My Jobs" flow — the dashboard
 * job list, a job's own page and its candidate list.
 *
 * Everything here is presentation only. It lives in one place so the three
 * pages stay visually identical as they change: same radii, same soft shadow,
 * same tinted icon plates, same section headings.
 */

/** Accent tones used for tiles and icon plates, keyed by meaning. */
export const TONE = {
  blue: '#0c5283',
  teal: '#0ab6a2',
  violet: '#7c3aed',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#dc2626',
  slate: '#64748b',
} as const;

export type ToneKey = keyof typeof TONE;

/** The soft, rounded card every panel in the flow sits on. */
export const panelSx: SxProps<Theme> = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 4,
  bgcolor: 'background.paper',
  boxShadow: (theme: Theme) =>
    theme.palette.mode === 'light'
      ? '0 1px 2px rgba(15, 23, 42, 0.04), 0 18px 40px -28px rgba(12, 82, 131, 0.35)'
      : '0 1px 2px rgba(0, 0, 0, 0.4), 0 18px 40px -28px rgba(0, 0, 0, 0.7)',
};

/** A nested panel inside a card — one step flatter than `panelSx`. */
export const insetSx: SxProps<Theme> = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  bgcolor: (theme: Theme) =>
    theme.palette.mode === 'light' ? alpha('#f8fafc', 0.9) : alpha('#ffffff', 0.03),
};

/** Rows and tiles that respond to the pointer without jumping the layout. */
export const hoverLiftSx: SxProps<Theme> = {
  transition: 'border-color 160ms ease, box-shadow 200ms ease, transform 200ms ease',
  '&:hover': {
    borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.45),
    boxShadow: (theme: Theme) =>
      theme.palette.mode === 'light'
        ? '0 2px 4px rgba(15, 23, 42, 0.05), 0 22px 44px -26px rgba(12, 82, 131, 0.45)'
        : '0 2px 4px rgba(0, 0, 0, 0.45), 0 22px 44px -26px rgba(0, 0, 0, 0.8)',
    transform: 'translateY(-2px)',
  },
} as const;

/** The gradient used by page heroes and primary accents. */
export const heroGradient = (theme: Theme) =>
  theme.palette.mode === 'light'
    ? `linear-gradient(125deg, ${TONE.blue} 0%, #0a4570 48%, ${alpha(TONE.teal, 0.92)} 135%)`
    : `linear-gradient(125deg, #0a3f66 0%, #0c2740 52%, ${alpha(TONE.teal, 0.55)} 140%)`;

/** The white pill button style used for actions sitting on the hero. */
export const heroButtonSx: SxProps<Theme> = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 2.5,
  color: '#ffffff',
  borderColor: alpha('#ffffff', 0.45),
  bgcolor: alpha('#ffffff', 0.12),
  '&:hover': { borderColor: '#ffffff', bgcolor: alpha('#ffffff', 0.22) },
};

/** Pipeline tabs rendered as a segmented pill strip rather than underlines. */
export const pillTabsSx: SxProps<Theme> = {
  minHeight: 0,
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTabs-flexContainer': { gap: 1 },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 700,
    minHeight: 38,
    minWidth: 0,
    px: 1.75,
    borderRadius: 999,
    color: 'text.secondary',
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
    '&:hover': { borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.4) },
  },
  '& .MuiTab-root.Mui-selected': {
    color: 'primary.contrastText',
    bgcolor: 'primary.main',
    borderColor: 'primary.main',
  },
};
