import { Link } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { Home as HomeIcon, SearchOff } from '@mui/icons-material';

const NotFound: React.FC = () => (
  <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
    <Box sx={{ display: 'inline-flex', p: 3, borderRadius: '50%', bgcolor: 'rgba(12, 82, 131, 0.08)', mb: 3 }}>
      <SearchOff sx={{ fontSize: 64, color: 'primary.main' }} />
    </Box>
    <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>404</Typography>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>Page Not Found</Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
      The page you are looking for doesn&apos;t exist or has been moved.
    </Typography>
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Button component={Link} to="/" variant="contained" startIcon={<HomeIcon />}>Go Home</Button>
      <Button component={Link} to="/jobs" variant="outlined">Browse Jobs</Button>
    </Box>
  </Container>
);

export default NotFound;
