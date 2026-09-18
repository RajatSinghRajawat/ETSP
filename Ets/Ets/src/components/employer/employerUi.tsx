import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import { TONE, hoverLiftSx, heroGradient, panelSx, type ToneKey } from './employerTokens';

/**
 * The presentational pieces shared by the employer "My Jobs" flow — the
 * dashboard job list, a job's own page and its candidate list. The tokens they
 * are built from live in `employerTokens.ts`.
 */

/**
 * A tinted square holding an icon. The tone carries the meaning, so the icon
 * itself never needs its own colour prop.
 */
export const IconPlate: React.FC<{
  children: React.ReactNode;
  tone?: ToneKey | string;
  size?: number;
  /** On a gradient hero the plate is translucent white instead of tinted. */
  onHero?: boolean;
}> = ({ children, tone = 'blue', size = 40, onHero = false }) => {
  const color = (TONE as Record<string, string>)[tone as string] ?? (tone as string);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 2.5,
        display: 'grid',
        placeItems: 'center',
        bgcolor: onHero ? alpha('#ffffff', 0.16) : alpha(color, 0.12),
        color: onHero ? '#ffffff' : color,
        border: '1px solid',
        borderColor: onHero ? alpha('#ffffff', 0.24) : alpha(color, 0.22),
        '& .MuiSvgIcon-root': { fontSize: size <= 32 ? 17 : 21 },
      }}
    >
      {children}
    </Box>
  );
};

/** The heading above a block of content: icon plate, title, caption, action. */
export const SectionHeading: React.FC<{
  icon?: React.ReactNode;
  tone?: ToneKey | string;
  title: string;
  caption?: string;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
}> = ({ icon, tone = 'blue', title, caption, action, sx }) => (
  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1.5,
      ...(sx as object),
    }}
  >
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      {icon && <IconPlate tone={tone}>{icon}</IconPlate>}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.3 }}>
          {title}
        </Typography>
        {caption && (
          <Typography variant="body2" color="text.secondary">
            {caption}
          </Typography>
        )}
      </Box>
    </Stack>
    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
  </Box>
);

/**
 * A headline number with its label. Clickable tiles get the hover lift and a
 * pointer; static ones stay flat.
 */
export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: ToneKey;
  caption?: string;
  onClick?: () => void;
}> = ({ label, value, icon, tone = 'blue', caption, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(event) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    }}
    sx={{
      ...(panelSx as object),
      ...(onClick ? (hoverLiftSx as object) : {}),
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      p: { xs: 2, md: 2.5 },
      cursor: onClick ? 'pointer' : 'default',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 'auto 0 0 0',
        height: 3,
        background: `linear-gradient(90deg, ${TONE[tone]} 0%, ${alpha(TONE[tone], 0)} 100%)`,
      },
    }}
  >
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'text.secondary' }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontWeight: 900,
            lineHeight: 1.15,
            mt: 0.5,
            fontSize: { xs: '1.6rem', md: '2rem' },
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {caption}
          </Typography>
        )}
      </Box>
      {icon && <IconPlate tone={tone} size={44}>{icon}</IconPlate>}
    </Stack>
  </Paper>
);

/** A quiet, tinted chip — used for meta facts rather than status. */
export const SoftChip: React.FC<{
  label: React.ReactNode;
  icon?: React.ReactElement;
  tone?: ToneKey | string;
  /** Sits on the gradient hero instead of a paper surface. */
  onHero?: boolean;
  sx?: SxProps<Theme>;
}> = ({ label, icon, tone = 'slate', onHero = false, sx }) => {
  const color = (TONE as Record<string, string>)[tone as string] ?? (tone as string);

  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={{
        fontWeight: 700,
        borderRadius: 999,
        height: 26,
        ...(onHero
          ? {
              color: '#ffffff',
              bgcolor: alpha('#ffffff', 0.16),
              border: '1px solid',
              borderColor: alpha('#ffffff', 0.24),
              '& .MuiChip-icon': { color: alpha('#ffffff', 0.9) },
            }
          : {
              color,
              bgcolor: alpha(color, 0.12),
              border: '1px solid',
              borderColor: alpha(color, 0.22),
              '& .MuiChip-icon': { color },
            }),
        ...(sx as object),
      }}
    />
  );
};

/** A status pill with its own dot, for pipeline stages and job states. */
export const StatusPill: React.FC<{ label: string; color: string; sx?: SxProps<Theme> }> = ({
  label,
  color,
  sx,
}) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      px: 1.25,
      py: 0.375,
      borderRadius: 999,
      bgcolor: alpha(color, 0.12),
      border: '1px solid',
      borderColor: alpha(color, 0.24),
      ...(sx as object),
    }}
  >
    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
    <Typography variant="caption" sx={{ fontWeight: 800, color, whiteSpace: 'nowrap' }}>
      {label}
    </Typography>
  </Box>
);

/**
 * The gradient band at the top of a job page. Holds a back link, the title,
 * meta chips and whatever controls belong with the record.
 */
export const PageHero: React.FC<{
  back?: React.ReactNode;
  eyebrow?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ back, eyebrow, title, meta, actions, children }) => (
  <Box
    sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 4,
      p: { xs: 2.25, sm: 3, md: 3.5 },
      mb: { xs: 2.5, md: 3 },
      color: '#ffffff',
      background: heroGradient,
      boxShadow: '0 20px 48px -28px rgba(12, 82, 131, 0.75)',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -120,
        right: -80,
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha('#ffffff', 0.16)} 0%, ${alpha('#ffffff', 0)} 70%)`,
        pointerEvents: 'none',
      },
    }}
  >
    <Box sx={{ position: 'relative' }}>
      {back}
      {eyebrow && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: alpha('#ffffff', 0.72),
            mb: 0.5,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 280px' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.02em',
              wordBreak: 'break-word',
              fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.1rem' },
            }}
          >
            {title}
          </Typography>
          {meta && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center', mt: 1.5 }}
            >
              {meta}
            </Stack>
          )}
        </Box>
        {actions && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', rowGap: 1 }}
          >
            {actions}
          </Stack>
        )}
      </Box>
      {children && <Box sx={{ mt: { xs: 2.25, md: 2.75 } }}>{children}</Box>}
    </Box>
  </Box>
);
