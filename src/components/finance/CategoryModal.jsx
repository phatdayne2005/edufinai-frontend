import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { getCategories, createCategory, deleteCategory } from '../../services/financeApi';

const CategoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('EXPENSE');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Không thể tải danh sách danh mục. Vui lòng thử lại.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createCategory(newCategoryName.trim(), newCategoryType);
      setNewCategoryName('');
      setNewCategoryType('EXPENSE');
      await loadCategories();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.message || 'Không thể tạo danh mục. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, isDefault) => {
    if (isDefault) {
      setError('Không thể xóa danh mục mặc định');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return;
    }

    setDeletingId(categoryId);
    setError(null);

    try {
      await deleteCategory(categoryId);
      await loadCategories();
      onSuccess?.();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Không thể xóa danh mục. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    if (!loading && !deletingId) {
      setNewCategoryName('');
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
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Quản lý danh mục</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading || deletingId}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Create new category form */}
        <form onSubmit={handleCreateCategory} className="mb-6 pb-6 border-b border-border">
          <label htmlFor="categoryName" className="block text-sm font-medium text-text-primary mb-2">
            Tạo danh mục mới
          </label>
          <div className="space-y-3">
            <input
              id="categoryName"
              type="text"
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                setError(null);
              }}
              placeholder="Nhập tên danh mục"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              required
            />
            <select
              value={newCategoryType}
              onChange={(e) => {
                setNewCategoryType(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="EXPENSE">Chỉ dùng cho khoản chi</option>
              <option value="INCOME">Chỉ dùng cho khoản thu</option>
              <option value="BOTH">Dùng cho cả thu và chi</option>
            </select>
            <button
              type="submit"
              disabled={loading || !newCategoryName.trim()}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-strong text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Thêm'
              )}
            </button>
          </div>
        </form>

        {/* Categories list */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Danh sách danh mục</h3>
          
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">Chưa có danh mục nào</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.categoryId}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-text-primary font-medium">{category.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      category.type === 'INCOME' 
                        ? 'bg-success/10 text-success' 
                        : category.type === 'EXPENSE'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {category.type === 'INCOME' 
                        ? 'Khoản thu' 
                        : category.type === 'EXPENSE'
                        ? 'Khoản chi'
                        : 'Cả hai'}
                    </span>
                    {category.isDefault && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-text-muted">
                        Mặc định
                      </span>
                    )}
                  </div>
                  {!category.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.categoryId, category.isDefault)}
                      disabled={deletingId === category.categoryId}
                      className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Xóa danh mục"
                    >
                      {deletingId === category.categoryId ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading || deletingId}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;

