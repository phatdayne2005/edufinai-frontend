import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import { logInfo, logError, logDebug, exportLogs, clearLogs, getLogs } from '../../utils/logger';
import { testAuth } from '../../utils/apiTest';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, enableBypass, authEnabled, bypassed } = useAuth();
  const [formState, setFormState] = useState({ username: '', password: '', name: '' });
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
    logInfo('login', { username: formState.username }, 'Bắt đầu quá trình đăng nhập');

    try {
      const requestBody = {
        username: formState.username,
        password: formState.password,
      };

      logDebug('login', {
        url: 'http://localhost:8080/auth/token',
        method: 'POST',
        body: requestBody,
      }, 'Gửi request đăng nhập');

      const response = await fetch('http://localhost:8080/auth/token', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Log response status and headers
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      logInfo('login', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: responseHeaders,
      }, 'Nhận được response từ server');

      // Get response text first to debug
      const responseText = await response.text();
      logDebug('login', { responseText }, 'Response text từ server');

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        logInfo('login', data, 'Parsed JSON data thành công');
      } catch (parseError) {
        logError('login', {
          parseError: parseError.message,
          responseText: responseText,
          status: response.status,
        }, 'Lỗi khi parse JSON từ response');
        throw new Error(`Lỗi khi đọc response từ server: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 100)}`);
      }

      // Check if response is successful based on status code
      if (!response.ok) {
        const errorMessage = data.message || data.error || data.result?.message || `Đăng nhập thất bại: ${response.status}`;
        logError('login', data, `Response không thành công: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Response structure: { code: 1000, result: { token: "...", authenticated: true } }
      const token = data.result?.token;

      if (!token) {
        logError('login', data, 'Không tìm thấy token trong response');
        throw new Error('Không nhận được token từ server. Vui lòng kiểm tra response structure.');
      }

      logInfo('login', { tokenLength: token.length }, 'Token nhận được thành công');

      // Save token to localStorage
      localStorage.setItem('jwt_token', token);

      // Call login function with token and user info
      login({
        username: formState.username,
        name: formState.name || undefined,
        token: token,
      });

      logInfo('login', { username: formState.username }, 'Đăng nhập thành công');

      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      logError('login', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      }, 'Lỗi trong quá trình đăng nhập');

      // Handle network errors
      if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('network'))) {
        const corsError = err.message.includes('CORS') || err.message.includes('Access-Control-Allow-Origin');
        if (corsError) {
          setError('Lỗi CORS: Header Access-Control-Allow-Origin bị trùng lặp. Vui lòng kiểm tra cấu hình CORS ở backend (gateway).');
        } else {
          setError('Không thể kết nối đến server. Vui lòng kiểm tra:\n- Backend đã chạy chưa?\n- URL có đúng không?\n- CORS đã được cấu hình chưa?');
        }
      } else {
        setError(err.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
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

        {/* Debug controls */}
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Debug Tools:</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                exportLogs();
                alert('Logs đã được tải xuống!');
              }}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              📥 Tải xuống Logs ({getLogs().length} entries)
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn xóa tất cả logs?')) {
                  clearLogs();
                  alert('Logs đã được xóa!');
                }
              }}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🗑️ Xóa Logs
            </button>
            <button
              type="button"
              onClick={() => {
                testAuth.showToken();
              }}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🔑 Xem Token
            </button>
            <button
              type="button"
              onClick={() => {
                const url = prompt('Nhập URL để test (ví dụ: http://localhost:8080/auth/me):', 'http://localhost:8080/auth/me');
                if (url) {
                  testAuth.call(url, 'GET');
                }
              }}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🧪 Test API
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
            💡 Hoặc mở Console (F12) và dùng: <code>testApi(url, method, body)</code> hoặc <code>testAuth.getCurrentUser()</code>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.authForm}>
          <div style={styles.authField}>
            <label htmlFor="username" style={styles.authLabel}>
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="phatadmin"
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

          <button type="submit" style={styles.authButton} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
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

