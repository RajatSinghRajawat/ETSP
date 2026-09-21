import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Avatar } from '@mui/material';
import { WorkOutlineRounded, BusinessRounded, GroupRounded, TrendingUpRounded } from '@mui/icons-material';
import { useGetJobsQuery } from '../../../store/api/jobApi';
import { useGetEmployerProfilesQuery } from '../../../store/api/employerProfileApi';
import { useGetFeaturedCandidatesQuery } from '../../../store/api/candidateProfileApi';
import SectionHeader from './SectionHeader';

function useAnimatedCounter(target: number, duration = 1600) {
  const [value, setValue] = useState(0);
  const lastTargetRef = useRef(0);

  useEffect(() => {
    if (!target || target <= 0) {
      lastTargetRef.current = 0;
      return undefined;
    }
    const start = lastTargetRef.current;
    const startTime = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      setValue(current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        lastTargetRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const Stats: React.FC = () => {
  const { t } = useTranslation();
  const { data: jobsData } = useGetJobsQuery({ limit: 1 });
  const { data: employersData } = useGetEmployerProfilesQuery({ limit: 1 });
  const { data: candidatesData } = useGetFeaturedCandidatesQuery({ limit: 1 });

  const jobsTotal = jobsData?.data?.pagination?.total ?? 0;
  const clinicsTotal = employersData?.data?.pagination?.total ?? 0;
  const doctorsTotal = candidatesData?.data?.total ?? 0;

  const jobs = useAnimatedCounter(jobsTotal);
  const clinics = useAnimatedCounter(clinicsTotal);
  const doctors = useAnimatedCounter(doctorsTotal);

  const stats = [
    {
      value: jobs,
      suffix: '+',
      label: t('stat_jobs'),
      subtext: t('stat_jobs_sub', { defaultValue: 'From top multi-specialty clinics' }),
      icon: <WorkOutlineRounded sx={{ fontSize: 28, color: '#38bdf8' }} />,
      glow: 'rgba(56, 189, 248, 0.2)',
    },
    {
      value: clinics,
      suffix: '+',
      label: t('stat_clinics'),
      subtext: t('stat_clinics_sub', { defaultValue: 'Actively hiring across India' }),
      icon: <BusinessRounded sx={{ fontSize: 28, color: '#2dd4bf' }} />,
      glow: 'rgba(45, 212, 191, 0.2)',
    },
    {
      value: doctors,
      suffix: '+',
      label: t('stat_doctors'),
      subtext: t('stat_doctors_sub', { defaultValue: 'Pre-screened & verified professionals' }),
      icon: <GroupRounded sx={{ fontSize: 28, color: '#a78bfa' }} />,
      glow: 'rgba(167, 139, 250, 0.2)',
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 },
        background: 'linear-gradient(135deg, #051a2a 0%, #0c3b60 60%, #072a44 100%)',
        position: 'relative',
        overflow: 'hidden',
        color: '#ffffff',
      }}
    >
      {/* Background aurora ambient lights */}
      <Box
        sx={{
          position: 'absolute',
          top: '-50%',
          left: '20%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10, 182, 162, 0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-50%',
          right: '20%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <SectionHeader
          align="center"
          variant="light"
          tone="light"
          eyebrowIcon={<TrendingUpRounded sx={{ color: '#2dd4bf' }} />}
          eyebrow={t('stats_overline', { defaultValue: 'NETWORK SCALE & IMPACT' })}
          title={t('stats_title', { defaultValue: 'A veterinary network growing every week' })}
          subtitle={t('stats_subtitle', {
            defaultValue: 'Live numbers from the clinics, hospitals and professionals already on VetsLinked.',
          })}
          sx={{ mx: 'auto' }}
        />

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {stats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                textAlign: 'center',
                position: 'relative',
                p: { xs: 4, md: 5 },
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  bgcolor: 'rgba(255, 255, 255, 0.07)',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  boxShadow: `0 20px 40px -10px ${stat.glow}`,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  mb: 2.5,
                }}
              >
                {stat.icon}
              </Avatar>

              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.8rem', md: '3.6rem' },
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  mb: 1,
                  background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stat.value.toLocaleString()}{stat.suffix}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: '#ffffff',
                  mb: 0.5,
                }}
              >
                {stat.label}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  maxWidth: 240,
                }}
              >
                {stat.subtext}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Stats;