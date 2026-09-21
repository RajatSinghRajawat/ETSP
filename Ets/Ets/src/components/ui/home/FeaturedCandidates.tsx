import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Skeleton,
} from '@mui/material';
import {
  Verified,
  Lock,
  TrendingUp,
  PeopleOutlineRounded,
  LocationOnOutlined,
  WorkspacePremiumRounded,
  ArrowForward,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useGetFeaturedCandidatesQuery,
  type FeaturedCandidate,
} from '../../../store/api/candidateProfileApi';
import { useAuth } from '../../../hooks/useAuth';
import SectionHeader from './SectionHeader';
import { sectionActionSx } from './sectionStyles';

/** One profile's slot in the centred row. */
const cardSlotSx = { flex: '1 1 250px', maxWidth: { xs: '100%', sm: 300 }, minWidth: 0, display: 'flex' } as const;

const FeaturedCandidates: React.FC = () => {
  const { t } = useTranslation();
  const { isLoggedIn, isEmployer, isCandidate } = useAuth();
  const { data, isLoading } = useGetFeaturedCandidatesQuery({ limit: 4 });
  const candidates: FeaturedCandidate[] = data?.data?.items ?? [];
  const skeletonCount = 4;

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      {/* Background ambient lighting */}
      <Box
        sx={{
          position: 'absolute',
          top: -80,
          right: '5%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10, 182, 162, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: '5%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12, 82, 131, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <SectionHeader
          eyebrowIcon={<TrendingUp />}
          eyebrow={isEmployer ? t('top_talent_overline_employer') : t('top_talent_overline')}
          title={isEmployer ? t('featured_candidates_title_employer') : t('featured_candidates_title')}
          subtitle={isEmployer ? t('featured_candidates_desc_employer') : t('featured_candidates_desc')}
          action={
            <Button
              component={Link}
              to={isEmployer ? '/employer/employees' : '/signup/employer'}
              variant="outlined"
              endIcon={<ArrowForward />}
              sx={sectionActionSx}
            >
              {isEmployer ? t('member_action_browse_candidates') : t('hire_talent')}
            </Button>
          }
        />

        {/* Candidates Grid */}
        <Box
          sx={{
            // Centred slots: a short list of featured profiles still reads as a
            // finished row instead of leaving half the section empty.
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {isLoading &&
            Array.from({ length: skeletonCount }).map((_, idx) => (
              <Card
                key={`cand-sk-${idx}`}
                elevation={0}
                sx={{
                  ...cardSlotSx,
                  flexDirection: 'column',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  p: 3,
                  bgcolor: '#ffffff',
                  textAlign: 'center',
                }}
              >
                <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="text" height={24} width="70%" sx={{ mx: 'auto', mb: 0.5 }} />
                <Skeleton variant="text" height={18} width="50%" sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="rounded" height={28} sx={{ mb: 2, borderRadius: '8px' }} />
                <Skeleton variant="rounded" height={40} sx={{ borderRadius: '10px' }} />
              </Card>
            ))}

          {!isLoading && candidates.length === 0 && (
            <Box
              sx={{
                flex: '1 1 100%',
                py: 8,
                textAlign: 'center',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '18px',
                bgcolor: '#ffffff',
                p: 4,
              }}
            >
              <PeopleOutlineRounded sx={{ fontSize: 52, color: '#94a3b8', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {t('no_featured_candidates')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('no_featured_candidates_hint')}
              </Typography>
            </Box>
          )}

          {!isLoading &&
            candidates.map((candidate) => {
              const displayName = `${t('dr_prefix')} ${candidate.firstName} ${candidate.lastNameInitial}`.trim();
              const role = candidate.currentJobTitle || candidate.degree || t('veterinary_professional');
              const initials = `${candidate.firstName?.[0] ?? ''}${candidate.lastNameInitial?.[0] ?? ''}`.toUpperCase();

              return (
                <Card
                  key={candidate._id}
                  elevation={0}
                  sx={{
                    ...cardSlotSx,
                    borderRadius: '18px',
                    border: '1px solid',
                    borderColor: 'rgba(226, 232, 240, 0.9)',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 10px 24px -10px rgba(12, 82, 131, 0.06)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 20px 36px -12px rgba(10, 182, 162, 0.18), 0 8px 16px -6px rgba(15, 23, 42, 0.04)',
                      borderColor: 'rgba(10, 182, 162, 0.45)',
                      '& .cand-avatar-img': {
                        transform: 'scale(1.04)',
                      },
                    },
                  }}
                >
                  {/* Decorative top accent rail */}
                  <Box
                    sx={{
                      height: 3.5,
                      background: candidate.excelMember
                        ? 'linear-gradient(90deg, #f59e0b 0%, #0ab6a2 100%)'
                        : 'linear-gradient(90deg, #0c5283 0%, #0ab6a2 100%)',
                    }}
                  />

                  <CardContent
                    sx={{
                      p: 2.75,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      flex: 1,
                    }}
                  >
                    {/* Top status bar: Live availability pill & trust badge */}
                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.6,
                          px: 1,
                          py: 0.25,
                          borderRadius: '20px',
                          bgcolor: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          color: '#059669',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#10b981',
                            boxShadow: '0 0 6px #10b981',
                          }}
                        />
                        <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                          Available
                        </Typography>
                      </Box>

                      {candidate.excelMember ? (
                        <Chip
                          icon={<WorkspacePremiumRounded sx={{ fontSize: '13px !important', color: '#b45309 !important' }} />}
                          label="EXCEL"
                          size="small"
                          sx={{
                            bgcolor: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 800,
                            fontSize: '0.64rem',
                            height: 22,
                            borderRadius: '6px',
                            border: '1px solid #fde68a',
                          }}
                        />
                      ) : candidate.verifiedBadge ? (
                        <Chip
                          icon={<Verified sx={{ fontSize: '13px !important', color: '#047857 !important' }} />}
                          label="VERIFIED"
                          size="small"
                          sx={{
                            bgcolor: '#ecfdf5',
                            color: '#047857',
                            fontWeight: 700,
                            fontSize: '0.64rem',
                            height: 22,
                            borderRadius: '6px',
                            border: '1px solid #a7f3d0',
                          }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: '#94a3b8' }}>
                          <Lock sx={{ fontSize: 13 }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            Protected
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Avatar with gradient border & verified shield */}
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <Box
                        sx={{
                          p: '3px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                          boxShadow: '0 6px 16px rgba(12, 82, 131, 0.18)',
                        }}
                      >
                        <Avatar
                          src={candidate.photoUrl || undefined}
                          className="cand-avatar-img"
                          sx={{
                            width: 76,
                            height: 76,
                            border: '2.5px solid #ffffff',
                            bgcolor: '#f0f9ff',
                            color: '#0c5283',
                            fontWeight: 800,
                            fontSize: '1.4rem',
                            transition: 'transform 240ms ease',
                          }}
                        >
                          {initials || 'DR'}
                        </Avatar>
                      </Box>

                      {candidate.aadhaarVerified && (
                        <Box
                          title="Aadhaar Verified Doctor"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: '#10b981',
                            color: '#ffffff',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.45)',
                          }}
                        >
                          <Verified sx={{ fontSize: 14 }} />
                        </Box>
                      )}
                    </Box>

                    {/* Candidate Name */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: '#0f172a',
                        letterSpacing: '-0.015em',
                        mb: 0.75,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayName}
                    </Typography>

                    {/* Role / Specialty Highlight */}
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1.25,
                        py: 0.35,
                        borderRadius: '8px',
                        bgcolor: 'rgba(10, 182, 162, 0.08)',
                        color: '#088072',
                        border: '1px solid rgba(10, 182, 162, 0.18)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        mb: 1.25,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {role}
                    </Box>

                    {/* Location */}
                    {candidate.currentLocation ? (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: '#64748b',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          mb: 2,
                        }}
                      >
                        <LocationOnOutlined sx={{ fontSize: 14, color: '#94a3b8' }} />
                        <span>{candidate.currentLocation}</span>
                      </Box>
                    ) : (
                      <Box sx={{ height: 21, mb: 2 }} />
                    )}

                    {/* Skills Chips */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.6,
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        mb: 3,
                        mt: 'auto',
                        minHeight: 26,
                      }}
                    >
                      {candidate.skills.slice(0, 3).map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            height: 23,
                            bgcolor: 'rgba(248, 250, 252, 0.9)',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '7px',
                          }}
                        />
                      ))}
                    </Box>

                    {/* Action Button */}
                    {(isEmployer || !isLoggedIn) && (
                      <Button
                        component={Link}
                        to={isEmployer ? `/employer/employees/${candidate._id}` : '/signup/employer'}
                        variant="contained"
                        fullWidth
                        sx={{
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          py: 0.9,
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                          boxShadow: '0 4px 14px rgba(12, 82, 131, 0.2)',
                          transition: 'all 200ms ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)',
                            boxShadow: '0 6px 20px rgba(10, 182, 162, 0.3)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        {isEmployer ? t('member_view_candidate_profile') : t('hire_this_candidate')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </Box>

        {/* Bottom invitation card */}
        <Box
          sx={{
            mt: 6,
            p: { xs: 3, md: 4 },
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3,
            boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
              {isEmployer
                ? t('member_browse_candidates_hint')
                : isCandidate
                  ? t('member_want_to_be_featured_candidate')
                  : t('want_to_be_featured')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('featured_candidates_cta_sub', {
                defaultValue: 'Get showcased to 500+ verified veterinary hospitals looking for your skillset.',
              })}
            </Typography>
          </Box>

          <Button
            component={Link}
            to={isEmployer ? '/employer/employees' : isCandidate ? '/candidate/profile' : '/signup'}
            variant="outlined"
            endIcon={<ArrowForward />}
            sx={{
              whiteSpace: 'nowrap',
              borderRadius: '10px',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderColor: '#0c5283',
              color: '#0c5283',
              '&:hover': {
                bgcolor: 'rgba(12, 82, 131, 0.04)',
                borderColor: '#0c5283',
              },
            }}
          >
            {isEmployer
              ? t('member_action_browse_candidates')
              : isCandidate
                ? t('member_link_my_profile')
                : t('create_profile')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedCandidates;