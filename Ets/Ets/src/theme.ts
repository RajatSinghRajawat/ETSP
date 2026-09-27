import { alpha, createTheme, responsiveFontSizes, type ThemeOptions } from '@mui/material/styles';

// Primary color: #0c5283 (Deep Blue)
// Secondary color: #0ab6a2 (Teal)

const BLUE = '#0c5283';
const TEAL = '#0ab6a2';

/**
 * One elevation language for the whole product.
 *
 * MUI's stock shadows are grey and heavy; these are tinted with the brand blue
 * and pushed downward, which is what makes a card read as "lifted" rather than
 * "outlined". `card` sits under every resting surface, `lift` under a surface
 * the pointer is over, `pop` under menus and dialogs.
 */
export const SHADOW = {
  card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 14px 32px -24px rgba(12, 82, 131, 0.35)',
  lift: '0 2px 6px rgba(15, 23, 42, 0.06), 0 24px 44px -24px rgba(12, 82, 131, 0.45)',
  pop: '0 8px 16px -8px rgba(15, 23, 42, 0.14), 0 28px 56px -28px rgba(12, 82, 131, 0.5)',
  cardDark: '0 1px 2px rgba(0, 0, 0, 0.4), 0 14px 32px -24px rgba(0, 0, 0, 0.7)',
  liftDark: '0 2px 6px rgba(0, 0, 0, 0.5), 0 24px 44px -24px rgba(0, 0, 0, 0.85)',
} as const;

