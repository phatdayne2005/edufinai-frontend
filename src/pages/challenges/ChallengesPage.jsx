import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Trophy, RefreshCw } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import { formatDateTime } from '../../utils/formatters';
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

const PERIOD_LABELS = {
  DAILY: '📅 Hằng ngày',
  WEEKLY: '📆 Hằng tuần',
  MONTHLY: '📊 Hằng tháng',
};

const normalizeChallengeId = (challenge) => challenge?.challengeId || challenge?.id;

const getDeadlineLabel = (challenge) => {
  if (!challenge) return 'Không xác định';
  if (challenge.scope && PERIOD_LABELS[challenge.scope]) {
    return PERIOD_LABELS[challenge.scope];
  }

  if (challenge.endAt) {
    const end = new Date(challenge.endAt);
    if (!Number.isNaN(end.getTime())) {
      const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) return `⏳ Còn ${diffDays} ngày`;
      if (diffDays === 0) return '⏳ Còn chưa tới 1 ngày';
      return '❌ Đã kết thúc';
    }
  }

  return 'Không giới hạn';
};

const getSortKey = (challenge, { completed } = {}) => {
  if (!challenge) return Number.MAX_SAFE_INTEGER;
  if (completed) return Number.MAX_SAFE_INTEGER - 100; // Completed luôn ở cuối

  if (challenge.scope && PERIOD_LABELS[challenge.scope]) {
    // Chu kỳ reset không có hạn, để sau cùng nhưng vẫn ưu tiên theo chu kỳ
    const priority = { DAILY: 3, WEEKLY: 2, MONTHLY: 1 }[challenge.scope] || 0;
    return Number.MAX_SAFE_INTEGER - priority;
  }

  if (challenge.endAt) {
    const end = new Date(challenge.endAt).getTime();
    if (!Number.isNaN(end)) return end;
  }

  return Number.MAX_SAFE_INTEGER;
};

const isCurrentlyActiveChallenge = (challenge) => {
  if (!challenge) return false;
  if (challenge.active === false) return false;

  const now = Date.now();
  const start = challenge.startAt ? new Date(challenge.startAt).getTime() : null;
  const end = challenge.endAt ? new Date(challenge.endAt).getTime() : null;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
};

