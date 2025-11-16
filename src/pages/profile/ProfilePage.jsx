import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';

const menuItems = [
  { icon: '🔔', label: 'Thông báo' },
  { icon: '🔒', label: 'Bảo mật' },
  { icon: '🌙', label: 'Giao diện tối' },
  { icon: '❓', label: 'Trợ giúp' },
];

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/auth/login', { replace: true });
    }
  };

  // Fallback to default values if user is not loaded yet
  const displayUser = user || {
    name: 'Loading...',
    avatar: '👤',
    level: 1,
    points: 0,
  };

  return (
    <div style={styles.page}>
      <Header title="Cá nhân" subtitle="Quản lý thông tin và cài đặt" />

      <div style={styles.profileCard}>
        <div style={styles.profileAvatar}>{displayUser.avatar || '👤'}</div>
        <h3 style={styles.profileName}>{displayUser.name || displayUser.username || 'User'}</h3>
        <p style={styles.profileLevel}>
          {displayUser.email && <span>{displayUser.email}</span>}
          {displayUser.username && displayUser.email && ' • '}
          {displayUser.username && <span>@{displayUser.username}</span>}
        </p>
      </div>

      {/* Nút xem thông tin cá nhân */}
      <div style={styles.section}>
        <button
          type="button"
          onClick={() => navigate('/profile/personal-info')}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#fff',
            border: '1px solid #E0E0E0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
          }}
        >
          <div style={styles.menuLeft}>
            <span style={styles.menuIcon}>👤</span>
            <span style={styles.menuLabel}>Thông tin cá nhân</span>
          </div>
          <ChevronRight size={20} color="#666" />
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Brain size={24} color="#4CAF50" />
          <h3 style={styles.sectionTitle}>Tư vấn AI</h3>
        </div>
        <div style={styles.aiCard}>
          <p style={styles.aiCardTitle}>📊 Phân tích chi tiêu</p>
          <p style={styles.aiCardText}>Chi tiêu tháng này giảm 40% so với tháng trước. Bạn đang làm rất tốt!</p>
        </div>
        <div style={styles.aiCard}>
          <p style={styles.aiCardTitle}>💰 Gợi ý tiết kiệm</p>
          <p style={styles.aiCardText}>
            Hãy cân nhắc chuyển 10% thu nhập vào quỹ đầu tư dài hạn để tối ưu lợi nhuận.
          </p>
        </div>
        <div style={styles.aiCard}>
          <p style={styles.aiCardTitle}>🎯 Mục tiêu tiếp theo</p>
          <p style={styles.aiCardText}>
            Với tốc độ tiết kiệm hiện tại, bạn có thể đạt mục tiêu "Mua laptop mới" trong 2 tháng nữa.
          </p>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Cài đặt</h3>
        {menuItems.map((item) => (
          <div key={item.label} style={styles.menuItem}>
            <div style={styles.menuLeft}>
              <span style={styles.menuIcon}>{item.icon}</span>
              <span style={styles.menuLabel}>{item.label}</span>
            </div>
            <ChevronRight size={20} color="#666" />
          </div>
        ))}
      </div>

      <button 
        type="button" 
        style={styles.logoutButton}
        onClick={handleLogout}
      >
        Đăng xuất
      </button>
    </div>
  );
};

export default ProfilePage;

