import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { withdrawFromGoal } from '../../services/financeApi';
import { formatCurrency } from '../../utils/formatters';

const WithdrawModal = ({ isOpen, onClose, onSuccess, goal }) => {
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!goal) {
      setError('Không tìm thấy thông tin mục tiêu');
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ (lớn hơn 0)');
      return;
    }

    if (numAmount > goal.savedAmount) {
      setError(`Số tiền rút không được vượt quá số tiền đã tiết kiệm (${formatCurrency(goal.savedAmount)})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await withdrawFromGoal(goal.goalId, numAmount, formData.note.trim() || undefined);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error withdrawing from goal:', err);
      setError(err.message || 'Không thể rút tiền từ mục tiêu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      note: '',
    });
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen || !goal) return null;

  const maxAmount = goal.savedAmount || 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Rút tiền từ mục tiêu</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <p className="text-sm font-medium text-text-primary mb-2">{goal.title}</p>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Đã tiết kiệm:</span>
            <span className="font-semibold text-primary">{formatCurrency(goal.savedAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-text-secondary mt-1">
            <span>Mục tiêu:</span>
            <span className="font-semibold">{formatCurrency(goal.amount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text-primary mb-2">
              Số tiền muốn rút (VNĐ) *
            </label>
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
              placeholder={`Tối đa: ${formatCurrency(maxAmount)}`}
              disabled={loading || maxAmount === 0}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              required
            />
            {formData.amount && !isNaN(parseFloat(formData.amount)) && parseFloat(formData.amount) > 0 && (
              <p className="mt-2 text-sm text-text-secondary">
                Số tiền rút: <span className="font-semibold text-primary">{formatCurrency(parseFloat(formData.amount))}</span>
              </p>
            )}
            {maxAmount > 0 && (
              <p className="mt-1 text-xs text-text-muted">
                Số tiền có thể rút tối đa: <span className="font-semibold">{formatCurrency(maxAmount)}</span>
              </p>
            )}
            {maxAmount === 0 && (
              <p className="mt-1 text-xs text-danger">Mục tiêu này chưa có tiền để rút</p>
            )}
          </div>

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
              placeholder="Lý do rút tiền (tùy chọn)..."
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
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
              disabled={loading || !formData.amount || maxAmount === 0}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Rút tiền'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;

