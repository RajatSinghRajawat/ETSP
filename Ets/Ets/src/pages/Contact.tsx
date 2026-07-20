import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent } from '@mui/material';
import { Email, Phone, LocationOn, AccessTime } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const Contact: React.FC = () => {
  const { t } = useTranslation();

  const contactInfo = [
    { icon: <Email />, title: 'Email', value: 'support@vetjobs.com' },
    { icon: <Phone />, title: 'Phone', value: '+91 123 456 7890' },
    { icon: <LocationOn />, title: 'Address', value: 'Mumbai, Maharashtra, India' },
    { icon: <AccessTime />, title: 'Working Hours', value: 'Mon - Sat, 9:00 AM - 6:00 PM' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>Contact Us</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>We'd love to hear from you. Get in touch with us.</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Send us a message</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField fullWidth label="Your Name" placeholder="John Doe" />
                  <TextField fullWidth label="Email Address" placeholder="john@example.com" type="email" />
                  <TextField fullWidth label="Phone Number" placeholder="+91 98765 43210" type="tel" />
                  <TextField fullWidth label="Subject" placeholder="How can we help?" />
                  <TextField fullWidth label="Message" placeholder="Your message..." multiline rows={4} />
                  
                  <Button variant="contained" color="primary" size="large" sx={{ py: 1.5 }}>
                    Send Message
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {contactInfo.map((info, index) => (
                <Card key={index} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                      {info.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {info.title}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {info.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Contact;
