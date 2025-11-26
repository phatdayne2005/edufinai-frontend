import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle size={24} />,
                    bg: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    iconColor: '#fff',
                };
            case 'error':
                return {
                    icon: <XCircle size={24} />,
                    bg: 'linear-gradient(135deg, #F44336, #E53935)',
                    iconColor: '#fff',
                };
            case 'warning':
                return {
                    icon: <AlertTriangle size={24} />,
                    bg: 'linear-gradient(135deg, #FF9800, #F57C00)',
                    iconColor: '#fff',
                };
            case 'info':
            default:
                return {
                    icon: <Info size={24} />,
                    bg: 'linear-gradient(135deg, #2196F3, #1976D2)',
                    iconColor: '#fff',
                };
        }
    };

    const config = getTypeConfig();

    return (
        <div style={{
            background: config.bg,
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 300,
            color: '#fff',
            transform: isVisible ? 'translateX(0)' : 'translateX(400px)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Icon */}
            <div style={{ color: config.iconColor, flexShrink: 0 }}>
                {config.icon}
            </div>

            {/* Message */}
            <div style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.5
            }}>
                {message}
            </div>

            {/* Close button */}
            <button
                onClick={handleClose}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    flexShrink: 0,
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
                <X size={16} />
            </button>

            {/* Progress bar */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                background: 'rgba(255,255,255,0.4)',
                animation: 'toastProgress 4s linear forwards'
            }} />

            <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
};

export default Toast;
