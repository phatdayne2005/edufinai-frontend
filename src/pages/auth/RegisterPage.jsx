import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formState.email || !formState.password || !formState.name) {
      setError('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.');
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    register({
      email: formState.email,
      name: formState.name,
    });

    navigate('/', { replace: true });
  };

  return (
    <div style={styles.authWrapper}>
      <div style={styles.authCard}>
        <h1 style={styles.authTitle}>Tạo tài khoản</h1>
        <p style={styles.authSubtitle}>
          Sẵn sàng tham gia hành trình quản lý tài chính thông minh. Bạn chỉ cần vài thông tin cơ bản.
        </p>

        {error && <div style={styles.authError}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.authForm}>
          <div style={styles.authField}>
            <label htmlFor="name" style={styles.authLabel}>
              Họ và tên
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formState.name}
              onChange={handleChange}
              style={styles.authInput}
              required
            />
          </div>

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

          <div style={styles.authDoubleField}>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="password" style={styles.authLabel}>
                Mật khẩu
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
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label htmlFor="confirmPassword" style={styles.authLabel}>
                Nhập lại mật khẩu
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

          <button type="submit" style={styles.authButton}>
            Đăng ký
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

