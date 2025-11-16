import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import * as authApi from '../../services/authApi';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (!formState.username || !formState.password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    if (formState.username.length < 4) {
      setError('Tên đăng nhập phải có ít nhất 4 ký tự.');
      return;
    }

    if (formState.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      setError('Email không hợp lệ.');
      return;
    }

    if (formState.phone && (formState.phone.length < 6 || formState.phone.length > 20)) {
      setError('Số điện thoại phải có từ 6 đến 20 ký tự.');
      return;
    }

    setLoading(true);

    try {
      // Prepare user data
      const userData = {
        username: formState.username.trim(),
        password: formState.password,
      };

      // Add optional fields if provided
      if (formState.firstName && formState.firstName.trim() !== '') {
        userData.firstName = formState.firstName.trim();
      }
      if (formState.lastName && formState.lastName.trim() !== '') {
        userData.lastName = formState.lastName.trim();
      }
      if (formState.email && formState.email.trim() !== '') {
        userData.email = formState.email.trim();
      }
      if (formState.phone && formState.phone.trim() !== '') {
        userData.phone = formState.phone.trim();
      }
      if (formState.dob && formState.dob.trim() !== '') {
        userData.dob = formState.dob.trim();
      }

      // Create user
      const createdUser = await authApi.createUser(userData);

      // Auto login after registration
      const loginResult = await login({
        username: formState.username,
        password: formState.password,
      });

      if (loginResult.success) {
        navigate('/', { replace: true });
      } else {
        setError('Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập lại.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.authWrapper}>
      <div style={styles.authCard}>
        <h1 style={styles.authTitle}>Tạo tài khoản</h1>
        <p style={styles.authSubtitle}>
          Sẵn sàng tham gia hành trình quản lý tài chính thông minh. Điền đầy đủ thông tin để tạo tài khoản.
        </p>

        {error && <div style={styles.authError}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.authForm}>
          <div style={styles.authField}>
            <label htmlFor="username" style={styles.authLabel}>
              Tên đăng nhập <span style={{ color: '#F44336' }}>*</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="james"
              value={formState.username}
              onChange={handleChange}
              style={styles.authInput}
              required
              minLength={4}
            />
            <p style={styles.authHint}>Tối thiểu 4 ký tự</p>
          </div>

          <div style={styles.authDoubleField}>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="firstName" style={styles.authLabel}>
                Họ
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="James"
                value={formState.firstName}
                onChange={handleChange}
                style={styles.authInput}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="lastName" style={styles.authLabel}>
                Tên
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Bond"
                value={formState.lastName}
                onChange={handleChange}
                style={styles.authInput}
              />
            </div>
          </div>

          <div style={styles.authField}>
            <label htmlFor="email" style={styles.authLabel}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="james.bond@example.com"
              value={formState.email}
              onChange={handleChange}
              style={styles.authInput}
            />
          </div>

          <div style={styles.authField}>
            <label htmlFor="phone" style={styles.authLabel}>
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="0987654321"
              value={formState.phone}
              onChange={handleChange}
              style={styles.authInput}
            />
            <p style={styles.authHint}>Từ 6 đến 20 ký tự</p>
          </div>

          <div style={styles.authField}>
            <label htmlFor="dob" style={styles.authLabel}>
              Ngày sinh
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              value={formState.dob}
              onChange={handleChange}
              style={styles.authInput}
            />
            <p style={styles.authHint}>Phải ít nhất 10 tuổi</p>
          </div>

          <div style={styles.authDoubleField}>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="password" style={styles.authLabel}>
                Mật khẩu <span style={{ color: '#F44336' }}>*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={formState.password}
                onChange={handleChange}
                style={styles.authInput}
                required
                minLength={6}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="confirmPassword" style={styles.authLabel}>
                Nhập lại mật khẩu <span style={{ color: '#F44336' }}>*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={formState.confirmPassword}
                onChange={handleChange}
                style={styles.authInput}
                required
              />
            </div>
          </div>

          <button type="submit" style={styles.authButton} disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p style={styles.authFooter}>
          Đã có tài khoản?{' '}
          <Link to="/auth/login" style={styles.authLink}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
