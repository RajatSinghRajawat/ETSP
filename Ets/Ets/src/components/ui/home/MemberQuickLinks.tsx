import type { ReactNode } from 'react';
import { Box, Card, CardActionArea, Container, Typography } from '@mui/material';
import {
  BookmarkBorder,
  Business,
  Description,
  Info,
  People,
  Person,
  SupportAgent,
  WorkOutlined,
  Workspaces,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';

type QuickLink = { title: string; desc: string; to: string; icon: ReactNode };

/**
 * The signed-in counterpart of `QuickActions` — that section asks a visitor
 * whether they are a candidate or an employer, which is already answered here.
 */
const MemberQuickLinks: React.FC = () => {
  const { t } = useTranslation();
  const { isEmployer, isCandidate } = useAuth();

  const links: QuickLink[] = isEmployer
    ? [
        {
          title: t('member_link_company_profile'),
          desc: t('member_link_company_profile_desc'),
          to: '/employer/profile',
          icon: <Business sx={{ fontSize: 30 }} />,
        },
        {
          title: t('member_action_view_applications'),
          desc: t('member_link_applications_desc'),
          to: '/employer/applications',
          icon: <Description sx={{ fontSize: 30 }} />,
        },
        {
          title: t('member_action_browse_candidates'),
          desc: t('member_link_candidates_desc'),
          to: '/employer/employees',
          icon: <People sx={{ fontSize: 30 }} />,
        },
        {
          title: t('support'),
          desc: t('member_link_support_desc'),
          to: '/employer/support',
          icon: <SupportAgent sx={{ fontSize: 30 }} />,
        },
      ]
    : isCandidate
      ? [
          {
            title: t('member_link_my_profile'),
            desc: t('member_link_my_profile_desc'),
            to: '/candidate/profile',
            icon: <Person sx={{ fontSize: 30 }} />,
          },
          {
            title: t('member_stat_saved_jobs'),
            desc: t('member_link_saved_desc'),
            to: '/candidate/saved-jobs',
            icon: <BookmarkBorder sx={{ fontSize: 30 }} />,
          },
          {
            title: t('member_link_browse_employers'),
            desc: t('member_link_browse_employers_desc'),
            to: '/employers',
            icon: <Business sx={{ fontSize: 30 }} />,
          },
          {
            title: t('support'),
            desc: t('member_link_support_desc'),
            to: '/candidate/support',
            icon: <SupportAgent sx={{ fontSize: 30 }} />,
          },
        ]
      : [
          {
            title: t('browse_jobs'),
            desc: t('member_link_browse_jobs_desc'),
            to: '/jobs',
            icon: <WorkOutlined sx={{ fontSize: 30 }} />,
          },
          {
            title: t('employers'),
            desc: t('member_link_browse_employers_desc'),
            to: '/employers',
            icon: <Business sx={{ fontSize: 30 }} />,
          },
          {
            title: t('member_link_showcase'),
            desc: t('member_link_showcase_desc'),
            to: '/showcase',
            icon: <Workspaces sx={{ fontSize: 30 }} />,
          },
          {
            title: t('about'),
            desc: t('member_link_about_desc'),
            to: '/about',
            icon: <Info sx={{ fontSize: 30 }} />,
          },
        ];

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: '1.3rem', md: '1.6rem' } }}>
          {t('member_shortcuts_title')}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
            gap: 2.5,
          }}
        >
          {links.map((link) => (
            <Card
              key={link.to}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  borderColor: 'primary.main',
                  boxShadow: '0 16px 32px -18px rgba(12,82,131,0.5)',
                },
              }}
            >
              <CardActionArea component={Link} to={link.to} sx={{ p: 2.5, height: '100%' }}>
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                    color: 'primary.main',
                    bgcolor: 'rgba(12, 82, 131, 0.08)',
                  }}
                >
                  {link.icon}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>{link.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                  {link.desc}
                </Typography>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default MemberQuickLinks;
