import type { ReactNode } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Skeleton,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  BookmarkBorder,
  Description,
  Lock,
  People,
  Work,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '../../../hooks/useAuth';
import { useCandidateHomeData, useEmployerHomeData } from '../../../hooks/useRoleHomeData';
import type { ApplicationStatus } from '../../../store/api/applicationApi';
import type { JobStatus } from '../../../store/api/jobApi';

const APPLICATION_STATUS_COLOR: Record<ApplicationStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  new: 'info',
  reviewing: 'warning',
  shortlisted: 'success',
  rejected: 'error',
  hired: 'success',
};

const JOB_STATUS_COLOR: Record<JobStatus, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  closed: 'warning',
  expired: 'error',
};

const applicationStatusLabel = (status: ApplicationStatus, t: TFunction) =>
  t(`application_status_${status}`, { defaultValue: status });

const jobStatusLabel = (status: JobStatus, t: TFunction) => t(`job_status_${status}`, { defaultValue: status });

type Row = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  avatar: ReactNode;
  chip?: { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' };
};

type PanelProps = {
  title: string;
  icon: ReactNode;
  rows: Row[];
  isLoading: boolean;
  emptyText: string;
  emptyActionLabel: string;
  emptyActionTo: string;
  viewAllTo: string;
};

const ActivityPanel: React.FC<PanelProps> = ({
  title,
  icon,
  rows,
  isLoading,
  emptyText,
  emptyActionLabel,
  emptyActionTo,
  viewAllTo,
}) => {
  const { t } = useTranslation();

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              {title}
            </Typography>
          </Box>
          {rows.length > 0 && (
            <Button
              component={Link}
              to={viewAllTo}
              size="small"
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {t('member_view_all')}
            </Button>
          )}
        </Box>

        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Box key={`sk-${index}`} sx={{ display: 'flex', gap: 2, py: 1.2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" height={20} width="70%" />
                <Skeleton variant="text" height={16} width="45%" />
              </Box>
            </Box>
          ))}

        {!isLoading && rows.length === 0 && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {emptyText}
            </Typography>
            <Button component={Link} to={emptyActionTo} variant="outlined" size="small" sx={{ fontWeight: 700 }}>
              {emptyActionLabel}
            </Button>
          </Box>
        )}

        {!isLoading &&
          rows.map((row, index) => (
            <Box key={row.id}>
              {index > 0 && <Divider />}
              <Box
                component={Link}
                to={row.to}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.4,
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover .activity-title': { color: 'primary.main' },
                }}
              >
                {row.avatar}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    className="activity-title"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {row.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.subtitle}
                  </Typography>
                </Box>
                {row.chip && (
                  <Chip
                    label={row.chip.label}
                    size="small"
                    color={row.chip.color}
                    variant={row.chip.color === 'default' ? 'outlined' : 'filled'}
                    sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, flexShrink: 0 }}
                  />
                )}
              </Box>
            </Box>
          ))}
      </CardContent>
    </Card>
  );
};

const MAX_ROWS = 4;

/**
 * The signed-in user's own records on the home page: a candidate sees the jobs
 * they applied to and saved, an employer sees their posts and who applied.
 */