/** The motion curve every hover, focus and expand shares. */
export const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Display sizes get tighter tracking — large text set at default tracking
    // reads loose and dated.
    h1: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 },
    h2: { fontWeight: 800, letterSpacing: '-0.022em', lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h4: { fontWeight: 700, letterSpacing: '-0.018em', lineHeight: 1.3 },
    h5: { fontWeight: 700, letterSpacing: '-0.012em', lineHeight: 1.35 },
    h6: { fontWeight: 700, letterSpacing: '-0.008em', lineHeight: 1.4 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 700, letterSpacing: 0 },
    caption: { lineHeight: 1.45 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // A visible, brand-tinted focus ring on anything keyboard-reachable.
        // The default browser outline disappears against the blue surfaces.
        ':focus-visible': {
          outline: `2px solid ${alpha(TEAL, 0.85)}`,
          outlineOffset: 2,
        },
        // Long pages jump when a dialog opens and the scrollbar is removed.
        body: { scrollbarGutter: 'stable' },
        '@media (prefers-reduced-motion: reduce)': {
          '*': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 700,
          padding: '9px 18px',
          // 44px is the comfortable touch target; anything smaller is a miss
          // on a phone.
          minHeight: 44,
          transition: `background-color 180ms ${EASE}, box-shadow 180ms ${EASE}, transform 180ms ${EASE}, border-color 180ms ${EASE}`,
          '&:active': { transform: 'translateY(1px)' },
        },
        sizeSmall: { minHeight: 36, padding: '6px 14px', fontSize: '0.8125rem' },
        sizeLarge: { minHeight: 50, padding: '12px 26px', fontSize: '0.975rem' },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
      // Colour-specific lift lives in `variants` — MUI dropped the
      // `containedPrimary` / `containedSecondary` override keys.
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            boxShadow: `0 10px 22px -12px ${alpha(BLUE, 0.85)}`,
            '&:hover': {
              boxShadow: `0 14px 26px -12px ${alpha(BLUE, 0.95)}`,
              transform: 'translateY(-1px)',
            },
          },
        },
        {
          props: { variant: 'contained', color: 'secondary' },
          style: {
            boxShadow: `0 10px 22px -12px ${alpha(TEAL, 0.85)}`,
            '&:hover': {
              boxShadow: `0 14px 26px -12px ${alpha(TEAL, 0.95)}`,
              transform: 'translateY(-1px)',
            },
          },
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: `background-color 160ms ${EASE}, color 160ms ${EASE}` },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          transition: `box-shadow 160ms ${EASE}, border-color 160ms ${EASE}`,
          '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
          '&:hover fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.55) },
          '&.Mui-focused': {
            // A ring instead of a thicker border: the field does not shift by a
            // pixel when it takes focus.
            boxShadow: `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.18)}`,
          },
          '&.Mui-focused fieldset': { borderColor: theme.palette.secondary.main, borderWidth: 1.5 },
        }),
        input: { '&::placeholder': { opacity: 0.6 } },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({ '&.Mui-focused': { color: theme.palette.secondary.main } }),
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: 2, marginTop: 5 } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 14 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          boxShadow: theme.palette.mode === 'light' ? SHADOW.card : SHADOW.cardDark,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
        sizeSmall: {
          height: 26,
          // A chip you can delete is a control too — its "x" is unhittable at
          // 26px on a touch screen.
          '@media (pointer: coarse)': {
            '&:has(> .MuiChip-deleteIcon)': { height: 34 },
          },
        },
        outlined: { borderWidth: 1.5 },
        // A 26px chip is a miss under a thumb. Anything you can actually tap
        // grows to a usable target on touch devices — a coarse pointer is the
        // real test here, not a width. Declared after `sizeSmall` so it wins
        // the cascade.
        clickable: {
          '@media (pointer: coarse)': { height: 34 },
        },
        deleteIcon: { '@media (pointer: coarse)': { fontSize: 20 } },
      },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: 14, boxShadow: SHADOW.pop } },
    },
    MuiMenuItem: {
      styleOverrides: { root: { borderRadius: 8, margin: '2px 6px', minHeight: 42 } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 18,
          // MUI's stock 32px margin eats a sixth of a 360px screen. Full-screen
          // dialogs keep their own zero margin.
          [theme.breakpoints.down('sm')]: {
            '&:not(.MuiDialog-paperFullScreen)': {
              margin: 16,
              width: 'calc(100% - 32px)',
              maxWidth: 'calc(100% - 32px)',
              maxHeight: 'calc(100% - 32px)',
            },
          },
        }),
      },
    },
    MuiTabs: {
      defaultProps: {
        // Tab strips are almost always wider than a phone; let them swipe
        // rather than squash or clip.
        variant: 'scrollable',
        scrollButtons: 'auto',
        allowScrollButtonsMobile: true,
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12, alignItems: 'center' } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, padding: '6px 10px' },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        // MUI ships these end-adornment buttons at 28px; that is under a thumb
        // on the profile and job forms, which are full of Autocompletes.
        popupIndicator: { '@media (pointer: coarse)': { width: 36, height: 36 } },
        clearIndicator: { '@media (pointer: coarse)': { width: 36, height: 36 } },
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 700, minHeight: 46 } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 999 }, bar: { borderRadius: 999 } },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: { rounded: { borderRadius: 12 } },
    },
  },
};

export const lightTheme = responsiveFontSizes(
  createTheme({
    ...baseThemeOptions,
    palette: {
      mode: 'light',
      primary: {
        main: BLUE,
        contrastText: '#ffffff',
      },
      secondary: {
        main: TEAL,
        contrastText: '#ffffff',
      },
      success: { main: '#10b981' },
      warning: { main: '#d97706' },
      error: { main: '#dc2626' },
      background: {
        default: '#f6f8fb',
        paper: '#ffffff',
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
      },
      divider: 'rgba(15, 23, 42, 0.1)',
    },
  })
);

export const darkTheme = responsiveFontSizes(
  createTheme({
    ...baseThemeOptions,
    palette: {
      mode: 'dark',
      primary: {
        main: '#2f86c4',
        contrastText: '#ffffff',
      },
      secondary: {
        main: TEAL,
        contrastText: '#03211d',
      },
      success: { main: '#34d399' },
      warning: { main: '#fbbf24' },
      error: { main: '#f87171' },
      background: {
        default: '#0f172a',
        paper: '#1e293b',
      },
      text: {
        primary: '#f8fafc',
        secondary: '#94a3b8',
      },
      divider: 'rgba(148, 163, 184, 0.18)',
    },
  })
);
