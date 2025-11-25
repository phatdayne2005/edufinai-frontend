import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Target, CheckCircle, Loader2, Trash2, TrendingUp, TrendingDown, Settings, History, ChevronDown, ChevronRight } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Header from '../../components/layout/Header';
import TransactionModal from '../../components/finance/TransactionModal';
import GoalModal from '../../components/finance/GoalModal';
import WithdrawModal from '../../components/finance/WithdrawModal';
import CategoryModal from '../../components/finance/CategoryModal';
import {
  getTransactions,
  deleteTransaction,
  getGoals,
  getMonthlySummary,
  confirmGoalCompletion,
  deleteGoal,
  getGoalTransactionHistory,
} from '../../services/financeApi';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';

const tabs = [
  { id: 'expense', label: 'Thu chi' },
  { id: 'goals', label: 'Mục tiêu' },
  { id: 'reports', label: 'Báo cáo' },
];

const FinancePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expense');
  const [transitionDirection, setTransitionDirection] = useState('forward');
  const goalRefs = useRef({});

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [transactionsPage, setTransactionsPage] = useState(0);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: null, endDate: null });

  // Goals state
  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);

  // Summary state
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [transactionType, setTransactionType] = useState('INCOME');
  const [selectedGoalForTransaction, setSelectedGoalForTransaction] = useState(null);
  const [showGoalHistoryModal, setShowGoalHistoryModal] = useState(false);
  const [goalHistoryLoading, setGoalHistoryLoading] = useState(false);
  const [goalHistoryData, setGoalHistoryData] = useState(null);
  const [goalHistoryFilter, setGoalHistoryFilter] = useState('DEPOSIT');
  const [goalHistoryError, setGoalHistoryError] = useState(null);
  const [goalHistoryGoal, setGoalHistoryGoal] = useState(null);

  // Reports: Expanded categories state
  const [expandedIncomeCategories, setExpandedIncomeCategories] = useState(new Set());
  const [expandedExpenseCategories, setExpandedExpenseCategories] = useState(new Set());

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextIndex = tabs.findIndex((t) => t.id === nextTab);
    setTransitionDirection(nextIndex > currentIndex ? 'forward' : 'backward');
    setActiveTab(nextTab);
  };

  // Load transactions
  const loadTransactions = useCallback(async (page = 0) => {
    try {
      setLoadingTransactions(true);
      const params = {
        page,
        size: 15,
        ...(dateFilter.startDate && { startDate: dateFilter.startDate }),
        ...(dateFilter.endDate && { endDate: dateFilter.endDate }),
      };
      const response = await getTransactions(params);
      setTransactions(response.content || []);
      setTransactionsTotal(response.totalElements || 0);
      setTransactionsPage(page);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [dateFilter]);

  // Get current month start and end dates
  const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    return { startDate, endDate };
  };

  // Load all transactions for current month (for Reports)
  const loadCurrentMonthTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true);
      const { startDate, endDate } = getCurrentMonthRange();
      const params = {
        page: 0,
        size: 1000, // Load large number to get all transactions
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      const response = await getTransactions(params);
      // Set transactions for current month (used in Reports)
      setTransactions(response.content || []);
    } catch (error) {
      console.error('Error loading current month transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  // Load goals
  const loadGoals = useCallback(async () => {
    try {
      setLoadingGoals(true);
      const data = await getGoals();
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  }, []);

  // Load summary
  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const data = await getMonthlySummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'expense') {
      loadTransactions(0);
    } else if (activeTab === 'goals') {
      loadGoals();
    } else if (activeTab === 'reports') {
      loadSummary();
      // Load all transactions for current month to show category details
      loadCurrentMonthTransactions();
    }
  }, [activeTab, loadTransactions, loadGoals, loadSummary, loadCurrentMonthTransactions]);

  // Handle navigation from HomePage - scroll to goal
  useEffect(() => {
    const goalId = location.state?.goalId;
    if (goalId) {
      // Switch to goals tab if not already
      if (activeTab !== 'goals') {
        handleTabChange('goals');
      }
      
      // Wait for goals to load, then scroll to goal
      const scrollToGoal = () => {
        setTimeout(() => {
          const goalElement = goalRefs.current[goalId];
          if (goalElement) {
            goalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the goal briefly
            goalElement.classList.add('goal-highlight');
            setTimeout(() => {
              goalElement.classList.remove('goal-highlight');
            }, 2000);
          }
        }, 500);
      };

      // If goals are already loaded, scroll immediately
      // Otherwise wait for them to load
      if (goals.length > 0) {
        scrollToGoal();
      } else {
        // Load goals first, then scroll
        const loadAndScroll = async () => {
          await loadGoals();
          scrollToGoal();
        };
        loadAndScroll();
      }

      // Clear the goalId from state after processing
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.goalId, activeTab, goals.length, loadGoals, navigate, location.pathname, handleTabChange]);

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      return;
    }

    try {
      await deleteTransaction(transactionId);
      await loadTransactions(transactionsPage);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(error.message || 'Không thể xóa giao dịch');
    }
  };

  const handleConfirmGoalCompletion = async (goal) => {
    // Ensure savedAmount and amount are numbers
    const savedAmount = typeof goal.savedAmount === 'string' 
      ? parseFloat(goal.savedAmount) || 0 
      : (goal.savedAmount || 0);
    const amount = typeof goal.amount === 'string' 
      ? parseFloat(goal.amount) || 0 
      : (goal.amount || 0);

    if (savedAmount < amount) {
      alert(`Mục tiêu chưa đủ tiền. Số tiền hiện có: ${formatCurrency(savedAmount)}, cần: ${formatCurrency(amount)}`);
      return;
    }

    if (goal.status === 'COMPLETED') {
      alert('Mục tiêu đã được xác nhận hoàn thành');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xác nhận hoàn thành mục tiêu "${goal.title}"? Sau khi xác nhận, bạn sẽ không thể thao tác (nạp, rút, xóa) mục tiêu này nữa.`)) {
      return;
    }

    try {
      await confirmGoalCompletion(goal.goalId);
      await loadGoals();
      alert('Đã xác nhận hoàn thành mục tiêu thành công!');
    } catch (error) {
      console.error('Error confirming goal completion:', error);
      alert(error.message || 'Không thể xác nhận hoàn thành mục tiêu. Vui lòng thử lại.');
    }
  };

  const handleDeleteGoal = async (goal) => {
    // Không cho phép xóa goal đã COMPLETED
    if (goal.status === 'COMPLETED') {
      alert('Không thể xóa mục tiêu đã hoàn thành.');
      return;
    }

    // Ensure savedAmount is a number
    const savedAmount = typeof goal.savedAmount === 'string' 
      ? parseFloat(goal.savedAmount) || 0 
      : (goal.savedAmount || 0);

    let confirmMessage = `Bạn có chắc chắn muốn xóa mục tiêu "${goal.title}"?`;
    
    if (savedAmount > 0) {
      confirmMessage += `\n\nMục tiêu này có ${formatCurrency(savedAmount)} đã nạp. Khi xóa, toàn bộ số tiền này sẽ tự động được rút về số dư hiện tại của bạn.`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteGoal(goal.goalId);
      await loadGoals();
      // Reload transactions to show the auto-created withdrawal transaction
      if (activeTab === 'expense') {
        await loadTransactions(transactionsPage);
      }
      alert(savedAmount > 0 
        ? `Đã xóa mục tiêu. ${formatCurrency(savedAmount)} đã được tự động rút về số dư hiện tại.`
        : 'Đã xóa mục tiêu thành công.'
      );
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert(error.message || 'Không thể xóa mục tiêu. Vui lòng thử lại.');
    }
  };

  const handleWithdraw = (goal) => {
    setSelectedGoal(goal);
    setShowWithdrawModal(true);
  };

  const handleAddToGoal = (goal) => {
    // Không cho phép nạp nếu goal đã COMPLETED (đã xác nhận hoàn thành)
    if (goal.status === 'COMPLETED') {
      alert('Không thể nạp tiền vào mục tiêu đã hoàn thành.');
      return;
    }
    
    // Ensure savedAmount and amount are numbers
    const savedAmount = typeof goal.savedAmount === 'string' 
      ? parseFloat(goal.savedAmount) || 0 
      : (goal.savedAmount || 0);
    const amount = typeof goal.amount === 'string' 
      ? parseFloat(goal.amount) || 0 
      : (goal.amount || 0);
    
    // Không cho phép nạp nếu goal đã đủ tiền (savedAmount >= amount)
    // Nhưng nếu user rút ra thì có thể nạp lại
    if (savedAmount >= amount) {
      alert('Mục tiêu đã đủ tiền. Nếu bạn cần nạp thêm, hãy rút một phần tiền ra trước.');
      return;
    }
    
    setSelectedGoalForTransaction(goal);
    setTransactionType('INCOME');
    setShowTransactionModal(true);
  };

  const fetchGoalHistory = useCallback(async (goalId) => {
    if (!goalId) return;
    try {
      setGoalHistoryLoading(true);
      setGoalHistoryError(null);
      const data = await getGoalTransactionHistory(goalId);
      setGoalHistoryData(data);
    } catch (error) {
      console.error('Error fetching goal history:', error);
      setGoalHistoryError(error.message || 'Không thể tải lịch sử giao dịch');
    } finally {
      setGoalHistoryLoading(false);
    }
  }, []);

  const handleViewGoalHistory = (goal) => {
    if (!goal) return;
    setGoalHistoryGoal(goal);
    setGoalHistoryFilter('DEPOSIT');
    setGoalHistoryData(null);
    setShowGoalHistoryModal(true);
    fetchGoalHistory(goal.goalId);
  };

  const closeGoalHistoryModal = () => {
    setShowGoalHistoryModal(false);
    setGoalHistoryGoal(null);
    setGoalHistoryData(null);
    setGoalHistoryError(null);
  };

  const handleSuccess = () => {
    if (activeTab === 'expense') {
      loadTransactions(transactionsPage);
    } else if (activeTab === 'goals') {
      loadGoals();
    } else if (activeTab === 'reports') {
      loadSummary();
    }

    if (showGoalHistoryModal && goalHistoryGoal) {
      fetchGoalHistory(goalHistoryGoal.goalId);
    }
  };

  // Extended color palette for categories (20+ distinct colors)
  const CATEGORY_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#FF6B9D', '#C44569', '#F8B500', '#6C5CE7', '#00D2D3', '#FF6348',
    '#FFA07A', '#20B2AA', '#9370DB', '#FFD700', '#FF69B4', '#00CED1',
    '#32CD32', '#FF4500', '#1E90FF', '#FF1493', '#00FA9A', '#FF8C00',
    '#8A2BE2', '#DC143C', '#00BFFF', '#FFD700', '#ADFF2F', '#FF69B4',
    '#40E0D0', '#EE82EE', '#F0E68C', '#DDA0DD', '#98D8C8', '#F7DC6F',
  ];

  // Function to get color for a category (consistent mapping)
  const getCategoryColor = (categoryName) => {
    // Simple hash function to consistently map category name to color
    let hash = 0;
    const name = categoryName || 'Khác';
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % CATEGORY_COLORS.length;
    return CATEGORY_COLORS[index];
  };

  // Filter transactions for current month
  const getCurrentMonthTransactions = () => {
    const { startDate, endDate } = getCurrentMonthRange();
    return transactions.filter((t) => {
      const txDate = new Date(t.transactionDate);
      return txDate >= startDate && txDate <= endDate;
    });
  };

  // Prepare chart data for reports (current month only)
  const currentMonthTransactions = getCurrentMonthTransactions();
  
  const spendingByCategory = currentMonthTransactions
    .filter((t) => t.type === 'EXPENSE' && !t.goalId) // Exclude goal deposits
    .reduce((acc, t) => {
      const category = t.category || 'Khác';
      acc[category] = (acc[category] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

  const incomeByCategory = currentMonthTransactions
    .filter((t) => t.type === 'INCOME' && !t.goalId) // Only regular income, exclude goal deposits
    .reduce((acc, t) => {
      const category = t.category || 'Khác';
      acc[category] = (acc[category] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

  const chartData = {
    spending: Object.entries(spendingByCategory)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value), // Sort by value descending
    income: Object.entries(incomeByCategory)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value), // Sort by value descending
  };

  // Get transactions by category for current month
  const getTransactionsByCategory = (categoryName, type) => {
    return currentMonthTransactions.filter(
      (t) => (t.category || 'Khác') === categoryName && t.type === type && !t.goalId
    );
  };

  // Toggle expanded category
  const toggleIncomeCategory = (categoryName) => {
    const newSet = new Set(expandedIncomeCategories);
    if (newSet.has(categoryName)) {
      newSet.delete(categoryName);
    } else {
      newSet.add(categoryName);
    }
    setExpandedIncomeCategories(newSet);
  };

  const toggleExpenseCategory = (categoryName) => {
    const newSet = new Set(expandedExpenseCategories);
    if (newSet.has(categoryName)) {
      newSet.delete(categoryName);
    } else {
      newSet.add(categoryName);
    }
    setExpandedExpenseCategories(newSet);
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 py-4 md:py-7 flex flex-col gap-6">
      <Header title="Tài chính" subtitle="Quản lý thu chi & mục tiêu" />

      <div className="flex gap-2 border-b border-border">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div key={activeTab} className={`tab-transition tab-transition--${transitionDirection}`}>
        {/* Transactions Tab */}
        {activeTab === 'expense' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('INCOME');
                    setShowTransactionModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <TrendingUp size={18} />
                  Thêm khoản thu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('EXPENSE');
                    setShowTransactionModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-danger to-danger-strong text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <TrendingDown size={18} />
                  Thêm khoản chi
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 rounded-xl border border-border bg-background text-text-primary font-medium hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Settings size={18} />
                Quản lý danh mục
              </button>
            </div>

            {/* Date Filter */}
            <div className="flex gap-2 flex-wrap">
              <input
                type="date"
                value={dateFilter.startDate ? dateFilter.startDate.split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value;
                  setDateFilter((prev) => ({
                    ...prev,
                    startDate: date ? `${date}T00:00:00` : null,
                  }));
                }}
                className="px-4 py-2 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="date"
                value={dateFilter.endDate ? dateFilter.endDate.split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value;
                  setDateFilter((prev) => ({
                    ...prev,
                    endDate: date ? `${date}T23:59:59` : null,
                  }));
                }}
                className="px-4 py-2 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => {
                  setDateFilter({ startDate: null, endDate: null });
                }}
                className="px-4 py-2 rounded-xl border border-border bg-background text-text-primary font-medium hover:bg-muted transition-colors"
              >
                Xóa lọc
              </button>
            </div>

            {loadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center py-12 text-text-muted">Chưa có giao dịch nào</p>
            ) : (
              <>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.transactionId}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg">
                            {transaction.type === 'EXPENSE' ? '💸' : transaction.type === 'WITHDRAWAL' ? '💳' : '💰'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text-primary truncate">{transaction.name}</p>
                            <p className="text-sm text-text-muted">{transaction.category}</p>
                            <p className="text-xs text-text-muted">{formatDateTime(transaction.transactionDate)}</p>
                            {transaction.note && (
                              <p className="text-xs text-text-muted mt-1 italic">{transaction.note}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p
                          className={`text-lg font-bold whitespace-nowrap ${
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
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(transaction.transactionId)}
                          className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Xóa giao dịch"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {transactionsTotal > 15 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => loadTransactions(transactionsPage - 1)}
                      disabled={transactionsPage === 0}
                      className="px-4 py-2 rounded-xl border border-border bg-background text-text-primary font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="text-sm text-text-muted">
                      Trang {transactionsPage + 1} / {Math.ceil(transactionsTotal / 15)}
                    </span>
                    <button
                      type="button"
                      onClick={() => loadTransactions(transactionsPage + 1)}
                      disabled={(transactionsPage + 1) * 15 >= transactionsTotal}
                      className="px-4 py-2 rounded-xl border border-border bg-background text-text-primary font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Tạo mục tiêu mới
            </button>

            {loadingGoals ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : goals.length === 0 ? (
              <p className="text-center py-12 text-text-muted">Chưa có mục tiêu nào</p>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => {
                  // Ensure savedAmount and amount are numbers
                  const savedAmount = typeof goal.savedAmount === 'string' 
                    ? parseFloat(goal.savedAmount) || 0 
                    : (goal.savedAmount || 0);
                  const amount = typeof goal.amount === 'string' 
                    ? parseFloat(goal.amount) || 0 
                    : (goal.amount || 0);
                  const progress = amount > 0 ? (savedAmount / amount) * 100 : 0;
                  const canWithdraw = savedAmount > 0;
                  
                  const statusLabels = {
                    ACTIVE: 'Đang thực hiện',
                    COMPLETED: 'Đã hoàn thành',
                    FAILED: 'Thất bại',
                  };
                  const statusColors = {
                    ACTIVE: 'text-primary',
                    COMPLETED: 'text-success',
                    FAILED: 'text-danger',
                  };

                  return (
                    <div
                      key={goal.goalId}
                      ref={(el) => {
                        if (el) goalRefs.current[goal.goalId] = el;
                      }}
                      className="p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all goal-item"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {goal.status === 'COMPLETED' ? (
                              <CheckCircle size={20} className="text-success" />
                            ) : (
                              <Target size={20} className="text-primary" />
                            )}
                            <h4 className="text-lg font-semibold text-text-primary">{goal.title}</h4>
                          </div>
                          <p className={`text-sm font-medium ${statusColors[goal.status] || ''}`}>
                            {statusLabels[goal.status] || goal.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(savedAmount)} / {formatCurrency(amount)}
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatDate(goal.startAt)} - {formatDate(goal.endAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-soft rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-text-muted mt-2">{Math.round(progress)}% hoàn thành</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {/* Chỉ hiển thị nút nạp/rút/xóa khi goal chưa COMPLETED (status !== 'COMPLETED') */}
                        {goal.status !== 'COMPLETED' && (
                          <>
                            {/* Nạp tiền: Ẩn khi đã đủ tiền (savedAmount >= amount) */}
                            {savedAmount < amount && (
                              <button
                                type="button"
                                onClick={() => handleAddToGoal(goal)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                              >
                                <TrendingUp size={16} />
                                Nạp tiền
                              </button>
                            )}
                            
                            {/* Rút tiền: luôn hiển thị để giữ bố cục, disable khi chưa có tiền */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!canWithdraw) return;
                                handleWithdraw(goal);
                              }}
                              disabled={!canWithdraw}
                              className={`px-4 py-2 rounded-xl border font-medium transition-colors ${
                                canWithdraw
                                  ? 'border-border bg-background text-text-primary hover:bg-muted'
                                  : 'border-dashed border-border text-text-muted bg-muted/40 cursor-not-allowed opacity-60'
                              }`}
                            >
                              Rút tiền
                            </button>
                            
                            {/* Lịch sử giao dịch: luôn hiển thị để người dùng xem lịch sử */}
                            <button
                              type="button"
                              onClick={() => handleViewGoalHistory(goal)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                            >
                              <History size={16} />
                              Xem lịch sử giao dịch
                            </button>
                            
                            {/* Xóa mục tiêu: Luôn hiển thị khi chưa COMPLETED */}
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal)}
                              className="px-4 py-2 rounded-xl bg-danger text-white font-medium hover:bg-danger/90 transition-colors flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Xóa mục tiêu
                            </button>
                          </>
                        )}

                        {/* Goal đã hoàn thành vẫn cần xem lịch sử */}
                        {goal.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleViewGoalHistory(goal)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <History size={16} />
                            Xem lịch sử giao dịch
                          </button>
                        )}
                        
                        {/* Hiển thị nút xác nhận hoàn thành khi goal đủ tiền nhưng chưa xác nhận */}
                        {goal.status === 'ACTIVE' && goal.newStatus === 'COMPLETED' && savedAmount >= amount && (
                          <button
                            type="button"
                            onClick={() => handleConfirmGoalCompletion(goal)}
                            className="px-4 py-2 rounded-xl bg-success text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Xác nhận hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {loadingSummary ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : summary ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm text-text-muted mb-1">Thu nhập tháng này</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(summary.monthlyIncome)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm text-text-muted mb-1">Chi tiêu tháng này</p>
                    <p className="text-2xl font-bold text-danger">{formatCurrency(summary.monthlyExpense)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <p className="text-sm text-text-muted mb-1">Tỷ lệ tiết kiệm</p>
                    <p className="text-2xl font-bold text-primary">{summary.savingRate.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Income Chart with Category Panel */}
                {chartData.income.length > 0 && (
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <h4 className="text-lg font-semibold text-text-primary mb-4">Thu nhập theo danh mục</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Donut Chart - Left */}
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={chartData.income}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.income.map((entry) => (
                                <Cell key={`income-${entry.name}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Category Panel - Right */}
                      <div className="border-l border-border pl-6">
                        <h5 className="text-lg font-semibold text-text-primary mb-4">Danh mục con</h5>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                          {chartData.income.map((category) => {
                            const isExpanded = expandedIncomeCategories.has(category.name);
                            const categoryTransactions = getTransactionsByCategory(category.name, 'INCOME');
                            
                            return (
                              <div key={`income-cat-${category.name}`} className="border border-border rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleIncomeCategory(category.name)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: category.color }}
                                      />
                                      <span className="font-medium text-text-primary truncate">{category.name}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-success ml-5">
                                      {formatCurrency(category.value)}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 ml-2">
                                    {isExpanded ? (
                                      <ChevronDown size={20} className="text-text-muted" />
                                    ) : (
                                      <ChevronRight size={20} className="text-text-muted" />
                                    )}
                                  </div>
                                </button>

                                {/* Expanded Transaction Details */}
                                {isExpanded && (
                                  <div className="border-t border-border bg-muted/20 p-3 space-y-2 max-h-[300px] overflow-y-auto">
                                    {categoryTransactions.length === 0 ? (
                                      <p className="text-sm text-text-muted text-center py-2">Chưa có giao dịch nào</p>
                                    ) : (
                                      categoryTransactions.map((tx) => (
                                        <div
                                          key={tx.transactionId}
                                          className="bg-background rounded-lg p-3 border border-border"
                                        >
                                          <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-text-primary">{tx.name}</p>
                                              <p className="text-xs text-text-muted mt-1">
                                                {formatDateTime(tx.transactionDate)}
                                              </p>
                                            </div>
                                            <p className="text-sm font-semibold text-success whitespace-nowrap">
                                              +{formatCurrency(tx.amount)}
                                            </p>
                                          </div>
                                          {tx.note && (
                                            <p className="text-xs text-text-muted italic mt-2">Ghi chú: {tx.note}</p>
                                          )}
                                          <p className="text-xs text-text-muted mt-1">
                                            Thời gian: {formatDateTime(tx.transactionDate)}
                                          </p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expense Chart with Category Panel */}
                {chartData.spending.length > 0 && (
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <h4 className="text-lg font-semibold text-text-primary mb-4">Chi tiêu theo danh mục</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Donut Chart - Left */}
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={chartData.spending}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.spending.map((entry) => (
                                <Cell key={`spending-${entry.name}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Category Panel - Right */}
                      <div className="border-l border-border pl-6">
                        <h5 className="text-lg font-semibold text-text-primary mb-4">Danh mục cha</h5>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                          {chartData.spending.map((category) => {
                            const isExpanded = expandedExpenseCategories.has(category.name);
                            const categoryTransactions = getTransactionsByCategory(category.name, 'EXPENSE');
                            
                            return (
                              <div key={`expense-cat-${category.name}`} className="border border-border rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleExpenseCategory(category.name)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: category.color }}
                                      />
                                      <span className="font-medium text-text-primary truncate">{category.name}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-danger ml-5">
                                      {formatCurrency(category.value)}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 ml-2">
                                    {isExpanded ? (
                                      <ChevronDown size={20} className="text-text-muted" />
                                    ) : (
                                      <ChevronRight size={20} className="text-text-muted" />
                                    )}
                                  </div>
                                </button>

                                {/* Expanded Transaction Details */}
                                {isExpanded && (
                                  <div className="border-t border-border bg-muted/20 p-3 space-y-2 max-h-[300px] overflow-y-auto">
                                    {categoryTransactions.length === 0 ? (
                                      <p className="text-sm text-text-muted text-center py-2">Chưa có giao dịch nào</p>
                                    ) : (
                                      categoryTransactions.map((tx) => (
                                        <div
                                          key={tx.transactionId}
                                          className="bg-background rounded-lg p-3 border border-border"
                                        >
                                          <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-text-primary">{tx.name}</p>
                                              <p className="text-xs text-text-muted mt-1">
                                                {formatDateTime(tx.transactionDate)}
                                              </p>
                                            </div>
                                            <p className="text-sm font-semibold text-danger whitespace-nowrap">
                                              -{formatCurrency(tx.amount)}
                                            </p>
                                          </div>
                                          {tx.note && (
                                            <p className="text-xs text-text-muted italic mt-2">Ghi chú: {tx.note}</p>
                                          )}
                                          <p className="text-xs text-text-muted mt-1">
                                            Thời gian: {formatDateTime(tx.transactionDate)}
                                          </p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Combined Bar Chart */}
                {(chartData.income.length > 0 || chartData.spending.length > 0) && (() => {
                  // Combine all unique categories
                  const allCategories = new Set([
                    ...chartData.income.map(item => item.name),
                    ...chartData.spending.map(item => item.name),
                  ]);
                  
                  const combinedData = Array.from(allCategories).map(category => {
                    const incomeItem = chartData.income.find(item => item.name === category);
                    const spendingItem = chartData.spending.find(item => item.name === category);
                    return {
                      name: category,
                      'Thu nhập': incomeItem ? incomeItem.value : 0,
                      'Chi tiêu': spendingItem ? spendingItem.value : 0,
                      incomeColor: incomeItem ? incomeItem.color : '#36A2EB',
                      spendingColor: spendingItem ? spendingItem.color : '#FF6384',
                    };
                  });

                  return (
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <h4 className="text-lg font-semibold text-text-primary mb-4">So sánh thu và chi theo danh mục</h4>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={combinedData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [formatCurrency(value), name]}
                          />
                          <Legend />
                          <Bar 
                            dataKey="Thu nhập" 
                            fill="#36A2EB"
                            name="Thu nhập"
                          >
                            {combinedData.map((entry, index) => (
                              <Cell key={`income-bar-${entry.name}-${index}`} fill={entry.incomeColor} />
                            ))}
                          </Bar>
                          <Bar 
                            dataKey="Chi tiêu" 
                            fill="#FF6384"
                            name="Chi tiêu"
                          >
                            {combinedData.map((entry, index) => (
                              <Cell key={`spending-bar-${entry.name}-${index}`} fill={entry.spendingColor} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="text-center py-12 text-text-muted">Chưa có dữ liệu báo cáo</p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedGoalForTransaction(null);
        }}
        onSuccess={() => {
          handleSuccess();
          setSelectedGoalForTransaction(null);
        }}
        type={transactionType}
        preselectedGoalId={selectedGoalForTransaction?.goalId}
        preselectedGoalTitle={selectedGoalForTransaction?.title}
      />
      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSuccess={handleSuccess}
      />
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          setSelectedGoal(null);
        }}
        onSuccess={handleSuccess}
        goal={selectedGoal}
      />
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={handleSuccess}
      />
      {showGoalHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Lịch sử giao dịch</p>
                <h3 className="text-xl font-semibold text-text-primary">
                  {`Lịch sử giao dịch — ${goalHistoryData?.goalTitle || goalHistoryGoal?.title || ''}`}
                </h3>
                <p className="text-sm text-text-muted">
                  {goalHistoryData
                    ? `${formatCurrency(goalHistoryData.savedAmount)} / ${formatCurrency(goalHistoryData.goalAmount)}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeGoalHistoryModal}
                className="text-text-muted hover:text-text-primary text-2xl leading-none"
                aria-label="Đóng"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="flex gap-2">
                {[
                  { id: 'DEPOSIT', label: 'Nạp', type: 'INCOME' },
                  { id: 'WITHDRAWAL', label: 'Rút', type: 'WITHDRAWAL' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setGoalHistoryFilter(filter.id)}
                    className={`flex-1 px-4 py-2 rounded-xl border font-medium transition-colors ${
                      goalHistoryFilter === filter.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-text-primary hover:bg-muted'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {goalHistoryLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              ) : goalHistoryError ? (
                <p className="text-center text-danger py-8">{goalHistoryError}</p>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {(() => {
                    const transactions =
                      goalHistoryData?.transactions?.filter((tx) =>
                        goalHistoryFilter === 'DEPOSIT' ? tx.type === 'INCOME' : tx.type === 'WITHDRAWAL'
                      ) || [];

                    if (transactions.length === 0) {
                      return <p className="text-center text-text-muted py-8">Chưa có giao dịch nào</p>;
                    }

                    return transactions.map((tx) => (
                      <div
                        key={tx.transactionId}
                        className="rounded-xl border border-border bg-background/80 p-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-text-primary">{tx.name || (tx.type === 'INCOME' ? 'Nạp tiền' : 'Rút tiền')}</p>
                            <p className="text-sm text-text-muted">{formatDateTime(tx.transactionDate)}</p>
                            {tx.categoryName && (
                              <p className="text-xs text-text-muted mt-1">Danh mục: {tx.categoryName}</p>
                            )}
                            {tx.note && <p className="text-xs text-text-muted italic mt-1">Ghi chú: {tx.note}</p>}
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-sm font-medium px-2 py-1 rounded-full ${
                                tx.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                              }`}
                            >
                              {tx.type === 'INCOME' ? 'Nạp' : 'Rút'}
                            </span>
                            <p
                              className={`mt-2 text-lg font-bold ${
                                tx.type === 'INCOME' ? 'text-success' : 'text-danger'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : '-'}
                              {formatCurrency(tx.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {goalHistoryData?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border pt-4">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-text-muted uppercase mb-1">Tổng nạp</p>
                    <p className="text-lg font-semibold text-success">
                      {formatCurrency(goalHistoryData.summary.totalDeposit)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-text-muted uppercase mb-1">Tổng rút</p>
                    <p className="text-lg font-semibold text-danger">
                      {formatCurrency(goalHistoryData.summary.totalWithdrawal)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-text-muted uppercase mb-1">Số giao dịch</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {goalHistoryData.summary.transactionCount}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
