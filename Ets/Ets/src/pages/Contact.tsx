import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent, InputAdornment } from '@mui/material';
import { Email, Phone, LocationOn, AccessTime } from '@mui/icons-material';
import { useLocalizedSiteContent } from '../hooks/useLocalizedSiteContent';
import { phoneHtmlInputProps, sanitizePhone, validatePhone } from '../utils/phone';

const Contact: React.FC = () => {
  const { content } = useLocalizedSiteContent();
  const contact = content?.contact;
  const [phone, setPhone] = useState('');

  const contactInfo = [
    { icon: <Email />, title: 'Email', value: contact?.email },
    { icon: <Phone />, title: 'Phone', value: contact?.phone },
    { icon: <LocationOn />, title: 'Address', value: contact?.address },
    { icon: <AccessTime />, title: 'Working Hours', value: contact?.workingHours },
  ].filter((info) => Boolean(info.value));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            {contact?.heroTitle || 'Contact Us'}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {contact?.heroSubtitle || "We'd love to hear from you. Get in touch with us."}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                  {contact?.formTitle || 'Send us a message'}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField fullWidth label="Your Name" placeholder="John Doe" />
                  <TextField fullWidth label="Email Address" placeholder="john@example.com" type="email" />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    placeholder="10 digit mobile number"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(sanitizePhone(event.target.value))}
                    error={Boolean(validatePhone(phone))}
                    helperText={validatePhone(phone) || '10 digits, without +91'}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>+91</Box>
                          </InputAdornment>
                        ),
                      },
                      htmlInput: phoneHtmlInputProps,
                    }}
                  />
                  <TextField fullWidth label="Subject" placeholder="How can we help?" />
                  <TextField fullWidth label="Message" placeholder="Your message..." multiline rows={4} />

                  <Button variant="contained" color="primary" size="large" sx={{ py: 1.5 }}>
                    {contact?.formSubmitLabel || 'Send Message'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {contactInfo.map((info) => (
                <Card key={info.title} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
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
