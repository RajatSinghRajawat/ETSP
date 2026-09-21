import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * The heading block every home-page section shares: a tinted eyebrow pill, the
 * section title, a supporting line and an optional action on the right.
 *
 * Before this existed each section re-declared the same three elements with
 * slightly different sizes, colours and margins, which is what made the page
 * read as a stack of unrelated blocks rather than one product. Everything here
 * is presentation only.
 */

type Tone = 'blue' | 'teal' | 'light';

const TONE_STYLES: Record<Tone, { color: string; bgcolor: string; borderColor: string }> = {
  blue: { color: '#0c5283', bgcolor: 'rgba(12, 82, 131, 0.08)', borderColor: 'rgba(12, 82, 131, 0.16)' },
  teal: { color: '#0ab6a2', bgcolor: 'rgba(10, 182, 162, 0.1)', borderColor: 'rgba(10, 182, 162, 0.2)' },
  light: { color: '#e2e8f0', bgcolor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.16)' },
};

export interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  tone?: Tone;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Shown beside the title on md+; sections render their own mobile version. */
  action?: React.ReactNode;
  align?: 'left' | 'center';
  /** `light` flips the title and subtitle for use on the dark bands. */
  variant?: 'dark' | 'light';
  sx?: SxProps<Theme>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  eyebrowIcon,
  tone = 'blue',
  title,
  subtitle,
  action,
  align = 'left',
  variant = 'dark',
  sx,
}) => {
  const centered = align === 'center';
  const toneStyle = TONE_STYLES[tone];
  const onLight = variant === 'light';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: centered ? 'column' : 'row' },
        alignItems: centered ? 'center' : { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 2.5, md: 3 },
        mb: { xs: 4.5, md: 6.5 },
        ...(sx as object),
      }}
    >
      <Box sx={{ textAlign: centered ? 'center' : 'left', maxWidth: centered ? 720 : 620 }}>
        {eyebrow && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.875,
              px: 1.75,
              py: 0.5,
              mb: 1.75,
              borderRadius: 999,
              border: '1px solid',
              ...toneStyle,
              '& svg': { fontSize: 17 },
            }}
          >
            {eyebrowIcon}
            <Typography
              component="span"
              sx={{
                fontWeight: 800,
                letterSpacing: 1.4,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                lineHeight: 1.6,
              }}
            >
              {eyebrow}
            </Typography>
          </Box>
        )}

        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            color: onLight ? '#ffffff' : '#0f172a',
            fontSize: { xs: '1.85rem', sm: '2.15rem', md: '2.5rem' },
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: 1.25,
              color: onLight ? 'rgba(226, 232, 240, 0.78)' : '#64748b',
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
};

export default SectionHeader;
