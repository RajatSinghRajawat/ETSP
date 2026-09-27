import { Box, Stack, Typography, CircularProgress, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowForward, CheckCircle, Check } from '@mui/icons-material';

export type RoleChoice = 'candidate' | 'employer';

/** The two brand accents, kept in one place so signup and login stay in sync. */
const ROLE_ACCENT: Record<RoleChoice, string> = {
  candidate: '#0c5283',
  employer: '#0ab6a2',
};

export interface RoleChoiceCardProps {
  role: RoleChoice;
  selected: boolean;
  /** Shows a spinner in place of the call-to-action while the choice is applied. */
  busy?: boolean;
  /** Dims the card while a *different* card is being applied. */
  disabled?: boolean;
  onSelect: (role: RoleChoice) => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Exactly three entries — the fixed count is what keeps both cards the same height. */
  features: string[];
  cta: string;
  badge?: string;
  layout?: 'horizontal' | 'vertical';
}

/**
 * One selectable role tile. Supports both stacked wide horizontal layout and vertical tile layout.
 */
export const RoleChoiceCard: React.FC<RoleChoiceCardProps> = ({
  role,
  selected,
  busy = false,
  disabled = false,
  onSelect,
  icon,
  title,
  subtitle,
  features,
  cta,
  badge,
  layout = 'vertical',
}) => {
  const accent = ROLE_ACCENT[role];
  const interactive = !busy && !disabled;

  if (layout === 'horizontal') {
    return (
      <Box
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-pressed={selected}
        aria-disabled={!interactive}
        onClick={() => interactive && onSelect(role)}
        onKeyDown={(event) => {
          if (interactive && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onSelect(role);
          }
        }}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          p: { xs: 2.25, sm: 2.75 },
          borderRadius: '20px',
          cursor: interactive ? 'pointer' : 'default',
          border: '2px solid',
          borderColor: selected ? accent : 'divider',
          bgcolor: 'background.paper',
          opacity: disabled ? 0.45 : 1,
          boxShadow: selected
            ? `0 20px 45px -16px ${alpha(accent, 0.45)}`
            : '0 2px 10px rgba(15, 23, 42, 0.04), 0 16px 32px -20px rgba(12, 82, 131, 0.12)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${alpha(accent, 0.07)} 0%, ${alpha(accent, 0)} 60%)`,
            opacity: selected ? 1 : 0,
            transition: 'opacity 0.25s ease',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '5px',
            bgcolor: accent,
            opacity: selected ? 1 : 0,
            transition: 'opacity 0.25s ease',
          },
          '&:hover': interactive
            ? {
                borderColor: accent,
                transform: 'translateY(-3px)',
                boxShadow: `0 22px 48px -18px ${alpha(accent, 0.38)}`,
                '&::before': { opacity: 0.8 },
                '& .role-cta-arrow': {
                  transform: 'translateX(4px)',
                },
                '& .role-cta-pill': {
                  bgcolor: accent,
                  color: '#ffffff',
                },
                '& .role-radio-ring': {
                  borderColor: accent,
                },
              }
            : undefined,
          '&:focus-visible': { outline: `2px solid ${accent}`, outlineOffset: 3 },
        }}
      >
        {/* Top Header Row */}
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: { xs: 48, sm: 54 },
              height: { xs: 48, sm: 54 },
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: selected
                ? `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.8)} 100%)`
                : alpha(accent, 0.1),
              color: selected ? '#ffffff' : accent,
              boxShadow: selected ? `0 10px 22px -8px ${alpha(accent, 0.6)}` : 'none',
              transition: 'all 0.25s ease',
              '& svg': { fontSize: { xs: 26, sm: 28 } },
            }}
          >
            {icon}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
            {badge && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  mb: 0.75,
                  height: 20,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  bgcolor: alpha(accent, 0.1),
                  color: accent,
                  border: '1px solid',
                  borderColor: alpha(accent, 0.2),
                }}
              />
            )}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.15rem', sm: '1.25rem' },
                lineHeight: 1.25,
                color: 'text.primary',
                mb: 0.4,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.84rem', sm: '0.88rem' }, lineHeight: 1.45 }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* Selection Radio / Checkmark Icon */}
          <Box sx={{ flexShrink: 0, pt: 0.25 }}>
            {selected ? (
              <CheckCircle
                sx={{
                  fontSize: 26,
                  color: accent,
                }}
              />
            ) : (
              <Box
                className="role-radio-ring"
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: 'divider',
                  transition: 'border-color 0.2s ease',
                }}
              />
            )}
          </Box>
        </Stack>

        {/* Feature Badges Row */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 1.75 },
            mt: 2,
            pt: 1.75,
            borderTop: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {features.map((feature) => (
            <Stack
              key={feature}
              direction="row"
              spacing={0.75}
              sx={{ alignItems: 'center' }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: alpha(accent, selected ? 0.18 : 0.1),
                  color: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Check sx={{ fontSize: 12, strokeWidth: 1 }} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                }}
              >
                {feature}
              </Typography>
            </Stack>
          ))}
        </Box>

        {/* Action Row */}
        <Stack
          direction="row"
          sx={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box
            className="role-cta-pill"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              px: 2.25,
              py: 0.75,
              borderRadius: 999,
              bgcolor: selected ? accent : alpha(accent, 0.08),
              color: selected ? '#ffffff' : accent,
              fontWeight: 700,
              fontSize: '0.84rem',
              border: '1px solid',
              borderColor: selected ? accent : alpha(accent, 0.2),
              transition: 'all 0.2s ease',
            }}
          >
            {busy ? (
              <>
                <CircularProgress size={14} sx={{ color: 'inherit' }} />
                <span>Opening…</span>
              </>
            ) : (
              <>
                <span>{cta}</span>
                <ArrowForward className="role-cta-arrow" sx={{ fontSize: 16, transition: 'transform 0.2s ease' }} />
              </>
            )}
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-pressed={selected}
      aria-disabled={!interactive}
      onClick={() => interactive && onSelect(role)}
      onKeyDown={(event) => {
        if (interactive && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onSelect(role);
        }
      }}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: { xs: 2.5, sm: 3 },
        borderRadius: '18px',
        cursor: interactive ? 'pointer' : 'default',
        border: '1.5px solid',
        borderColor: selected ? accent : 'divider',
        bgcolor: 'background.paper',
        opacity: disabled ? 0.5 : 1,
        boxShadow: selected
          ? `0 18px 40px -18px ${alpha(accent, 0.55)}`
          : '0 1px 2px rgba(15,23,42,0.04), 0 14px 32px -24px rgba(12,82,131,0.35)',
        transition: 'border-color .25s ease, box-shadow .25s ease, transform .25s ease, opacity .2s ease',
        overflow: 'hidden',
        // A tinted wash behind the content instead of a flat background colour —
        // it keeps the form fields and chips on top fully legible.
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(accent, 0.09)} 0%, ${alpha(accent, 0)} 62%)`,
          opacity: selected ? 1 : 0,
          transition: 'opacity .25s ease',
          pointerEvents: 'none',
        },
        '&:hover': interactive
          ? {
              borderColor: accent,
              transform: 'translateY(-4px)',
              boxShadow: `0 22px 46px -20px ${alpha(accent, 0.5)}`,
              '&::before': { opacity: 1 },
            }
          : undefined,
        '&:focus-visible': { outline: `2px solid ${accent}`, outlineOffset: 3 },
      }}
    >
      {/* Reserved top-right slot: the tick only appears when selected, but the
          space is always there, so nothing below it shifts. */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1, lineHeight: 0 }}>
        <CheckCircle
          sx={{
            fontSize: 24,
            color: accent,
            opacity: selected ? 1 : 0,
            transform: selected ? 'scale(1)' : 'scale(0.6)',
            transition: 'all .25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </Box>

      <Stack spacing={2} sx={{ position: 'relative', flex: 1 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: selected
              ? `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.75)} 100%)`
              : alpha(accent, 0.1),
            color: selected ? '#fff' : accent,
            boxShadow: selected ? `0 10px 22px -8px ${alpha(accent, 0.65)}` : 'none',
            transition: 'all .25s ease',
            '& svg': { fontSize: 28 },
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, pr: 4 }}>
            {title}
          </Typography>
          {/* Fixed two-line slot — one card having a shorter subtitle must not
              make it shorter than its neighbour. */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.5, minHeight: { sm: 42 } }}
          >
            {subtitle}
          </Typography>
        </Box>

        <Stack component="ul" spacing={1.1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {features.map((feature) => (
            <Stack
              key={feature}
              component="li"
              direction="row"
              spacing={1.2}
              sx={{ alignItems: 'center' }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(accent, selected ? 0.18 : 0.1),
                  color: accent,
                  transition: 'background-color .25s ease',
                }}
              >
                <Check sx={{ fontSize: 13 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {feature}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      {/* Pinned to the bottom of whichever card is taller, so the two footers
          always sit on the same line. */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: 'relative',
          mt: 'auto',
          pt: 2.5,
          alignItems: 'center',
          color: accent,
          fontWeight: 700,
        }}
      >
        {busy ? (
          <>
            <CircularProgress size={16} sx={{ color: accent }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Opening…
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {cta}
            </Typography>
            <ArrowForward sx={{ fontSize: 17 }} />
          </>
        )}
      </Stack>
    </Box>
  );
};

export default RoleChoiceCard;
