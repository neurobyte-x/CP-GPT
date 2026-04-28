import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/AppLayout';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import ProblemsPage from '@/pages/ProblemsPage';
import PathsPage from '@/pages/PathsPage';
import PathDetailPage from '@/pages/PathDetailPage';
import StatsPage from '@/pages/StatsPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import ProblemWorkspacePage from '@/pages/ProblemWorkspacePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function PublicOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}

function AuthGuard() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
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

          <Route path="/app" element={<AuthGuard />}>
            <Route index element={<DashboardPage />} />
            <Route path="coach" element={<ChatPage />} />
            <Route path="practice" element={<PathsPage />} />
            <Route path="practice/:id" element={<PathDetailPage />} />
            <Route path="problems" element={<ProblemsPage />} />
            <Route path="problems/:id" element={<ProblemWorkspacePage />} />
            <Route path="analytics" element={<StatsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/chat" element={<Navigate to="/app/coach" replace />} />
          <Route path="/coaching" element={<Navigate to="/app/coach" replace />} />
          <Route path="/paths" element={<Navigate to="/app/practice" replace />} />
          <Route path="/paths/:id" element={<Navigate to="/app/practice/:id" replace />} />
          <Route path="/problems" element={<Navigate to="/app/problems" replace />} />
          <Route path="/stats" element={<Navigate to="/app/analytics" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" duration={3000} richColors />
    </QueryClientProvider>
  );
}
