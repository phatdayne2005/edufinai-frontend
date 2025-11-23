import React, { useEffect, useState } from 'react';
import { checkBalanceInitialized } from '../../services/financeApi';
import InitializeBalanceModal from './InitializeBalanceModal';
import { Loader2 } from 'lucide-react';

/**
 * BalanceGuard Component
 * Kiểm tra và yêu cầu khai báo số dư ban đầu trước khi sử dụng các chức năng tài chính
 */
const BalanceGuard = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(null); // null = checking, true = initialized, false = not initialized
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBalance();
  }, []);

  const checkBalance = async () => {
    try {
      setLoading(true);
      const initialized = await checkBalanceInitialized();
      setIsInitialized(initialized);
      if (!initialized) {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error checking balance initialization:', error);
      // Nếu có lỗi (ví dụ: 401), cho phép truy cập (có thể là chưa đăng nhập)
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceInitialized = () => {
    setIsInitialized(true);
    setShowModal(false);
  };

  // Đang kiểm tra
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Chưa khai báo số dư - hiển thị modal và chặn nội dung
  if (!isInitialized) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Chào mừng đến với EduFinAI!
            </h2>
            <p className="text-text-secondary mb-6">
              Để bắt đầu sử dụng các chức năng quản lý tài chính, bạn cần khai báo số dư ban đầu.
              Số dư này sẽ là cơ sở để tính toán các giao dịch thu chi sau này.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all"
            >
              Khai báo số dư ban đầu
            </button>
          </div>
        </div>
        <InitializeBalanceModal
          isOpen={showModal}
          onClose={() => {}} // Không cho đóng modal nếu chưa khai báo
          onSuccess={handleBalanceInitialized}
        />
      </>
    );
  }

  // Đã khai báo - hiển thị nội dung bình thường
  return <>{children}</>;
};

export default BalanceGuard;

