import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { styles } from '../../styles/appStyles';
import { forgotPassword, verifyOtp, resetPassword } from '../../services/authApi';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await forgotPassword(email);
            setStep(2);
            setMessage('Mã OTP đã được gửi đến email của bạn.');
        } catch (err) {
            setError(err.message || 'Không thể gửi OTP. Vui lòng kiểm tra lại email.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const isValid = await verifyOtp(email, otp);
            if (isValid) {
                setStep(3);
                setMessage('Xác thực OTP thành công. Vui lòng nhập mật khẩu mới.');
            } else {
                setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
            }
        } catch (err) {
            setError(err.message || 'Lỗi xác thực OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await resetPassword(email, otp, newPassword);
            setMessage('Đặt lại mật khẩu thành công!');
            setTimeout(() => {
                navigate('/auth/login');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Không thể đặt lại mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.authWrapper}>
            <div style={styles.authSpectrum} aria-hidden />
            <div style={styles.authBackdrop} aria-hidden />
            <div style={styles.authBackdropGlow} aria-hidden />
            <div style={styles.authCard}>
                <h1 style={styles.authTitle}>Quên mật khẩu</h1>
                <p style={styles.authSubtitle}>
                    {step === 1 && 'Nhập email để nhận mã xác thực.'}
                    {step === 2 && 'Nhập mã OTP 6 số đã được gửi đến email.'}
                    {step === 3 && 'Nhập mật khẩu mới của bạn.'}
                </p>

                {error && <div style={styles.authError}>{error}</div>}
                {message && <div style={{ ...styles.authNotice, color: 'green', borderColor: 'green' }}>{message}</div>}

                {step === 1 && (
                    <form onSubmit={handleEmailSubmit} style={styles.authForm}>
                        <div style={styles.authField}>
                            <label style={styles.authLabel}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={styles.authInput}
                                required
                                placeholder="example@email.com"
                            />
                        </div>
                        <button type="submit" style={styles.authButton} disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleOtpSubmit} style={styles.authForm}>
                        <div style={styles.authField}>
                            <label style={styles.authLabel}>Mã OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                style={styles.authInput}
                                required
                                placeholder="123456"
                                maxLength={6}
                            />
                        </div>
                        <button type="submit" style={styles.authButton} disabled={loading}>
                            {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={{ ...styles.authButton, background: 'transparent', color: '#666', marginTop: '10px' }}
                        >
                            Quay lại
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handlePasswordSubmit} style={styles.authForm}>
                        <div style={styles.authField}>
                            <label style={styles.authLabel}>Mật khẩu mới</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={styles.authInput}
                                required
                                placeholder="Nhập mật khẩu mới"
                            />
                        </div>
                        <div style={styles.authField}>
                            <label style={styles.authLabel}>Xác nhận mật khẩu</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={styles.authInput}
                                required
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </div>
                        <button type="submit" style={styles.authButton} disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>
                    </form>
                )}

                <p style={styles.authFooter}>
                    <Link to="/auth/login" style={styles.authLink}>
                        Quay lại đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
