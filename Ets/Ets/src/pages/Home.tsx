import HomeSlider from '../components/ui/home/HomeSlider';
import QuickActions from '../components/ui/home/QuickActions';
import FeaturedJobs from '../components/ui/home/FeaturedJobs';
import FeaturedCandidates from '../components/ui/home/FeaturedCandidates';
import JobProfilesSection from '../components/ui/home/JobProfilesSection';
import Stats from '../components/ui/home/Stats';
import CTASection from '../components/ui/home/CTASection';
import Footer from '../components/ui/home/Footer';
import MemberHero from '../components/ui/home/MemberHero';
import MemberQuickLinks from '../components/ui/home/MemberQuickLinks';
import MemberActivity from '../components/ui/home/MemberActivity';
import AdBanner from '../components/common/AdBanner';
import { Box } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

/**
 * The home page is assembled per audience:
 *
 * - guest — the marketing funnel (hero, "are you a candidate or employer?",
 *   sign-up CTA);
 * - candidate — their own applications and saved jobs first, then jobs to apply
 *   to; no sign-up pitch, no "hire this candidate" cards;
 * - employer — their posts and applicants first, then talent to hire;
 * - admin — signed in but with no member data here, so it stays on the public
 *   listings without any sign-up pitch.
 */
const Home: React.FC = () => {
  const { isLoggedIn, isCandidate, isEmployer, isAdmin } = useAuth();

  if (isCandidate) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MemberHero />
        <AdBanner placement="home_top" />
        <MemberActivity />
        <MemberQuickLinks />
        <FeaturedJobs />
        <AdBanner placement="home_mid" />
        <JobProfilesSection />
        <Stats />
        <AdBanner placement="home_bottom" />
        <Footer />
      </Box>
    );
  }

  if (isEmployer) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MemberHero />
        <AdBanner placement="home_top" />
        <MemberActivity />
        <MemberQuickLinks />
        <FeaturedCandidates />
        <AdBanner placement="home_mid" />
        <Stats />
        <AdBanner placement="home_bottom" />
        <Footer />
      </Box>
    );
  }

  if (isAdmin || isLoggedIn) {
    // Admin — and any role the API adds later — gets the signed-in shell
    // without the member-only sections that would have no data to show.
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <MemberHero />
        <AdBanner placement="home_top" />
        <MemberQuickLinks />
        <FeaturedJobs />
        <AdBanner placement="home_mid" />
        <FeaturedCandidates />
        <Stats />
        <AdBanner placement="home_bottom" />
        <Footer />
      </Box>
    );
  }

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
