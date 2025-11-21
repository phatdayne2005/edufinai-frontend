import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Target, ChevronRight, Brain, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import { getDailyReport } from '../../services/aiService';

const HomePage = () => {
  const { user: mockUser, goals, expenses } = useApp();
  const { user: authUser } = useAuth();
  const activeGoals = goals.filter((goal) => goal.status === 'ACTIVE');
  const recentExpenses = expenses.slice(0, 3);
  const [dailyReport, setDailyReport] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState(null);

  const loadDailyReport = useCallback(async () => {
    setIsLoadingReport(true);
    setReportError(null);
    try {
      const report = await getDailyReport();
      setDailyReport(report);
    } catch (error) {
      setReportError(error.message || 'Không thể tải báo cáo');
      setDailyReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    loadDailyReport();
  }, [loadDailyReport]);

  // Use real user name from AuthContext if available, otherwise fallback to mock data
  const displayName = authUser?.name || authUser?.username || mockUser?.name || 'Người dùng';
  
  // Use mock data for financial information (balance, income, expense, savingRate)
  const financialData = mockUser;

  return (
    <div style={styles.page}>
      <Header title="Xin chào!" subtitle={`Chào mừng trở lại, ${displayName}`} />

      <div style={styles.responsiveGrid}>
        <div style={styles.responsiveColumn}>
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
              <div style={styles.quickActionIconWrap}>
                <Plus size={18} />
              </div>
              <span>Thêm thu chi</span>
            </button>
            <button type="button" style={styles.quickActionBtn}>
              <div style={styles.quickActionIconWrap}>
                <Target size={18} />
              </div>
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
        </div>

        <div style={styles.responsiveColumn}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <p style={styles.aiTipTitle}>📊 Báo cáo hôm nay</p>
                  <p style={{ ...styles.aiTipText, margin: 0 }}>
                    {dailyReport?.reportDate
                      ? new Date(dailyReport.reportDate).toLocaleDateString('vi-VN')
                      : 'Dữ liệu realtime từ AI'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={isLoadingReport ? undefined : loadDailyReport}
                  disabled={isLoadingReport}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: isLoadingReport ? 'not-allowed' : 'pointer',
                    color: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Làm mới báo cáo"
                >
                  {isLoadingReport ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RefreshCw size={18} />
                  )}
                </button>
              </div>

              {isLoadingReport ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#666' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang tải báo cáo từ AI...</span>
                </div>
              ) : reportError ? (
                <div style={{ color: '#F44336', marginTop: 12, fontSize: '14px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AlertCircle size={16} />
                    <span>{reportError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadDailyReport}
                    style={{
                      marginTop: 8,
                      border: 'none',
                      background: '#4CAF50',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Thử lại
                  </button>
                </div>
              ) : dailyReport ? (
                <div style={{ marginTop: 8 }}>
                  <p style={{ ...styles.aiTipText, marginBottom: 8 }}>
                    {dailyReport.insight || 'Chưa có insight cho hôm nay.'}
                  </p>
                  {dailyReport.rootCause && (
                    <p style={{ ...styles.aiTipText, marginBottom: 6 }}>
                      <strong>Lý do: </strong>
                      {dailyReport.rootCause}
                    </p>
                  )}
                  {dailyReport.priorityAction && (
                    <p style={{ ...styles.aiTipText, fontWeight: 600, color: '#4CAF50' }}>
                      Ưu tiên: {dailyReport.priorityAction}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ ...styles.aiTipText, marginTop: 8 }}>
                  Chưa có dữ liệu để tạo báo cáo hôm nay. Hãy đồng bộ giao dịch và thử lại.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

