import React, { useEffect, useState } from 'react';
import { Brain, ChevronRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/appStyles';
import { askQuestion } from '../../services/edufinaiApi';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { icon: '👤', label: 'Thông tin cá nhân' },
  { icon: '🔔', label: 'Thông báo' },
  { icon: '🔒', label: 'Bảo mật' },
  { icon: '🌙', label: 'Giao diện tối' },
  { icon: '❓', label: 'Trợ giúp' },
];

const widgetConfigs = [
  {
    key: 'spending',
    title: '📊 Phân tích chi tiêu',
    context: 'SPENDING_WIDGET',
    conversationId: 'advisor-spending',
    description: 'Phân tích khoản chi nổi bật trong 7 ngày.',
  },
  {
    key: 'saving',
    title: '💰 Gợi ý tiết kiệm',
    context: 'SAVING_WIDGET',
    conversationId: 'advisor-saving',
    description: 'Gợi ý cách tối ưu khoản tiết kiệm hiện tại.',
  },
  {
    key: 'goal',
    title: '🎯 Mục tiêu tiếp theo',
    context: 'GOAL_WIDGET',
    conversationId: 'advisor-goal',
    description: 'Nhắc nhở mục tiêu cần ưu tiên cùng % hoàn thành.',
  },
];

const ProfilePage = () => {
  const { user } = useApp();
  const auth = useAuth();
  const [widgets, setWidgets] = useState(() =>
    widgetConfigs.map((config) => ({
      ...config,
      loading: true,
      error: null,
      answer: '',
      tips: [],
      disclaimers: [],
      lastUpdated: null,
    }))
  );

  useEffect(() => {
    widgetConfigs.forEach((config) => {
      fetchWidget(config.key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWidget = async (key) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.key === key
          ? {
              ...widget,
              loading: true,
              error: null,
            }
          : widget
      )
    );

    const config = widgetConfigs.find((item) => item.key === key);
    if (!config) return;

    try {
      const response = await askQuestion(
        null,
        auth?.user?.id || auth?.user?.email || null,
        config.conversationId,
        config.context
      );

      setWidgets((prev) =>
        prev.map((widget) =>
          widget.key === key
            ? {
                ...widget,
                loading: false,
                answer: response.answer || 'Chưa có dữ liệu để phân tích.',
                tips: response.tips || [],
                disclaimers: response.disclaimers || [],
                lastUpdated: new Date(),
              }
            : widget
        )
      );
    } catch (error) {
      console.error('[ProfilePage] Failed to load widget', key, error);
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
        {widgets.map((widget) => (
          <div key={widget.key} style={{ ...styles.aiCard, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={styles.aiCardTitle}>{widget.title}</p>
              <button
                type="button"
                onClick={() => fetchWidget(widget.key)}
                disabled={widget.loading}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: widget.loading ? 'not-allowed' : 'pointer',
                  color: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Làm mới gợi ý"
              >
                {widget.loading ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
            </div>
            <p style={{ ...styles.aiCardText, color: '#757575', marginBottom: '8px', fontSize: '12px' }}>{widget.description}</p>
            {widget.error ? (
              <div style={{ color: '#F44336', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{widget.error}</span>
              </div>
            ) : widget.loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Đang lấy gợi ý từ AI...</span>
              </div>
            ) : (
              <>
                <p style={styles.aiCardText}>{widget.answer}</p>
                {widget.tips && widget.tips.length > 0 && (
                  <ul style={{ marginTop: '8px', paddingLeft: '18px', color: '#4CAF50', fontSize: '13px' }}>
                    {widget.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                )}
                {widget.disclaimers && widget.disclaimers.length > 0 && (
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                    ⚠️ {widget.disclaimers[0]}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
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

