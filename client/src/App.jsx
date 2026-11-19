import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import Spinner from './components/ui/Spinner';
import {
  OnboardingGuard,
  ProtectedRoute,
  PublicOnlyRoute,
} from './components/ProtectedRoute';

const Landing = lazy(() => import('./pages/public/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding'));

const Dashboard = lazy(() => import('./pages/app/Dashboard'));
const Discover = lazy(() => import('./pages/app/Discover'));
const Matches = lazy(() => import('./pages/app/Matches'));
const Profile = lazy(() => import('./pages/app/Profile'));
const ProfileEdit = lazy(() => import('./pages/app/ProfileEdit'));
const Startups = lazy(() => import('./pages/app/Startups'));
const StartupDetail = lazy(() => import('./pages/app/StartupDetail'));
const StartupForm = lazy(() => import('./pages/app/StartupForm'));
const Connections = lazy(() => import('./pages/app/Connections'));
const Chat = lazy(() => import('./pages/app/Chat'));
const Notifications = lazy(() => import('./pages/app/Notifications'));
const Settings = lazy(() => import('./pages/app/Settings'));
const NotFound = lazy(() => import('./pages/app/NotFound'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function RouteFallback() {
  return (
    <div className="route-fallback">
      <Spinner label="Loading…" />
    </div>
  );
}

function Protected({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />

              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <AuthLayout
                      title="Welcome back"
                      subtitle="Log in to pick up your matches, messages, and next move."
                    />
                  </PublicOnlyRoute>
                }
              >
                <Route index element={<Login />} />
              </Route>

              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <AuthLayout
                      title="Create your founder profile"
                      subtitle="Tell the engine what you bring. It will find who complements you."
                    />
                  </PublicOnlyRoute>
                }
              >
                <Route index element={<Register />} />
              </Route>

              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <AuthLayout
                      title="Reset your password"
                      subtitle="Enter your account email and we will send a secure reset link."
                    />
                  </PublicOnlyRoute>
                }
              >
                <Route index element={<ForgotPassword />} />
              </Route>

              <Route
                path="/reset-password/:token"
                element={
                  <AuthLayout
                    title="Choose a new password"
                    subtitle="Your reset link is valid for 30 minutes."
                  />
                }
              >
                <Route index element={<ResetPassword />} />
              </Route>

              <Route
                path="/onboarding"
                element={
                  <Protected>
                    <Onboarding />
                  </Protected>
                }
              />

              <Route
                element={
                  <Protected>
                    <OnboardingGuard>
                      <AppLayout />
                    </OnboardingGuard>
                  </Protected>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="discover" element={<Discover />} />
                <Route path="matches" element={<Matches />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<ProfileEdit />} />
                <Route path="profile/:id" element={<Profile />} />
                <Route path="startups" element={<Startups />} />
                <Route path="startups/new" element={<StartupForm mode="create" />} />
                <Route path="startups/:id/edit" element={<StartupForm mode="edit" />} />
                <Route path="startups/:id" element={<StartupDetail />} />
                <Route path="connections" element={<Connections />} />
                <Route path="chat" element={<Chat />} />
                <Route path="chat/:conversationId" element={<Chat />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route
                path="/admin"
                element={
                  <Protected adminOnly>
                    <AdminLayout />
                  </Protected>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="reports" element={<AdminReports />} />
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
