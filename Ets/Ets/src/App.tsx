import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lightTheme } from './theme';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import Showcase from './pages/Showcase';
import LoginPage from './pages/Login';
import Signup from './pages/auth/Signup';
import JobListing from './pages/jobs/JobListing';
import JobDetails from './pages/jobs/JobDetails';
import FindJob from './pages/jobs/FindJob';
import CandidateProfileCreate from './pages/candidate/CandidateProfileCreate';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import EmployerProfileCreate from './pages/employer/EmployerProfileCreate';
import EmployerProfileView from './pages/employer/EmployerProfileView';
import Employers from './pages/employer/Employers';
import EmployerPostJob from './pages/employer/PostJob';
import EmployerEmployees from './pages/employer/EmployerEmployees';
import EmployerEmployeeView from './pages/employer/EmployerEmployeeView';
import EmployerApplications from './pages/employer/EmployerApplications';
import EmployerApplicationDetails from './pages/employer/EmployerApplicationDetails';
import EmployerJobApplicants from './pages/employer/EmployerJobApplicants';
import EmployerJobView from './pages/employer/EmployerJobView';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import SavedJobs from './pages/candidate/SavedJobs';
import CandidateSupport from './pages/support/CandidateSupport';
import EmployerSupport from './pages/support/EmployerSupport';
import NotFound from './pages/NotFound';
import Pricing from './pages/billing/Pricing';
import BillingSuccess from './pages/billing/BillingSuccess';
import ChatBotWidget from './components/common/ChatBotWidget';
import UpgradeDialog from './components/common/UpgradeDialog';
import ProfileApprovalBanner from './components/common/ProfileApprovalBanner';
import RequireAuth from './components/common/RequireAuth';
import SessionExpiredRedirect from './components/common/SessionExpiredRedirect';
import AdBanner from './components/common/AdBanner';
import { ChatProvider } from './context/ChatContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Router>
        <ChatProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navbar />
          <Box
            component="main"
            sx={{
              minHeight: '100vh',
              pt: { xs: '56px', sm: '64px', md: '72px' },
              bgcolor: 'background.default',
              // `clip`, not `hidden` — `hidden` would make this a scroll container
              // and break the sticky sidebar / mobile sidebar bar inside it.
              overflowX: 'clip',
            }}
          >
            <ProfileApprovalBanner />
            <AdBanner placement="global_top" variant="strip" />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/candidate" element={<CandidateProfileCreate />} />
              <Route path="/signup/employer" element={<EmployerProfileCreate />} />
              <Route path="/jobs" element={<JobListing />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/find-job" element={<FindJob />} />
              <Route path="/employers" element={<Employers />} />
              <Route path="/employer/dashboard" element={<RequireAuth role="employer"><EmployerDashboard /></RequireAuth>} />
              <Route path="/employer/post-job" element={<RequireAuth role="employer"><EmployerPostJob /></RequireAuth>} />
              <Route path="/employer/edit-job/:id" element={<RequireAuth role="employer"><EmployerPostJob /></RequireAuth>} />
              <Route path="/employer/employees" element={<RequireAuth role="employer"><EmployerEmployees /></RequireAuth>} />
              <Route path="/employer/employees/:id" element={<RequireAuth role="employer"><EmployerEmployeeView /></RequireAuth>} />
              <Route path="/employer/applications" element={<RequireAuth role="employer"><EmployerApplications /></RequireAuth>} />
              <Route path="/employer/applications/:id" element={<RequireAuth role="employer"><EmployerApplicationDetails /></RequireAuth>} />
              <Route path="/employer/jobs/:id" element={<RequireAuth role="employer"><EmployerJobView /></RequireAuth>} />
              <Route path="/employer/jobs/:id/applicants" element={<RequireAuth role="employer"><EmployerJobApplicants /></RequireAuth>} />
              <Route path="/employer/profile" element={<RequireAuth role="employer"><EmployerProfileCreate showSidebar /></RequireAuth>} />
              <Route path="/employer/profile/:id" element={<EmployerProfileView />} />
              <Route path="/candidate/dashboard" element={<RequireAuth role="candidate"><CandidateDashboard /></RequireAuth>} />
              <Route path="/candidate/saved-jobs" element={<RequireAuth role="candidate"><SavedJobs /></RequireAuth>} />
              <Route path="/candidate/profile" element={<RequireAuth role="candidate"><CandidateProfileCreate showSidebar /></RequireAuth>} />
              <Route path="/candidate/support" element={<RequireAuth role="candidate"><CandidateSupport /></RequireAuth>} />
              <Route path="/employer/support" element={<RequireAuth role="employer"><EmployerSupport /></RequireAuth>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/billing/success" element={<RequireAuth><BillingSuccess /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          <SessionExpiredRedirect />
          <ChatBotWidget />
          <UpgradeDialog />
          {/* Sits above the fixed navbar (zIndex 1201) and the chat drawer. */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover
            theme="colored"
            style={{ zIndex: 2000 }}
            toastStyle={{ borderRadius: 12, fontWeight: 600 }}
          />
        </Box>
        </ChatProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
