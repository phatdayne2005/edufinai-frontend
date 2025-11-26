import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Target, ChevronRight, Brain, Loader2, RefreshCw, AlertCircle, PenTool, Shield, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getDailyReport } from '../../services/aiService';
import { getBalance, getMonthlySummary, getRecentTransactions, getGoals } from '../../services/financeApi';
import TransactionModal from '../../components/finance/TransactionModal';
import GoalModal from '../../components/finance/GoalModal';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const HomePage = () => {
  const navigate = useNavigate();
  const { user: mockUser } = useApp();
  const { user: authUser } = useAuth();
  
  // Finance data states
  const [balance, setBalance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [transactionType, setTransactionType] = useState('INCOME');
  
  // AI Report states
  const [dailyReport, setDailyReport] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  
  const activeGoals = goals.filter((goal) => goal.status === 'ACTIVE');

  // Load finance data
  const loadFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [balanceData, summaryData, transactionsData, goalsData] = await Promise.all([
        getBalance().catch(() => null),
        getMonthlySummary().catch(() => null),
        getRecentTransactions(3).catch(() => []),
        getGoals().catch(() => []),
      ]);
      
      setBalance(balanceData);
      setSummary(summaryData);
      setRecentTransactions(transactionsData || []);
      setGoals(goalsData || []);
    } catch (err) {
      console.error('Error loading finance data:', err);
      setError(err.message || 'Không thể tải dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const loadDailyReport = useCallback(async () => {
    setIsLoadingReport(true);
    setReportError(null);
    try {
      const report = await getDailyReport();
      setDailyReport(report);
    } catch (error) {
      // Error 401 (unauthorized) is handled by aiService (redirects to login)
      // For other errors, show error message
      if (error.message?.includes('401') || error.message?.includes('hết hạn')) {
        setReportError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Redirect will be handled by aiService
      } else {
        setReportError(error.message || 'Không thể tải báo cáo');
      }
      setDailyReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    loadDailyReport();
  }, [loadDailyReport]);

  // Handle transaction success
  const handleTransactionSuccess = useCallback(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Handle goal success
  const handleGoalSuccess = useCallback(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Use real user name from AuthContext if available, otherwise fallback to mock data
  const displayName = authUser?.name || authUser?.username || mockUser?.name || 'Người dùng';

  // Role Check Logic
  const roles = authUser?.roles || [];
  const hasRole = (roleName) => {
    if (!roles || roles.length === 0) return false;
    return roles.some(r => {
      const rName = typeof r === 'string' ? r : (r?.name || r?.authority || '');
      if (!rName) return false;
      const upperRoleName = rName.toUpperCase();
      const upperSearchName = roleName.toUpperCase();
      // Check for exact match or contains (e.g., 'ROLE_CREATOR' contains 'CREATOR')
      return upperRoleName === upperSearchName || 
             upperRoleName.includes(upperSearchName) ||
             upperRoleName === `ROLE_${upperSearchName}`;
    });
  };

  const isCreator = hasRole('CREATOR');
  const isMod = hasRole('MOD') || hasRole('MODERATOR');
  const isAdmin = hasRole('ADMIN');

  const headerAction = (isCreator || isMod || isAdmin) ? (
    <div className="flex gap-2">
      {isAdmin && (
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="px-3 py-2 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-colors text-sm flex items-center gap-2"
        >
           <UserCog size={16} />
           <span className="hidden sm:inline">Admin</span>
        </button>
      )}
      {isCreator && (
        <button
          onClick={() => navigate('/creator/dashboard')}
          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-colors text-sm flex items-center gap-2"
        >
           <PenTool size={16} />
           <span className="hidden sm:inline">Creator</span>
        </button>
      )}
      {isMod && (
        <button
          onClick={() => navigate('/mod/dashboard')}
          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-colors text-sm flex items-center gap-2"
        >
           <Shield size={16} />
           <span className="hidden sm:inline">Moderator</span>
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 py-4 md:py-7 flex flex-col gap-6 box-border">
      <Header 
        title="Xin chào!" 
        subtitle={`Chào mừng trở lại, ${displayName}`} 
        action={headerAction}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          {/* Balance Card */}
          <div className="relative overflow-hidden p-6 rounded-2xl border border-border shadow-lg bg-card text-text-primary transition-transform duration-300 hover:-translate-y-1">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <p className="text-sm text-text-secondary uppercase tracking-wider mb-1 font-medium relative z-10">Số dư hiện tại</p>
            <h2 className="text-4xl font-bold mb-6 tracking-tight bg-gradient-to-r from-primary to-primary-strong bg-clip-text text-transparent relative z-10">
              {loading ? (
                <Loader2 size={32} className="animate-spin text-primary" />
              ) : balance?.currentBalance !== undefined ? (
                formatCurrency(balance.currentBalance)
              ) : (
                '0 đ'
              )}
            </h2>
            
            <div className="flex justify-between flex-wrap gap-4 relative z-10">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Thu nhập</p>
                <p className="text-lg font-semibold text-success">
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : summary?.monthlyIncome !== undefined ? (
                    `+${formatCurrency(summary.monthlyIncome)}`
                  ) : (
                    '+0 đ'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Chi tiêu</p>
                <p className="text-lg font-semibold text-danger">
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : summary?.monthlyExpense !== undefined ? (
                    `-${formatCurrency(summary.monthlyExpense)}`
                  ) : (
                    '-0 đ'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tiết kiệm</p>
                <p className="text-lg font-semibold text-info">
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : summary?.savingRate !== undefined ? (
                    `${summary.savingRate.toFixed(1)}%`
                  ) : (
                    '0%'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => {
                setTransactionType('INCOME');
                setShowTransactionModal(true);
              }}
              className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left"
            >
              <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Plus size={20} />
              </div>
              <span className="font-semibold text-text-primary text-sm">Thêm thu chi</span>
            </button>
            <button 
              type="button" 
              onClick={() => setShowGoalModal(true)}
              className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left"
            >
              <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Target size={20} />
              </div>
              <span className="font-semibold text-text-primary text-sm">Mục tiêu mới</span>
            </button>
          </div>

          {/* Financial Goals */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text-primary">Mục tiêu tài chính</h3>
              <button className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : activeGoals.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Chưa có mục tiêu nào</p>
            ) : (
              activeGoals.map((goal) => {
                const progress = goal.amount > 0 ? (goal.savedAmount / goal.amount) * 100 : 0;
                return (
                  <div 
                    key={goal.goalId} 
                    onClick={() => {
                      navigate('/', { 
                        state: { 
                          activeTab: 'finance',
                          goalId: goal.goalId 
                        } 
                      });
                    }}
                    className="group bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex justify-between mb-2 relative z-10">
                      <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{goal.title}</span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(goal.savedAmount)} / {formatCurrency(goal.amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative z-10">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-soft rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      {Math.round(progress)}% hoàn thành
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Recent Transactions */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text-primary">Giao dịch gần đây</h3>
              <button className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Chưa có giao dịch nào</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.transactionId} 
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 cursor-pointer"
                  >
                    <div className="text-2xl p-2 bg-muted rounded-full shrink-0">
                      {transaction.type === 'EXPENSE' ? '💸' : transaction.type === 'WITHDRAWAL' ? '💳' : '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{transaction.name}</p>
                      <p className="text-xs text-text-muted">{transaction.category}</p>
                      <p className="text-xs text-text-muted">{formatDateTime(transaction.transactionDate)}</p>
                    </div>
                    <p
                      className={`text-base font-bold whitespace-nowrap ${
                        // INCOME có goalId (nạp vào mục tiêu) hoặc EXPENSE: hiển thị số âm (màu đỏ)
                        // WITHDRAWAL (rút từ mục tiêu) hoặc INCOME không có goalId: hiển thị số dương (màu xanh)
                        transaction.type === 'EXPENSE' || (transaction.type === 'INCOME' && transaction.goalId)
                          ? 'text-danger'
                          : 'text-success'
                      }`}
                    >
                      {transaction.type === 'EXPENSE' || (transaction.type === 'INCOME' && transaction.goalId) ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Report Card */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-primary shrink-0">
                <Brain size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Báo cáo hôm nay</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-0.5">
                      {dailyReport?.reportDate
                        ? new Date(dailyReport.reportDate).toLocaleDateString('vi-VN')
                        : 'Dữ liệu realtime từ AI'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={isLoadingReport ? undefined : loadDailyReport}
                    disabled={isLoadingReport}
                    className={`text-primary p-1.5 rounded-full hover:bg-primary/10 transition-colors ${
                      isLoadingReport ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    title="Làm mới báo cáo"
                  >
                    {isLoadingReport ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                </div>

                {isLoadingReport ? (
                  <div className="flex items-center gap-2 mt-3 text-sm text-text-muted">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang phân tích dữ liệu...</span>
                  </div>
                ) : reportError ? (
                  <div className="mt-3 bg-danger/10 rounded-lg p-3 border border-danger/20">
                    <div className="flex gap-2 items-start text-danger text-sm">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{reportError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={loadDailyReport}
                      className="mt-2 text-xs bg-danger text-white px-3 py-1.5 rounded-md font-medium hover:bg-danger/90 transition-colors"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : dailyReport ? (() => {
                  // Simple check: if fields are null/empty/undefined, treat as no data
                  // Backend should return null/empty when there's no data, not error messages
                  const insight = dailyReport.insight?.trim();
                  const rootCause = dailyReport.rootCause?.trim();
                  const priorityAction = dailyReport.priorityAction?.trim();
                  
                  const hasInsight = insight && insight.length > 0;
                  const hasRootCause = rootCause && rootCause.length > 0;
                  const hasPriorityAction = priorityAction && priorityAction.length > 0;

                  // If all fields are empty/null, show fallback message
                  if (!hasInsight && !hasRootCause && !hasPriorityAction) {
                    return (
                      <p className="mt-3 text-sm text-text-muted italic">
                        Chưa đủ dữ liệu để tạo báo cáo. Vui lòng cập nhật dữ liệu.
                      </p>
                    );
                  }

                  // Show report with available data
                  return (
                    <div className="mt-3 space-y-2">
                      {hasInsight && (
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {insight}
                        </p>
                      )}
                      {hasRootCause && (
                        <div className="text-sm text-text-secondary bg-white/50 dark:bg-black/20 p-2 rounded border border-indigo-100 dark:border-indigo-900/30">
                          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Lý do: </span>
                          {rootCause}
                        </div>
                      )}
                      {hasPriorityAction && (
                        <div className="flex items-center gap-2 text-sm font-medium text-primary mt-2">
                          <Target size={14} />
                          <span>Ưu tiên: {priorityAction}</span>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <p className="mt-3 text-sm text-text-muted italic">
                    Chưa có dữ liệu để tạo báo cáo hôm nay. Hãy thêm giao dịch mới.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSuccess={handleTransactionSuccess}
        type={transactionType}
      />
      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSuccess={handleGoalSuccess}
      />
    </div>
  );
};

export default HomePage;
