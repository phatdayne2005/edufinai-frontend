import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import * as authApi from '../../services/authApi';

const PersonalInfoPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'edit'
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
  const [loading, setLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Fallback to default values if user is not loaded yet
  const displayUser = user || {
    name: 'Loading...',
    avatar: '👤',
  };

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

  const handleUpdate = async () => {
    setLoading(true);
    setUpdateError('');

    try {
      // Prepare update data - only include fields that have non-empty values
      // Note: Backend may require password field, but we don't want to change password
      // So we'll send empty string or omit it if backend allows
      const updateData = {};
      
      // Only include fields that are not empty strings
      if (formData.firstName && formData.firstName.trim() !== '') {
        updateData.firstName = formData.firstName.trim();
      }
      if (formData.lastName && formData.lastName.trim() !== '') {
        updateData.lastName = formData.lastName.trim();
      }
      if (formData.email && formData.email.trim() !== '') {
        updateData.email = formData.email.trim();
      }
      if (formData.phone && formData.phone.trim() !== '') {
        updateData.phone = formData.phone.trim();
      }
      if (formData.dob && formData.dob.trim() !== '') {
        updateData.dob = formData.dob.trim();
      }
      
      // Don't send password field - backend now handles null/empty password correctly
      // Password is only updated if explicitly provided in the request

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

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Chi tiết thông tin</h3>
        <div style={styles.infoCard}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Tên đăng nhập:</span>
            <span style={styles.infoValue}>{displayUser.username || 'N/A'}</span>
          </div>
          
          {displayUser.firstName && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Họ:</span>
              <span style={styles.infoValue}>{displayUser.firstName}</span>
            </div>
          )}
          
          {displayUser.lastName && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Tên:</span>
              <span style={styles.infoValue}>{displayUser.lastName}</span>
            </div>
          )}
          
          {displayUser.email && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Email:</span>
              <span style={styles.infoValue}>{displayUser.email}</span>
            </div>
          )}
          
          {displayUser.phone && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Số điện thoại:</span>
              <span style={styles.infoValue}>{displayUser.phone}</span>
            </div>
          )}
          
          {displayUser.dob && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Ngày sinh:</span>
              <span style={styles.infoValue}>
                {new Date(displayUser.dob).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
          
          {displayUser.roles && displayUser.roles.length > 0 && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Vai trò:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                {displayUser.roles.map((role, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#E8F5E9',
                      color: '#4CAF50',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: '1px solid #4CAF50',
                    }}
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Edit Tab - Update user information
  const renderEditTab = () => {
    if (!passwordVerified) {
      return (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Xác thực mật khẩu</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
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
                style={styles.authInput}
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
        <div style={styles.infoCard}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Tên đăng nhập:</span>
            <span style={styles.infoValue}>{displayUser.username || 'N/A'}</span>
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Họ:</span>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              style={{
                ...styles.infoValue,
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: '#fff',
              }}
              placeholder="Nhập họ"
            />
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Tên:</span>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              style={{
                ...styles.infoValue,
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: '#fff',
              }}
              placeholder="Nhập tên"
            />
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Email:</span>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                ...styles.infoValue,
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: '#fff',
              }}
              placeholder="Nhập email"
            />
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Số điện thoại:</span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              style={{
                ...styles.infoValue,
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: '#fff',
              }}
              placeholder="Nhập số điện thoại"
            />
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Ngày sinh:</span>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
              style={{
                ...styles.infoValue,
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: '#fff',
              }}
            />
          </div>
          
          {displayUser.roles && displayUser.roles.length > 0 && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Vai trò:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                {displayUser.roles.map((role, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#E8F5E9',
                      color: '#4CAF50',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '500',
                      border: '1px solid #4CAF50',
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
            backgroundColor: '#4CAF50',
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
    <div style={styles.page}>
      <Header 
        title="Thông tin cá nhân" 
        subtitle="Chi tiết thông tin tài khoản"
        action={
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#212121',
            }}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        }
      />

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid #E0E0E0',
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('view');
            setPasswordVerified(false);
            setUpdateError('');
          }}
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'view' ? '2px solid #4CAF50' : '2px solid transparent',
            color: activeTab === 'view' ? '#4CAF50' : '#666',
            fontWeight: activeTab === 'view' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Xem thông tin
        </button>
        <button
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
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'edit' ? '2px solid #4CAF50' : '2px solid transparent',
            color: activeTab === 'edit' ? '#4CAF50' : '#666',
            fontWeight: activeTab === 'edit' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Cập nhật thông tin
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'view' ? renderViewTab() : renderEditTab()}

      <button
        type="button"
        onClick={handleBack}
        style={{
          ...styles.logoutButton,
          backgroundColor: '#4CAF50',
          marginTop: '20px',
        }}
      >
        Quay lại
      </button>

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
              color: '#666',
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
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#212121',
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
                  backgroundColor: '#4CAF50',
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
  );
};

export default PersonalInfoPage;
