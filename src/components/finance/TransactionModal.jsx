import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Plus } from 'lucide-react';
import { createTransaction, getCategories, getGoals, createCategory, getBalance } from '../../services/financeApi';
import { formatCurrency, formatDateToISO } from '../../utils/formatters';

const TransactionModal = ({ isOpen, onClose, onSuccess, type = 'INCOME', preselectedGoalId = null, preselectedGoalTitle = null }) => {
  const [formData, setFormData] = useState({
    type: type,
    amount: '',
    name: '',
    categoryId: '',
    note: '',
    goalId: preselectedGoalId || '',
    transactionDate: formatDateToISO(new Date()),
  });
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [selectedGoalData, setSelectedGoalData] = useState(null); // Lưu thông tin goal được chọn để validate
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset form data when modal opens or type changes
      const resetFormData = {
        type: type,
        amount: '',
        name: '',
        categoryId: '',
        note: '',
        goalId: preselectedGoalId || '',
        transactionDate: formatDateToISO(new Date()),
      };
      
      // Set preselected goal if provided
      if (preselectedGoalId) {
        const defaultName = preselectedGoalTitle 
          ? `Nạp tiền vào mục tiêu "${preselectedGoalTitle}"`
          : '';
        resetFormData.name = defaultName;
      }
      
      setFormData(resetFormData);
      setSelectedGoalData(null); // Reset selected goal data
    } else {
      // Reset form when modal closes
      setFormData({
        type: type,
        amount: '',
        name: '',
        categoryId: '',
        note: '',
        goalId: '',
        transactionDate: formatDateToISO(new Date()),
      });
      setError(null);
      setShowCreateCategory(false);
      setNewCategoryName('');
    }
  }, [isOpen, type, preselectedGoalId, preselectedGoalTitle]);

  const loadData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const promises = [
        getCategories(),
        type === 'INCOME' ? getGoals() : Promise.resolve([]),
      ];
      
      // Load balance if type is EXPENSE or if nạp vào goal (INCOME with goalId)
      // Nạp vào goal sẽ trừ khỏi số dư, nên cần validate
      if (type === 'EXPENSE' || (type === 'INCOME' && preselectedGoalId)) {
        promises.push(getBalance());
      }
      
      const results = await Promise.all(promises);
      setCategories(results[0] || []);
      const goalsData = results[1] || [];
      setGoals(goalsData);
      
      // Set selected goal data if preselectedGoalId is provided
      if (preselectedGoalId && goalsData.length > 0) {
        const selectedGoal = goalsData.find(g => g.goalId === preselectedGoalId);
        if (selectedGoal) {
          setSelectedGoalData(selectedGoal);
        }
      }
      
      // Set balance if type is EXPENSE or if nạp vào goal
      if ((type === 'EXPENSE' || (type === 'INCOME' && preselectedGoalId)) && results[2]) {
        setCurrentBalance(results[2].currentBalance || 0);
      } else {
        setCurrentBalance(null);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newCategoryName.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    setCreatingCategory(true);
    setError(null);

    try {
      // Create category with type matching the transaction type
      const categoryType = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
      const newCategory = await createCategory(newCategoryName.trim(), categoryType);
      setCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, categoryId: newCategory.categoryId }));
      setNewCategoryName('');
      setShowCreateCategory(false);
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.message || 'Không thể tạo danh mục. Vui lòng thử lại.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ (lớn hơn 0)');
      return;
    }

    // Validate expense amount or goal deposit amount against current balance
    // EXPENSE: chi tiêu không được vượt quá số dư
    // INCOME with goalId: nạp vào goal không được vượt quá số dư (vì sẽ trừ khỏi số dư)
    if (formData.type === 'EXPENSE' || (formData.type === 'INCOME' && formData.goalId)) {
      // Validate goal status and savedAmount for goal deposit
      if (formData.type === 'INCOME' && formData.goalId) {
        // Find goal data
        const goal = goals.find(g => g.goalId === formData.goalId) || selectedGoalData;
        if (goal) {
          const goalSavedAmount = typeof goal.savedAmount === 'string' 
            ? parseFloat(goal.savedAmount) || 0 
            : (goal.savedAmount || 0);
          const goalAmount = typeof goal.amount === 'string' 
            ? parseFloat(goal.amount) || 0 
            : (goal.amount || 0);
          
          // Check if goal is already completed
          if (goal.status === 'COMPLETED') {
            setError('Không thể nạp tiền vào mục tiêu đã hoàn thành.');
            return;
          }
          
          // Check if goal already has enough money
          if (goalSavedAmount >= goalAmount) {
            setError('Mục tiêu đã đủ tiền. Không thể nạp thêm.');
            return;
          }
          
          // Calculate remaining amount needed
          const remainingAmount = goalAmount - goalSavedAmount;
          // Actual deposit amount is the minimum of requested amount and remaining amount
          const actualDepositAmount = Math.min(numAmount, remainingAmount);
          
          // Reload balance to ensure we have the latest value
          try {
            const balanceData = await getBalance();
            const balance = balanceData?.currentBalance || 0;
            
            // Validate balance against actual deposit amount (not requested amount)
            if (actualDepositAmount > balance) {
              setError(`Không đủ số dư để nạp vào mục tiêu. Số dư hiện tại: ${formatCurrency(balance)}, số tiền cần nạp: ${formatCurrency(actualDepositAmount)}.`);
              return;
            }
            
            // If user tries to deposit more than remaining amount, show warning
            if (numAmount > remainingAmount) {
              const excessAmount = numAmount - remainingAmount;
              if (!window.confirm(`Mục tiêu chỉ còn thiếu ${formatCurrency(remainingAmount)}. Bạn đang nạp ${formatCurrency(numAmount)} (dư ${formatCurrency(excessAmount)}). Hệ thống sẽ chỉ nạp ${formatCurrency(remainingAmount)} và số tiền dư sẽ không bị trừ khỏi số dư của bạn. Bạn có muốn tiếp tục?`)) {
                return;
              }
            }
            
            // Update current balance state
            setCurrentBalance(balance);
          } catch (err) {
            console.error('Error checking balance:', err);
            // Continue with submission if balance check fails (backend will validate)
          }
        } else {
          setError('Không tìm thấy thông tin mục tiêu. Vui lòng thử lại.');
          return;
        }
      } else if (formData.type === 'EXPENSE') {
        // Reload balance to ensure we have the latest value
        try {
          const balanceData = await getBalance();
          const balance = balanceData?.currentBalance || 0;
          
          if (numAmount > balance) {
            setError(`Số tiền chi tiêu (${formatCurrency(numAmount)}) vượt quá số dư hiện tại (${formatCurrency(balance)}). Vui lòng nhập số tiền nhỏ hơn hoặc bằng số dư hiện tại.`);
            return;
          }
          
          // Update current balance state
          setCurrentBalance(balance);
        } catch (err) {
          console.error('Error checking balance:', err);
          // Continue with submission if balance check fails (backend will validate)
        }
      }
    }

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên giao dịch');
      return;
    }

    // Category chỉ bắt buộc khi không có goalId
    if (!formData.goalId && !formData.categoryId) {
      setError('Vui lòng chọn danh mục');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        type: formData.type,
        amount: numAmount,
        name: formData.name.trim(),
        note: formData.note.trim() || undefined,
        goalId: formData.goalId || undefined,
        transactionDate: formData.transactionDate || formatDateToISO(new Date()),
        // Chỉ gửi categoryId khi không có goalId
        ...(formData.goalId ? {} : { categoryId: formData.categoryId }),
      };

      // Remove undefined fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      await createTransaction(payload);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'Không thể tạo giao dịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: type,
      amount: '',
      name: '',
      categoryId: '',
      note: '',
      goalId: preselectedGoalId || '',
      transactionDate: formatDateToISO(new Date()),
    });
    setError(null);
    setShowCreateCategory(false);
    setNewCategoryName('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            {type === 'INCOME' ? 'Thêm thu nhập' : 'Thêm chi tiêu'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="amount" className="block text-sm font-medium text-text-primary">
                  Số tiền (VNĐ) *
                </label>
                {currentBalance !== null && (formData.type === 'EXPENSE' || (formData.type === 'INCOME' && formData.goalId)) && (
                  <span className="text-xs text-text-muted">
                    Số dư hiện tại: <span className="font-semibold text-text-primary">{formatCurrency(currentBalance)}</span>
                  </span>
                )}
              </div>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.amount}
                onChange={(e) => {
                  // Chỉ cho phép số nguyên
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, amount: value });
                  setError(null);
                }}
                placeholder="Nhập số tiền (VNĐ)"
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                  currentBalance !== null && formData.amount && !isNaN(parseFloat(formData.amount)) && parseFloat(formData.amount) > currentBalance && 
                  (formData.type === 'EXPENSE' || (formData.type === 'INCOME' && formData.goalId))
                    ? 'border-danger focus:ring-danger'
                    : 'border-border'
                }`}
                required
              />
              {formData.amount && !isNaN(parseFloat(formData.amount)) && parseFloat(formData.amount) > 0 && (
                <p className={`mt-2 text-sm ${
                  currentBalance !== null && parseFloat(formData.amount) > currentBalance && 
                  (formData.type === 'EXPENSE' || (formData.type === 'INCOME' && formData.goalId))
                    ? 'text-danger font-semibold'
                    : 'text-text-secondary'
                }`}>
                  {formatCurrency(parseFloat(formData.amount))}
                  {currentBalance !== null && parseFloat(formData.amount) > currentBalance && 
                  (formData.type === 'EXPENSE' || (formData.type === 'INCOME' && formData.goalId)) && (
                    <span className="ml-2">⚠️ Vượt quá số dư hiện tại</span>
                  )}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                Tên giao dịch *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setError(null);
                }}
                placeholder={formData.goalId ? "Ví dụ: Nạp tiền vào mục tiêu \"Du lịch\"" : "Ví dụ: Lương tháng 1, Mua sắm..."}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                required
              />
              {formData.goalId && !formData.name && (
                <p className="mt-1 text-xs text-text-muted">
                  Tên sẽ tự động được điền khi bạn chọn mục tiêu
                </p>
              )}
            </div>

            {/* Ẩn category khi nạp vào goal (có goalId) */}
            {!formData.goalId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="categoryId" className="block text-sm font-medium text-text-primary">
                    Danh mục *
                  </label>
                  {!showCreateCategory && (
                    <button
                      type="button"
                      onClick={() => setShowCreateCategory(true)}
                      className="text-xs text-primary hover:text-primary-strong font-medium flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Tạo danh mục mới
                    </button>
                  )}
                </div>

                {showCreateCategory ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          setError(null);
                        }}
                        placeholder="Nhập tên danh mục"
                        disabled={creatingCategory}
                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                        className="px-4 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {creatingCategory ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Plus size={16} />
                            Tạo
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateCategory(false);
                          setNewCategoryName('');
                          setError(null);
                        }}
                        disabled={creatingCategory}
                        className="px-4 py-3 rounded-xl border border-border bg-background text-text-primary font-medium hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      id="categoryId"
                      value={formData.categoryId}
                      onChange={(e) => {
                        setFormData({ ...formData, categoryId: e.target.value });
                        setError(null);
                      }}
                      disabled={loading || categories.length === 0}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      required={!formData.goalId}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories
                        .filter((cat) => {
                          // Filter categories based on transaction type
                          if (type === 'INCOME') {
                            // For INCOME: show INCOME or BOTH categories
                            return cat.type === 'INCOME' || cat.type === 'BOTH';
                          } else if (type === 'EXPENSE') {
                            // For EXPENSE: show EXPENSE or BOTH categories
                            return cat.type === 'EXPENSE' || cat.type === 'BOTH';
                          }
                          return true;
                        })
                        .map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="mt-1 text-xs text-text-muted">
                        Chưa có danh mục. Nhấn "Tạo danh mục mới" ở trên để tạo.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {formData.goalId && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-xs text-text-secondary">
                  <strong className="text-primary">Lưu ý:</strong> Khi nạp tiền vào mục tiêu, danh mục sẽ tự động được gán là "Tiết kiệm". Số tiền này sẽ bị trừ khỏi số dư hiện tại (tiền bị khóa trong mục tiêu).
                </p>
              </div>
            )}

            {type === 'INCOME' && goals.length > 0 && (
              <div>
                <label htmlFor="goalId" className="block text-sm font-medium text-text-primary mb-2">
                  Gắn vào mục tiêu (tùy chọn)
                </label>
                <select
                  id="goalId"
                  value={formData.goalId}
                  onChange={async (e) => {
                    const selectedGoalId = e.target.value;
                    const selectedGoal = goals.find((g) => g.goalId === selectedGoalId);
                    const defaultName = selectedGoal 
                      ? `Nạp tiền vào mục tiêu "${selectedGoal.title}"`
                      : '';
                    
                    // Set selected goal data for validation
                    setSelectedGoalData(selectedGoal || null);
                    
                    // Load balance if goal is selected (nạp vào goal sẽ trừ khỏi số dư)
                    if (selectedGoalId && selectedGoal) {
                      try {
                        const balanceData = await getBalance();
                        setCurrentBalance(balanceData?.currentBalance || 0);
                        
                        // Validate goal status and savedAmount
                        const goalSavedAmount = typeof selectedGoal.savedAmount === 'string' 
                          ? parseFloat(selectedGoal.savedAmount) || 0 
                          : (selectedGoal.savedAmount || 0);
                        const goalAmount = typeof selectedGoal.amount === 'string' 
                          ? parseFloat(selectedGoal.amount) || 0 
                          : (selectedGoal.amount || 0);
                        
                        if (selectedGoal.status === 'COMPLETED') {
                          setError('Mục tiêu này đã hoàn thành. Không thể nạp tiền.');
                        } else if (goalSavedAmount >= goalAmount) {
                          setError('Mục tiêu này đã đủ tiền. Không thể nạp thêm.');
                        } else {
                          setError(null);
                        }
                      } catch (err) {
                        console.error('Error loading balance:', err);
                      }
                    } else {
                      setCurrentBalance(null);
                      setError(null);
                    }
                    
                    setFormData({ 
                      ...formData, 
                      goalId: selectedGoalId,
                      name: defaultName,
                      categoryId: selectedGoalId ? '' : formData.categoryId, // Clear category if goal selected
                    });
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Không gắn vào mục tiêu</option>
                  {goals
                    .filter((goal) => {
                      // Chỉ hiển thị goals chưa COMPLETED và chưa đủ tiền
                      const goalSavedAmount = typeof goal.savedAmount === 'string' 
                        ? parseFloat(goal.savedAmount) || 0 
                        : (goal.savedAmount || 0);
                      const goalAmount = typeof goal.amount === 'string' 
                        ? parseFloat(goal.amount) || 0 
                        : (goal.amount || 0);
                      return goal.status === 'ACTIVE' && goalSavedAmount < goalAmount;
                    })
                    .map((goal) => (
                      <option key={goal.goalId} value={goal.goalId}>
                        {goal.title} ({formatCurrency(goal.savedAmount)} / {formatCurrency(goal.amount)})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-text-primary mb-2">
                Ghi chú
              </label>
              <textarea
                id="note"
                value={formData.note}
                onChange={(e) => {
                  setFormData({ ...formData, note: e.target.value });
                }}
                placeholder="Ghi chú thêm..."
                disabled={loading}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
              />
            </div>

            <div>
              <label htmlFor="transactionDate" className="block text-sm font-medium text-text-primary mb-2">
                Ngày giao dịch
              </label>
              <input
                id="transactionDate"
                type="datetime-local"
                value={formData.transactionDate ? formData.transactionDate.slice(0, 16) : ''}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    setFormData({ ...formData, transactionDate: `${dateValue}:00` });
                  }
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-text-primary font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !formData.amount || !formData.name || (!formData.goalId && !formData.categoryId)}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Thêm giao dịch'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;

