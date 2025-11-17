import React from 'react';
import { Brain, ChevronRight } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/appStyles';

const menuItems = [
  { icon: '👤', label: 'Thông tin cá nhân' },
  { icon: '🔔', label: 'Thông báo' },
  { icon: '🔒', label: 'Bảo mật' },
  { icon: '🌙', label: 'Giao diện tối' },
  { icon: '❓', label: 'Trợ giúp' },
];

const ProfilePage = () => {
  const { user } = useApp();

  return (
    <div style={styles.page}>
      <Header title="Cá nhân" subtitle="Quản lý thông tin và cài đặt" />

      <div style={styles.profileCard}>
        <div style={styles.profileAvatar}>{user.avatar}</div>
        <h3 style={styles.profileName}>{user.name}</h3>
        <p style={styles.profileLevel}>
          Level {user.level} • {user.points} điểm
        </p>
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

      <button type="button" style={styles.logoutButton}>
        Đăng xuất
      </button>
    </div>
  );
};

export default ProfilePage;

