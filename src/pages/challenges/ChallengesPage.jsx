import React from 'react';
import { TrendingUp, Trophy, Award } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/appStyles';

const ChallengesPage = () => {
  const { challenges, leaderboard, user } = useApp();

  return (
    <div style={styles.page}>
      <Header title="Thử thách" subtitle="Cạnh tranh và giành phần thưởng" />

      <div style={styles.statsCard}>
        <div style={styles.statBox}>
          <TrendingUp size={24} color="#4CAF50" />
          <div>
            <p style={styles.statLabel}>Điểm</p>
            <p style={styles.statValue}>{user.points}</p>
          </div>
        </div>
        <div style={styles.statBox}>
          <Trophy size={24} color="#FFD700" />
          <div>
            <p style={styles.statLabel}>Hạng</p>
            <p style={styles.statValue}>#{user.rank}</p>
          </div>
        </div>
        <div style={styles.statBox}>
          <Award size={24} color="#2196F3" />
          <div>
            <p style={styles.statLabel}>Level</p>
            <p style={styles.statValue}>{user.level}</p>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Thử thách hiện tại</h3>
        {challenges.map((challenge) => (
          <div key={challenge.id} style={styles.challengeCard}>
            <div style={styles.challengeHeader}>
              <h4 style={styles.challengeTitle}>{challenge.title}</h4>
              <span style={styles.challengeReward}>🎁 {challenge.reward} điểm</span>
            </div>
            <div style={styles.challengeProgress}>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${(challenge.progress / challenge.target) * 100}%`,
                  }}
                />
              </div>
              <span style={styles.challengeText}>
                {challenge.progress}/{challenge.target}
              </span>
            </div>
            <span style={styles.challengeType}>
              {challenge.type === 'daily' ? '📅 Hàng ngày' : '📆 Hàng tuần'}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Bảng xếp hạng</h3>
        {leaderboard.map((item) => (
          <div
            key={item.rank}
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
              <span style={styles.leaderboardName}>{item.name}</span>
            </div>
            <span style={styles.leaderboardPoints}>{item.points} điểm</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengesPage;

