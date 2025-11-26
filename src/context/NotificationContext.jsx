import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/notifications/Toast';
import ConfirmDialog from '../components/notifications/ConfirmDialog';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Show toast notification
    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        const toast = { id, message, type };
        setToasts(prev => [...prev, toast]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    // Show success toast
    const showSuccess = useCallback((message) => {
        showToast(message, 'success');
    }, [showToast]);

    // Show error toast
    const showError = useCallback((message) => {
        showToast(message, 'error');
    }, [showToast]);

    // Show warning toast
    const showWarning = useCallback((message) => {
        showToast(message, 'warning');
    }, [showToast]);

    // Show info toast
    const showInfo = useCallback((message) => {
        showToast(message, 'info');
    }, [showToast]);

    // Show confirm dialog
    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                message,
                title: options.title || 'Xác nhận',
                confirmText: options.confirmText || 'OK',
                cancelText: options.cancelText || 'Hủy',
                type: options.type || 'warning',
                onConfirm: () => {
                    setConfirmDialog(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmDialog(null);
                    resolve(false);
                }
            });
        });
    }, []);

    // Remove toast
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value = {
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}

            {/* Toast notifications */}
            <div style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxWidth: 400,
                width: '100%'
            }}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Confirm dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    {...confirmDialog}
                />
            )}
        </NotificationContext.Provider>
    );
};
