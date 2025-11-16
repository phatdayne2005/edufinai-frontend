import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppShell from './pages/app/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PersonalInfoPage from './pages/profile/PersonalInfoPage';

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
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
