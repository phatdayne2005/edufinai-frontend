import React, { useState, useEffect } from 'react';
import { Plus, Target, ChevronRight, Brain, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/appStyles';
import { getDailyReport, generateDailyReport } from '../../services/edufinaiApi';

const HomePage = () => {
  const { user, goals, expenses } = useApp();
  const activeGoals = goals.filter((goal) => goal.status === 'ACTIVE');
  const recentExpenses = expenses.slice(0, 3);
  
  const [dailyReport, setDailyReport] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);

  // Load daily report on mount
  useEffect(() => {
    loadDailyReport();
  }, []);

  const loadDailyReport = async () => {
    setIsLoadingReport(true);
    setReportError(null);
    try {
      const report = await getDailyReport();
      setDailyReport(report);
    } catch (err) {
      console.error('[HomePage] Failed to load daily report:', err);
      setReportError(err.message);
      setDailyReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const report = await generateDailyReport();
      setDailyReport(report);
    } catch (err) {
      console.error('[HomePage] Failed to generate daily report:', err);
      setReportError(err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div style={styles.page}>
      <Header title="Xin chào!" subtitle={`Chào mừng trở lại, ${user.name}`} />

      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>Số dư hiện tại</p>
        <h2 style={styles.balanceAmount}>{user.balance.toLocaleString('vi-VN')} đ</h2>
        <div style={styles.balanceStats}>
          <div>
            <p style={styles.statLabel}>Thu nhập</p>
            <p style={styles.statValue}>+{(user.income / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p style={styles.statLabel}>Chi tiêu</p>
            <p style={styles.statValue}>-{(user.expense / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p style={styles.statLabel}>Tiết kiệm</p>
            <p style={styles.statValue}>{user.savingRate}%</p>
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

      {/* Daily Report Section */}
      <div style={styles.aiTip}>
        <Brain size={24} color="#4CAF50" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={styles.aiTipTitle}>📊 Báo cáo hôm nay</p>
            <button
              type="button"
              onClick={isGeneratingReport ? undefined : handleGenerateReport}
              disabled={isGeneratingReport}
              style={{
                background: 'none',
                border: 'none',
                cursor: isGeneratingReport ? 'not-allowed' : 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: isGeneratingReport ? 0.5 : 1,
              }}
              title="Tạo báo cáo mới"
            >
              {isGeneratingReport ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshCw size={16} color="#4CAF50" />
              )}
            </button>
          </div>
          
          {isLoadingReport ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Đang tải báo cáo...</span>
            </div>
          ) : reportError ? (
            <div style={{ color: '#F44336', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={16} />
                <span>Không thể tải báo cáo</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: isGeneratingReport ? 'not-allowed' : 'pointer',
                  marginTop: '8px',
                }}
              >
                {isGeneratingReport ? 'Đang tạo...' : 'Tạo báo cáo mới'}
              </button>
            </div>
          ) : dailyReport?.sanitizedSummary ? (
            <div>
              {dailyReport.sanitizedSummary.highlights && dailyReport.sanitizedSummary.highlights.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>✨ Điểm nổi bật:</p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                    {dailyReport.sanitizedSummary.highlights.map((highlight, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dailyReport.sanitizedSummary.advice && dailyReport.sanitizedSummary.advice.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>💡 Lời khuyên:</p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                    {dailyReport.sanitizedSummary.advice.map((advice, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{advice}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dailyReport.sanitizedSummary.risks && dailyReport.sanitizedSummary.risks.length > 0 && (
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px', color: '#F44336' }}>⚠️ Rủi ro:</p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                    {dailyReport.sanitizedSummary.risks.map((risk, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dailyReport.sanitizedSummary.kpis && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#F5F5F5', borderRadius: '6px', fontSize: '12px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '4px' }}>📈 KPIs:</p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {dailyReport.sanitizedSummary.kpis.totalTransactions !== undefined && (
                      <span>Giao dịch: {dailyReport.sanitizedSummary.kpis.totalTransactions}</span>
                    )}
                    {dailyReport.sanitizedSummary.kpis.totalSpending !== undefined && (
                      <span>Chi tiêu: {dailyReport.sanitizedSummary.kpis.totalSpending.toLocaleString('vi-VN')} đ</span>
                    )}
                    {dailyReport.sanitizedSummary.kpis.totalIncome !== undefined && (
                      <span>Thu nhập: {dailyReport.sanitizedSummary.kpis.totalIncome.toLocaleString('vi-VN')} đ</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '14px' }}>
              <p>Chưa có báo cáo hôm nay. Nhấn nút tạo báo cáo để xem phân tích từ AI.</p>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: isGeneratingReport ? 'not-allowed' : 'pointer',
                  marginTop: '8px',
                }}
              >
                {isGeneratingReport ? 'Đang tạo...' : 'Tạo báo cáo mới'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

