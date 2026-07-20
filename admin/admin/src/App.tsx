import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/Toaster';
import { AuthProvider } from './lib/auth';
import Applications from './pages/Applications';
import Candidates from './pages/Candidates';
import Dashboard from './pages/Dashboard';
import Employers from './pages/Employers';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import Plans from './pages/Plans';
import Purchases from './pages/Purchases';
import Settings from './pages/Settings';
import Subscriptions from './pages/Subscriptions';
import Users from './pages/Users';
import { system } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="candidates" element={<Candidates />} />
                <Route path="employers" element={<Employers />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="applications" element={<Applications />} />
                <Route path="plans" element={<Plans />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/stripe" element={<Navigate to="/settings" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
