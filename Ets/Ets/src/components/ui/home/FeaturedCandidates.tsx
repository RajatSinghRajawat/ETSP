import { Box, Container, Typography, Card, CardContent, Avatar, Chip, Button, Skeleton } from '@mui/material';
import { Verified, Lock, TrendingUp, PeopleOutlined, LocationOn } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useGetFeaturedCandidatesQuery, type FeaturedCandidate } from '../../../store/api/candidateProfileApi';

const FeaturedCandidates: React.FC = () => {
  const { data, isLoading } = useGetFeaturedCandidatesQuery({ limit: 4 });
  const candidates: FeaturedCandidate[] = data?.data?.items ?? [];
  const skeletonCount = 4;

  return (
    <Box sx={{ py: 10, bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: 'linear-gradient(180deg, rgba(10, 182, 162, 0.05) 0%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUp sx={{ color: 'secondary.main', fontSize: 24 }} />
            <Typography
              variant="overline"
              sx={{
                color: 'secondary.main',
                fontWeight: 600,
                letterSpacing: 2,
                fontSize: '0.85rem'
              }}
            >
              TOP TALENT
            </Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: 'primary.main',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Featured Candidates
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Stand out from the crowd with our verified and highly-rated veterinary professionals
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3
          }}
        >
          {isLoading &&
            Array.from({ length: skeletonCount }).map((_, idx) => (
              <Card key={`sk-${idx}`} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ height: 8, background: 'linear-gradient(90deg, #0c5283, #0ab6a2)', opacity: 0.4 }} />
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Skeleton variant="circular" width={90} height={90} sx={{ mx: 'auto', mb: 2 }} />
                  <Skeleton variant="text" height={24} sx={{ mx: 'auto', width: '70%' }} />
                  <Skeleton variant="text" height={18} sx={{ mx: 'auto', width: '50%' }} />
                  <Skeleton variant="text" height={18} sx={{ mx: 'auto', width: '40%', mb: 2 }} />
                  <Skeleton variant="rounded" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={36} />
                </CardContent>
              </Card>
            ))}

          {!isLoading && candidates.length === 0 && (
            <Box
              sx={{
                gridColumn: '1 / -1',
                py: 6,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                color: 'text.secondary'
              }}
            >
              <PeopleOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                No featured candidates yet
              </Typography>
              <Typography variant="body2">
                Be among the first to showcase your veterinary expertise.
              </Typography>
            </Box>
          )}

          {!isLoading && candidates.map((candidate) => {
            const displayName = `Dr. ${candidate.firstName} ${candidate.lastNameInitial}`.trim();
            const role = candidate.currentJobTitle || candidate.degree || 'Veterinary Professional';
            const initials = `${candidate.firstName?.[0] ?? ''}${candidate.lastNameInitial?.[0] ?? ''}`.toUpperCase();

            return (
              <Card
                key={candidate._id}
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, #ffffff 0%, #fbfdfe 100%)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(10, 182, 162, 0.12)',
                    borderColor: 'secondary.main'
                  }
                }}
              >
                <Box sx={{ height: 8, background: 'linear-gradient(90deg, #0c5283, #0ab6a2)', opacity: 0.85 }} />

                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <Avatar
                      src={candidate.photoUrl || undefined}
                      sx={{
                        width: 90,
                        height: 90,
                        mx: 'auto',
                        border: '3px solid',
                        borderColor: 'primary.100',
                        bgcolor: 'primary.50',
                        color: 'primary.main',
                        fontWeight: 800,
                        fontSize: '1.6rem'
                      }}
                    >
                      {initials || '?'}
                    </Avatar>
                    {candidate.aadhaarVerified && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'success.main',
                          borderRadius: '50%',
                          p: 0.3,
                          border: '2px solid',
                          borderColor: 'background.default'
                        }}
                      >
                        <Verified sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                    )}
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }} noWrap>
                    {displayName}
                  </Typography>

                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                    {role}
                  </Typography>

                  {candidate.currentLocation && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2, color: 'text.secondary' }}>
                      <LocationOn sx={{ fontSize: 14 }} />
                      <Typography variant="caption">{candidate.currentLocation}</Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mb: 1.5, minHeight: 28 }}>
                    {candidate.skills.slice(0, 3).map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mb: 2, minHeight: 24 }}>
                    {candidate.excelMember && (
                      <Chip label="EXCEL" size="small" color="warning" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 700 }} />
                    )}
                    {candidate.verifiedBadge && (
                      <Chip label="Verified" size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 700 }} />
                    )}
                    {!candidate.excelMember && !candidate.verifiedBadge && (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <Lock sx={{ fontSize: 13 }} />
                        <Typography variant="caption">Contact visible to entitled employers</Typography>
                      </Box>
                    )}
                  </Box>

                  <Button
                    component={Link}
                    to="/signup/employer"
                    variant="contained"
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      py: 1,
                      background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0ab6a2 0%, #0c5283 100%)'
                      }
                    }}
                  >
                    Hire this candidate
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Want to be featured? Create your professional profile today!
          </Typography>
          <Button
            component={Link}
            to="/signup"
            variant="outlined"
            sx={{
              borderWidth: 2,
              fontWeight: 700,
              '&:hover': { borderWidth: 2 }
            }}
          >
            Create Profile
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedCandidates;