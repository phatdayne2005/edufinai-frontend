import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, Clock, BookOpen, Award, TrendingUp, PiggyBank, CreditCard, DollarSign, HelpCircle, FileText, Tag, Circle, AlertCircle, AlertTriangle } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { styles } from '../../styles/appStyles';
import Header from '../../components/layout/Header';

const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
        case 'BASIC':
            return {
                bg: '#E8F5E9',
                icon: <Circle size={14} fill="#2E7D32" color="#2E7D32" />,
                text: 'Cơ bản'
            };
        case 'INTERMEDIATE':
            return {
                bg: '#FFF3E0',
                icon: <AlertCircle size={14} color="#EF6C00" />,
                text: 'Trung bình'
            };
        case 'ADVANCED':
            return {
                bg: '#FFEBEE',
                icon: <AlertTriangle size={14} color="#C62828" />,
                text: 'Nâng cao'
            };
        default:
            return {
                bg: '#F5F5F5',
                icon: <Circle size={14} color="#666" />,
                text: difficulty
            };
    }
};

const getTagColor = (tag) => {
    switch (tag) {
        case 'BUDGETING': return { bg: '#E3F2FD' };
        case 'INVESTING': return { bg: '#E8F5E9' };
        case 'SAVING': return { bg: '#FFF3E0' };
        case 'DEBT': return { bg: '#FFEBEE' };
        case 'TAX': return { bg: '#F3E5F5' };
        default: return { bg: 'var(--bg-secondary)' };
    }
};

const LessonDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [lesson, setLesson] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token) return;

            try {
                // Fetch lesson and enrollment in parallel
                const [lessonData, enrollmentData] = await Promise.all([
                    learningService.getLessonBySlug(token, slug),
                    learningService.getMyEnrollmentForLesson(token, slug).catch(err => {
                        // 404 means not enrolled, which is OK
                        if (err.message && err.message.includes('Not enrolled')) {
                            return null;
                        }
                        console.error('Error fetching enrollment:', err);
                        return null;
                    })
                ]);

                // Fallback for totalQuestions if missing or 0
                if (!lessonData.totalQuestions && !lessonData.total_question && lessonData.quizJson) {
                    try {
                        const quizData = typeof lessonData.quizJson === 'string'
                            ? JSON.parse(lessonData.quizJson)
                            : lessonData.quizJson;
                        lessonData.totalQuestions = quizData.questions?.length || 0;
                    } catch (e) {
                        console.error('Failed to parse quiz:', e);
                        lessonData.totalQuestions = 0;
                    }
                }

                setLesson(lessonData);
                setEnrollment(enrollmentData);
            } catch (error) {
                console.error('Error fetching lesson details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, getToken]);

    const handleEnroll = async () => {
        const token = getToken();
        try {
            const newEnrollment = await learningService.enrollInLesson(token, lesson.id);
            setEnrollment(newEnrollment);
            showSuccess('Đã đăng ký học thành công!');
        } catch (error) {
            console.error('Error enrolling:', error);
            showError(`Không thể đăng ký bài học này: ${error.message}`);
        }
    };

    const handleStartQuiz = () => {
        navigate(`/learning/quiz/${slug}`);
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>;
    if (!lesson) return <div style={{ padding: 20, textAlign: 'center' }}>Không tìm thấy bài học này.</div>;

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11
            ? `https://www.youtube.com/embed/${match[2]}`
            : null;
    };

    const getEnrollmentStatus = (enrollment) => {
        if (enrollment && enrollment.status === 'COMPLETED') {
            return { text: 'Đã hoàn thành', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)', border: '#4CAF50' };
        }
        if (enrollment) {
            return { text: 'Đang làm', color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.1)', border: '#FF9800' };
        }
        return { text: 'Chưa bắt đầu', color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.1)', border: '#F44336' };
    };

    const statusStyle = enrollment ? getEnrollmentStatus(enrollment) : null;
    const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
    const difficultyInfo = getDifficultyStyle(lesson.difficulty);

    return (
        <div style={styles.page}>
            <button
                onClick={() => navigate('/learning')}
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

            <h1 style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginBottom: 24,
                marginTop: 0
            }}>
                {lesson.title}
            </h1>

            {/* Lesson Info */}
            <div style={{ ...styles.progressCard, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Difficulty Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: difficultyInfo.color,
                        fontSize: 14,
                        fontWeight: 600
                    }}>
                        {difficultyInfo.icon}
                        {difficultyInfo.text}
                    </div>

                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={16} /> {lesson.durationMinutes} phút
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <HelpCircle size={16} /> {lesson.totalQuestions || lesson.total_question || 0} câu hỏi
                    </span>

                    {lesson.tags && lesson.tags.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag size={16} />
                            {lesson.tags.map((tag, index) => {
                                const tagStyle = getTagColor(tag);
                                return (
                                    <span key={tag} style={{
                                        color: tagStyle.color,
                                        fontSize: 14,
                                        fontWeight: 500
                                    }}>
                                        {tag}{index < lesson.tags.length - 1 ? ',' : ''}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Enrollment Status */}
            {!enrollment ? (
                <div style={{
                    ...styles.progressCard,
                    border: '2px dashed #2196F3',
                    textAlign: 'center',
                    marginBottom: 20
                }}>
                    <p style={{ color: '#2196F3', marginBottom: 12, fontSize: 15 }}>
                        Bạn chưa đăng ký bài học này
                    </p>
                    <button onClick={handleEnroll} style={styles.addButton}>
                        <CheckCircle size={20} /> Đăng ký học ngay
                    </button>
                </div>
            ) : (
                <div style={{
                    ...styles.progressCard,
                    border: `1px solid ${statusStyle.border}`,
                    backgroundColor: statusStyle.bgColor,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: statusStyle.color
                        }} />
                        <div>
                            <p style={{ color: statusStyle.color, fontWeight: 700, margin: 0, fontSize: 16 }}>
                                {statusStyle.text}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 13 }}>
                                Tiến độ: {enrollment.progressPercent}%
                                {enrollment.score !== null && ` • Điểm: ${enrollment.score}`}
                                {enrollment.correctAnswers != null && (enrollment.totalQuestions != null || enrollment.total_question != null || lesson.totalQuestions > 0 || lesson.total_question > 0) &&
                                    ` • Đúng: ${enrollment.correctAnswers}/${enrollment.totalQuestions || enrollment.total_question || lesson.totalQuestions || lesson.total_question}`}
                            </p>
                        </div>
                    </div>

                    {enrollment.status === 'COMPLETED' && (
                        <Award size={32} color={statusStyle.color} />
                    )}
                </div>
            )}

            {/* Video Section */}
            {embedUrl && (
                <div style={styles.section}>
                    <h3 style={{ ...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PlayCircle size={22} /> Video bài học
                    </h3>
                    <div style={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                        borderRadius: 12,
                        backgroundColor: '#000'
                    }}>
                        <iframe
                            src={embedUrl}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Lesson Video"
                        />
                    </div>
                </div>
            )}

            {/* Content Section */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Nội dung bài học</h3>
                <div
                    style={{
                        ...styles.lessonCard,
                        display: 'block',
                        fontSize: 15,
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap'
                    }}
                    dangerouslySetInnerHTML={{ __html: lesson.content || 'Chưa có nội dung' }}
                />
            </div>

            {/* Quiz Action */}
            {lesson.quizJson && (
                <div style={styles.quizCard}>
                    <Award size={32} color="#FFD700" />
                    <div>
                        <h4 style={styles.quizTitle}>Bài kiểm tra</h4>
                        <p style={styles.quizText}>
                            {enrollment
                                ? 'Hoàn thành bài kiểm tra để nhận điểm!'
                                : 'Đăng ký học để làm bài kiểm tra'}
                        </p>
                    </div>
                    <button
                        type="button"
                        style={{
                            ...styles.quizButton,
                            opacity: enrollment ? 1 : 0.5,
                            cursor: enrollment ? 'pointer' : 'not-allowed'
                        }}
                        onClick={handleStartQuiz}
                        disabled={!enrollment}
                    >
                        Làm bài
                    </button>
                </div>
            )}
        </div>
    );
};

export default LessonDetailPage;
