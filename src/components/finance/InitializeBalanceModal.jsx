import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { initializeBalance } from '../../services/financeApi';
import { formatCurrency } from '../../utils/formatters';

const InitializeBalanceModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Vui lòng nhập số dư ban đầu hợp lệ (lớn hơn 0)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await initializeBalance(numAmount);
      setAmount('');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error initializing balance:', err);
      setError(err.message || 'Không thể khai báo số dư ban đầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError(null);
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
          <h2 className="text-2xl font-bold text-text-primary">Khai báo số dư ban đầu</h2>
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
          <p className="text-sm text-text-secondary">
            <strong className="text-primary">Lưu ý quan trọng:</strong> Bạn chỉ có thể khai báo số dư ban đầu một lần duy nhất. 
            Số dư này sẽ là cơ sở để tính toán các giao dịch thu chi sau này.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text-primary mb-2">
              Số dư ban đầu (VNĐ)
            </label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => {
                // Chỉ cho phép số nguyên
                const value = e.target.value.replace(/[^0-9]/g, '');
                setAmount(value);
                setError(null);
              }}
              placeholder="Nhập số dư ban đầu (VNĐ)"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <p className="mt-2 text-sm text-text-secondary">
                Số dư: <span className="font-semibold text-primary">{formatCurrency(parseFloat(amount))}</span>
              </p>
            )}
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
              disabled={loading || !amount}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitializeBalanceModal;

