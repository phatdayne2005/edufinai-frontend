import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, enableBypass, authEnabled, bypassed } = useAuth();
  const [formState, setFormState] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.email || !formState.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    login({
      email: formState.email,
      name: formState.name || undefined,
    });

    const redirectPath = location.state?.from?.pathname || '/';
    navigate(redirectPath, { replace: true });
  };

  const handleBypass = () => {
    enableBypass();
    navigate('/', { replace: true });
  };

  return (
    <div style={styles.authWrapper}>
      <div style={styles.authCard}>
        <h1 style={styles.authTitle}>Đăng nhập</h1>
        <p style={styles.authSubtitle}>
          Truy cập trải nghiệm tài chính học đường. Nếu bạn chỉ cần test nhanh, có thể dùng chế độ bỏ qua đăng nhập.
        </p>

        {!authEnabled && (
          <div style={styles.authNotice}>
            <strong>Chế độ không yêu cầu đăng nhập đang bật.</strong> Bạn có thể{' '}
            <Link to="/" style={styles.authLinkInline}>
              quay lại trang chính
            </Link>
            .
          </div>
        )}

        {error && <div style={styles.authError}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.authForm}>
          <div style={styles.authField}>
            <label htmlFor="email" style={styles.authLabel}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="student@uth.edu.vn"
              value={formState.email}
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

          <div style={styles.authField}>
            <label htmlFor="name" style={styles.authLabel}>
              Tên hiển thị (tuỳ chọn)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formState.name}
              onChange={handleChange}
              style={styles.authInput}
            />
            <p style={styles.authHint}>Nếu để trống, hệ thống sẽ dùng tên mặc định trong dữ liệu mẫu.</p>
          </div>

          <button type="submit" style={styles.authButton}>
            Đăng nhập
          </button>
        </form>

        {authEnabled && (
          <button type="button" style={styles.authBypassButton} onClick={handleBypass}>
            {bypassed ? 'Đã bật chế độ bỏ qua đăng nhập' : 'Bật chế độ bỏ qua đăng nhập (dành cho test)'}
          </button>
        )}

        <p style={styles.authFooter}>
          Chưa có tài khoản?{' '}
          <Link to="/auth/register" style={styles.authLink}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