const MemberActivity: React.FC = () => {
  const { t } = useTranslation();
  const { isCandidate, isEmployer } = useAuth();
  const candidate = useCandidateHomeData(isCandidate);
  const employer = useEmployerHomeData(isEmployer);

  if (!isCandidate && !isEmployer) {
    return null;
  }

  const applicationRows: Row[] = isCandidate
    ? candidate.applications.slice(0, MAX_ROWS).map((application) => ({
        id: application._id,
        title: application.job?.title || t('member_job_removed'),
        subtitle: [application.job?.companyName, application.job?.location].filter(Boolean).join(' · '),
        to: application.job?._id ? `/jobs/${application.job._id}` : '/candidate/dashboard',
        avatar: (
          <Avatar variant="rounded" sx={{ bgcolor: 'rgba(12, 82, 131, 0.1)', color: 'primary.main', fontWeight: 800 }}>
            {(application.job?.companyName || application.job?.title || '?').charAt(0).toUpperCase()}
          </Avatar>
        ),
        chip: {
          label: applicationStatusLabel(application.status, t),
          color: APPLICATION_STATUS_COLOR[application.status] ?? 'default',
        },
      }))
    : employer.jobs.slice(0, MAX_ROWS).map((job) => ({
        id: job._id,
        title: job.title,
        subtitle: [job.location, job.type].filter(Boolean).join(' · '),
        to: `/jobs/${job._id}`,
        avatar: (
          <Avatar variant="rounded" sx={{ bgcolor: 'rgba(12, 82, 131, 0.1)', color: 'primary.main', fontWeight: 800 }}>
            {job.title.charAt(0).toUpperCase()}
          </Avatar>
        ),
        chip: { label: jobStatusLabel(job.status, t), color: JOB_STATUS_COLOR[job.status] ?? 'default' },
      }));

  const secondaryRows: Row[] = isCandidate
    ? candidate.savedJobs.slice(0, MAX_ROWS).map((saved) => ({
        id: saved._id,
        title: saved.job?.title || t('member_job_removed'),
        subtitle: [saved.job?.companyName, saved.job?.location].filter(Boolean).join(' · '),
        to: saved.job?._id ? `/jobs/${saved.job._id}` : '/candidate/saved-jobs',
        avatar: (
          <Avatar variant="rounded" sx={{ bgcolor: 'rgba(10, 182, 162, 0.12)', color: 'secondary.main', fontWeight: 800 }}>
            {(saved.job?.companyName || saved.job?.title || '?').charAt(0).toUpperCase()}
          </Avatar>
        ),
      }))
    : employer.applications.slice(0, MAX_ROWS).map((application) => {
        const locked = Boolean(application.candidateProfile?.locked);
        const applicantName = [application.candidateProfile?.firstName, application.candidateProfile?.lastName]
          .filter(Boolean)
          .join(' ');

        return {
          id: application._id,
          // A locked profile is masked server-side, so the row leads with the job.
          title: locked || !applicantName ? t('member_locked_applicant') : applicantName,
          subtitle: application.job?.title || '',
          to: `/employer/applications/${application._id}`,
          avatar: (
            <Avatar sx={{ bgcolor: locked ? 'grey.400' : 'rgba(10, 182, 162, 0.12)', color: locked ? '#fff' : 'secondary.main', fontWeight: 800 }}>
              {locked || !applicantName ? <Lock fontSize="small" /> : applicantName.charAt(0).toUpperCase()}
            </Avatar>
          ),
          chip: {
            label: applicationStatusLabel(application.status, t),
            color: APPLICATION_STATUS_COLOR[application.status] ?? 'default',
          },
        };
      });

  const isLoading = isCandidate ? candidate.isLoading : employer.isLoading;

  return (
    <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
          {t('member_activity_title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isCandidate ? t('member_activity_subtitle_candidate') : t('member_activity_subtitle_employer')}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <ActivityPanel
            title={isCandidate ? t('member_recent_applications') : t('member_my_job_posts')}
            icon={isCandidate ? <Description /> : <Work />}
            rows={applicationRows}
            isLoading={isLoading}
            emptyText={isCandidate ? t('member_no_applications') : t('member_no_job_posts')}
            emptyActionLabel={isCandidate ? t('find_jobs') : t('post_job')}
            emptyActionTo={isCandidate ? '/find-job' : '/employer/post-job'}
            viewAllTo={isCandidate ? '/candidate/dashboard' : '/employer/dashboard'}
          />

          <ActivityPanel
            title={isCandidate ? t('member_saved_jobs_title') : t('member_recent_applicants')}
            icon={isCandidate ? <BookmarkBorder /> : <People />}
            rows={secondaryRows}
            isLoading={isLoading}
            emptyText={isCandidate ? t('member_no_saved_jobs') : t('member_no_applicants')}
            emptyActionLabel={isCandidate ? t('browse_jobs') : t('member_action_browse_candidates')}
            emptyActionTo={isCandidate ? '/jobs' : '/employer/employees'}
            viewAllTo={isCandidate ? '/candidate/saved-jobs' : '/employer/applications'}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default MemberActivity;
