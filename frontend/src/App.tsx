/**
 * Application shell — routing, auth guards, providers.
 *
 * Routing structure (matches UI reference):
 *   /                → LandingPage (no layout)
 *   /login           → LoginPage (public-only)
 *   /register        → RegisterPage (public-only)
 *   /app             → AppLayout shell (auth-guarded)
 *     /app           → Dashboard (index)
 *     /app/coach     → AI Coach (chat)
 *     /app/practice  → Practice Paths list
 *     /app/practice/:id → Path detail
 *     /app/problems  → Problems browser
 *     /app/problem/:id → Problem workspace
 *     /app/analytics → Analytics / stats
 *     /app/profile   → Profile settings
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/AppLayout';

// Pages
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
    },
  },
});

/** Redirect authenticated users away from public-only pages */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}

/** Auth guard — loads user, shows spinner, or redirects to /login */
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

  // Render AppLayout which contains <Outlet /> for child routes
  return <AppLayout />;
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

          {/* Authenticated routes — all under /app with AppLayout shell */}
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

          {/* Legacy redirects — old routes → new /app/* routes */}
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/chat" element={<Navigate to="/app/coach" replace />} />
          <Route path="/coaching" element={<Navigate to="/app/coach" replace />} />
          <Route path="/paths" element={<Navigate to="/app/practice" replace />} />
          <Route path="/paths/:id" element={<Navigate to="/app/practice/:id" replace />} />
          <Route path="/problems" element={<Navigate to="/app/problems" replace />} />
          <Route path="/stats" element={<Navigate to="/app/analytics" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" duration={3000} richColors />
    </QueryClientProvider>
  );
}
