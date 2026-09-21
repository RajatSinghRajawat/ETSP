import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Box, Card, CardContent, Paper, Typography, ThemeProvider, CssBaseline } from '@mui/material';
import { GroupsOutlined } from '@mui/icons-material';
import { store } from '../store';
import { lightTheme } from '../theme';
import EmployerJobsTable from '../components/employer/EmployerJobsTable';
import { SectionHeading } from '../components/employer/employerUi';
import { panelSx } from '../components/employer/employerTokens';
import type { JobResponse } from '../store/api/jobApi';

const job = (over: Partial<JobResponse>): JobResponse => ({
  _id: 'j1',
  employerProfile: 'e1',
  employerEmail: 'a@b.com',
  companyName: 'Abu Vet Clinic',
  createdAt: new Date(Date.now() - 32 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
  title: 'Sales Manager',
  type: 'Full-time',
  location: 'Abu',
  salary: '30000 - 45000 per month',
  description: 'desc',
  skills: ['Sales', 'CRM'],
  experience: '2-5 years',
  education: 'Graduate',
  benefits: '',
  status: 'active',
  postedVia: 'free',
  ...over,
});

const jobs: JobResponse[] = [
  job({}),
  job({
    _id: 'j2',
    title: 'Senior Veterinary Surgeon with a long title that wraps',
    location: 'Mumbai',
    status: 'draft',
    isFeatured: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    postedVia: 'premium',
  }),
  job({
    _id: 'j3',
    title: 'Clinic Receptionist',
    location: 'Pune',
    type: 'Part-time',
    status: 'paused',
    isUrgent: true,
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  }),
];

const counts = {
  j1: { total: 1, new: 1, reviewing: 0, shortlisted: 0, rejected: 0, hired: 0 },
  j2: { total: 24, new: 6, reviewing: 4, shortlisted: 3, rejected: 2, hired: 1 },
  j3: { total: 0, new: 0, reviewing: 0, shortlisted: 0, rejected: 0, hired: 0 },
};

import { Routes, Route } from 'react-router-dom';
import EmployerJobView from '../pages/employer/EmployerJobView';
import { Button, Stack } from '@mui/material';
import EmployerDashboard from '../pages/employer/EmployerDashboard';

const PreviewApp = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'table' | 'job'>('dashboard');

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Paper
        elevation={0}
        sx={{
          p: 1.25,
          mb: 2.5,
          borderRadius: '10px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', px: 1 }}>
          Preview Mode:
        </Typography>
        <Button
          variant={activeView === 'dashboard' ? 'contained' : 'outlined'}
          onClick={() => setActiveView('dashboard')}
          size="small"
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
        >
          Employer Dashboard (/employer/dashboard)
        </Button>
        <Button
          variant={activeView === 'table' ? 'contained' : 'outlined'}
          onClick={() => setActiveView('table')}
          size="small"
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
        >
          Jobs Table (Row View)
        </Button>
        <Button
          variant={activeView === 'job' ? 'contained' : 'outlined'}
          onClick={() => setActiveView('job')}
          size="small"
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
        >
          Job Details Page (/employer/jobs/:id)
        </Button>
      </Paper>

      {activeView === 'dashboard' ? (
        <EmployerDashboard
          overrideJobs={jobs}
          overrideCounts={counts}
          overrideCompanyName="Abu Vet Clinic"
        />
      ) : activeView === 'table' ? (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <SectionHeading
            icon={<GroupsOutlined />}
            title="My Jobs"
            caption="Search, filter by status or sort — then open a job to see everyone who applied."
            sx={{ mb: 2.5 }}
          />
          <EmployerJobsTable jobs={jobs} countsByJob={counts} showMatches={false} />
        </Paper>
      ) : (
        <Routes>
          <Route path="*" element={<EmployerJobView />} />
        </Routes>
      )}
    </Box>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <MemoryRouter initialEntries={['/employer/jobs/j1']}>
          <PreviewApp />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
