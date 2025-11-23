import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, Loader2, RefreshCw, AlertCircle, Award, Trophy } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import ThemeCustomizer from '../../components/settings/ThemeCustomizer';
import { askQuestion } from '../../services/aiService';
import { getMyBadges, getUserRewards } from '../../services/gamificationApi';

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
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState(null);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(true);

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

  // Fetch badges and rewards
  const fetchGamificationData = async () => {
    try {
      setBadgesLoading(true);
      setRewardsLoading(true);

      const [badgesData, rewardsData] = await Promise.all([
        getMyBadges().catch(() => ({ code: 200, result: [], message: '' })),
        getUserRewards().catch(() => null),
      ]);

      // Handle badges response: { code, result[], message }
      setBadges(badgesData?.result || []);

      // Handle rewards response: { userId, totalScore, rewardDetail[] }
      setRewards(rewardsData);
    } catch (err) {
      console.error('Error fetching gamification data:', err);
      setBadges([]);
      setRewards(null);
    } finally {
      setBadgesLoading(false);
      setRewardsLoading(false);
    }
  };

  useEffect(() => {
    widgetConfigs.forEach((config) => fetchWidget(config.key));
    fetchGamificationData();
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
        {rewards && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={18} color="#FFD700" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {Math.round(rewards.totalScore || 0).toLocaleString()} điểm
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} color="#2196F3" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {badges.length} badge{badges.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
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

      {/* Badges Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Award size={24} color="#2196F3" />
          <h3 style={styles.sectionTitle}>Badges đạt được</h3>
        </div>
        {badgesLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', padding: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Đang tải badges...</span>
          </div>
        ) : badges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <p>Chưa có badge nào. Hãy hoàn thành các thử thách để nhận badge!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {badges.map((badge) => (
              <div
                key={badge.badgeCode}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {badge.iconUrl ? (
                  <img 
                    src={badge.iconUrl} 
                    alt={badge.badgeName}
                    style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div style={{ fontSize: '32px', display: badge.iconUrl ? 'none' : 'block' }}>
                  🏆
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>
                    {badge.badgeName || badge.badgeCode}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                    {badge.badgeDescription || ''}
                  </p>
                  {badge.count > 1 && (
                    <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>
                      Đạt được {badge.count} lần
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards Section */}
      {rewards && rewards.rewardDetail && rewards.rewardDetail.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Trophy size={24} color="#FFD700" />
            <h3 style={styles.sectionTitle}>Lịch sử phần thưởng</h3>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {rewards.rewardDetail.slice(0, 10).map((reward) => (
              <div
                key={reward.rewardId}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>
                    {reward.badge ? `🏆 ${reward.badge}` : `💰 +${reward.score} điểm`}
                  </p>
                  {reward.reason && (
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                      {reward.reason}
                    </p>
                  )}
                  {reward.createdAt && (
                    <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>
                      {new Date(reward.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4CAF50' }}>
                  +{reward.score} điểm
                </div>
              </div>
            ))}
            {rewards.rewardDetail.length > 10 && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Và {rewards.rewardDetail.length - 10} phần thưởng khác...
              </p>
            )}
          </div>
        </div>
      )}

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
          style={{ ...styles.profileLogoutButton, marginBottom: 0 }}
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

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ProfilePage;

