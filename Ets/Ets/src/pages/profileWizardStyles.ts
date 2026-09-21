import { alpha } from '@mui/material/styles';

const BLUE = '#0c5283';
const TEAL = '#0ab6a2';

/**
 * One `sx` applied to a wizard's form surface — it themes every TextField and
 * Select inside without having to touch each field, which is what keeps the
 * candidate and employer registration forms looking like the same product.
 */
export const modernFormSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    transition: 'all 0.2s ease',
    bgcolor: '#fff',
    '& fieldset': { borderColor: alpha(BLUE, 0.18) },
    '&:hover fieldset': { borderColor: alpha(TEAL, 0.6) },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: 2 },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': { color: TEAL },
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: BLUE,
    fontSize: 20,
  },
} as const;

/** The wizard's forward action — Continue / Submit. */
export const wizardPrimaryButtonSx = {
  px: 3.5,
  fontWeight: 700,
  borderRadius: 2.5,
  background: `linear-gradient(135deg, ${BLUE} 0%, ${TEAL} 100%)`,
  boxShadow: `0 12px 26px -12px ${alpha(BLUE, 0.7)}`,
  transition: 'transform .2s ease, box-shadow .2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 16px 32px -12px ${alpha(BLUE, 0.75)}`,
  },
  '&.Mui-disabled': { background: alpha(BLUE, 0.16), color: alpha('#0f172a', 0.4) },
} as const;

/** Previous / Save draft — present but visually quieter than the forward action. */
export const wizardSecondaryButtonSx = {
  px: 3,
  fontWeight: 700,
  borderRadius: 2.5,
  borderColor: alpha(BLUE, 0.28),
  color: BLUE,
  '&:hover': { borderColor: BLUE, bgcolor: alpha(BLUE, 0.05) },
} as const;

/** The action row that closes every wizard step. */
export const wizardActionBarSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2,
  flexWrap: 'wrap',
  mt: 4,
  pt: 3,
  borderTop: `1px solid ${alpha(BLUE, 0.1)}`,
} as const;
