import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import * as authApi from '../../services/authApi';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formState, setFormState] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!formState.username || !formState.password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const loginResult = await login({
        username: formState.username,
        password: formState.password,
      });

      if (loginResult.success) {
        // Check if user has ADMIN role
        const userInfo = await authApi.getCurrentUser();
        const roles = userInfo?.roles || [];
        const hasAdminRole = roles.some(role => {
          const roleName = typeof role === 'string' ? role : role?.name;
          return roleName === 'ADMIN' || roleName === 'ROLE_ADMIN';
        });

        if (hasAdminRole) {
          const redirectPath = location.state?.from?.pathname || '/admin/dashboard';
          navigate(redirectPath, { replace: true });
        } else {
          setError('Tài khoản này không có quyền ADMIN. Vui lòng đăng nhập bằng tài khoản admin.');
          // Logout user
          authApi.removeToken();
        }
      } else {
        throw new Error(loginResult.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.authWrapper}>
      <div style={styles.authCard}>
        <h1 style={styles.authTitle}>Đăng nhập Admin</h1>
        <p style={styles.authSubtitle}>
          Trang quản trị dành riêng cho quản trị viên. Chỉ tài khoản có quyền ADMIN mới có thể truy cập.
        </p>

        {error && <div style={styles.authError}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.authForm}>
          <div style={styles.authField}>
            <label htmlFor="username" style={styles.authLabel}>
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Nhập tên đăng nhập admin"
              value={formState.username}
              onChange={handleChange}
              style={styles.authInput}
              required
            />
          </div>

          <div style={styles.authField}>
            <label htmlFor="password" style={styles.authLabel}>
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={formState.password}
              onChange={handleChange}
              style={styles.authInput}
              required
            />
          </div>

          <button type="submit" style={styles.authButton} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập Admin'}
          </button>
        </form>

        <p style={styles.authFooter}>
          <a href="/" style={styles.authLink}>
            ← Quay lại trang chủ
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;

