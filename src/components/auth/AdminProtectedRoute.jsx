import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, ready, user, authEnabled } = useAuth();
  const location = useLocation();

  if (!authEnabled) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!ready) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Check if user has ADMIN role
  const hasAdminRole = user?.roles?.some(role => {
    // Handle both string and object formats
    const roleName = typeof role === 'string' ? role : role?.name;
    return roleName === 'ADMIN' || roleName === 'ROLE_ADMIN';
  });

  if (!hasAdminRole) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Không có quyền truy cập</h2>
        <p>Bạn cần quyền ADMIN để truy cập trang này.</p>
        <p>Vai trò hiện tại của bạn: {user?.roles?.map(r => typeof r === 'string' ? r : r?.name).join(', ') || 'Không có'}</p>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;

