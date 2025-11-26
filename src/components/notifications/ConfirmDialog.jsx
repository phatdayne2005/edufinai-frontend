import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const ConfirmDialog = ({
    message,
    title = 'Xác nhận',
    confirmText = 'OK',
    cancelText = 'Hủy',
    type = 'warning',
    onConfirm,
    onCancel
}) => {

    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle size={48} />,
                    color: '#4CAF50',
                    bgColor: 'rgba(76, 175, 80, 0.1)',
                };
            case 'error':
            case 'danger':
                return {
                    icon: <XCircle size={48} />,
                    color: '#F44336',
                    bgColor: 'rgba(244, 67, 54, 0.1)',
                };
            case 'info':
                return {
                    icon: <Info size={48} />,
                    color: '#2196F3',
                    bgColor: 'rgba(33, 150, 243, 0.1)',
                };
            case 'warning':
            default:
                return {
                    icon: <AlertTriangle size={48} />,
                    color: '#FF9800',
                    bgColor: 'rgba(255, 152, 0, 0.1)',
                };
        }
    };

    const config = getTypeConfig();

    return (
        <div
            onClick={onCancel}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                animation: 'fadeIn 0.2s ease-out',
                padding: 20
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--surface-card)',
                    borderRadius: 20,
                    padding: 32,
                    maxWidth: 480,
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    textAlign: 'center'
                }}
            >
                {/* Icon */}
                <div style={{
                    width: 80,
                    height: 80,
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    background: config.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: config.color
                }}>
                    {config.icon}
                </div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 12px 0',
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                }}>
                    {title}
                </h2>

                {/* Message */}
                <p style={{
                    margin: '0 0 28px 0',
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)'
                }}>
                    {message}
                </p>

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '12px 32px',
                            borderRadius: 12,
                            border: '2px solid var(--border-subtle)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: 120
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface-muted)';
                            e.currentTarget.style.borderColor = 'var(--border-strong)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '12px 32px',
                            borderRadius: 12,
                            border: 'none',
                            background: config.color,
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: `0 4px 12px ${config.color}40`,
                            transition: 'all 0.2s',
                            minWidth: 120
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 6px 16px ${config.color}60`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${config.color}40`;
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
        </div>
    );
};

export default ConfirmDialog;
