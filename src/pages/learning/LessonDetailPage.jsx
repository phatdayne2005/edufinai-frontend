import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';

const LessonDetailPage = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [lesson, setLesson] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token) return;

            try {
                const [lessonData, enrollments] = await Promise.all([
                    learningService.getAllLessons(token).then(lessons => lessons.find(l => l.id === lessonId)),
                    learningService.getMyEnrollments(token).catch(() => [])
                ]);

                setLesson(lessonData);
                const userEnrollment = enrollments.find(e => e.lessonId === lessonId);
                setEnrollment(userEnrollment);
            } catch (error) {
                console.error('Error fetching lesson details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [lessonId, getToken]);

    const handleEnroll = async () => {
        const token = getToken();
        try {
            const newEnrollment = await learningService.enrollInLesson(token, lessonId);
            setEnrollment(newEnrollment);
        } catch (error) {
            console.error('Error enrolling:', error);
            alert(`Không thể đăng ký bài học này: ${error.message}`);
        }
    };

    const handleStartQuiz = () => {
        navigate(`/learning/quiz/${lessonId}`);
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>;
    if (!lesson) return <div style={{ padding: 20, textAlign: 'center' }}>Không tìm thấy bài học.</div>;

    const isEnrolled = !!enrollment;
    const isCompleted = enrollment?.status === 'COMPLETED';

    return (
        <div style={{ ...styles.page, paddingBottom: 80 }}>
            <div style={styles.header}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16, color: '#666' }}
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <h1 style={styles.headerTitle}>{lesson.title}</h1>
                <div style={{ display: 'flex', gap: 16, color: '#666', fontSize: 14, marginTop: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={16} /> {lesson.durationMinutes} phút
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={16} /> {lesson.difficulty}
                    </span>
                </div>
            </div>

            {lesson.videoUrl && (
                <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
                    <video
                        src={lesson.videoUrl}
                        controls
                        style={{ width: '100%', aspectRatio: '16/9', display: 'block' }}
                        poster={lesson.thumbnailUrl}
                    />
                </div>
            )}

            <div style={{ ...styles.section, backgroundColor: '#fff', padding: 20, borderRadius: 12, border: '1px solid #E0E0E0' }}>
                <h3 style={styles.sectionTitle}>Nội dung bài học</h3>
                <div
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                    style={{ lineHeight: '1.6', color: '#333', marginTop: 12 }}
                />
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: 600, width: '100%' }}>
                    {!isEnrolled ? (
                        <button onClick={handleEnroll} style={styles.addButton}>
                            <PlayCircle size={20} /> Bắt đầu học
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: 12 }}>
                            {isCompleted ? (
                                <button disabled style={{ ...styles.addButton, backgroundColor: '#E0E0E0', color: '#666', cursor: 'default' }}>
                                    <CheckCircle size={20} /> Đã hoàn thành
                                </button>
                            ) : (
                                <button onClick={handleStartQuiz} style={styles.addButton}>
                                    Làm bài kiểm tra
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonDetailPage;
