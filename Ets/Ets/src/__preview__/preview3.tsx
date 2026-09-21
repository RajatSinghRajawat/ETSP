/* Scratch harness - not routed. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from '../store';
import { ChatProvider } from '../context/ChatContext';
import { lightTheme } from '../theme';
import EmployerJobView from '../pages/employer/EmployerJobView';
import EmployerJobApplicants from '../pages/employer/EmployerJobApplicants';
import EmployerDashboard from '../pages/employer/EmployerDashboard';

const which = new URLSearchParams(location.search).get('p') ?? 'jobview';
const initial =
  which === 'applicants' ? '/employer/jobs/j1/applicants'
  : which === 'dashboard' ? '/employer/dashboard'
  : '/employer/jobs/j1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <MemoryRouter initialEntries={[initial]}>
          <ChatProvider>
          <Routes>
            <Route path="/employer/dashboard" element={<EmployerDashboard />} />
            <Route path="/employer/jobs/:id" element={<EmployerJobView />} />
            <Route path="/employer/jobs/:id/applicants" element={<EmployerJobApplicants />} />
          </Routes>
        </ChatProvider>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
