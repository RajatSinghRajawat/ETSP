import HomeSlider from '../components/ui/home/HomeSlider';
import QuickActions from '../components/ui/home/QuickActions';
import FeaturedJobs from '../components/ui/home/FeaturedJobs';
import FeaturedCandidates from '../components/ui/home/FeaturedCandidates';
import WhyChooseUs from '../components/ui/home/WhyChooseUs';
import Stats from '../components/ui/home/Stats';
import CTASection from '../components/ui/home/CTASection';
import Footer from '../components/ui/home/Footer';
import { Box } from '@mui/material';

const Home: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HomeSlider />
      <QuickActions />
      <FeaturedJobs />
      <FeaturedCandidates />
      <WhyChooseUs />
      <Stats />
      <CTASection />
      <Footer />
    </Box>
  );
};

export default Home;
