import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import ThemeCustomizer from '../../components/settings/ThemeCustomizer';
import { askQuestion } from '../../services/aiService';

const menuItems = [
  { icon: '🔔', label: 'Thông báo' },
  { icon: '🔒', label: 'Bảo mật' },
  { icon: '❓', label: 'Trợ giúp' },
];

const widgetConfigs = [
  {
    key: 'spending',
    title: '📊 Phân tích chi tiêu',
    context: 'SPENDING_WIDGET',
    conversationId: 'advisor-spending',
    description: 'Phân tích khoản chi nổi bật 7 ngày gần nhất.',
  },
  {
    key: 'saving',
    title: '💰 Gợi ý tiết kiệm',
    context: 'SAVING_WIDGET',
    conversationId: 'advisor-saving',
    description: 'Tiến độ tiết kiệm và đề xuất đóng góp tiếp theo.',
  },
  {
    key: 'goal',
    title: '🎯 Mục tiêu tiếp theo',
    context: 'GOAL_WIDGET',
    conversationId: 'advisor-goal',
    description: 'Mục tiêu tài chính cần ưu tiên cùng % hoàn thành.',
  },
];

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState(() =>
    widgetConfigs.map((config) => ({
      ...config,
      loading: true,
      error: null,
      answer: '',
      tips: [],
      disclaimers: [],
    }))
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/auth/login', { replace: true });
    }
  };

  const fetchWidget = async (key) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.key === key
          ? { ...widget, loading: true, error: null }
          : widget
      )
    );

    const config = widgetConfigs.find((item) => item.key === key);
    if (!config) return;

    try {
      const response = await askQuestion({
        conversationId: config.conversationId,
        context: config.context,
      });

      setWidgets((prev) =>
        prev.map((widget) =>
          widget.key === key
            ? {
                ...widget,
                loading: false,
                answer: response.answer || 'Chưa có dữ liệu để phân tích.',
                tips: response.tips || [],
                disclaimers: response.disclaimers || [],
              }
            : widget
        )
      );
    } catch (error) {
      setWidgets((prev) =>
        prev.map((widget) =>
          widget.key === key
            ? {
                ...widget,
                loading: false,
                error: error.message || 'Không thể tải dữ liệu AI',
              }
            : widget
        )
      );
    }
  };

  useEffect(() => {
    widgetConfigs.forEach((config) => fetchWidget(config.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          style={styles.menuItem}
          className="card-interactive"
        >
          <div style={styles.menuLeft}>
            <span style={styles.menuIcon}>👤</span>
            <span style={styles.menuLabel}>Thông tin cá nhân</span>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Brain size={24} color="#4CAF50" />
          <h3 style={styles.sectionTitle}>Tư vấn AI</h3>
        </div>
        {widgets.map((widget) => (
          <div key={widget.key} style={styles.aiCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={styles.aiCardTitle}>{widget.title}</p>
              <button
                type="button"
                onClick={() => fetchWidget(widget.key)}
                disabled={widget.loading}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: widget.loading ? 'not-allowed' : 'pointer',
                  color: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Làm mới"
              >
                {widget.loading ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
            </div>
            <p style={{ ...styles.aiCardText, color: '#757575', fontSize: '12px', marginTop: 0 }}>
              {widget.description}
            </p>
            {widget.error ? (
              <div style={{ color: '#F44336', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} />
                <span>{widget.error}</span>
              </div>
            ) : widget.loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Đang lấy dữ liệu từ AI...</span>
              </div>
            ) : (
              <>
                <p style={styles.aiCardText}>{widget.answer}</p>
                {widget.tips && widget.tips.length > 0 && (
                  <ul style={{ margin: '8px 0 0 16px', color: '#4CAF50', fontSize: '13px' }}>
                    {widget.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                )}
                {widget.disclaimers && widget.disclaimers.length > 0 && (
                  <p style={{ marginTop: 10, fontSize: '12px', color: '#999' }}>⚠️ {widget.disclaimers[0]}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Theme Customizer */}
      <ThemeCustomizer />

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Cài đặt</h3>
        {menuItems.map((item) => (
          <div key={item.label} style={styles.menuItem} className="card-interactive">
            <div style={styles.menuLeft}>
              <span style={styles.menuIcon}>{item.icon}</span>
              <span style={styles.menuLabel}>{item.label}</span>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <button
          type="button"
          style={{
            ...styles.menuItem,
            backgroundColor: 'var(--color-danger)',
            marginBottom: 0,
            width: '918px',
          }}
          className="card-interactive"
          onClick={handleLogout}
        >
          <div style={styles.menuLeft}>
            <span style={styles.menuIcon}>🚪</span>
            <span style={styles.menuLabel}>Đăng xuất</span>
          </div>
          <ChevronRight size={20} style={{ color: '#fff' }} />
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;

