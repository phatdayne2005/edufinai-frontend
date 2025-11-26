import React, { useEffect, useState } from 'react';
import {
    Plus, Edit, Trash2, Send, TrendingUp, Filter, ArrowLeft,
    Clock, BarChart, Tag, FileText, CheckCircle, XCircle, AlertCircle, Eye, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { styles } from '../../styles/appStyles';
import Header from '../../components/layout/Header';
import CreatorChallengeManager from '../../components/challenges/CreatorChallengeManager';

const CreatorDashboard = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { showSuccess, showError, showConfirm } = useNotification();
    const [lessons, setLessons] = useState([]);
    const [creatorProfile, setCreatorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showFilter, setShowFilter] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [activeTab, setActiveTab] = useState('challenges'); // 'challenges' or 'lessons'

    const STATUSES = ['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

    useEffect(() => {
        const fetchMyLessons = async () => {
            const token = getToken();
            if (!token) return;
            try {
                // Fetch creator profile and lessons in parallel
                const [profile, allLessons] = await Promise.all([
                    learningService.getCreatorProfile(token).catch(() => null),
                    (statusFilter !== 'ALL')
                        ? learningService.filterLessonsByStatus(token, statusFilter)
                        : learningService.getAllLessons(token)
                ]);

                setCreatorProfile(profile);

                // Filter to show only my lessons using profile ID
                if (profile) {
                    const myLessons = (allLessons || []).filter(l => l.creatorId === profile.id);
                    setLessons(myLessons);
                } else {
                    setLessons(allLessons || []);
                }
            } catch (error) {
                console.error('Error fetching lessons:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyLessons();
    }, [getToken, statusFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return;
        const token = getToken();
        try {
            await learningService.deleteLesson(token, id);
            setLessons(lessons.filter(l => l.id !== id));
            alert('Đã xóa bài học!');
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Không thể xóa bài học: ' + error.message);
        }
    };

    const handleSubmitForReview = async (id) => {
        if (!window.confirm('Gửi bài học này để kiểm duyệt?')) return;
        const token = getToken();
        try {
            await learningService.submitLesson(token, id);
            // Refresh lessons
            const allLessons = await learningService.getAllLessons(token);
            const myLessons = allLessons.filter(l => l.creatorId === creatorProfile?.id);
            setLessons(myLessons);
            alert('Đã gửi yêu cầu kiểm duyệt!');
        } catch (error) {
            console.error('Failed to submit:', error);
            alert('Không thể gửi yêu cầu: ' + error.message);
        }
    };

    const handleCancelSubmission = async (lesson) => {
        if (!window.confirm('Hủy yêu cầu kiểm duyệt và chuyển bài học về nháp?')) return;
        const token = getToken();
        try {
            // Prepare payload to update (which resets status to DRAFT)
            const payload = {
                title: lesson.title,
                description: lesson.description,
                content: lesson.content,
                durationMinutes: lesson.durationMinutes,
                difficulty: lesson.difficulty,
                thumbnailUrl: lesson.thumbnailUrl,
                videoUrl: lesson.videoUrl,
                tags: lesson.tags,
                // Ensure quizJson is stringified if it's an object, matching CreateLessonPage logic
                quizJson: typeof lesson.quizJson === 'object' ? JSON.stringify(lesson.quizJson) : lesson.quizJson
            };

            await learningService.updateLesson(token, lesson.id, payload);

            // Refresh
            const allLessons = await learningService.getAllLessons(token);
            const myLessons = allLessons.filter(l => l.creatorId === creatorProfile?.id);
            setLessons(myLessons);
            alert('Đã hủy yêu cầu kiểm duyệt! Bài học đã chuyển về nháp.');
        } catch (error) {
            console.error('Failed to cancel submission:', error);
            alert('Không thể hủy yêu cầu: ' + error.message);
        }
    };

    const viewLessonDetail = async (lesson) => {
        const token = getToken();
        try {
            // Use getLessonById or getLessonBySlug depending on what's available/preferred
            // Since we have the full lesson object in the list, we might just use it directly
            // or fetch fresh data if needed. For now, let's use the lesson object directly
            // but if content is missing (e.g. list view optimization), fetch it.
            if (!lesson.content) {
                const detailedLesson = await learningService.getLessonById(token, lesson.id);
                setSelectedLesson(detailedLesson);
            } else {
                setSelectedLesson(lesson);
            }
        } catch (err) {
            console.error('Error fetching lesson detail:', err);
            setSelectedLesson(lesson);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DRAFT': return '#9E9E9E';
            case 'PENDING': return '#FF9800';
            case 'APPROVED': return '#4CAF50';
            case 'REJECTED': return '#F44336';
            default: return '#666';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle size={14} />;
            case 'REJECTED': return <XCircle size={14} />;
            case 'PENDING': return <Clock size={14} />;
            case 'DRAFT': return <FileText size={14} />;
            default: return null;
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

    const modalStyles = {
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
            maxWidth: '900px',
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
            fontSize: '24px',
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
            fontSize: '16px',
            lineHeight: '1.6',
        },
    };

    return (
        <>
            <div style={styles.page}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 16,
                        fontSize: 16,
                        color: 'var(--text-secondary)'
                    }}
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>

                <Header title="Creator Dashboard" subtitle="Quản lý bài học của bạn" />

                {/* Creator Stats */}
                {creatorProfile && (
                    <div style={{
                        ...styles.progressCard,
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        marginBottom: 20,
                        background: 'var(--surface-card)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <TrendingUp size={24} color="#4CAF50" />
                            <p style={styles.progressLabel}>Thống kê Creator</p>
                        </div>
                        <div style={styles.progressStats}>
                            <div>
                                <h3 style={styles.progressNumber}>{creatorProfile.totalLessons || 0}</h3>
                                <p style={styles.progressText}>Tổng số bài học đã tạo</p>
                            </div>
                            <div>
                                <h3 style={styles.progressNumber}>
                                    {lessons.filter(l => l.status === 'APPROVED').length}
                                </h3>
                                <p style={styles.progressText}>Số bài đã được duyệt</p>
                            </div>
                            <div>
                                <h3 style={styles.progressNumber}>
                                    {lessons.filter(l => l.status === 'PENDING').length}
                                </h3>
                                <p style={styles.progressText}>Số bài đang chờ duyệt</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    borderBottom: '2px solid var(--border-subtle)',
                    paddingBottom: '0'
                }}>
                    <button
                        onClick={() => setActiveTab('challenges')}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'challenges' ? '3px solid #2196F3' : '3px solid transparent',
                            color: activeTab === 'challenges' ? '#2196F3' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'challenges' ? 600 : 400,
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginBottom: '-2px'
                        }}
                    >
                        🎯 Tạo Challenge
                    </button>
                    <button
                        onClick={() => setActiveTab('lessons')}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'lessons' ? '3px solid #2196F3' : '3px solid transparent',
                            color: activeTab === 'lessons' ? '#2196F3' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'lessons' ? 600 : 400,
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginBottom: '-2px'
                        }}
                    >
                        📝 Tạo Quiz/Bài học
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'challenges' ? (
                    <div style={{ marginTop: '20px' }}>
                        <CreatorChallengeManager />
                    </div>
                ) : (
                    <>
                        {/* Create Lesson Button */}
                        <button
                            onClick={() => navigate('/creator/lesson/new')}
                            style={{
                                ...styles.addButton,
                                marginBottom: 20,
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            <Plus size={20} /> Tạo bài học mới
                        </button>

                        {/* Filter by Status */}
                        <div style={{ marginBottom: 20 }}>
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '12px 0',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    width: '100%',
                                    justifyContent: 'flex-start'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Filter size={20} color="#666" />
                                    Lọc trạng thái
                                </div>
                            </button>

                            {showFilter && (
                                <div style={{
                                    marginTop: 12,
                                    padding: '16px',
                                    background: 'var(--surface-card)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 12,
                                    animation: 'fadeIn 0.3s ease-in-out'
                                }}>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Trạng thái:</p>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {STATUSES.map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: 20,
                                                    border: statusFilter === status ? '2px solid #2196F3' : '1px solid var(--border-subtle)',
                                                    background: statusFilter === status ? 'rgba(33, 150, 243, 0.1)' : 'var(--bg-primary)',
                                                    color: statusFilter === status ? '#2196F3' : 'var(--text-secondary)',
                                                    fontSize: 13,
                                                    cursor: 'pointer',
                                                    fontWeight: statusFilter === status ? 600 : 400,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                {status !== 'ALL' && getStatusIcon(status)}
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>
                                Danh sách bài học đã tạo ({lessons.length})
                            </h3>
                            {loading ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</p> : (
                                lessons.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Bạn chưa tạo bài học nào {statusFilter !== 'ALL' && `với trạng thái ${statusFilter}`}.
                                    </p>
                                ) : (
                                    lessons.map(lesson => (
                                        <div key={lesson.id} style={{ ...styles.lessonCard, display: 'block', padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <h4 style={{
                                                    ...styles.lessonTitle,
                                                    margin: 0,
                                                    fontSize: 18,
                                                    fontWeight: 700,
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    {lesson.title}
                                                </h4>
                                                <span style={{
                                                    fontSize: 12,
                                                    padding: '6px 12px',
                                                    borderRadius: 20,
                                                    backgroundColor: `${getStatusColor(lesson.status)}15`,
                                                    color: getStatusColor(lesson.status),
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    border: `1px solid ${getStatusColor(lesson.status)}30`
                                                }}>
                                                    {getStatusIcon(lesson.status)}
                                                    {lesson.status}
                                                </span>
                                            </div>

                                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                                                {lesson.description || 'Chưa có mô tả'}
                                            </p>

                                            {lesson.status === 'REJECTED' && lesson.commentByMod && (
                                                <div style={{
                                                    padding: 12,
                                                    background: '#FFEBEE',
                                                    borderLeft: '3px solid #F44336',
                                                    borderRadius: 4,
                                                    marginBottom: 16,
                                                    display: 'flex',
                                                    gap: 10
                                                }}>
                                                    <AlertCircle size={18} color="#D32F2F" style={{ marginTop: 2 }} />
                                                    <div>
                                                        <p style={{ fontSize: 13, color: '#D32F2F', margin: '0 0 4px 0', fontWeight: 600 }}>
                                                            Yêu cầu chỉnh sửa:
                                                        </p>
                                                        <p style={{ fontSize: 13, color: '#C62828', margin: 0 }}>
                                                            {lesson.commentByMod}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 16,
                                                    flexWrap: 'wrap',
                                                    fontSize: 13,
                                                    color: 'var(--text-tertiary)'
                                                }}>
                                                    {lesson.tags && lesson.tags.length > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Tag size={14} />
                                                            {lesson.tags.map((tag, idx) => {
                                                                const tagStyle = getTagColor(tag);
                                                                return (
                                                                    <span key={idx} style={{
                                                                        backgroundColor: tagStyle.bg,
                                                                        color: tagStyle.color,
                                                                        padding: '2px 8px',
                                                                        borderRadius: 4,
                                                                        fontSize: 12,
                                                                        fontWeight: 500
                                                                    }}>
                                                                        {tag}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <BarChart size={14} />
                                                        <span style={{ fontWeight: 500 }}>{lesson.difficulty}</span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Clock size={14} />
                                                        <span>{lesson.durationMinutes} phút</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    {(lesson.status === 'DRAFT' || lesson.status === 'REJECTED') && (
                                                        <>
                                                            <button
                                                                onClick={() => navigate(`/creator/lesson/edit/${lesson.id}`)}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    borderRadius: 8,
                                                                    border: '1px solid var(--border-subtle)',
                                                                    background: 'var(--bg-secondary)',
                                                                    color: 'var(--text-primary)',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    fontWeight: 500,
                                                                    fontSize: 13
                                                                }}
                                                            >
                                                                <Edit size={14} /> Sửa
                                                            </button>
                                                            <button
                                                                onClick={() => handleSubmitForReview(lesson.id)}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    borderRadius: 8,
                                                                    border: 'none',
                                                                    background: '#4CAF50',
                                                                    color: 'white',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    fontWeight: 500,
                                                                    fontSize: 13
                                                                }}
                                                            >
                                                                <Send size={14} /> Gửi duyệt
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(lesson.id)}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    borderRadius: 8,
                                                                    border: '1px solid #FFEBEE',
                                                                    background: '#FFEBEE',
                                                                    color: '#D32F2F',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    fontWeight: 500,
                                                                    fontSize: 13
                                                                }}
                                                            >
                                                                <Trash2 size={14} /> Xóa
                                                            </button>
                                                        </>
                                                    )}
                                                    {lesson.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleCancelSubmission(lesson)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                borderRadius: 8,
                                                                border: '1px solid #FF9800',
                                                                background: 'transparent',
                                                                color: '#FF9800',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                fontWeight: 500,
                                                                fontSize: 13
                                                            }}
                                                        >
                                                            <XCircle size={14} /> Hủy gửi
                                                        </button>
                                                    )}
                                                    {lesson.status === 'APPROVED' && (
                                                        <button
                                                            onClick={() => viewLessonDetail(lesson)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                borderRadius: 8,
                                                                border: '1px solid #2196F3',
                                                                background: 'rgba(33, 150, 243, 0.1)',
                                                                color: '#2196F3',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                fontWeight: 500,
                                                                fontSize: 13
                                                            }}
                                                        >
                                                            <Eye size={14} /> Xem
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>

                        {selectedLesson && (
                            <div style={modalStyles.modalOverlay} onClick={() => setSelectedLesson(null)}>
                                <div style={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
                                    <div style={modalStyles.modalHeader}>
                                        <div>
                                            <h2 style={modalStyles.modalTitle}>{selectedLesson.title}</h2>
                                            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                                {new Date(selectedLesson.createdAt).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                        <button style={modalStyles.closeButton} onClick={() => setSelectedLesson(null)}>
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div style={modalStyles.detailRow}>
                                        <span style={modalStyles.detailLabel}>Mô tả</span>
                                        <div style={modalStyles.detailValue}>{selectedLesson.description}</div>
                                    </div>

                                    {selectedLesson.videoUrl && (
                                        <div style={modalStyles.detailRow}>
                                            <span style={modalStyles.detailLabel}>Video bài học</span>
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

                                    <div style={modalStyles.detailRow}>
                                        <span style={modalStyles.detailLabel}>Nội dung</span>
                                        <div style={{
                                            ...modalStyles.detailValue,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            padding: '16px',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 8,
                                            fontSize: '15px'
                                        }}>
                                            {selectedLesson.content || 'Chưa có nội dung'}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
                                        <div style={modalStyles.detailRow}>
                                            <span style={modalStyles.detailLabel}>Độ khó</span>
                                            <div style={modalStyles.detailValue}>{selectedLesson.difficulty}</div>
                                        </div>
                                        <div style={modalStyles.detailRow}>
                                            <span style={modalStyles.detailLabel}>Thời gian ước tính</span>
                                            <div style={modalStyles.detailValue}>{selectedLesson.durationMinutes} phút</div>
                                        </div>
                                        <div style={modalStyles.detailRow}>
                                            <span style={modalStyles.detailLabel}>Trạng thái</span>
                                            <div style={modalStyles.detailValue}>{selectedLesson.status}</div>
                                        </div>
                                    </div>

                                    {selectedLesson.commentByMod && (
                                        <div style={modalStyles.detailRow}>
                                            <span style={modalStyles.detailLabel}>Nhận xét từ moderator</span>
                                            <div style={{
                                                ...modalStyles.detailValue,
                                                padding: '16px',
                                                background: 'rgba(244, 67, 54, 0.1)',
                                                borderLeft: '4px solid #F44336',
                                                borderRadius: 4
                                            }}>
                                                {selectedLesson.commentByMod}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default CreatorDashboard;
