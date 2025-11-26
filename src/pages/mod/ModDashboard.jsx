import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, XCircle, Loader2, Eye, X, Clock, BarChart, Tag, User, Circle, AlertCircle, AlertTriangle, HelpCircle, RefreshCw, Target, Gift, CalendarDays } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getChallengesByStatus, updateChallengeApproval } from '../../services/gamificationApi';

const ModDashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [creatorNames, setCreatorNames] = useState({});
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

  const fetchLessons = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const data = await learningService.getModerationLessons(token, statusFilter);
      setLessons(data || []);
    } catch (err) {
      console.error('Error fetching moderation lessons:', err);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [pending, approved, rejected] = await Promise.all([
        learningService.getModerationLessons(token, 'PENDING'),
        learningService.getModerationLessons(token, 'APPROVED'),
        learningService.getModerationLessons(token, 'REJECTED')
      ]);
      setCounts({
        PENDING: pending?.length || 0,
        APPROVED: approved?.length || 0,
        REJECTED: rejected?.length || 0
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchPendingChallenges = async () => {
    try {
      setChallengeLoading(true);
      const data = await getChallengesByStatus('PENDING');
      const normalized = Array.isArray(data) ? data : data?.result || [];
      setPendingChallenges(normalized);
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
      setPendingChallenges([]);
    } finally {
      setChallengeLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [statusFilter, getToken]);

  useEffect(() => {
    fetchCounts();
  }, [getToken, lessons]);

  useEffect(() => {
    fetchPendingChallenges();
  }, []);

  // Fetch creator names
  useEffect(() => {
    const fetchCreators = async () => {
      const token = getToken();
      if (!token) return;

      const uniqueCreatorIds = [...new Set(lessons.map(l => l.creatorId))];
      const newCreators = {};

      const idsToFetch = uniqueCreatorIds.filter(id => !creatorNames[id]);

      if (idsToFetch.length === 0) return;

      await Promise.all(idsToFetch.map(async (id) => {
        try {
          const creator = await learningService.getCreatorById(token, id);
          // API returns username only
          newCreators[id] = creator.username || 'User';
        } catch (e) {
          console.error(`Failed to fetch creator ${id}`, e);
          newCreators[id] = 'User';
        }
      }));

      setCreatorNames(prev => ({ ...prev, ...newCreators }));
    };

    if (lessons.length > 0) fetchCreators();
  }, [lessons, getToken, creatorNames]);

  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const handleModerate = async (lessonId, status) => {
    const token = getToken();

    if (status === 'REJECTED') {
      if (!rejectionReason.trim()) {
        alert('Vui lòng nhập lý do từ chối');
        return;
      }

      try {
        await learningService.moderateLesson(token, lessonId, {
          status,
          commentByMod: rejectionReason
        });
        alert('Đã từ chối bài học');
        setSelectedLesson(null);
        setIsRejecting(false);
        setRejectionReason('');
        fetchLessons();
      } catch (err) {
        console.error('Error rejecting:', err);
        alert('Lỗi khi từ chối bài học: ' + err.message);
      }
    } else {
      if (!window.confirm('Bạn có chắc chắn muốn duyệt bài này?')) return;
      try {
        await learningService.moderateLesson(token, lessonId, {
          status,
          commentByMod: null
        });
        alert('Đã duyệt bài học');
        setSelectedLesson(null);
        fetchLessons();
      } catch (err) {
        console.error('Error approving:', err);
        alert('Lỗi khi duyệt bài học: ' + err.message);
      }
    }
  };

  const viewLessonDetail = async (lesson) => {
    const token = getToken();
    setIsRejecting(false);
    setRejectionReason('');
    try {
      const detailedLesson = await learningService.getLessonDetailForMod(token, lesson.id);
      setSelectedLesson(detailedLesson);
    } catch (err) {
      console.error('Error fetching lesson detail:', err);
      setSelectedLesson(lesson);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'APPROVED': return '#4CAF50';
      case 'REJECTED': return '#F44336';
      default: return '#666';
    }
  };

  const getTagColor = (tag) => {
    switch (tag) {
      case 'BUDGETING': return { bg: '#E3F2FD', color: '#1976D2' };
      case 'INVESTING': return { bg: '#E8F5E9', color: '#388E3C' };
      case 'SAVING': return { bg: '#FFF3E0', color: '#F57C00' };
      case 'DEBT': return { bg: '#FFEBEE', color: '#D32F2F' };
      case 'TAX': return { bg: '#F3E5F5', color: '#7B1FA2' };
      default: return { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' };
    }
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'BASIC':
        return {
          bg: '#E8F5E9',
          color: '#2E7D32',
          icon: <Circle size={14} fill="#2E7D32" color="#2E7D32" />,
          text: 'Cơ bản'
        };
      case 'INTERMEDIATE':
        return {
          bg: '#FFF3E0',
          color: '#EF6C00',
          icon: <AlertCircle size={14} color="#EF6C00" />,
          text: 'Trung bình'
        };
      case 'ADVANCED':
        return {
          bg: '#FFEBEE',
          color: '#C62828',
          icon: <AlertTriangle size={14} color="#C62828" />,
          text: 'Nâng cao'
        };
      default:
        return {
          bg: '#F5F5F5',
          color: '#666',
          icon: <Circle size={14} color="#666" />,
          text: difficulty
        };
    }
  };

  const parseRule = (rule) => {
    if (!rule) return {};
    if (typeof rule === 'object') return rule;
    try {
      return JSON.parse(rule);
    } catch (error) {
      console.warn('Failed to parse challenge rule', error);
      return {};
    }
  };

  const getChallengeId = (challenge) => challenge?.id || challenge?.challengeId;

  const formatDateDisplay = (value, withTime = false) => {
    if (!value) return 'Không rõ';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Không rõ';
    return withTime ? date.toLocaleString('vi-VN') : date.toLocaleDateString('vi-VN');
  };

  const handleChallengeModerate = async (challenge, status) => {
    const challengeId = getChallengeId(challenge);
    if (!challengeId) return;

    if (status === 'REJECTED') {
      const note = prompt('Nhập lý do từ chối thử thách:');
      if (!note) return;
      try {
        await updateChallengeApproval(challengeId, { status, note });
        alert('Đã từ chối thử thách');
        setSelectedChallenge(null);
        fetchPendingChallenges();
      } catch (error) {
        console.error('Reject challenge failed', error);
        alert(error.message || 'Không thể từ chối thử thách');
      }
    } else {
      if (!window.confirm('Bạn có chắc chắn muốn duyệt thử thách này?')) return;
      try {
        await updateChallengeApproval(challengeId, { status });
        alert('Đã duyệt thử thách');
        setSelectedChallenge(null);
        fetchPendingChallenges();
      } catch (error) {
        console.error('Approve challenge failed', error);
        alert(error.message || 'Không thể duyệt thử thách');
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
      backgroundColor: 'rgba(156, 39, 176, 0.1)',
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
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    lessonInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%'
    },
    lessonTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: 'var(--text-primary)',
    },
    lessonMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      fontSize: '13px',
      color: 'var(--text-tertiary)',
    },
    bottomRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      width: '100%',
      flexWrap: 'wrap',
      gap: '16px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    tag: {
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: '12px',
      fontWeight: 500
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    btnDetail: {
      padding: '8px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#2196F3',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      width: '36px',
      height: '36px'
    },
    btnApprove: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#4CAF50',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      height: '36px'
    },
    btnReject: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid #FFEBEE',
      backgroundColor: '#FFEBEE',
      color: '#D32F2F',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      height: '36px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modalContent: {
      backgroundColor: 'var(--surface-card)',
      padding: '32px',
      borderRadius: '24px',
      width: '100%',
      maxWidth: '900px', // Increased width
      maxHeight: '85vh',
      overflowY: 'auto',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      color: 'var(--text-primary)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-subtle)',
      paddingBottom: '16px',
    },
    modalTitle: {
      fontSize: '24px', // Increased font size
      fontWeight: '700',
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
    },
    detailRow: {
      marginBottom: '20px',
    },
    detailLabel: {
      fontWeight: '600',
      color: 'var(--text-secondary)',
      fontSize: '15px',
      marginBottom: '8px',
      display: 'block',
    },
    detailValue: {
      color: 'var(--text-primary)',
      fontSize: '16px', // Increased font size
      lineHeight: '1.6',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      minHeight: '100px',
      resize: 'vertical',
      marginBottom: '16px',
      fontFamily: 'inherit'
    },
    challengeSection: {
      marginTop: '48px',
    },
    challengeCard: {
      backgroundColor: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    challengeMeta: {
      fontSize: '13px',
      color: 'var(--text-muted)',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
    },
    challengeActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginTop: '12px',
    },
    challengePill: {
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: 'rgba(248, 191, 38, 0.15)',
      color: '#B45309',
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
              <Shield size={32} />
            </div>
            <div>
              <h1 style={styles.title}>Moderator Dashboard</h1>
              <p style={styles.subtitle}>Kiểm duyệt nội dung bài học</p>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {STATUSES.map(status => {
              const color = getStatusColor(status);
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: isActive ? `2px solid ${color}` : '1px solid var(--border-subtle)',
                    background: isActive ? `${color}15` : 'var(--bg-primary)',
                    color: isActive ? color : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  {status}
                  <span style={{
                    background: isActive ? color : 'var(--bg-secondary)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {counts[status]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 style={styles.sectionTitle}>
            Bài viết {statusFilter.toLowerCase()} ({lessons.length})
          </h2>
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

                    <div style={styles.lessonMeta}>
                      <div style={styles.metaItem}>
                        <User size={14} />
                        <span>{creatorNames[lesson.creatorId] || 'Đang tải...'}</span>
                      </div>
                      <span style={{ color: 'var(--border-subtle)' }}>|</span>
                      <div style={styles.metaItem}>
                        <Clock size={14} />
                        <span>{new Date(lesson.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div style={styles.bottomRow}>
                      <div style={styles.lessonMeta}>
                        {lesson.tags && lesson.tags.length > 0 && (
                          <div style={styles.metaItem}>
                            <Tag size={14} />
                            {lesson.tags.map((tag, idx) => {
                              const tagStyle = getTagColor(tag);
                              return (
                                <span key={idx} style={{
                                  ...styles.tag,
                                  backgroundColor: tagStyle.bg,
                                  color: tagStyle.color
                                }}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div style={styles.metaItem}>
                          {(() => {
                            const diffStyle = getDifficultyStyle(lesson.difficulty);
                            return (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: diffStyle.bg,
                                color: diffStyle.color,
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 500
                              }}>
                                {diffStyle.icon}
                                {diffStyle.text}
                              </div>
                            );
                          })()}
                        </div>

                        <div style={styles.metaItem}>
                          <Clock size={14} />
                          <span>{lesson.durationMinutes} phút</span>
                        </div>

                        {lesson.questionCount !== undefined && (
                          <div style={styles.metaItem}>
                            <HelpCircle size={14} />
                            <span>{lesson.questionCount} câu hỏi</span>
                          </div>
                        )}
                      </div>

                      <div style={styles.actionButtons}>
                        <button
                          style={styles.btnDetail}
                          onClick={() => viewLessonDetail(lesson)}
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {statusFilter === 'PENDING' && (
                          <>
                            <button
                              style={styles.btnApprove}
                              onClick={() => handleModerate(lesson.id, 'APPROVED')}
                            >
                              <CheckCircle size={16} /> Duyệt
                            </button>
                            <button
                              style={styles.btnReject}
                              onClick={() => {
                                viewLessonDetail(lesson);
                                setIsRejecting(true);
                              }}
                            >
                              <XCircle size={16} /> Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Không có bài viết nào {statusFilter.toLowerCase()}.
            </div>
          )}
        </div>
      </div>

      {selectedLesson && (
        <div style={styles.modalOverlay} onClick={() => setSelectedLesson(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedLesson.title}</h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {new Date(selectedLesson.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedLesson(null)}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Tác giả</span>
              <div style={styles.detailValue}>{creatorNames[selectedLesson.creatorId] || selectedLesson.creatorId}</div>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Mô tả</span>
              <div style={styles.detailValue}>{selectedLesson.description}</div>
            </div>

            {selectedLesson.videoUrl && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Video bài học</span>
                <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  {selectedLesson.videoUrl.includes('youtube.com') || selectedLesson.videoUrl.includes('youtu.be') ? (
                    <iframe
                      width="100%"
                      height="400"
                      src={selectedLesson.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title="Lesson Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video controls width="100%" style={{ display: 'block' }}>
                      <source src={selectedLesson.videoUrl} type="video/mp4" />
                      Trình duyệt của bạn không hỗ trợ thẻ video.
                    </video>
                  )}
                </div>
              </div>
            )}

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Nội dung</span>
              <div style={{
                ...styles.detailValue,
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '16px',
                background: 'var(--bg-secondary)', // Changed to variable
                borderRadius: 8,
                fontSize: '15px'
              }}>
                {selectedLesson.content || 'Chưa có nội dung'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Độ khó</span>
                <div style={styles.detailValue}>{selectedLesson.difficulty}</div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Thời gian ước tính</span>
                <div style={styles.detailValue}>{selectedLesson.durationMinutes} phút</div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Trạng thái</span>
                <div style={styles.detailValue}>{selectedLesson.status}</div>
              </div>
            </div>

            {selectedLesson.commentByMod && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Nhận xét từ moderator</span>
                <div style={{
                  ...styles.detailValue,
                  padding: '16px',
                  background: 'rgba(244, 67, 54, 0.1)', // Semi-transparent red
                  borderLeft: '4px solid #F44336',
                  borderRadius: 4
                }}>
                  {selectedLesson.commentByMod}
                </div>
              </div>
            )}

            {statusFilter === 'PENDING' && (
              <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                {isRejecting ? (
                  <div style={{ animation: 'fadeIn 0.2s' }}>
                    <span style={styles.detailLabel}>Lý do từ chối:</span>
                    <textarea
                      style={styles.textarea}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối bài viết này..."
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button
                        style={{ ...styles.btnDetail, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', width: 'auto', padding: '8px 16px' }}
                        onClick={() => setIsRejecting(false)}
                      >
                        Hủy
                      </button>
                      <button
                        style={styles.btnReject}
                        onClick={() => handleModerate(selectedLesson.id, 'REJECTED')}
                      >
                        <XCircle size={16} /> Xác nhận từ chối
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      style={styles.btnReject}
                      onClick={() => setIsRejecting(true)}
                    >
                      <XCircle size={16} /> Từ chối
                    </button>
                    <button
                      style={styles.btnApprove}
                      onClick={() => handleModerate(selectedLesson.id, 'APPROVED')}
                    >
                      <CheckCircle size={16} /> Duyệt bài
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Challenge Moderation Section */}
      <div style={styles.challengeSection}>
        <h2 style={styles.sectionTitle}>
          Thử thách chờ duyệt ({pendingChallenges.length})
        </h2>
        {challengeLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : pendingChallenges.length > 0 ? (
          <div style={styles.lessonList}>
            {pendingChallenges.map((challenge) => {
              const rule = parseRule(challenge.rule);
              return (
                <div key={getChallengeId(challenge)} style={styles.challengeCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={styles.lessonTitle}>{challenge.title}</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        {challenge.description}
                      </p>
                      <div style={styles.challengeMeta}>
                        <div style={styles.metaItem}>
                          <Target size={14} />
                          <span>{challenge.type || 'N/A'}</span>
                        </div>
                        <div style={styles.metaItem}>
                          <Gift size={14} />
                          <span>{challenge.rewardScore || 0} điểm</span>
                          {challenge.rewardBadgeCode && (
                            <span style={styles.challengePill}>{challenge.rewardBadgeCode}</span>
                          )}
                        </div>
                        <div style={styles.metaItem}>
                          <CalendarDays size={14} />
                          <span>
                            {formatDateDisplay(challenge.startAt)} - {formatDateDisplay(challenge.endAt)}
                          </span>
                        </div>
                        {rule.targetValue && (
                          <div style={styles.metaItem}>
                            <span>Mục tiêu: {rule.targetValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={styles.challengeActions}>
                      <button
                        style={styles.btnDetail}
                        onClick={() => setSelectedChallenge(challenge)}
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        style={styles.btnApprove}
                        onClick={() => handleChallengeModerate(challenge, 'APPROVED')}
                      >
                        <CheckCircle size={16} /> Duyệt
                      </button>
                      <button
                        style={styles.btnReject}
                        onClick={() => handleChallengeModerate(challenge, 'REJECTED')}
                      >
                        <XCircle size={16} /> Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Không có thử thách nào chờ duyệt.
          </div>
        )}
      </div>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div style={styles.modalOverlay} onClick={() => setSelectedChallenge(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedChallenge.title}</h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Tạo lúc: {formatDateDisplay(selectedChallenge.createdAt, true)}
                </span>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedChallenge(null)}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Mô tả</span>
              <div style={styles.detailValue}>{selectedChallenge.description}</div>
            </div>

            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Loại</span>
                <div style={styles.detailValue}>{selectedChallenge.type || 'N/A'}</div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Phạm vi</span>
                <div style={styles.detailValue}>{selectedChallenge.scope || 'N/A'}</div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Trạng thái</span>
                <div style={styles.detailValue}>{selectedChallenge.status || 'PENDING'}</div>
              </div>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Thời gian</span>
              <div style={styles.detailValue}>
                Bắt đầu: {formatDateDisplay(selectedChallenge.startAt, true)}<br />
                Kết thúc: {formatDateDisplay(selectedChallenge.endAt, true)}
              </div>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Phần thưởng</span>
              <div style={styles.detailValue}>
                Điểm: {selectedChallenge.rewardScore || 0}
                {selectedChallenge.rewardBadgeCode && (
                  <span style={{ ...styles.challengePill, marginLeft: '8px' }}>
                    {selectedChallenge.rewardBadgeCode}
                  </span>
                )}
              </div>
            </div>

            {selectedChallenge.rule && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Quy tắc</span>
                <div style={{
                  ...styles.detailValue,
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify(parseRule(selectedChallenge.rule), null, 2)}
                </div>
              </div>
            )}

            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  style={styles.btnReject}
                  onClick={() => {
                    setSelectedChallenge(null);
                    handleChallengeModerate(selectedChallenge, 'REJECTED');
                  }}
                >
                  <XCircle size={16} /> Từ chối
                </button>
                <button
                  style={styles.btnApprove}
                  onClick={() => {
                    setSelectedChallenge(null);
                    handleChallengeModerate(selectedChallenge, 'APPROVED');
                  }}
                >
                  <CheckCircle size={16} /> Duyệt thử thách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModDashboard;
