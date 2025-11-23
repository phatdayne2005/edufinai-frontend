import React, { useState, useEffect } from 'react';
import { TrendingUp, Trophy, Award, RefreshCw } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import { 
  getLeaderboard, 
  getMyLeaderboardPosition, 
  getMe,
  getChallenges,
  getActiveChallenges,
  getCompletedChallenges
} from '../../services/gamificationApi';

const LEADERBOARD_TYPES = [
  { value: 'DAILY', label: '📅 Hàng ngày' },
  { value: 'WEEKLY', label: '📆 Hàng tuần' },
  { value: 'MONTHLY', label: '📊 Hàng tháng' },
  { value: 'ALLTIME', label: '🏆 Tất cả thời gian' },
];

const ChallengesPage = () => {
  const { user: mockUser } = useApp();
  const { user: authUser, getToken } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedType, setSelectedType] = useState('ALLTIME');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);

  // Get current user ID from JWT token
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = getToken();
        if (token) {
          try {
            const meData = await getMe();
            setCurrentUserId(meData.sub || null);
          } catch (err) {
            console.warn('Could not get user info from token:', err);
            // Try to decode token manually
            try {
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                setCurrentUserId(payload.sub || null);
              }
            } catch (e) {
              console.warn('Could not decode token');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };

    fetchUserInfo();
  }, [getToken]);

  // Fetch leaderboard data
  const fetchLeaderboard = async (type, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Fetch leaderboard and my position in parallel
      const [leaderboardData, myPositionData] = await Promise.all([
        getLeaderboard(type, 20),
        getMyLeaderboardPosition(type).catch(() => null), // Ignore error if not authenticated
      ]);

      // Map API response to UI format
      // API returns: { result: [{ name, score, top }], status }
      // Note: name field is usually empty string, we'll use a fallback
      const mappedLeaderboard = (leaderboardData || []).map((item, index) => ({
        rank: item.top || (index + 1),
        userId: `user-${item.top || (index + 1)}`, // Generate fallback ID
        points: Math.round(item.score || 0),
        name: item.name || `Người chơi #${item.top || (index + 1)}`, // Use name or fallback
        avatar: '👤',
        isMe: false, // We'll check this separately using myPosition
      }));

      setLeaderboard(mappedLeaderboard);
      
      // Handle myPosition response structure: { code, result: { name, score, top }, message }
      if (myPositionData && myPositionData.result) {
        setMyPosition(myPositionData.result);
      } else {
        setMyPosition(null);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Không thể tải bảng xếp hạng');
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch challenges
  const fetchChallenges = async () => {
    try {
      setChallengesLoading(true);
      const [activeData, completedData] = await Promise.all([
        getActiveChallenges().catch(() => ({ code: 200, result: [], message: '' })),
        getCompletedChallenges().catch(() => ({ code: 200, result: [], message: '' })),
      ]);

      // Handle response structure: { code, result[], message }
      setActiveChallenges(activeData?.result || []);
      setCompletedChallenges(completedData?.result || []);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setActiveChallenges([]);
      setCompletedChallenges([]);
    } finally {
      setChallengesLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId !== undefined) {
      fetchLeaderboard(selectedType);
      fetchChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, currentUserId]);

  const handleRefresh = () => {
    fetchLeaderboard(selectedType, false);
  };

  // Get user stats from my position or fallback to mock data
  // myPosition structure: { name, score, top }
  const userStats = myPosition
    ? {
      points: Math.round(myPosition.score || 0),
      rank: myPosition.top > 0 ? myPosition.top : 'N/A',
      level: Math.floor((myPosition.score || 0) / 1000) + 1,
    }
    : mockUser || { points: 0, rank: 'N/A', level: 1 };

  return (
    <div style={styles.page}>
      <Header title="Thử thách" subtitle="Cạnh tranh và giành phần thưởng" />

      <div style={styles.statsCard}>
        <div style={styles.statBox}>
          <TrendingUp size={24} color="#4CAF50" />
          <div>
            <p style={styles.statLabel}>Điểm</p>
            <p style={styles.statValue}>{userStats.points}</p>
          </div>
        </div>
        <div style={styles.statBox}>
          <Trophy size={24} color="#FFD700" />
          <div>
            <p style={styles.statLabel}>Hạng</p>
            <p style={styles.statValue}>
              {userStats.rank === 'N/A' || userStats.rank === -1 ? 'N/A' : `#${userStats.rank}`}
            </p>
          </div>
        </div>
        <div style={styles.statBox}>
          <Award size={24} color="#2196F3" />
          <div>
            <p style={styles.statLabel}>Level</p>
            <p style={styles.statValue}>{userStats.level}</p>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={styles.sectionTitle}>Thử thách đang thực hiện</h3>
          {challengesLoading && (
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </div>
        
        {challengesLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p>Đang tải thử thách...</p>
          </div>
        ) : activeChallenges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <p>Chưa có thử thách đang thực hiện</p>
          </div>
        ) : (
          activeChallenges.map((challenge) => {
            const progressPercent = challenge.targetProgress > 0 
              ? (challenge.currentProgress / challenge.targetProgress) * 100 
              : 0;
            return (
              <div key={challenge.challengeId} style={styles.challengeCard}>
                <div style={styles.challengeHeader}>
                  <h4 style={styles.challengeTitle}>{challenge.title}</h4>
                  <span style={styles.challengeReward}>
                    🎁 {challenge.rewardScore || 0} điểm
                  </span>
                </div>
                <div style={styles.challengeProgress}>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(progressPercent, 100)}%`,
                      }}
                    />
                  </div>
                  <span style={styles.challengeText}>
                    {challenge.currentProgress}/{challenge.targetProgress}
                  </span>
                </div>
                <span style={styles.challengeType}>
                  {challenge.scope === 'DAILY' ? '📅 Hàng ngày' : 
                   challenge.scope === 'WEEKLY' ? '📆 Hàng tuần' :
                   challenge.scope === 'MONTHLY' ? '📊 Hàng tháng' : '🎯 Một lần'}
                </span>
              </div>
            );
          })
        )}

        {completedChallenges.length > 0 && (
          <>
            <h3 style={{ ...styles.sectionTitle, marginTop: '24px', marginBottom: '16px' }}>
              Thử thách đã hoàn thành
            </h3>
            {completedChallenges.map((challenge) => {
              const completedDate = challenge.completedAt 
                ? new Date(challenge.completedAt).toLocaleDateString('vi-VN')
                : '';
              return (
                <div key={challenge.challengeId} style={{ ...styles.challengeCard, opacity: 0.8 }}>
                  <div style={styles.challengeHeader}>
                    <h4 style={styles.challengeTitle}>
                      ✅ {challenge.title}
                    </h4>
                    <span style={styles.challengeReward}>
                      🎁 {challenge.rewardScore || 0} điểm
                    </span>
                  </div>
                  <div style={styles.challengeProgress}>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: '100%',
                          backgroundColor: '#4CAF50',
                        }}
                      />
                    </div>
                    <span style={styles.challengeText}>
                      {challenge.currentProgress}/{challenge.targetProgress} ✓
                    </span>
                  </div>
                  {completedDate && (
                    <span style={{ ...styles.challengeType, color: '#4CAF50' }}>
                      Hoàn thành: {completedDate}
                    </span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={styles.sectionTitle}>Bảng xếp hạng</h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '8px 12px',
              backgroundImage: 'var(--gradient-brand)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* Leaderboard Type Selector */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {LEADERBOARD_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedType === type.value ? 'transparent' : 'var(--surface-muted)',
                backgroundImage: selectedType === type.value ? 'var(--gradient-brand)' : 'none',
                color: selectedType === type.value ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: selectedType === type.value ? '600' : '400',
                transition: 'all 0.2s',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !refreshing && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p>Đang tải bảng xếp hạng...</p>
          </div>
        )}

        {/* Leaderboard List */}
        {!loading && leaderboard.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Chưa có dữ liệu bảng xếp hạng</p>
          </div>
        )}

        {!loading && leaderboard.length > 0 && (
          <>
            {leaderboard.map((item) => (
              <div
                key={`${item.userId}-${item.rank}`}
                style={{
                  ...styles.leaderboardItem,
                  ...(item.isMe ? styles.leaderboardItemMe : {}),
                }}
              >
                <div style={styles.leaderboardLeft}>
                  <span
                    style={{
                      ...styles.leaderboardRank,
                      color: item.rank <= 3 ? '#FFD700' : '#666',
                    }}
                  >
                    #{item.rank}
                  </span>
                  <span style={styles.leaderboardAvatar}>{item.avatar}</span>
                  <span style={styles.leaderboardName}>
                    {item.name}
                    {item.isMe && ' (Bạn)'}
                  </span>
                </div>
                <span style={styles.leaderboardPoints}>{item.points.toLocaleString()} điểm</span>
              </div>
            ))}

            {/* Show my position if not in top list */}
            {myPosition && myPosition.top > 0 && myPosition.top > 20 && (
              <div
                style={{
                  ...styles.leaderboardItem,
                  ...styles.leaderboardItemMe,
                  marginTop: '12px',
                  borderTop: '2px dashed #ccc',
                  paddingTop: '12px',
                }}
              >
                <div style={styles.leaderboardLeft}>
                  <span style={{ ...styles.leaderboardRank, color: '#666' }}>
                    #{myPosition.top}
                  </span>
                  <span style={styles.leaderboardAvatar}>👤</span>
                  <span style={styles.leaderboardName}>Bạn</span>
                </div>
                <span style={styles.leaderboardPoints}>
                  {Math.round(myPosition.score || 0).toLocaleString()} điểm
                </span>
              </div>
            )}
            
            {/* Show my position if not ranked (top = -1) */}
            {myPosition && myPosition.top === -1 && (
              <div
                style={{
                  ...styles.leaderboardItem,
                  ...styles.leaderboardItemMe,
                  marginTop: '12px',
                  borderTop: '2px dashed #ccc',
                  paddingTop: '12px',
                }}
              >
                <div style={styles.leaderboardLeft}>
                  <span style={{ ...styles.leaderboardRank, color: '#666' }}>
                    N/A
                  </span>
                  <span style={styles.leaderboardAvatar}>👤</span>
                  <span style={styles.leaderboardName}>Bạn</span>
                </div>
                <span style={styles.leaderboardPoints}>
                  {Math.round(myPosition.score || 0).toLocaleString()} điểm
                </span>
              </div>
            )}
          </>
        )}
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

export default ChallengesPage;

