import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography } from '@mui/material';
import { Work, Business, People } from '@mui/icons-material';
import { useGetJobsQuery } from '../../../store/api/jobApi';
import { useGetEmployerProfilesQuery } from '../../../store/api/employerProfileApi';
import { useGetFeaturedCandidatesQuery } from '../../../store/api/candidateProfileApi';

function useAnimatedCounter(target: number, duration = 1500) {
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
    { value: jobs, suffix: '+', label: t('stat_jobs'), icon: <Work sx={{ fontSize: 40 }} /> },
    { value: clinics, suffix: '+', label: t('stat_clinics'), icon: <Business sx={{ fontSize: 40 }} /> },
    { value: doctors, suffix: '+', label: t('stat_doctors'), icon: <People sx={{ fontSize: 40 }} /> }
  ];

  return (
    <Box
      sx={{
        py: 8,
        background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }}
      />

      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4
          }}
        >
          {stats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                textAlign: 'center',
                position: 'relative',
                p: 4,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  bgcolor: 'rgba(255,255,255,0.15)'
                }
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  mb: 2
                }}
              >
                {stat.icon}
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {stat.value.toLocaleString()}{stat.suffix}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  fontWeight: 500,
                  fontSize: '1.1rem'
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Stats;