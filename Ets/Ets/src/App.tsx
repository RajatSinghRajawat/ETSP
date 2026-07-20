import { useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lightTheme, darkTheme } from './theme';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
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
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import SavedJobs from './pages/candidate/SavedJobs';
import NotFound from './pages/NotFound';
import Pricing from './pages/billing/Pricing';
import BillingSuccess from './pages/billing/BillingSuccess';
import ChatBotWidget from './components/common/ChatBotWidget';
import UpgradeDialog from './components/common/UpgradeDialog';
import { ChatProvider } from './context/ChatContext';
import './App.css';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ChatProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Navbar mode={mode} toggleMode={toggleMode} />
          <Box
            component="main"
            sx={{
              minHeight: '100vh',
              pt: { xs: '64px', md: '72px' },
              bgcolor: 'background.default',
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/candidate" element={<CandidateProfileCreate />} />
              <Route path="/signup/employer" element={<EmployerProfileCreate />} />
              <Route path="/jobs" element={<JobListing />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/find-job" element={<FindJob />} />
              <Route path="/employers" element={<Employers />} />
              <Route path="/employer/dashboard" element={<EmployerDashboard />} />
              <Route path="/employer/post-job" element={<EmployerPostJob />} />
              <Route path="/employer/edit-job/:id" element={<EmployerPostJob />} />
              <Route path="/employer/employees" element={<EmployerEmployees />} />
              <Route path="/employer/employees/:id" element={<EmployerEmployeeView />} />
              <Route path="/employer/applications" element={<EmployerApplications />} />
              <Route path="/employer/applications/:id" element={<EmployerApplicationDetails />} />
              <Route path="/employer/profile" element={<EmployerProfileCreate showSidebar />} />
              <Route path="/employer/profile/:id" element={<EmployerProfileView />} />
              <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
              <Route path="/candidate/saved-jobs" element={<SavedJobs />} />
              <Route path="/candidate/profile" element={<CandidateProfileCreate showSidebar />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/billing/success" element={<BillingSuccess />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          <ChatBotWidget />
          <UpgradeDialog />
        </Box>
        </ChatProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
