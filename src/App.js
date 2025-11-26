import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import AppShell from './pages/app/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import PersonalInfoPage from './pages/profile/PersonalInfoPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import ModDashboard from './pages/mod/ModDashboard';

const App = () => (
  <AuthProvider>
    <NotificationProvider>
      <AppProvider>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={(
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            )}
          />
          <Route
            path="/creator/dashboard"
            element={(
              <ProtectedRoute>
                <CreatorDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/mod/dashboard"
            element={(
              <ProtectedRoute>
                <ModDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile/personal-info"
            element={(
              <ProtectedRoute>
                <PersonalInfoPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/*"
            element={(
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </AppProvider>
    </NotificationProvider>
  </AuthProvider>
);

export default App;
