import HomeSlider from '../components/ui/home/HomeSlider';
import QuickActions from '../components/ui/home/QuickActions';
import FeaturedJobs from '../components/ui/home/FeaturedJobs';
import FeaturedCandidates from '../components/ui/home/FeaturedCandidates';
import JobProfilesSection from '../components/ui/home/JobProfilesSection';
import Stats from '../components/ui/home/Stats';
import CTASection from '../components/ui/home/CTASection';
import Footer from '../components/ui/home/Footer';
import AdBanner from '../components/common/AdBanner';
import { Box } from '@mui/material';

const Home: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HomeSlider />
      <AdBanner placement="home_top" />
      <QuickActions />
      <FeaturedJobs />
      <AdBanner placement="home_mid" />
      <FeaturedCandidates />
      <JobProfilesSection />
      <Stats />
      <AdBanner placement="home_bottom" />
      <CTASection />
      <Footer />
    </Box>
  );
};

export default Home;
