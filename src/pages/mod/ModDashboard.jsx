import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getPendingLessons, moderateLesson } from '../../services/learningApi';

const ModDashboard = () => {
  const navigate = useNavigate();
  const [pendingLessons, setPendingLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await getPendingLessons();
      setPendingLessons(data);
    } catch (err) {
      console.error('Error fetching pending lessons:', err);
      setPendingLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleModerate = async (lessonId, status) => {
      if (status === 'REJECTED') {
          const comment = prompt('Nhập lý do từ chối:');
          if (!comment) return;
          try {
              await moderateLesson(lessonId, status, comment);
              alert('Đã từ chối bài viết');
              fetchPending();
          } catch (err) {
              alert('Lỗi khi từ chối bài viết');
          }
      } else {
          if (!window.confirm('Bạn có chắc chắn muốn duyệt bài này?')) return;
          try {
              await moderateLesson(lessonId, status, null);
              alert('Đã duyệt bài viết');
              fetchPending();
          } catch (err) {
              alert('Lỗi khi duyệt bài viết');
          }
      }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: 'var(--surface-app)',
      padding: '32px',
      color: 'var(--text-primary)',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--text-muted)',
      marginBottom: '32px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'color 0.2s',
    },
    headerCard: {
      backgroundColor: 'var(--surface-card)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border-subtle)',
      padding: '32px',
      marginBottom: '32px',
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    },
    iconBox: {
      padding: '12px',
      backgroundColor: 'rgba(156, 39, 176, 0.1)', // Consistent Purple for Mod
      borderRadius: '12px',
      color: '#9C27B0',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--text-primary)',
      margin: 0,
    },
    subtitle: {
      color: 'var(--text-muted)',
      marginTop: '4px',
      fontSize: '14px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginTop: '32px',
    },
    card: {
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      backgroundColor: 'var(--surface-card)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: 0,
      color: 'var(--text-primary)',
    },
    badge: {
      fontSize: '12px',
      fontWeight: '600',
      padding: '4px 8px',
      borderRadius: '99px',
    },
    badgeRed: {
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      color: '#F44336',
    },
    badgeOrange: {
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      color: '#FF9800',
    },
    cardText: {
      color: 'var(--text-muted)',
      fontSize: '14px',
      margin: 0,
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '16px',
        color: 'var(--text-primary)',
    },
    lessonList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    lessonItem: {
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lessonInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    lessonTitle: {
        fontWeight: '600',
        color: 'var(--text-primary)',
    },
    lessonCreator: {
        fontSize: '13px',
        color: 'var(--text-muted)',
    },
    actionButtons: {
        display: 'flex',
        gap: '8px',
    },
    btnApprove: {
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: '#10B981',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    btnReject: {
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#EF4444',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button 
          onClick={() => navigate('/')}
          style={styles.backButton}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={20} />
          Quay lại trang chủ
        </button>
        
        <div style={styles.headerCard}>
          <div style={styles.headerContent}>
            <div style={styles.iconBox}>
              <Shield size={32} />
            </div>
            <div>
              <h1 style={styles.title}>Moderator Dashboard</h1>
              <p style={styles.subtitle}>Kiểm duyệt nội dung và quản lý cộng đồng</p>
            </div>
          </div>
          
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Báo cáo vi phạm</h3>
                <span style={{...styles.badge, ...styles.badgeRed}}>0 mới</span>
              </div>
              <p style={styles.cardText}>Xử lý các báo cáo từ người dùng</p>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Duyệt bài viết</h3>
                <span style={{...styles.badge, ...styles.badgeOrange}}>{pendingLessons.length} chờ duyệt</span>
              </div>
              <p style={styles.cardText}>Kiểm tra nội dung trước khi xuất bản</p>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Nhật ký kiểm duyệt</h3>
              </div>
              <p style={styles.cardText}>Lịch sử các thao tác đã thực hiện</p>
            </div>
          </div>
        </div>

        <div>
            <h2 style={styles.sectionTitle}>Bài viết chờ duyệt ({pendingLessons.length})</h2>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" />
                </div>
            ) : pendingLessons.length > 0 ? (
                <div style={styles.lessonList}>
                    {pendingLessons.map((lesson) => (
                        <div key={lesson.id} style={styles.lessonItem}>
                            <div style={styles.lessonInfo}>
                                <span style={styles.lessonTitle}>{lesson.title}</span>
                                <span style={styles.lessonCreator}>
                                    Tạo bởi: {lesson.creator?.username || 'Unknown'} • {new Date(lesson.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <div style={styles.actionButtons}>
                                <button 
                                    style={styles.btnApprove}
                                    onClick={() => handleModerate(lesson.id, 'APPROVED')}
                                >
                                    <CheckCircle size={16} /> Duyệt
                                </button>
                                <button 
                                    style={styles.btnReject}
                                    onClick={() => handleModerate(lesson.id, 'REJECTED')}
                                >
                                    <XCircle size={16} /> Từ chối
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Không có bài viết nào cần duyệt.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ModDashboard;

