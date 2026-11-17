import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import DevBanner from './components/DevBanner';

import SplashPage from './pages/SplashPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ReportItemPage from './pages/ReportItemPage';
import MyReportsPage from './pages/MyReportsPage';
import BrowsePage from './pages/BrowsePage';
import MatchDetailPage from './pages/MatchDetailPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted">
        Loading VIT Campus Portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// App Layout with Navbar and Sidebar
function AppLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DevBanner />
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
        {user && <Sidebar />}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
      {user && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Splash */}
          <Route path="/" element={<SplashPage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Protected Campus Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportItemPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyReportsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/browse"
            element={
              <AppLayout>
                <BrowsePage />
              </AppLayout>
            }
          />

          <Route
            path="/items/:id"
            element={
              <AppLayout>
                <ItemDetailPage />
              </AppLayout>
            }
          />

          <Route
            path="/matches/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MatchDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <AppLayout>
                <NotFoundPage />
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
