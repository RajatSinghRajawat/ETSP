/* Scratch harness - not routed. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from '../store';
import { lightTheme } from '../theme';
import PostJob from '../pages/employer/PostJob';

localStorage.setItem('ets-access-token', 'preview');
localStorage.setItem('user', JSON.stringify({ name: 'Abu Vet Clinic', role: 'employer' }));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <MemoryRouter><PostJob /></MemoryRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
