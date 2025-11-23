import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';

const QuizPage = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [enrollmentId, setEnrollmentId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = getToken();
            if (!token) return;

            try {
                // Fetch lesson to get quizJson
                const lessons = await learningService.getAllLessons(token);
                const lesson = lessons.find(l => l.id === lessonId);

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
                const enrollments = await learningService.getMyEnrollments(token);
                const myEnrollment = enrollments.find(e => e.lessonId === lessonId);
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
    }, [lessonId, getToken]);

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
            if (answers[index] === q.correctAnswer) {
                correctCount++;
            }
        });

        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
        setSubmitted(true);

        // Update progress via API
        if (enrollmentId) {
            const token = getToken();
            try {
                await learningService.updateEnrollmentProgress(token, enrollmentId, {
                    status: finalScore >= 80 ? 'COMPLETED' : 'IN_PROGRESS',
                    progressPercent: 100,
                    score: finalScore,
                    addAttempt: 1
                });
            } catch (error) {
                console.error('Failed to submit progress:', error);
            }
        }
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải câu hỏi...</div>;
    if (questions.length === 0) return <div style={{ padding: 20, textAlign: 'center' }}>Bài học này chưa có câu hỏi kiểm tra. <button onClick={() => navigate(-1)}>Quay lại</button></div>;

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
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
                <div style={{ ...styles.section, backgroundColor: '#fff', padding: 24, borderRadius: 16, border: '1px solid #E0E0E0', minHeight: 300 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 24 }}>{currentQuestion.question}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {currentQuestion.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: answers[currentQuestionIndex] === idx ? '2px solid #4CAF50' : '1px solid #E0E0E0',
                                    backgroundColor: answers[currentQuestionIndex] === idx ? '#E8F5E9' : '#fff',
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
                            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#f5f5f5', color: currentQuestionIndex === 0 ? '#ccc' : '#333', cursor: 'pointer' }}
                        >
                            Trước
                        </button>

                        {isLastQuestion ? (
                            <button
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length < questions.length}
                                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', opacity: Object.keys(answers).length < questions.length ? 0.5 : 1 }}
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
                <div style={{ textAlign: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 16, border: '1px solid #E0E0E0' }}>
                    {score >= 80 ? (
                        <CheckCircle size={64} color="#4CAF50" style={{ marginBottom: 16 }} />
                    ) : (
                        <XCircle size={64} color="#F44336" style={{ marginBottom: 16 }} />
                    )}
                    <h2 style={{ fontSize: 24, marginBottom: 8 }}>
                        {score >= 80 ? 'Chúc mừng!' : 'Cần cố gắng hơn!'}
                    </h2>
                    <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
                        Bạn đạt được <span style={{ fontWeight: 'bold', color: score >= 80 ? '#4CAF50' : '#F44336' }}>{score}/100</span> điểm.
                    </p>
                    <button onClick={() => navigate('/learning')} style={styles.addButton}>
                        Quay về danh sách bài học
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuizPage;
