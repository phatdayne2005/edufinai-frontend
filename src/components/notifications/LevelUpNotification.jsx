import React, { useEffect } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';

const LevelUpNotification = ({ oldLevel, newLevel, onClose }) => {
    useEffect(() => {
        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getLevelInfo = (level) => {
        switch (level) {
            case 'BEGINNER':
                return { icon: '🌱', color: '#4CAF50', name: 'BEGINNER' };
            case 'INTERMEDIATE':
                return { icon: '⭐', color: '#2196F3', name: 'INTERMEDIATE' };
            case 'ADVANCED':
                return { icon: '🏆', color: '#9C27B0', name: 'ADVANCED' };
            default:
                return { icon: '🎯', color: '#666', name: level };
        }
    };

    const newLevelInfo = getLevelInfo(newLevel);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-in-out'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 24,
                padding: 48,
                maxWidth: 500,
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative'
            }}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 'bold'
                    }}
                >
                    ×
                </button>

                {/* Sparkles animation */}
                <div style={{
                    position: 'absolute',
                    top: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    animation: 'float 2s ease-in-out infinite'
                }}>
                    <Sparkles size={32} color="#FFD700" />
                </div>

                {/* Trophy icon */}
                <div style={{
                    width: 100,
                    height: 100,
                    margin: '0 auto 24px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'bounce 1s ease-in-out infinite'
                }}>
                    <Trophy size={60} color="#FFD700" />
                </div>

                {/* Main message */}
                <h2 style={{
                    color: 'white',
                    fontSize: 32,
                    fontWeight: 800,
                    margin: '0 0 12px 0',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                    🎉 Chúc mừng!
                </h2>

                <p style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 16,
                    margin: '0 0 24px 0'
                }}>
                    Bạn đã thăng hạng lên cấp độ mới!
                </p>

                {/* Level badge */}
                <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 16,
                    padding: 24,
                    margin: '24px 0'
                }}>
                    <div style={{
                        fontSize: 48,
                        marginBottom: 12
                    }}>
                        {newLevelInfo.icon}
                    </div>
                    <div style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: newLevelInfo.color,
                        marginBottom: 8
                    }}>
                        {newLevelInfo.name}
                    </div>
                    <div style={{
                        fontSize: 14,
                        color: '#666'
                    }}>
                        Cấp độ mới của bạn
                    </div>
                </div>

                {/* Encouragement text */}
                <p style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 14,
                    margin: 0,
                    fontStyle: 'italic'
                }}>
                    {newLevel === 'INTERMEDIATE' && 'Bạn đã mở khóa các bài học INTERMEDIATE!'}
                    {newLevel === 'ADVANCED' && 'Bạn đã đạt cấp độ cao nhất! Tất cả bài học đều có thể truy cập!'}
                </p>

                {/* Button */}
                <button
                    onClick={onClose}
                    style={{
                        marginTop: 32,
                        padding: '12px 32px',
                        background: 'white',
                        color: '#667eea',
                        border: 'none',
                        borderRadius: 999,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                    Tiếp tục học tập
                </button>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
        </div>
    );
};

export default LevelUpNotification;
