import React from 'react';
import { Plus, Target, ChevronRight, Brain } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';

const HomePage = () => {
  const { user: mockUser, goals, expenses } = useApp();
  const { user: authUser } = useAuth();
  const activeGoals = goals.filter((goal) => goal.status === 'ACTIVE');
  const recentExpenses = expenses.slice(0, 3);

  // Use real user name from AuthContext if available, otherwise fallback to mock data
  const displayName = authUser?.name || authUser?.username || mockUser?.name || 'Người dùng';
  
  // Use mock data for financial information (balance, income, expense, savingRate)
  const financialData = mockUser;

  return (
    <div style={styles.page}>
      <Header title="Xin chào!" subtitle={`Chào mừng trở lại, ${displayName}`} />

      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>Số dư hiện tại</p>
        <h2 style={styles.balanceAmount}>{financialData.balance.toLocaleString('vi-VN')} đ</h2>
        <div style={styles.balanceStats}>
          <div>
            <p style={styles.statLabel}>Thu nhập</p>
            <p style={styles.statValue}>+{(financialData.income / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p style={styles.statLabel}>Chi tiêu</p>
            <p style={styles.statValue}>-{(financialData.expense / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p style={styles.statLabel}>Tiết kiệm</p>
            <p style={styles.statValue}>{financialData.savingRate}%</p>
          </div>
        </div>
      </div>

      <div style={styles.quickActions}>
        <button type="button" style={styles.quickActionBtn}>
          <Plus size={24} />
          <span>Thêm thu chi</span>
        </button>
        <button type="button" style={styles.quickActionBtn}>
          <Target size={24} />
          <span>Mục tiêu mới</span>
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Mục tiêu tài chính</h3>
          <ChevronRight size={20} color="#4CAF50" />
        </div>
        {activeGoals.map((goal) => (
          <div key={goal.id} style={styles.goalCard}>
            <div style={styles.goalHeader}>
              <span style={styles.goalTitle}>{goal.title}</span>
              <span style={styles.goalAmount}>
                {(goal.current / 1000000).toFixed(1)}M / {(goal.target / 1000000).toFixed(1)}M
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(goal.current / goal.target) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Giao dịch gần đây</h3>
          <ChevronRight size={20} color="#4CAF50" />
        </div>
        {recentExpenses.map((exp) => (
          <div key={exp.id} style={styles.transactionItem}>
            <div style={styles.transactionIcon}>{exp.type === 'EXPENSE' ? '💸' : '💰'}</div>
            <div style={styles.transactionInfo}>
              <p style={styles.transactionCategory}>{exp.category}</p>
              <p style={styles.transactionDate}>{exp.date}</p>
            </div>
            <p
              style={{
                ...styles.transactionAmount,
                color: exp.type === 'EXPENSE' ? '#F44336' : '#4CAF50',
              }}
            >
              {exp.type === 'EXPENSE' ? '-' : '+'}
              {exp.amount.toLocaleString('vi-VN')}đ
            </p>
          </div>
        ))}
      </div>

      <div style={styles.aiTip}>
        <Brain size={24} color="#4CAF50" />
        <div style={{ flex: 1 }}>
          <p style={styles.aiTipTitle}>💡 Gợi ý từ AI</p>
          <p style={styles.aiTipText}>
            Bạn đã tiết kiệm được 65% thu nhập tháng này! Tuyệt vời! Hãy duy trì và cân nhắc đầu tư một phần vào quỹ khẩn cấp.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

