import { Box, Container, Typography, Card, CardContent, Divider } from '@mui/material';
import {
  Lock,
  Storage,
  Share,
  Cookie,
  Gavel,
  ContactSupport,
  Description,
} from '@mui/icons-material';
import type { SiteLegalPage } from '../store/api/siteContentApi';

const SECTION_ICONS = [Storage, Lock, Share, Cookie, Gavel, Description];

type LegalPageViewProps = {
  content?: SiteLegalPage;
  fallbackIcon?: React.ReactNode;
};

/**
 * Shared layout for Privacy / Terms / Cookie pages driven by admin site-content.
 */
export default function LegalPageView({ content, fallbackIcon }: LegalPageViewProps) {
  if (!content) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0c5283 0%, #0ab6a2 100%)',
          color: 'white',
          py: { xs: 7, md: 10 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          {fallbackIcon ?? <Lock sx={{ fontSize: 52, mb: 2, opacity: 0.9 }} />}
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, fontSize: { xs: 30, md: 42 } }}>
            {content.heroTitle}
          </Typography>
          {content.heroSubtitle && (
            <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 640, mx: 'auto', fontSize: 17 }}>
              {content.heroSubtitle}
            </Typography>
          )}
          {content.lastUpdated && (
            <Typography variant="caption" sx={{ display: 'block', mt: 2.5, opacity: 0.8 }}>
              Last updated: {content.lastUpdated}
            </Typography>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        {content.intro && (
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.8 }}>
            {content.intro}
          </Typography>
        )}

        {(content.sections ?? []).map((section, index) => {
          const Icon = SECTION_ICONS[index % SECTION_ICONS.length];
          return (
            <Card
              key={section.id || section.title}
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Icon sx={{ fontSize: 32, color: index % 2 === 0 ? '#0c5283' : '#0ab6a2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {section.title}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                  {(section.body ?? []).map((line) => (
                    <Typography
                      key={line}
                      component="li"
                      variant="body2"
                      sx={{ color: 'text.secondary', mb: 1.2, lineHeight: 1.75 }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {(content.contactCardTitle || content.contactCardBody) && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'rgba(10,182,162,0.06)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <ContactSupport sx={{ fontSize: 32, color: '#0ab6a2' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {content.contactCardTitle}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                {content.contactCardBody}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
