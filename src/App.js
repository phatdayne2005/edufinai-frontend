import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import AppShell from './pages/app/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PersonalInfoPage from './pages/profile/PersonalInfoPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
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
        path="/profile/personal-info"
        element={(
          <ProtectedRoute>
            <AppProvider>
              <PersonalInfoPage />
            </AppProvider>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/*"
        element={(
          <ProtectedRoute>
            <AppProvider>
              <AppShell />
            </AppProvider>
          </ProtectedRoute>
        )}
      />
    </Routes>
  </AuthProvider>
);

export default App;
