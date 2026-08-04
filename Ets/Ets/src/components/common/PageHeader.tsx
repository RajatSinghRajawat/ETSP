import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  action?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, action }) => {
  return (
    <Box sx={{ mb: { xs: 2.5, md: 4 } }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 2, '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}>
          {breadcrumbs.map((crumb, index) => (
            crumb.path ? (
              <MuiLink
                key={index}
                component={Link}
                to={crumb.path}
                color="inherit"
                underline="hover"
                sx={{ fontSize: '0.875rem' }}
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={index} color="text.primary" sx={{ fontSize: '0.875rem' }}>
                {crumb.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, sm: 2 },
          mb: 1,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.125rem' },
            wordBreak: 'break-word',
          }}
        >
          {title}
        </Typography>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
      {subtitle && (
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default PageHeader;
