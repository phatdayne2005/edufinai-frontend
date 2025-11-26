import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { styles } from '../../styles/appStyles';
import LevelUpNotification from '../../components/notifications/LevelUpNotification';

const QuizPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { showError } = useNotification();

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [enrollmentId, setEnrollmentId] = useState(null);
    const [showLevelUpNotification, setShowLevelUpNotification] = useState(false);
    const [levelUpData, setLevelUpData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token) return;

            try {
                // Fetch lesson and enrollments in parallel
                const [lesson, enrollments] = await Promise.all([
                    learningService.getLessonBySlug(token, slug),
                    learningService.getMyEnrollments(token).catch(() => [])
                ]);

                if (lesson && lesson.quizJson) {
                    // Parse quizJson if it's a string, or use directly if object
                    let parsedQuiz = [];
                    try {
                        const quizData = typeof lesson.quizJson === 'string' ? JSON.parse(lesson.quizJson) : lesson.quizJson;

                        // Check if it has 'questions' property (API document format)
                        if (quizData.questions && Array.isArray(quizData.questions)) {
                            parsedQuiz = quizData.questions;
                        }
                        // Check if it's directly an array
                        else if (Array.isArray(quizData)) {
                            parsedQuiz = quizData;
                        }
                        else {
                            throw new Error('Invalid quiz format');
                        }
                    } catch (e) {
                        console.error("Failed to parse quizJson", e);
                        // Fallback mock quiz if parsing fails or empty
                        parsedQuiz = [
                            { id: 1, question: "Đâu là nguyên tắc cơ bản của quản lý tài chính?", options: ["Chi tiêu nhiều hơn thu nhập", "Tiết kiệm trước khi chi tiêu", "Vay mượn tối đa"], correctAnswer: 1 },
                            { id: 2, question: "Lãi suất kép là gì?", options: ["Lãi mẹ đẻ lãi con", "Lãi suất cố định", "Lãi suất ngân hàng"], correctAnswer: 0 }
                        ];
                    }
                    setQuestions(parsedQuiz);
                }

                // Get enrollment ID
                const myEnrollment = (enrollments || []).find(e => e.lessonId === lesson.id);
                if (myEnrollment) {
                    setEnrollmentId(myEnrollment.id);
                }

            } catch (error) {
                console.error('Error loading quiz:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, getToken]);

    const handleAnswer = (optionIndex) => {
        if (submitted) return;
        setAnswers({ ...answers, [currentQuestionIndex]: optionIndex });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        let correctCount = 0;
        questions.forEach((q, index) => {
            // Use loose equality to handle potential string/number mismatches
            // eslint-disable-next-line eqeqeq
            if (answers[index] == q.correctAnswer) {
                correctCount++;
            }
        });

        // Logic: Mỗi câu 10 điểm
        const pointsPerQuestion = 10;
        const totalPoints = questions.length * pointsPerQuestion;
        const earnedPoints = correctCount * pointsPerQuestion;

        setScore(earnedPoints);
        setSubmitted(true);

        // Logic pass: Đạt 100% số điểm tối đa thì tính là hoàn thành
        const isPassed = correctCount === questions.length;

        // Update progress via new slug-based API
        const token = getToken();
        try {
            // Get current learner profile before update
            const profileBefore = await learningService.getLearnerProfile(token);
            const oldLevel = profileBefore?.level;

            await learningService.updateMyEnrollmentProgressBySlug(token, slug, {
                status: isPassed ? 'COMPLETED' : 'IN_PROGRESS',
                progressPercent: 100, // Đã làm xong bài quiz
                score: earnedPoints,
                addAttempt: 1,
                correctAnswers: correctCount
            });
            console.log('Progress updated successfully!');

            // Get updated profile to check if level changed
            const profileAfter = await learningService.getLearnerProfile(token);
            const newLevel = profileAfter?.level;

            // Show level-up notification if level changed
            if (oldLevel && newLevel && oldLevel !== newLevel) {
                setLevelUpData({ oldLevel, newLevel });
                setShowLevelUpNotification(true);
            }
        } catch (error) {
            console.error('Failed to submit progress:', error);
            showError('Không thể lưu kết quả: ' + error.message);
        }
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải câu hỏi...</div>;
    if (questions.length === 0) return <div style={{ padding: 20, textAlign: 'center' }}>Bài học này chưa có câu hỏi kiểm tra. <button onClick={() => navigate(-1)}>Quay lại</button></div>;

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const maxPoints = questions.length * 10;
    const isPassed = score === maxPoints;

    return (
        <>
            {/* Level Up Notification */}
            {showLevelUpNotification && levelUpData && (
                <LevelUpNotification
                    oldLevel={levelUpData.oldLevel}
                    newLevel={levelUpData.newLevel}
                    onClose={() => setShowLevelUpNotification(false)}
                />
            )}

            <div style={styles.page}>
                <div style={styles.header}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16, color: '#666' }}
                    >
                        <ArrowLeft size={20} /> Thoát
                    </button>
                    <h1 style={styles.headerTitle}>Kiểm tra kiến thức</h1>
                    <p style={styles.headerSubtitle}>Câu hỏi {currentQuestionIndex + 1}/{questions.length}</p>
                </div>

                {!submitted ? (
                    <div style={{ ...styles.section, backgroundColor: 'var(--surface-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', minHeight: 300 }}>
                        <h3 style={{ fontSize: 18, marginBottom: 24, color: 'var(--text-primary)' }}>{currentQuestion.question}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(currentQuestion.answer || currentQuestion.options || []).map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: answers[currentQuestionIndex] === idx ? '2px solid #4CAF50' : '1px solid var(--border-subtle)',
                                        backgroundColor: answers[currentQuestionIndex] === idx ? 'rgba(76, 175, 80, 0.1)' : 'var(--surface-app)',
                                        color: 'var(--text-primary)',
                                        textAlign: 'left',
                                        fontSize: 16,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: currentQuestionIndex === 0 ? 'var(--surface-muted)' : 'var(--surface-hover)',
                                    color: currentQuestionIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Trước
                            </button>

                            {isLastQuestion ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={Object.keys(answers).length < questions.length}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: '#4CAF50',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        opacity: Object.keys(answers).length < questions.length ? 0.5 : 1
                                    }}
                                >
                                    Nộp bài
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2196F3', color: '#fff', cursor: 'pointer' }}
                                >
                                    Tiếp theo
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--surface-card)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                            {isPassed ? (
                                <CheckCircle size={48} color="#4CAF50" />
                            ) : (
                                <XCircle size={48} color="#F44336" />
                            )}
                            <h2 style={{ fontSize: 28, margin: 0, color: 'var(--text-primary)' }}>
                                {isPassed ? 'Chúc mừng!' : 'Cần cố gắng hơn!'}
                            </h2>
                        </div>

                        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Bạn đạt được <span style={{ fontWeight: 'bold', color: isPassed ? '#4CAF50' : '#F44336', fontSize: 24 }}>{score}/{maxPoints}</span> điểm.
                        </p>
                        <button onClick={() => navigate('/learning')} style={styles.addButton}>
                            Quay về danh sách bài học
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default QuizPage;
