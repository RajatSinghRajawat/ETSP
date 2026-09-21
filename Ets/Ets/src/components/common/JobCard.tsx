import React from 'react';
import { Avatar, Box, Button, Card, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import {
  AccessTimeOutlined,
  ArrowForwardRounded,
  BookmarkAddedOutlined,
  BookmarkBorderRounded,
  BusinessCenterOutlined,
  CheckCircleRounded,
  CurrencyRupeeOutlined,
  LocationOnOutlined,
  WorkspacePremiumRounded,
  BoltRounded,
  VerifiedRounded,
} from '@mui/icons-material';

export interface JobCardProps {
  title: string;
  clinic: string;
  location: string;
  salary: string;
  type: string;
  skills?: string[];
  onApply?: () => void;
  onClick?: () => void;
  featured?: boolean;
  urgent?: boolean;
  /** Company logo shown in the card's avatar; falls back to the initial. */
  logoUrl?: string;
  /** Pre-formatted relative date, e.g. "2 days ago". */
  postedAt?: string;
  /** Experience band, e.g. "2-5 years". */
  experience?: string;
  /** Renders the apply slot as a confirmed state instead of a button. */
  applied?: boolean;
  /** Shows the bookmark toggle in the top-right corner. */
  onSave?: () => void;
  saved?: boolean;
}

/** Maximum skill chips to render inline before collapsing to +N. */
const VISIBLE_SKILLS = 3;

/**
 * Format raw salary strings nicely if they contain repeating text,
 * extracting a clean number and clean interval.
 */
function cleanSalaryDisplay(raw: string): { amount: string; interval: string } {
  if (!raw) return { amount: 'Salary not disclosed', interval: 'Disclosed on interview' };

  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('per annum') || lower.includes('/ annum') || lower.includes('/ year')) {
    const amount = trimmed.replace(/per annum|\/ annum|\/ year/gi, '').trim();
    return { amount, interval: 'Per annum' };
  }
  if (lower.includes('per month') || lower.includes('/ month')) {
    const amount = trimmed.replace(/per month|\/ month/gi, '').trim();
    return { amount, interval: 'Per month' };
  }
  return { amount: trimmed, interval: 'Competitive' };
}

/**
 * Executive modern Job Card component.
 *
 * Implements high-conversion aesthetics:
 * - 18px radius with layered shadows and smooth lift
 * - Vibrant gradient squircle company avatar
 * - Top accent shimmer rail for featured/urgent listings
 * - Glanceable metadata tags (Full-time, Location, Experience)
 * - Dedicated compensation spotlight container
 * - Modern skill pill tags with tooltip overflow
 * - Interactive conversion footer with hover animations
 */
