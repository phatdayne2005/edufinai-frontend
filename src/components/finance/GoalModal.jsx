import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { createGoal } from '../../services/financeApi';
import { formatCurrency, formatDateToISO } from '../../utils/formatters';

const GoalModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    endAt: '',
    startAt: formatDateToISO(new Date()),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Vui lòng nhập số tiền mục tiêu hợp lệ (lớn hơn 0)');
      return;
    }

    if (!formData.title.trim()) {
      setError('Vui lòng nhập tên mục tiêu');
      return;
    }

    if (!formData.endAt) {
      setError('Vui lòng chọn hạn hoàn thành');
      return;
    }

    const endDate = new Date(formData.endAt);
    const now = new Date();
    if (endDate <= now) {
      setError('Hạn hoàn thành phải là thời gian trong tương lai');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        amount: numAmount,
        endAt: formData.endAt,
        ...(formData.startAt && { startAt: formData.startAt }),
      };

      console.log('[GoalModal] Creating goal with payload:', payload);
      
      await createGoal(payload);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating goal:', err);
      // Handle different error types
      let errorMessage = 'Không thể tạo mục tiêu. Vui lòng thử lại.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
      } else if (err.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      endAt: '',
      startAt: formatDateToISO(new Date()),
    });
    setError(null);
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
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Tạo mục tiêu mới</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
              Tên mục tiêu *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setError(null);
              }}
              placeholder="Ví dụ: Mua laptop mới, Du lịch Đà Lạt..."
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text-primary mb-2">
              Số tiền mục tiêu (VNĐ) *
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
              placeholder="Nhập số tiền mục tiêu (VNĐ)"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              required
            />
            {formData.amount && !isNaN(parseFloat(formData.amount)) && parseFloat(formData.amount) > 0 && (
              <p className="mt-2 text-sm text-text-secondary">
                Mục tiêu: <span className="font-semibold text-primary">{formatCurrency(parseFloat(formData.amount))}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="startAt" className="block text-sm font-medium text-text-primary mb-2">
              Ngày bắt đầu
            </label>
            <input
              id="startAt"
              type="datetime-local"
              value={formData.startAt ? formData.startAt.slice(0, 16) : ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                if (dateValue) {
                  setFormData({ ...formData, startAt: `${dateValue}:00` });
                }
              }}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="endAt" className="block text-sm font-medium text-text-primary mb-2">
              Hạn hoàn thành *
            </label>
            <input
              id="endAt"
              type="datetime-local"
              value={formData.endAt ? formData.endAt.slice(0, 16) : ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                if (dateValue) {
                  setFormData({ ...formData, endAt: `${dateValue}:00` });
                  setError(null);
                }
              }}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              required
            />
            <p className="mt-1 text-xs text-text-muted">Hạn hoàn thành phải là thời gian trong tương lai</p>
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
              disabled={loading || !formData.title || !formData.amount || !formData.endAt}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Tạo mục tiêu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;

