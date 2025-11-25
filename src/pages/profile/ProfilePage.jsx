import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Award, Trophy } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import ThemeCustomizer from '../../components/settings/ThemeCustomizer';
import { getMyBadges, getUserRewards } from '../../services/gamificationApi';
import { formatDateTime } from '../../utils/formatters';
import AIWidgetCard from '../../components/ai/AIWidgetCard';

const menuItems = [
  { icon: '🔔', label: 'Thông báo' },
  { icon: '🔒', label: 'Bảo mật' },
  { icon: '❓', label: 'Trợ giúp' },
];

// Helper function để get badge type label và color
const getBadgeTypeInfo = (badgeType) => {
  const typeMap = {
    'DAILY': { label: '📅 Hàng ngày', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' },
    'WEEKLY': { label: '📆 Hàng tuần', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' },
    'MONTHLY': { label: '📊 Hàng tháng', color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.1)' },
    'SEASONAL': { label: '🍂 Theo mùa', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.1)' },
    'SPECIAL': { label: '⭐ Đặc biệt', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },
  };
  return typeMap[badgeType] || { label: badgeType || 'Không xác định', color: '#666', bg: 'rgba(0, 0, 0, 0.05)' };
};
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {badges.map((badge) => {
              const typeInfo = getBadgeTypeInfo(badge.badgeType);
              return (
                <div
                  key={badge.badgeCode}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Badge Type Label */}
                  {badge.badgeType && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: typeInfo.color,
                        backgroundColor: typeInfo.bg,
                      }}
                    >
                      {typeInfo.label}
                    </div>
                  )}

                  {/* Badge Icon */}
                  <div style={{ position: 'relative', marginTop: badge.badgeType ? '8px' : '0' }}>
                    {badge.iconUrl ? (
                      <img 
                        src={badge.iconUrl} 
                        alt={badge.badgeName}
                        style={{ 
                          width: '64px', 
                          height: '64px', 
                          objectFit: 'contain',
                          borderRadius: '8px',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'block';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      style={{ 
                        fontSize: '48px', 
                        display: badge.iconUrl ? 'none' : 'block',
                        lineHeight: 1,
                      }}
                    >
                      🏆
                    </div>
                    
                    {/* Count Badge */}
                    {badge.count && badge.count > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          minWidth: '24px',
                          height: '24px',
                          padding: '0 6px',
                          borderRadius: '12px',
                          backgroundColor: '#FF5722',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid var(--card-bg)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}
                        title={`Đạt được ${badge.count} lần`}
                      >
                        {badge.count > 99 ? '99+' : badge.count}
                      </div>
                    )}
                  </div>

                  {/* Badge Info */}
                  <div style={{ width: '100%' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, color: 'var(--text-primary)' }}>
                      {badge.badgeName || badge.badgeCode}
                    </p>
                    {badge.badgeDescription && (
                      <p style={{ fontSize: '12px', color: '#666', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        {badge.badgeDescription}
                      </p>
                    )}
                    
                    {/* Date Info */}
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
                      {badge.firstEarnedAt && (
                        <div style={{ marginTop: '4px' }}>
                          🎯 Lần đầu: {formatDateTime(badge.firstEarnedAt)}
                        </div>
                      )}
                      {badge.lastEarnedAt && badge.count > 1 && (
                        <div style={{ marginTop: '2px' }}>
                          ⏰ Lần cuối: {formatDateTime(badge.lastEarnedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* AI Advisory Widgets */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Tư vấn AI</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AIWidgetCard
            title="Phân tích chi tiêu"
            description="Phân tích khoản chi nổi bật 7 ngày gần nhất."
            context="SPENDING_WIDGET"
          />
          <AIWidgetCard
            title="Gợi ý tiết kiệm"
            description="Tiến độ tiết kiệm và đề xuất đóng góp tiếp theo."
            context="SAVING_WIDGET"
          />
          <AIWidgetCard
            title="Mục tiêu tiếp theo"
            description="Mục tiêu tài chính cần ưu tiên cùng % hoàn thành."
            context="GOAL_WIDGET"
          />
        </div>
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

