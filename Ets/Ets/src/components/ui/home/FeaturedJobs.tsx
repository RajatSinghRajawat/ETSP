import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Skeleton,
} from '@mui/material';
import {
  ArrowForward,
  WorkOutlineRounded,
  LocalHospitalOutlined,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useGetJobsQuery, type JobResponse } from '../../../store/api/jobApi';
import { useGetMySavedJobsQuery, useSaveJobMutation, useUnsaveJobMutation } from '../../../store/api/savedJobApi';
import { useAuth } from '../../../hooks/useAuth';
import { JobCard } from '../../common/JobCard';
import SectionHeader from './SectionHeader';
import { sectionActionSx } from './sectionStyles';
import notify from '../../../utils/toast';

function timeAgo(iso: string, t: TFunction): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('time_just_now');
  if (minutes < 60) return t('time_minutes_ago', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time_hours_ago', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('time_days_ago', { count: days });
  const months = Math.floor(days / 30);
  return t('time_months_ago', { count: months });
}

const FeaturedJobsSkeleton: React.FC = () => (
  <Paper
    elevation={0}
    sx={{
      height: '100%',
      borderRadius: '18px',
      border: '1px solid #e2e8f0',
      p: 2.5,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#ffffff',
    }}
  >
    <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
      <Skeleton variant="rounded" width={50} height={50} sx={{ borderRadius: '14px', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="80%" height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="text" width="45%" height={18} sx={{ borderRadius: 1, mt: 0.5 }} />
      </Box>
      <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px' }} />
    </Stack>
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: '8px' }} />
      <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '8px' }} />
    </Stack>
    <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: '12px', mt: 2 }} />
    <Stack direction="row" spacing={0.75} sx={{ mt: 2 }}>
      <Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: '8px' }} />
      <Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: '8px' }} />
    </Stack>
    <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton variant="text" width={70} height={16} />
      <Skeleton variant="rounded" width={90} height={32} sx={{ borderRadius: '9px' }} />
    </Box>
  </Paper>
);

/** One card's slot in the centred row: grows to fill, never gets unwieldy. */
const cardSlotSx = { flex: '1 1 260px', maxWidth: { xs: '100%', sm: 320 }, minWidth: 0 } as const;

const FeaturedJobs: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isCandidate } = useAuth();
  const { data, isLoading } = useGetJobsQuery({ limit: 4 });
  const jobs: JobResponse[] = data?.data?.items ?? [];
  const skeletonCount = 4;

  const { data: savedJobsData } = useGetMySavedJobsQuery(undefined, { skip: !isCandidate });
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();

  const savedJobIds = useMemo(
    () => new Set((savedJobsData?.data?.items ?? []).map((entry) => entry.job._id)),
    [savedJobsData],
  );

  const toggleSave = async (jobId: string) => {
    if (!isCandidate) {
      notify.info('Sign in with a candidate account to save jobs.');
      return;
    }

    const wasSaved = savedJobIds.has(jobId);
    try {
      if (wasSaved) {
        await unsaveJob(jobId).unwrap();
        notify.success('Removed from saved jobs.');
      } else {
        await saveJob(jobId).unwrap();
        notify.success('Job saved. Find it under Saved Jobs.');
      }
    } catch (error) {
      notify.apiError(error, wasSaved ? 'Could not remove this job.' : 'Could not save this job.');
    }
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <SectionHeader
          tone="teal"
          eyebrowIcon={<LocalHospitalOutlined />}
          eyebrow={isCandidate ? t('featured_overline_candidate') : t('featured_overline')}
          title={isCandidate ? t('latest_jobs_title_candidate') : t('latest_jobs_title')}
          subtitle={isCandidate ? t('latest_jobs_subtitle_candidate') : t('latest_jobs_subtitle')}
          action={
            <Button
              component={Link}
              to="/jobs"
              variant="outlined"
              endIcon={<ArrowForward />}
              sx={sectionActionSx}
            >
              {t('view_all')}
            </Button>
          }
        />

        {/* Jobs Grid */}
        <Box
          sx={{
            // Cards keep a sane width and stay centred, so two open jobs read as
            // a deliberate row rather than a grid that failed to fill.
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {isLoading &&
            Array.from({ length: skeletonCount }).map((_, idx) => (
              <Box key={`sk-${idx}`} sx={cardSlotSx}>
                <FeaturedJobsSkeleton />
              </Box>
            ))}

          {!isLoading && jobs.length === 0 && (
            <Box
              sx={{
                flex: '1 1 100%',
                maxWidth: 'none',
                py: 8,
                textAlign: 'center',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '18px',
                bgcolor: '#f8fafc',
                p: 4,
              }}
            >
              <WorkOutlineRounded sx={{ fontSize: 52, color: '#94a3b8', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {t('no_active_jobs')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('no_active_jobs_hint')}
              </Typography>
            </Box>
          )}

          {!isLoading &&
            jobs.map((job) => (
              <Box key={job._id} sx={cardSlotSx}>
                <JobCard
                  title={job.title}
                  clinic={job.companyName}
                  location={job.location}
                  salary={job.salary}
                  type={job.type}
                  skills={job.skills}
                  experience={job.experience}
                  postedAt={timeAgo(job.createdAt, t)}
                  applied={isCandidate && Boolean(job.hasApplied)}
                  featured={Boolean(job.isFeatured)}
                  urgent={Boolean(job.isUrgent)}
                  saved={savedJobIds.has(job._id)}
                  onSave={isCandidate ? () => void toggleSave(job._id) : undefined}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                />
              </Box>
            ))}
        </Box>

        {/* Mobile View All Button */}
        <Box sx={{ textAlign: 'center', mt: 4, display: { xs: 'block', md: 'none' } }}>
          <Button
            component={Link}
            to="/jobs"
            variant="outlined"
            fullWidth
            endIcon={<ArrowForward />}
            sx={{
              py: 1.5,
              borderRadius: 3,
              fontWeight: 700,
              color: '#0c5283',
              borderColor: '#cbd5e1',
            }}
          >
            {t('view_all')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedJobs;