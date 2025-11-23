import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Target, ChevronRight, Brain, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
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
    <div className="w-full max-w-[1240px] mx-auto px-4 py-4 md:py-7 flex flex-col gap-6 box-border">
      <Header title="Xin chào!" subtitle={`Chào mừng trở lại, ${displayName}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          {/* Balance Card */}
          <div className="relative overflow-hidden p-6 rounded-2xl border border-border shadow-lg bg-card text-text-primary transition-transform duration-300 hover:-translate-y-1">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <p className="text-sm text-text-secondary uppercase tracking-wider mb-1 font-medium relative z-10">Số dư hiện tại</p>
            <h2 className="text-4xl font-bold mb-6 tracking-tight bg-gradient-to-r from-primary to-primary-strong bg-clip-text text-transparent relative z-10">
              {financialData.balance.toLocaleString('vi-VN')} đ
            </h2>
            
            <div className="flex justify-between flex-wrap gap-4 relative z-10">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Thu nhập</p>
                <p className="text-lg font-semibold text-success">+{(financialData.income / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Chi tiêu</p>
                <p className="text-lg font-semibold text-danger">-{(financialData.expense / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tiết kiệm</p>
                <p className="text-lg font-semibold text-info">{financialData.savingRate}%</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left"
            >
              <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Plus size={20} />
              </div>
              <span className="font-semibold text-text-primary text-sm">Thêm thu chi</span>
            </button>
            <button 
              type="button" 
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
            {activeGoals.map((goal) => (
              <div 
                key={goal.id} 
                className="group bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between mb-2 relative z-10">
                  <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{goal.title}</span>
                  <span className="text-sm font-bold text-primary">
                    {(goal.current / 1000000).toFixed(1)}M / {(goal.target / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative z-10">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-soft rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(goal.current / goal.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
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
            <div className="flex flex-col gap-3">
              {recentExpenses.map((exp) => (
                <div 
                  key={exp.id} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 cursor-pointer"
                >
                  <div className="text-2xl p-2 bg-muted rounded-full shrink-0">
                    {exp.type === 'EXPENSE' ? '💸' : '💰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{exp.category}</p>
                    <p className="text-xs text-text-muted">{exp.date}</p>
                  </div>
                  <p
                    className={`text-base font-bold whitespace-nowrap ${
                      exp.type === 'EXPENSE' ? 'text-danger' : 'text-success'
                    }`}
                  >
                    {exp.type === 'EXPENSE' ? '-' : '+'}
                    {exp.amount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
            </div>
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
                ) : dailyReport ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {dailyReport.insight || 'Chưa có insight cho hôm nay.'}
                    </p>
                    {dailyReport.rootCause && (
                      <div className="text-sm text-text-secondary bg-white/50 dark:bg-black/20 p-2 rounded border border-indigo-100 dark:border-indigo-900/30">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">Lý do: </span>
                        {dailyReport.rootCause}
                      </div>
                    )}
                    {dailyReport.priorityAction && (
                      <div className="flex items-center gap-2 text-sm font-medium text-primary mt-2">
                        <Target size={14} />
                        <span>Ưu tiên: {dailyReport.priorityAction}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-muted italic">
                    Chưa có dữ liệu để tạo báo cáo hôm nay. Hãy thêm giao dịch mới.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
