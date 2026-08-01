import { Box, Container, Typography, Card, CardContent, Divider } from '@mui/material';
import {
  Lock,
  Storage,
  Share,
  Cookie,
  Gavel,
  ContactSupport,
} from '@mui/icons-material';

const LAST_UPDATED = '1 August 2026';

const sections = [
  {
    icon: <Storage sx={{ fontSize: 32, color: '#0c5283' }} />,
    title: 'Information We Collect',
    body: [
      'Account details you provide when registering — name, email address, phone number and, for employers, company information.',
      'Profile content you choose to add, such as your education, work experience, skills, preferred locations and profile photo or company logo.',
      'Usage information generated as you browse — the jobs you view, save or apply to, and the searches you run.',
      'Technical data such as your browser type, device and IP address, collected to keep the platform secure and working correctly.',
    ],
  },
  {
    icon: <Lock sx={{ fontSize: 32, color: '#0ab6a2' }} />,
    title: 'How We Use Your Information',
    body: [
      'To create and maintain your account and verify your registration before granting access.',
      'To show your profile to employers when you are a candidate, and to publish your job postings when you are an employer.',
      'To send one-time passwords for login, along with job alerts and account notifications you have opted into.',
      'To improve matching between candidates and roles, and to keep the platform free of fraud and misuse.',
    ],
  },
  {
    icon: <Share sx={{ fontSize: 32, color: '#0c5283' }} />,
    title: 'What We Share',
    body: [
      'Candidate profiles are visible to verified employers on the platform. Contact details are revealed only when an employer unlocks a profile or you apply to their job.',
      'Employer details and job postings are shown publicly once approved by our team.',
      'We use trusted service providers for email delivery, SMS and payments; they receive only what they need to provide that service.',
      'We do not sell your personal information to advertisers or data brokers.',
    ],
  },
  {
    icon: <Cookie sx={{ fontSize: 32, color: '#0ab6a2' }} />,
    title: 'Cookies & Local Storage',
    body: [
      'We use cookies and browser storage to keep you signed in, remember your language and theme, and understand how the site is used.',
      'You can clear or block these through your browser settings, though signing in will not work without the essential ones.',
    ],
  },
  {
    icon: <Gavel sx={{ fontSize: 32, color: '#0c5283' }} />,
    title: 'Your Rights',
    body: [
      'You can view and update most of your information at any time from your profile page.',
      'You may request a copy of your data, ask us to correct it, or ask us to delete your account entirely.',
      'You can turn off job alerts and marketing emails from your account settings without losing access to the platform.',
      'We keep your information only as long as your account is active or as needed to meet legal obligations.',
    ],
  },
];

const PrivacyPolicy: React.FC = () => (
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
        <Lock sx={{ fontSize: 52, mb: 2, opacity: 0.9 }} />
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, fontSize: { xs: 30, md: 42 } }}>
          Privacy Policy
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 640, mx: 'auto', fontSize: 17 }}>
          How we collect, use and protect the information you share with us.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 2.5, opacity: 0.8 }}>
          Last updated: {LAST_UPDATED}
        </Typography>
      </Container>
    </Box>

    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.8 }}>
        This policy explains what happens to your information when you use our platform, whether you
        are a veterinary professional looking for work or an organisation hiring one. We have tried to
        keep it in plain language — if anything is unclear, please get in touch.
      </Typography>

      {sections.map((section) => (
        <Card
          key={section.title}
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
              {section.icon}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {section.title}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
              {section.body.map((line) => (
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
      ))}

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
              Questions About Your Data?
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
            Write to us from the Contact page and our team will respond. If you want your account and
            profile removed, tell us the email address you registered with and we will take care of it.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  </Box>
);

export default PrivacyPolicy;
