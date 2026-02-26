/**
 * Application shell — routing, auth guards, providers.
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Layout, Spinner } from '@/components/Layout';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import ProblemsPage from '@/pages/ProblemsPage';
import PathsPage from '@/pages/PathsPage';
import PathDetailPage from '@/pages/PathDetailPage';
import StatsPage from '@/pages/StatsPage';
import CoachingPage from '@/pages/CoachingPage';
import ProfilePage from '@/pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Redirect authenticated users away from public-only pages */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

/** Require authentication — redirects to /login if not logged in */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <RegisterPage />
              </PublicOnly>
            }
          />

          {/* Authenticated routes */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route
            path="/problems"
            element={
              <AuthGuard>
                <ProblemsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/paths"
            element={
              <AuthGuard>
                <PathsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/paths/:id"
            element={
              <AuthGuard>
                <PathDetailPage />
              </AuthGuard>
            }
          />
          <Route
            path="/stats"
            element={
              <AuthGuard>
                <StatsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/coaching"
            element={
              <AuthGuard>
                <CoachingPage />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
