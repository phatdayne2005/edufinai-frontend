import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import * as authApi from '../../services/authApi';

const PersonalInfoPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'edit', or 'changePassword'
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [verifiedPassword, setVerifiedPassword] = useState(''); // Store verified password
  const [passwordError, setPasswordError] = useState('');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob ? user.dob.split('T')[0] : '', // Format YYYY-MM-DD
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changePasswordError, setChangePasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const tabsRef = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabElement = tabsRef.current[activeTab];
      if (activeTabElement) {
        setIndicatorStyle({
          left: activeTabElement.offsetLeft,
          width: activeTabElement.offsetWidth,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    
    // Small timeout to ensure layout is stable (e.g. fonts loaded)
    const timeoutId = setTimeout(updateIndicator, 50);

    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timeoutId);
    };
  }, [activeTab]);

  // Fallback to default values if user is not loaded yet
  const displayUser = user || {
    name: 'Loading...',
    avatar: '👤',
  };

  const accentColor = 'var(--color-primary)';
  const accentSoftColor = 'var(--color-primary-soft)';
  const textPrimaryColor = 'var(--text-primary)';
  const textMutedColor = 'var(--text-secondary)';
  const borderSubtleColor = 'var(--border-subtle)';

  const infoCardStyle = { ...styles.infoCard, border: 'none', boxShadow: 'none' };
  const infoRowStyle = { ...styles.infoRow, borderBottom: 'none' };
  const infoInputStyle = {
    ...styles.infoValue,
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: textPrimaryColor,
    boxShadow: 'none',
  };
  const authInputStyle = {
    ...styles.authInput,
    border: 'none',
    borderRadius: '999px',
    padding: '14px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: textPrimaryColor,
    boxShadow: 'none',
  };

  const getTabButtonStyle = (isActive) => ({
    padding: '12px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? accentColor : textMutedColor,
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'color 0.3s ease',
    position: 'relative',
    zIndex: 1,
  });

  const handleBack = () => {
    // Navigate back to home and set active tab to profile
    navigate('/', { replace: true, state: { activeTab: 'profile' } });
  };

  const handlePasswordVerify = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      // Verify password by attempting login
      await authApi.login(user.username, password);
      setPasswordVerified(true);
      setVerifiedPassword(password); // Store verified password for later use
      setPassword('');
    } catch (error) {
      setPasswordError('Mật khẩu không đúng');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePasswordInput = (field, value) => {
    setChangePasswordData(prev => ({ ...prev, [field]: value }));
    setChangePasswordError(''); // Clear error when user types
  };

  const handleChangePassword = async () => {
    setChangePasswordError('');
    setLoading(true);

    try {
      // Validation
      if (!changePasswordData.oldPassword) {
        setChangePasswordError('Vui lòng nhập mật khẩu cũ');
        setLoading(false);
        return;
      }

      if (!changePasswordData.newPassword) {
        setChangePasswordError('Vui lòng nhập mật khẩu mới');
        setLoading(false);
        return;
      }

      if (changePasswordData.newPassword.length < 6) {
        setChangePasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
        setLoading(false);
        return;
      }

      if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
        setChangePasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp');
        setLoading(false);
        return;
      }

      // Verify old password
      try {
        await authApi.login(user.username, changePasswordData.oldPassword);
      } catch (error) {
        setChangePasswordError('Mật khẩu cũ không đúng');
        setLoading(false);
        return;
      }

      // Update password
      const updateData = {
        password: changePasswordData.newPassword,
      };

      console.log('Changing password for user:', user.id);

      const updatedUser = await authApi.updateUser(user.id, updateData);

      console.log('Password changed successfully');

      // Update user in context
      const updatedUserData = {
        id: updatedUser.id,
        username: updatedUser.username,
        name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.username,
        email: updatedUser.email || updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        dob: updatedUser.dob,
        phone: updatedUser.phone,
        roles: updatedUser.roles || [],
        avatar: user.avatar || '👤',
        level: user.level || 1,
        points: user.points || 0,
      };
      setUser(updatedUserData);

      // Reset form after successful password change
      setChangePasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setChangePasswordError('');

      // Show success message and optionally switch to view tab
      alert('Đổi mật khẩu thành công!');
      // Optionally switch to view tab after success
      // setActiveTab('view');
    } catch (error) {
      console.error('Change password error:', error);
      setChangePasswordError(error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setUpdateError('');

    try {
      // Prepare update data - only include fields that have non-empty values
      // IMPORTANT: Only include fields that user actually wants to update
      // Do NOT include fields that are null/empty to prevent data loss
      const updateData = {};
      
      // Only include fields that have non-empty values (not null, not undefined, not empty string)
      // This ensures we only update fields that user explicitly wants to change
      if (formData.firstName !== null && formData.firstName !== undefined && formData.firstName.trim() !== '') {
        updateData.firstName = formData.firstName.trim();
      }
      if (formData.lastName !== null && formData.lastName !== undefined && formData.lastName.trim() !== '') {
        updateData.lastName = formData.lastName.trim();
      }
      if (formData.email !== null && formData.email !== undefined && formData.email.trim() !== '') {
        updateData.email = formData.email.trim();
      }
      if (formData.phone !== null && formData.phone !== undefined && formData.phone.trim() !== '') {
        updateData.phone = formData.phone.trim();
      }
      if (formData.dob !== null && formData.dob !== undefined && formData.dob.trim() !== '') {
        updateData.dob = formData.dob.trim();
      }
      
      // NEVER send password field when updating other info
      // Password is only updated via the change password dialog

      // Check if there's any data to update
      if (Object.keys(updateData).length === 0) {
        setUpdateError('Vui lòng nhập ít nhất một trường để cập nhật');
        setLoading(false);
        return;
      }

      console.log('Updating user with data:', updateData);
      console.log('User ID:', user.id);
      console.log('Full request body:', JSON.stringify(updateData, null, 2));
      
      // Check token before making request
      const token = authApi.getStoredToken();
      console.log('Token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? token.substring(0, 30) + '...' : 'No token',
      });

      // Call API to update user
      const updatedUser = await authApi.updateUser(user.id, updateData);
      
      console.log('User updated successfully:', updatedUser);

      // Update user in context with proper format
      const updatedUserData = {
        id: updatedUser.id,
        username: updatedUser.username,
        name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.username,
        email: updatedUser.email || updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        dob: updatedUser.dob,
        phone: updatedUser.phone,
        roles: updatedUser.roles || [],
        avatar: user.avatar || '👤',
        level: user.level || 1,
        points: user.points || 0,
      };
      setUser(updatedUserData);

      // Close dialog and switch back to view tab
      setShowConfirmDialog(false);
      setActiveTab('view');
      setPasswordVerified(false);
      setFormData({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        dob: updatedUser.dob ? updatedUser.dob.split('T')[0] : '',
      });
    } catch (error) {
      console.error('Update user error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack,
      });
      
      // Show more detailed error message
      let errorMessage = 'Cập nhật thất bại';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Lỗi ${error.code}: ${error.message || 'Cập nhật thất bại'}`;
      } else if (error.status) {
        errorMessage = `Lỗi HTTP ${error.status}: ${error.message || 'Cập nhật thất bại'}`;
      }
      
      setUpdateError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // View Tab - Display user information
  const renderViewTab = () => (
    <>
      <div style={styles.profileCard}>
        <div style={{
           position: 'absolute',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           background: 'linear-gradient(to bottom right, hsl(var(--accent-hue) var(--accent-saturation) var(--accent-lightness) / 0.05), transparent)',
           pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={styles.profileAvatar}>{displayUser.avatar || '👤'}</div>
          <h3 style={styles.profileName}>
            {displayUser.name || displayUser.username || 'User'}
          </h3>
          <p style={styles.profileLevel}>
            {displayUser.email && <span>{displayUser.email}</span>}
            {displayUser.username && displayUser.email && ' • '}
            {displayUser.username && <span>@{displayUser.username}</span>}
          </p>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Chi tiết thông tin</h3>
        <div style={infoCardStyle}>
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Tên đăng nhập:</span>
            <span style={styles.infoValue}>{displayUser.username || 'N/A'}</span>
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Họ:</span>
            <span style={styles.infoValue}>{displayUser.firstName || 'N/A'}</span>
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Tên:</span>
            <span style={styles.infoValue}>{displayUser.lastName || 'N/A'}</span>
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Email:</span>
            <span style={styles.infoValue}>{displayUser.email || 'N/A'}</span>
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Số điện thoại:</span>
            <span style={styles.infoValue}>{displayUser.phone || 'N/A'}</span>
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Ngày sinh:</span>
            <span style={styles.infoValue}>
              {displayUser.dob ? new Date(displayUser.dob).toLocaleDateString('vi-VN') : 'N/A'}
            </span>
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Vai trò:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
              {displayUser.roles && displayUser.roles.length > 0 ? (
                displayUser.roles.map((role, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: accentSoftColor,
                      color: accentColor,
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: `1px solid ${accentColor}`,
                    }}
                  >
                    {role.name}
                  </span>
                ))
              ) : (
                <span style={styles.infoValue}>N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Change Password Tab - Change password
  const renderChangePasswordTab = () => {
    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Đổi mật khẩu</h3>
        <p style={{ fontSize: '14px', color: textMutedColor, marginBottom: '20px' }}>
          Vui lòng nhập mật khẩu cũ và mật khẩu mới để thay đổi mật khẩu
        </p>

        {changePasswordError && (
          <div style={{
            padding: '12px',
            backgroundColor: '#FFEBEE',
            border: '1px solid #F44336',
            borderRadius: '8px',
            color: '#F44336',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            {changePasswordError}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          handleChangePassword();
        }} style={styles.authForm}>
          <div style={styles.authField}>
            <label htmlFor="oldPassword" style={styles.authLabel}>
              Mật khẩu cũ <span style={{ color: '#F44336' }}>*</span>
            </label>
            <input
              id="oldPassword"
              type="password"
              value={changePasswordData.oldPassword}
              onChange={(e) => handleChangePasswordInput('oldPassword', e.target.value)}
              placeholder="Nhập mật khẩu cũ"
              style={authInputStyle}
              required
            />
          </div>

          <div style={styles.authField}>
            <label htmlFor="newPassword" style={styles.authLabel}>
              Mật khẩu mới <span style={{ color: '#F44336' }}>*</span>
            </label>
            <input
              id="newPassword"
              type="password"
              value={changePasswordData.newPassword}
              onChange={(e) => handleChangePasswordInput('newPassword', e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              style={authInputStyle}
              required
              minLength={6}
            />
          </div>

          <div style={styles.authField}>
            <label htmlFor="confirmPassword" style={styles.authLabel}>
              Xác nhận mật khẩu mới <span style={{ color: '#F44336' }}>*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={changePasswordData.confirmPassword}
              onChange={(e) => handleChangePasswordInput('confirmPassword', e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              style={authInputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.authButton,
              backgroundColor: loading ? '#ccc' : '#2196F3',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    );
  };

  // Edit Tab - Update user information
  const renderEditTab = () => {
    if (!passwordVerified) {
      return (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Xác thực mật khẩu</h3>
          <p style={{ fontSize: '14px', color: textMutedColor, marginBottom: '20px' }}>
            Vui lòng nhập mật khẩu để xác thực trước khi cập nhật thông tin
          </p>
          <form onSubmit={handlePasswordVerify} style={styles.authForm}>
            <div style={styles.authField}>
              <label htmlFor="password" style={styles.authLabel}>
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                style={authInputStyle}
                required
              />
              {passwordError && (
                <p style={{ color: '#F44336', fontSize: '12px', marginTop: '4px' }}>
                  {passwordError}
                </p>
              )}
            </div>
            <button type="submit" style={styles.authButton}>
              Xác thực
            </button>
          </form>
        </div>
      );
    }

    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Cập nhật thông tin</h3>
        <div style={infoCardStyle}>
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Tên đăng nhập:</span>
            <span style={styles.infoValue}>{displayUser.username || 'N/A'}</span>
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Họ:</span>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              style={infoInputStyle}
              placeholder="Nhập họ"
            />
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Tên:</span>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              style={infoInputStyle}
              placeholder="Nhập tên"
            />
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Email:</span>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={infoInputStyle}
              placeholder="Nhập email"
            />
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Số điện thoại:</span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              style={infoInputStyle}
              placeholder="Nhập số điện thoại"
            />
          </div>
          
          <div style={infoRowStyle}>
            <span style={styles.infoLabel}>Ngày sinh:</span>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
              style={infoInputStyle}
            />
          </div>
          
          {displayUser.roles && displayUser.roles.length > 0 && (
            <div style={infoRowStyle}>
              <span style={styles.infoLabel}>Vai trò:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                {displayUser.roles.map((role, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: accentSoftColor,
                      color: accentColor,
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: `1px solid ${accentColor}`,
                    }}
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {updateError && (
          <div style={{
            padding: '12px',
            backgroundColor: '#FFEBEE',
            border: '1px solid #F44336',
            borderRadius: '8px',
            color: '#F44336',
            fontSize: '14px',
            marginTop: '16px',
          }}>
            {updateError}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowConfirmDialog(true)}
          style={{
            ...styles.logoutButton,
            backgroundColor: accentColor,
            marginTop: '20px',
          }}
          disabled={loading}
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật'}
        </button>
      </div>
    );
  };

  return (
    <div style={{ ...styles.app, paddingBottom: 0 }}>
      <div style={styles.page}>
      <Header 
        title="Thông tin cá nhân" 
        subtitle="Chi tiết thông tin tài khoản"
        action={
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: accentColor,
            }}
          >
            <ArrowLeft size={18} color={accentColor} />
            Quay lại
          </button>
        }
      />

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: `1px solid ${borderSubtleColor}`,
        position: 'relative',
      }}>
        <button
          ref={(el) => (tabsRef.current['view'] = el)}
          type="button"
          onClick={() => {
            setActiveTab('view');
            setPasswordVerified(false);
            setUpdateError('');
          }}
          style={getTabButtonStyle(activeTab === 'view')}
        >
          Xem thông tin
        </button>
        <button
          ref={(el) => (tabsRef.current['edit'] = el)}
          type="button"
          onClick={() => {
            setActiveTab('edit');
            setPasswordVerified(false);
            setPassword('');
            setPasswordError('');
            setUpdateError('');
            // Reset form data to current user data
            setFormData({
              firstName: user?.firstName || '',
              lastName: user?.lastName || '',
              email: user?.email || '',
              phone: user?.phone || '',
              dob: user?.dob ? user.dob.split('T')[0] : '',
            });
          }}
          style={getTabButtonStyle(activeTab === 'edit')}
        >
          Cập nhật thông tin
        </button>
        <button
          ref={(el) => (tabsRef.current['changePassword'] = el)}
          type="button"
          onClick={() => {
            setActiveTab('changePassword');
            setChangePasswordError('');
            setChangePasswordData({
              oldPassword: '',
              newPassword: '',
              confirmPassword: '',
            });
          }}
          style={getTabButtonStyle(activeTab === 'changePassword')}
        >
          Đổi mật khẩu
        </button>
        
        <div
          style={{
            position: 'absolute',
            bottom: '-1px',
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            height: '2px',
            backgroundColor: accentColor,
            transition: 'all 0.3s ease',
            zIndex: 2,
          }}
        />
      </div>

      <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${['view', 'edit', 'changePassword'].indexOf(activeTab) * 100}%)`,
            transition: 'transform 0.3s ease-in-out',
            alignItems: 'flex-start', // Ensure items are aligned at top
          }}
        >
          <div style={{ minWidth: '100%', flexShrink: 0, boxSizing: 'border-box' }}>
            {renderViewTab()}
          </div>
          <div style={{ minWidth: '100%', flexShrink: 0, boxSizing: 'border-box' }}>
            {renderEditTab()}
          </div>
          <div style={{ minWidth: '100%', flexShrink: 0, boxSizing: 'border-box' }}>
            {renderChangePasswordTab()}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              color: '#212121',
            }}>
              Xác nhận cập nhật
            </h3>
            <p style={{
              fontSize: '14px',
              color: textMutedColor,
              margin: '0 0 20px 0',
            }}>
              Bạn có chắc chắn muốn cập nhật thông tin cá nhân không?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${borderSubtleColor}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: textPrimaryColor,
                  fontWeight: 600,
                }}
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: accentColor,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: '#fff',
                  fontWeight: '600',
                }}
              >
                {loading ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default PersonalInfoPage;