// Parse rule JSON và convert sang ngôn ngữ tự nhiên
const parseRuleToNaturalLanguage = (ruleString) => {
  if (!ruleString) return 'Không có điều kiện';
  
  try {
    const rule = typeof ruleString === 'string' ? JSON.parse(ruleString) : ruleString;
    const parts = [];
    
    if (rule.eventType) {
      const eventTypeMap = {
        'QUIZ': 'Quiz',
        'EXPENSE': 'Chi tiêu',
        'GOAL': 'Mục tiêu',
        'SCENARIO': 'Kịch bản',
        'STREAK': 'Chuỗi ngày',
        'CUSTOM': 'Tùy chỉnh'
      };
      parts.push(`Loại: ${eventTypeMap[rule.eventType] || rule.eventType}`);
    }
    
    if (rule.action) {
      const actionMap = {
        'COMPLETE': 'Hoàn thành',
        'SAVE': 'Tiết kiệm',
        'CREATE': 'Tạo mới',
        'UPDATE': 'Cập nhật'
      };
      parts.push(`Hành động: ${actionMap[rule.action] || rule.action}`);
    }
    
    if (rule.minAccuracy !== undefined) {
      parts.push(`Độ chính xác tối thiểu: ${rule.minAccuracy}%`);
    }
    
    if (rule.maxAccuracy !== undefined) {
      parts.push(`Độ chính xác tối đa: ${rule.maxAccuracy}%`);
    }
    
    if (rule.minScore !== undefined) {
      parts.push(`Điểm tối thiểu: ${rule.minScore}`);
    }
    
    if (rule.maxScore !== undefined) {
      parts.push(`Điểm tối đa: ${rule.maxScore}`);
    }
    
    if (rule.maxProgressPerDay !== undefined && rule.maxProgressPerDay > 0) {
      parts.push(`Giới hạn mỗi ngày: ${rule.maxProgressPerDay} lần`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Không có điều kiện';
  } catch (error) {
    console.warn('Failed to parse rule:', error);
    return 'Không thể đọc điều kiện';
  }
};

// Format date dễ nhìn
const formatDateDisplay = (dateString) => {
  if (!dateString) return 'Không xác định';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Không xác định';
    return formatDateTime(date);
  } catch (error) {
    return 'Không xác định';
  }
};

// Get type label
const getTypeLabel = (type) => {
  const typeMap = {
    'QUIZ': '📝 Quiz',
    'EXPENSE': '💰 Chi tiêu',
    'GOAL': '🎯 Mục tiêu',
    'SCENARIO': '🎬 Kịch bản',
    'STREAK': '🔥 Chuỗi ngày',
    'CUSTOM': '⚙️ Tùy chỉnh'
  };
  return typeMap[type] || type || 'Không xác định';
};

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
  const [allChallenges, setAllChallenges] = useState([]);
  const [challengeView, setChallengeView] = useState('NO_PROGRESS'); // NO_PROGRESS | WITH_PROGRESS

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
      const [allData, activeData, completedData] = await Promise.all([
        getChallenges().catch(() => []),
        getActiveChallenges().catch(() => ({ code: 200, result: [], message: '' })),
        getCompletedChallenges().catch(() => ({ code: 200, result: [], message: '' })),
      ]);

      const normalizedAll = Array.isArray(allData) ? allData : allData?.result || [];
      setAllChallenges(normalizedAll);
      setActiveChallenges(activeData?.result || []);
      setCompletedChallenges(completedData?.result || []);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setAllChallenges([]);
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

  const challengeDefinitionsMap = useMemo(() => {
    const map = new Map();
    allChallenges.forEach((challenge) => {
      const id = normalizeChallengeId(challenge);
      if (id) map.set(String(id), challenge);
    });
    return map;
  }, [allChallenges]);

  const progressMap = useMemo(() => {
    const map = new Map();
    activeChallenges.forEach((challenge) => {
      if (challenge.challengeId) {
        map.set(String(challenge.challengeId), { ...challenge, status: 'ACTIVE' });
      }
    });
    completedChallenges.forEach((challenge) => {
      if (challenge.challengeId) {
        map.set(String(challenge.challengeId), { ...challenge, status: 'COMPLETED' });
      }
    });
    return map;
  }, [activeChallenges, completedChallenges]);

  const challengesWithProgress = useMemo(() => {
    const list = [];
    progressMap.forEach((progress, key) => {
      const definition = challengeDefinitionsMap.get(key);
      const merged = {
        id: key,
        title: definition?.title || progress.title || 'Chưa rõ tên',
        description: definition?.description || progress.description || '',
        type: definition?.type || progress.type,
        rule: definition?.rule || progress.rule,
        rewardScore: definition?.rewardScore ?? progress.rewardScore ?? 0,
        rewardBadgeCode: definition?.rewardBadgeCode || progress.rewardBadgeCode,
        scope: definition?.scope || progress.scope,
        startAt: definition?.startAt || progress.startAt,
        endAt: definition?.endAt || progress.endAt,
        currentProgress: progress.currentProgress || 0,
        targetProgress: progress.targetProgress || 0,
        status: progress.status,
        completedAt: progress.completedAt,
      };
      list.push({
        ...merged,
        deadlineLabel: getDeadlineLabel(definition || progress),
        sortKey: getSortKey(definition || progress, { completed: progress.status === 'COMPLETED' }),
      });
    });
    return list.sort((a, b) => a.sortKey - b.sortKey);
  }, [progressMap, challengeDefinitionsMap]);

  const challengesWithoutProgress = useMemo(() => {
    const list = allChallenges
      .filter((challenge) => {
        const id = normalizeChallengeId(challenge);
        if (!id) return false;
        if (progressMap.has(String(id))) return false;
        return isCurrentlyActiveChallenge(challenge);
      })
      .map((challenge) => ({
        id: normalizeChallengeId(challenge),
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        rule: challenge.rule,
        rewardScore: challenge.rewardScore || 0,
        rewardBadgeCode: challenge.rewardBadgeCode,
        scope: challenge.scope,
        startAt: challenge.startAt,
        endAt: challenge.endAt,
        deadlineLabel: getDeadlineLabel(challenge),
        sortKey: getSortKey(challenge),
      }))
      .sort((a, b) => a.sortKey - b.sortKey);

    return list;
  }, [allChallenges, progressMap]);

  // Get user stats from my position or fallback to mock data
  // myPosition structure: { name, score, top }
  const userStats = myPosition
    ? {
      points: Math.round(myPosition.score || 0),
      rank: myPosition.top > 0 ? myPosition.top : 'N/A',
    }
    : mockUser || { points: 0, rank: 'N/A' };

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
      </div>

      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={styles.sectionTitle}>Thử thách</h3>
          {challengesLoading && (
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setChallengeView('NO_PROGRESS')}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
              border: challengeView === 'NO_PROGRESS' ? '2px solid #2563eb' : '1px solid var(--border-subtle)',
              background: challengeView === 'NO_PROGRESS' ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface-muted)',
              color: challengeView === 'NO_PROGRESS' ? '#1d4ed8' : 'var(--text-primary)',
              fontWeight: challengeView === 'NO_PROGRESS' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🔓 Chưa tham gia ({challengesWithoutProgress.length})
          </button>
          <button
            onClick={() => setChallengeView('WITH_PROGRESS')}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
              border: challengeView === 'WITH_PROGRESS' ? '2px solid #059669' : '1px solid var(--border-subtle)',
              background: challengeView === 'WITH_PROGRESS' ? 'rgba(5, 150, 105, 0.08)' : 'var(--surface-muted)',
              color: challengeView === 'WITH_PROGRESS' ? '#047857' : 'var(--text-primary)',
              fontWeight: challengeView === 'WITH_PROGRESS' ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🚀 Đang/đã tham gia ({challengesWithProgress.length})
          </button>
        </div>

        {challengesLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p>Đang tải thử thách...</p>
          </div>
        ) : challengeView === 'NO_PROGRESS' ? (
          challengesWithoutProgress.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <p>🎉 Bạn đã tham gia tất cả các thử thách khả dụng.</p>
            </div>
          ) : (
            challengesWithoutProgress.map((challenge) => (
              <div key={challenge.id} style={styles.challengeCard}>
                <div style={styles.challengeHeader}>
                  <h4 style={styles.challengeTitle}>{challenge.title}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {challenge.rewardScore > 0 && (
                      <span style={styles.challengeReward}>🎁 {challenge.rewardScore} điểm</span>
                    )}
                    {challenge.rewardBadgeCode && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#FFD700', 
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)'
                      }}>
                        🏆 {challenge.rewardBadgeCode}
                      </span>
                    )}
                  </div>
                </div>
                
                {challenge.description && (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                    {challenge.description}
                  </p>
                )}
                
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {challenge.type && (
                      <span style={{ 
                        fontSize: '12px', 
                        padding: '4px 10px', 
                        borderRadius: '999px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#1d4ed8',
                        fontWeight: 500
                      }}>
                        {getTypeLabel(challenge.type)}
                      </span>
                    )}
                    <span style={styles.challengeType}>{challenge.deadlineLabel}</span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Chưa tham gia
                    </span>
                  </div>
                  
                  {challenge.rule && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)', 
                      padding: '8px',
                      backgroundColor: 'var(--surface-muted)',
                      borderRadius: '6px',
                      marginTop: '4px'
                    }}>
                      <strong>Điều kiện:</strong> {parseRuleToNaturalLanguage(challenge.rule)}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {challenge.startAt && (
                      <div>📅 Bắt đầu: {formatDateDisplay(challenge.startAt)}</div>
                    )}
                    {challenge.endAt && (
                      <div>⏰ Kết thúc: {formatDateDisplay(challenge.endAt)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        ) : challengesWithProgress.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <p>Chưa có thử thách nào đang theo dõi tiến độ.</p>
          </div>
        ) : (
          challengesWithProgress.map((challenge) => {
            const progressPercent =
              challenge.status === 'COMPLETED'
                ? 100
                : challenge.targetProgress > 0
                  ? (challenge.currentProgress / challenge.targetProgress) * 100
                  : 0;
            const statusLabel = challenge.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang thực hiện';
            const statusStyle =
              challenge.status === 'COMPLETED'
                ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#047857' }
                : { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#1d4ed8' };

            return (
              <div key={challenge.id} style={styles.challengeCard}>
                <div style={styles.challengeHeader}>
                  <h4 style={styles.challengeTitle}>{challenge.title}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {challenge.rewardScore > 0 && (
                      <span style={styles.challengeReward}>🎁 {challenge.rewardScore} điểm</span>
                    )}
                    {challenge.rewardBadgeCode && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#FFD700', 
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)'
                      }}>
                        🏆 {challenge.rewardBadgeCode}
                      </span>
                    )}
                  </div>
                </div>
                
                {challenge.description && (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                    {challenge.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {challenge.type && (
                      <span style={{ 
                        fontSize: '12px', 
                        padding: '4px 10px', 
                        borderRadius: '999px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#1d4ed8',
                        fontWeight: 500
                      }}>
                        {getTypeLabel(challenge.type)}
                      </span>
                    )}
                    <span style={styles.challengeType}>{challenge.deadlineLabel}</span>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, ...statusStyle }}>
                    {statusLabel}
                  </span>
                </div>
                
                <div style={styles.challengeProgress}>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(progressPercent, 100)}%`,
                        backgroundColor:
                          challenge.status === 'COMPLETED'
                            ? '#10B981'
                            : (styles.progressFill && styles.progressFill.backgroundColor) || '#2196F3',
                      }}
                    />
                  </div>
                  <span style={styles.challengeText}>
                    {challenge.currentProgress}/{challenge.targetProgress}
                  </span>
                </div>
                
                {challenge.rule && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)', 
                    padding: '8px',
                    backgroundColor: 'var(--surface-muted)',
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}>
                    <strong>Điều kiện:</strong> {parseRuleToNaturalLanguage(challenge.rule)}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {challenge.startAt && (
                    <div>📅 Bắt đầu: {formatDateDisplay(challenge.startAt)}</div>
                  )}
                  {challenge.endAt && (
                    <div>⏰ Kết thúc: {formatDateDisplay(challenge.endAt)}</div>
                  )}
                  {challenge.status === 'COMPLETED' && challenge.completedAt && (
                    <div style={{ color: '#047857', fontWeight: 500 }}>
                      ✅ Hoàn thành: {formatDateDisplay(challenge.completedAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
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