export const JobCard: React.FC<JobCardProps> = ({
  title,
  clinic,
  location,
  salary,
  type,
  skills = [],
  onApply,
  onClick,
  featured = false,
  urgent = false,
  logoUrl,
  postedAt,
  experience,
  applied = false,
  onSave,
  saved = false,
}) => {
  const clickable = Boolean(onClick);
  const visibleSkills = skills.slice(0, VISIBLE_SKILLS);
  const overflowCount = skills.length - visibleSkills.length;
  const { amount: salaryAmount, interval: salaryInterval } = cleanSalaryDisplay(salary);

  return (
    <Card
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${title} at ${clinic}` : undefined}
      onKeyDown={(event) => {
        if (clickable && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: (theme: Theme) =>
          featured
            ? alpha(theme.palette.secondary.main, 0.45)
            : urgent
            ? alpha(theme.palette.error.main, 0.35)
            : theme.palette.mode === 'light'
            ? alpha(theme.palette.divider, 0.8)
            : alpha(theme.palette.divider, 0.25),
        bgcolor: (theme: Theme) =>
          theme.palette.mode === 'light' ? '#ffffff' : alpha(theme.palette.background.paper, 0.95),
        boxShadow: (theme: Theme) =>
          theme.palette.mode === 'light'
            ? '0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 10px 24px -10px rgba(12, 82, 131, 0.08)'
            : '0 2px 6px -1px rgba(0, 0, 0, 0.4), 0 10px 24px -10px rgba(0, 0, 0, 0.6)',
        cursor: clickable ? 'pointer' : 'default',
        transition: (theme: Theme) =>
          theme.transitions.create(['transform', 'box-shadow', 'border-color'], {
            duration: 240,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }),
        ...(clickable && {
          '&:hover': {
            transform: 'translateY(-5px)',
            borderColor: (theme: Theme) =>
              featured
                ? theme.palette.secondary.main
                : alpha(theme.palette.primary.main, 0.5),
            boxShadow: (theme: Theme) =>
              theme.palette.mode === 'light'
                ? '0 20px 36px -12px rgba(12, 82, 131, 0.16), 0 8px 16px -6px rgba(15, 23, 42, 0.06)'
                : '0 20px 36px -12px rgba(0, 0, 0, 0.7), 0 8px 16px -6px rgba(0, 0, 0, 0.5)',
            '& .job-card-title': {
              color: 'primary.main',
            },
            '& .job-card-avatar': {
              transform: 'scale(1.05)',
            },
            '& .job-card-cta-btn': {
              bgcolor: 'primary.main',
              color: '#ffffff',
              borderColor: 'primary.main',
              '& .job-card-arrow': {
                transform: 'translateX(3px)',
              },
            },
            '& .job-card-bookmark': {
              opacity: 1,
            },
          },
        }),
      }}
    >
      {/* Delicate top gradient rail for featured or urgent listings */}
      {(featured || urgent) && (
        <Box
          sx={{
            height: 3.5,
            width: '100%',
            background: urgent
              ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)'
              : 'linear-gradient(90deg, #0c5283 0%, #0ab6a2 100%)',
          }}
        />
      )}

      {/* Main card body */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2.25, sm: 2.5 },
        }}
      >
        {/* Header: Company Avatar, Title, Clinic, Bookmark */}
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
          <Avatar
            src={logoUrl || undefined}
            variant="rounded"
            className="job-card-avatar"
            sx={{
              width: 50,
              height: 50,
              flexShrink: 0,
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '1.2rem',
              letterSpacing: '0.02em',
              background: logoUrl
                ? 'transparent'
                : 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(12, 82, 131, 0.16)',
              border: '1.5px solid',
              borderColor: (theme: Theme) =>
                theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.1)',
              transition: 'transform 240ms ease',
            }}
          >
            {clinic.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              title={title}
              className="job-card-title"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.025rem', sm: '1.075rem' },
                lineHeight: 1.35,
                letterSpacing: '-0.015em',
                color: 'text.primary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '2.7em',
                transition: 'color 180ms ease',
              }}
            >
              {title}
            </Typography>

            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.35, minWidth: 0 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '-0.005em',
                }}
              >
                {clinic}
              </Typography>
              <VerifiedRounded sx={{ fontSize: 15, color: 'secondary.main', flexShrink: 0 }} />
            </Stack>
          </Box>

          {onSave && (
            <Tooltip title={saved ? 'Remove from saved' : 'Save job'} arrow>
              <IconButton
                size="small"
                aria-label={saved ? `Remove ${title} from saved jobs` : `Save ${title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSave();
                }}
                className="job-card-bookmark"
                sx={{
                  mt: -0.25,
                  mr: -0.5,
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: (theme: Theme) =>
                    saved
                      ? alpha(theme.palette.secondary.main, 0.14)
                      : alpha(theme.palette.text.primary, 0.04),
                  color: saved ? 'secondary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: (theme: Theme) =>
                    saved
                      ? alpha(theme.palette.secondary.main, 0.3)
                      : alpha(theme.palette.divider, 0.6),
                  transition: 'all 200ms ease',
                  '&:hover': {
                    bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.2),
                    color: 'secondary.main',
                    borderColor: 'secondary.main',
                    transform: 'scale(1.08)',
                  },
                }}
              >
                {saved ? (
                  <BookmarkAddedOutlined sx={{ fontSize: 19 }} />
                ) : (
                  <BookmarkBorderRounded sx={{ fontSize: 19 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Badges: Featured & Urgent pills */}
        {(featured || urgent) && (
          <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 0.75 }}>
            {featured && (
              <Chip
                size="small"
                icon={<WorkspacePremiumRounded />}
                label="Featured"
                sx={{
                  height: 24,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.02em',
                  color: 'primary.main',
                  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.1),
                  border: '1px solid',
                  borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.22),
                  '& .MuiChip-icon': { color: 'primary.main', fontSize: 14 },
                }}
              />
            )}
            {urgent && (
              <Chip
                size="small"
                icon={<BoltRounded />}
                label="Urgent Hiring"
                sx={{
                  height: 24,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.02em',
                  color: '#dc2626',
                  bgcolor: (theme: Theme) => alpha(theme.palette.error.main, 0.1),
                  border: '1px solid',
                  borderColor: (theme: Theme) => alpha(theme.palette.error.main, 0.22),
                  '& .MuiChip-icon': { color: '#dc2626', fontSize: 14 },
                }}
              />
            )}
          </Stack>
        )}

        {/* Glanceable Meta Badges Strip (Type, Location, Experience) */}
        <Stack
          direction="row"
          spacing={0.875}
          sx={{
            mt: 1.75,
            flexWrap: 'wrap',
            rowGap: 0.875,
            alignItems: 'center',
          }}
        >
          {/* Employment Type Tag */}
          {type && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.1,
                py: 0.35,
                borderRadius: '8px',
                fontSize: '0.725rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                color: '#077a6d',
                bgcolor: (theme: Theme) =>
                  theme.palette.mode === 'light'
                    ? alpha(theme.palette.secondary.main, 0.11)
                    : alpha(theme.palette.secondary.main, 0.22),
                border: '1px solid',
                borderColor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.24),
              }}
            >
              {type}
            </Box>
          )}

          {/* Location Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.4,
              px: 1,
              py: 0.35,
              borderRadius: '8px',
              fontSize: '0.725rem',
              fontWeight: 600,
              color: 'text.secondary',
              bgcolor: (theme: Theme) =>
                theme.palette.mode === 'light'
                  ? alpha(theme.palette.text.primary, 0.035)
                  : alpha(theme.palette.text.primary, 0.08),
              border: '1px solid',
              borderColor: 'divider',
              maxWidth: 160,
            }}
          >
            <LocationOnOutlined sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
            <Typography
              component="span"
              noWrap
              sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}
            >
              {location || 'Remote / Pan-India'}
            </Typography>
          </Box>

          {/* Experience Badge */}
          {experience && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 1,
                py: 0.35,
                borderRadius: '8px',
                fontSize: '0.725rem',
                fontWeight: 600,
                color: 'text.secondary',
                bgcolor: (theme: Theme) =>
                  theme.palette.mode === 'light'
                    ? alpha(theme.palette.text.primary, 0.035)
                    : alpha(theme.palette.text.primary, 0.08),
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <BusinessCenterOutlined sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
              <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
                {experience}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Dedicated Compensation Spotlight Container */}
        <Box
          sx={{
            mt: 1.75,
            p: 1.25,
            px: 1.5,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: (theme: Theme) =>
              theme.palette.mode === 'light'
                ? 'rgba(10, 182, 162, 0.05)'
                : alpha(theme.palette.secondary.main, 0.08),
            border: '1px solid',
            borderColor: (theme: Theme) =>
              theme.palette.mode === 'light'
                ? 'rgba(10, 182, 162, 0.16)'
                : alpha(theme.palette.secondary.main, 0.22),
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.15),
                color: 'secondary.main',
              }}
            >
              <CurrencyRupeeOutlined sx={{ fontSize: 16 }} />
            </Box>
            <Typography
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: '0.875rem',
                letterSpacing: '-0.01em',
                color: 'text.primary',
              }}
            >
              {salaryAmount}
            </Typography>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.675rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'secondary.main',
              bgcolor: (theme: Theme) => alpha(theme.palette.secondary.main, 0.1),
              px: 0.85,
              py: 0.25,
              borderRadius: '6px',
              flexShrink: 0,
              ml: 1,
            }}
          >
            {salaryInterval}
          </Typography>
        </Box>

        {/* Skills Chips Row */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            flexWrap: 'nowrap',
            overflow: 'hidden',
            mt: 1.75,
            minHeight: 26,
            alignItems: 'center',
          }}
        >
          {visibleSkills.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              size="small"
              variant="outlined"
              sx={{
                height: 24,
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '8px',
                borderColor: 'divider',
                color: 'text.secondary',
                bgcolor: (theme: Theme) =>
                  theme.palette.mode === 'light'
                    ? 'rgba(248, 250, 252, 0.9)'
                    : alpha(theme.palette.common.white, 0.04),
                maxWidth: 130,
              }}
            />
          ))}
          {overflowCount > 0 && (
            <Tooltip title={skills.slice(VISIBLE_SKILLS).join(', ')} arrow>
              <Chip
                label={`+${overflowCount}`}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  flexShrink: 0,
                  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.18),
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Footer — Pinned to bottom with time status and conversion CTA */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2.25, sm: 2.5 },
          py: 1.5,
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme: Theme) =>
            theme.palette.mode === 'light'
              ? 'rgba(248, 250, 252, 0.75)'
              : alpha(theme.palette.common.white, 0.02),
        }}
      >
        {/* Left: Posted Time */}
        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <AccessTimeOutlined sx={{ fontSize: 15, color: 'text.disabled' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
            {postedAt || 'Recently'}
          </Typography>
        </Stack>

        {/* Right: Applied Confirmation | Apply Button | View CTA */}
        {applied ? (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.4,
              py: 0.5,
              borderRadius: '999px',
              bgcolor: (theme: Theme) => alpha(theme.palette.success.main, 0.12),
              border: '1px solid',
              borderColor: (theme: Theme) => alpha(theme.palette.success.main, 0.28),
              color: 'success.main',
            }}
          >
            <CheckCircleRounded sx={{ fontSize: 16 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Applied</Typography>
          </Box>
        ) : onApply ? (
          <Button
            variant="contained"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onApply();
            }}
            endIcon={<ArrowForwardRounded className="job-card-arrow" sx={{ fontSize: 15, transition: 'transform 200ms ease' }} />}
            sx={{
              borderRadius: '9px',
              px: 1.75,
              py: 0.5,
              minHeight: 32,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              bgcolor: 'primary.main',
              boxShadow: (theme: Theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: 'all 200ms ease',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-1px)',
                '& .job-card-arrow': { transform: 'translateX(3px)' },
              },
            }}
          >
            Apply Now
          </Button>
        ) : clickable ? (
          <Box
            className="job-card-cta-btn"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.5,
              py: 0.5,
              borderRadius: '9px',
              bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08),
              border: '1px solid',
              borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.18),
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '-0.01em',
              transition: 'all 200ms ease',
            }}
          >
            <span>View Details</span>
            <ArrowForwardRounded
              className="job-card-arrow"
              sx={{ fontSize: 15, transition: 'transform 200ms ease' }}
            />
          </Box>
        ) : null}
      </Stack>
    </Card>
  );
};

export default JobCard;
