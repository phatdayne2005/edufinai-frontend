import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, Layout, BookOpen, BarChart2, Loader2 } from 'lucide-react';
import { getMyLessons, getCreatorStats } from '../../services/learningApi';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, lessonsData] = await Promise.all([
          getCreatorStats(),
          getMyLessons()
        ]);
        setStats(statsData);
        setLessons(lessonsData);
      } catch (err) {
        console.error('Error fetching creator data:', err);
        // setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        // Fallback to mock data for demo if API fails (or remove this in production)
        setLessons([]);
        setStats({ totalLessons: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      backgroundColor: 'var(--color-primary-soft)',
      borderRadius: '12px',
      color: 'var(--color-primary)',
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
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      minHeight: '160px',
    },
    cardIcon: {
        marginBottom: '16px',
        color: 'var(--color-primary)',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: 'var(--text-primary)',
    },
    cardText: {
      color: 'var(--text-muted)',
      fontSize: '14px',
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
    lessonStatus: {
        fontSize: '12px',
        fontWeight: '500',
        padding: '4px 8px',
        borderRadius: '99px',
        width: 'fit-content',
    },
    statusDraft: { backgroundColor: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-muted)' },
    statusPending: { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#F59E0B' },
    statusApproved: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' },
    statusRejected: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' },
  };

  const getStatusStyle = (status) => {
      switch (status) {
          case 'DRAFT': return styles.statusDraft;
          case 'PENDING': return styles.statusPending;
          case 'APPROVED': return styles.statusApproved;
          case 'REJECTED': return styles.statusRejected;
          default: return styles.statusDraft;
      }
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
              <PenTool size={32} />
            </div>
            <div>
              <h1 style={styles.title}>Creator Dashboard</h1>
              <p style={styles.subtitle}>Quản lý nội dung và khóa học của bạn</p>
            </div>
          </div>
          
          <div style={styles.grid}>
            <div style={styles.card}>
                <div style={styles.cardIcon}><BookOpen size={32} /></div>
                <h3 style={styles.cardTitle}>{stats?.totalLessons || 0}</h3>
                <p style={styles.cardText}>Bài viết của tôi</p>
            </div>
            <div style={styles.card}>
                <div style={styles.cardIcon}><PenTool size={32} /></div>
                <h3 style={styles.cardTitle}>Tạo mới</h3>
                <p style={styles.cardText}>Soạn thảo bài học mới</p>
            </div>
            <div style={styles.card}>
                <div style={styles.cardIcon}><BarChart2 size={32} /></div>
                <h3 style={styles.cardTitle}>Thống kê</h3>
                <p style={styles.cardText}>Lượt xem và tương tác</p>
            </div>
          </div>
        </div>

        <div>
            <h2 style={styles.sectionTitle}>Danh sách bài học</h2>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" />
                </div>
            ) : lessons.length > 0 ? (
                <div style={styles.lessonList}>
                    {lessons.map((lesson) => (
                        <div key={lesson.id} style={styles.lessonItem}>
                            <div style={styles.lessonInfo}>
                                <span style={styles.lessonTitle}>{lesson.title}</span>
                                <span style={{...styles.lessonStatus, ...getStatusStyle(lesson.status)}}>{lesson.status}</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                {new Date(lesson.updatedAt || lesson.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Chưa có bài học nào. Hãy tạo bài học đầu tiên!
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;

