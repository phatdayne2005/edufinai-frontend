import React, { useEffect, useState } from 'react';
import {
    Plus, Edit, Trash2, Send, TrendingUp, Filter, ArrowLeft,
    Clock, BarChart, Tag, FileText, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import Header from '../../components/layout/Header';

const CreatorDashboard = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [lessons, setLessons] = useState([]);
    const [creatorProfile, setCreatorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showFilter, setShowFilter] = useState(false);

    const STATUSES = ['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

    useEffect(() => {
        const fetchMyLessons = async () => {
            const token = getToken();
            if (!token) return;
            try {
                // Fetch creator profile to get stats
                const profile = await learningService.getCreatorProfile(token).catch(() => null);
                setCreatorProfile(profile);

                // Fetch lessons with filter
                let allLessons;
                if (statusFilter !== 'ALL') {
                    allLessons = await learningService.filterLessonsByStatus(token, statusFilter);
                } else {
                    allLessons = await learningService.getAllLessons(token);
                }

                // Filter to show only my lessons using profile ID
                if (profile) {
                    const myLessons = allLessons.filter(l => l.creatorId === profile.id);
                    setLessons(myLessons);
                } else {
                    setLessons(allLessons);
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

    return (
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

            {/* Create Button */}
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
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default CreatorDashboard;
