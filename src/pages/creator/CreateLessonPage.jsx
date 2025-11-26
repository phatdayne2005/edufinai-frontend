import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { styles } from '../../styles/appStyles';

const CreateLessonPage = () => {
    const navigate = useNavigate();
    const { lessonId } = useParams();
    const { getToken } = useAuth();
    const { showSuccess, showError, showWarning, showConfirm } = useNotification();
    const isEdit = !!lessonId;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        durationMinutes: 0,
        difficulty: 'BASIC',
        thumbnailUrl: '',
        videoUrl: '',
        tags: [],
        quizJson: ''
    });

    // State for Quiz Builder
    const [quizQuestions, setQuizQuestions] = useState([]);

    useEffect(() => {
        const fetchLessonData = async () => {
            if (!lessonId) return; // Not editing mode
            const token = getToken();
            try {
                // Fetch lesson and profile in parallel
                const [lessonData, profile] = await Promise.all([
                    learningService.getLessonById(token, lessonId),
                    learningService.getCreatorProfile(token).catch(() => null)
                ]);

                // Check ownership
                if (profile && lessonData.creatorId !== profile.id) {
                    alert('Bạn không có quyền chỉnh sửa bài học này');
                    navigate('/creator');
                    return;
                }

                setFormData({
                    title: lessonData.title,
                    description: lessonData.description,
                    content: lessonData.content,
                    difficulty: lessonData.difficulty,
                    durationMinutes: lessonData.durationMinutes,
                    thumbnailUrl: lessonData.thumbnailUrl,
                    videoUrl: lessonData.videoUrl,
                    tags: lessonData.tags ? lessonData.tags.join(', ') : '',
                });

                // Parse quizJson
                if (lessonData.quizJson) {
                    try {
                        const parsed = typeof lessonData.quizJson === 'string'
                            ? JSON.parse(lessonData.quizJson)
                            : lessonData.quizJson;

                        if (parsed.questions && Array.isArray(parsed.questions)) {
                            setQuizQuestions(parsed.questions);
                        } else if (Array.isArray(parsed)) {
                            setQuizQuestions(parsed);
                        }
                    } catch (e) {
                        console.error('Error parsing quizJson:', e);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch lesson:', error);
                alert('Không thể tải thông tin bài học');
                navigate('/creator');
            }
        };
        fetchLessonData();
    }, [lessonId, getToken, navigate]);

    const validateForm = () => {
        if (!formData.title.trim()) {
            alert('Vui lòng nhập Tiêu đề bài học.');
            return false;
        }
        if (!formData.description.trim()) {
            alert('Vui lòng nhập Mô tả ngắn.');
            return false;
        }
        if (formData.title.length > 150) {
            alert('Tiêu đề không được vượt quá 150 ký tự.');
            return false;
        }

        if (formData.description.length > 1000) {
            alert('Mô tả ngắn không được vượt quá 1000 ký tự.');
            return false;
        }

        const hasContent = !!formData.content.trim();
        const hasVideo = !!formData.videoUrl.trim();

        if (!hasContent && !hasVideo) {
            alert('Vui lòng nhập ít nhất một trong hai: Nội dung bài học hoặc Video URL.');
            return false;
        }

        if (hasVideo) {
            if (formData.durationMinutes < 0) {
                alert('Thời lượng (phút) không được nhỏ hơn 0.');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const token = getToken();

        // Construct quiz JSON from builder state
        const finalQuizJson = JSON.stringify({ questions: quizQuestions });

        try {
            const payload = {
                ...formData,
                tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.split(',').map(t => t.trim()),
                quizJson: finalQuizJson
            };

            if (isEdit) {
                await learningService.updateLesson(token, lessonId, payload);
            } else {
                await learningService.createLesson(token, payload);
            }
            navigate('/creator/dashboard');
        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('Lỗi khi lưu bài học: ' + error.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Quiz Builder Functions
    const addQuestion = () => {
        setQuizQuestions([...quizQuestions, { question: '', options: ['', ''], correctAnswer: 0 }]);
    };

    const removeQuestion = (index) => {
        const newQuestions = [...quizQuestions];
        newQuestions.splice(index, 1);
        setQuizQuestions(newQuestions);
    };

    const updateQuestionText = (index, text) => {
        const newQuestions = [...quizQuestions];
        newQuestions[index].question = text;
        setQuizQuestions(newQuestions);
    };

    const addOption = (qIndex) => {
        const newQuestions = [...quizQuestions];
        if (newQuestions[qIndex].options.length >= 4) return; // Max 4 options
        newQuestions[qIndex].options.push('');
        setQuizQuestions(newQuestions);
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...quizQuestions];
        newQuestions[qIndex].options.splice(oIndex, 1);
        // Adjust correct answer if needed
        if (newQuestions[qIndex].correctAnswer >= oIndex && newQuestions[qIndex].correctAnswer > 0) {
            newQuestions[qIndex].correctAnswer--;
        }
        setQuizQuestions(newQuestions);
    };

    const updateOptionText = (qIndex, oIndex, text) => {
        const newQuestions = [...quizQuestions];
        newQuestions[qIndex].options[oIndex] = text;
        setQuizQuestions(newQuestions);
    };

    const setCorrectAnswer = (qIndex, oIndex) => {
        const newQuestions = [...quizQuestions];
        newQuestions[qIndex].correctAnswer = oIndex;
        setQuizQuestions(newQuestions);
    };

    const loadSampleQuiz = () => {
        if (window.confirm('Hành động này sẽ thay thế các câu hỏi hiện tại. Bạn có chắc chắn không?')) {
            const allSampleQuestions = [
                {
                    question: "Mục đích chính của việc lập ngân sách là gì?",
                    options: [
                        "Để hạn chế chi tiêu cho mọi thứ",
                        "Để theo dõi thu chi và quản lý tiền hiệu quả",
                        "Để tăng nợ",
                        "Để trốn thuế"
                    ],
                    correctAnswer: 1
                },
                {
                    question: "Khoản chi nào sau đây được coi là chi phí cố định?",
                    options: [
                        "Tiền đi chợ",
                        "Chi phí giải trí",
                        "Tiền thuê nhà hoặc trả góp nhà",
                        "Tiền ăn hàng"
                    ],
                    correctAnswer: 2
                },
                {
                    question: "Quy tắc 50/30/20 trong lập ngân sách là gì?",
                    options: [
                        "50% Nhu cầu, 30% Mong muốn, 20% Tiết kiệm/Nợ",
                        "50% Tiết kiệm, 30% Nhu cầu, 20% Mong muốn",
                        "50% Mong muốn, 30% Tiết kiệm, 20% Nhu cầu",
                        "50% Nợ, 30% Nhu cầu, 20% Tiết kiệm"
                    ],
                    correctAnswer: 0
                },
                {
                    question: "Lãi suất kép là gì?",
                    options: [
                        "Lãi suất chỉ tính trên số tiền gốc",
                        "Lãi suất tính trên cả vốn gốc và lãi đã tích lũy",
                        "Phí ngân hàng thu khi gửi tiết kiệm",
                        "Lãi suất do chính phủ quy định"
                    ],
                    correctAnswer: 1
                },
                {
                    question: "Kênh đầu tư nào thường có rủi ro thấp nhất?",
                    options: [
                        "Cổ phiếu",
                        "Tiền điện tử (Crypto)",
                        "Trái phiếu chính phủ",
                        "Bất động sản"
                    ],
                    correctAnswer: 2
                },
                {
                    question: "Quỹ khẩn cấp nên bằng bao nhiêu tháng chi phí sinh hoạt?",
                    options: [
                        "1 tháng",
                        "3-6 tháng",
                        "1 năm",
                        "Không cần thiết"
                    ],
                    correctAnswer: 1
                },
                {
                    question: "Lạm phát ảnh hưởng như thế nào đến sức mua của tiền?",
                    options: [
                        "Làm tăng sức mua",
                        "Không ảnh hưởng",
                        "Làm giảm sức mua",
                        "Làm tiền có giá trị hơn"
                    ],
                    correctAnswer: 2
                },
                {
                    question: "Đa dạng hóa danh mục đầu tư giúp ích gì?",
                    options: [
                        "Đảm bảo lợi nhuận cao nhất",
                        "Giảm thiểu rủi ro",
                        "Không mất phí giao dịch",
                        "Tăng rủi ro"
                    ],
                    correctAnswer: 1
                },
                {
                    question: "Chỉ số P/E trong chứng khoán là gì?",
                    options: [
                        "Giá trên thu nhập mỗi cổ phiếu",
                        "Lợi nhuận trên vốn chủ sở hữu",
                        "Tổng tài sản của công ty",
                        "Cổ tức được chia"
                    ],
                    correctAnswer: 0
                },
                {
                    question: "Sự khác biệt chính giữa thẻ tín dụng và thẻ ghi nợ là gì?",
                    options: [
                        "Thẻ tín dụng dùng tiền của bạn, thẻ ghi nợ vay tiền ngân hàng",
                        "Thẻ tín dụng vay tiền ngân hàng, thẻ ghi nợ dùng tiền của bạn",
                        "Không có sự khác biệt",
                        "Thẻ tín dụng không mất phí"
                    ],
                    correctAnswer: 1
                }
            ];

            // Shuffle array and pick 5
            const shuffled = allSampleQuestions.sort(() => 0.5 - Math.random());
            setQuizQuestions(shuffled.slice(0, 5));
        }
    };

    // Tag Functions
    const AVAILABLE_TAGS = ['BUDGETING', 'INVESTING', 'SAVING', 'DEBT', 'TAX'];

    const toggleTag = (tag) => {
        setFormData(prev => {
            const currentTags = prev.tags;
            if (currentTags.includes(tag)) {
                return { ...prev, tags: currentTags.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...currentTags, tag] };
            }
        });
    };

    const labelStyle = {
        ...styles.authLabel,
        color: 'var(--text-primary)',
        marginBottom: 8,
        display: 'block'
    };

    const inputStyle = {
        ...styles.authInput,
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-subtle)'
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
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
                        color: 'var(--text-primary)',
                        fontWeight: 600
                    }}
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <h1 style={{ ...styles.headerTitle, color: 'var(--text-primary)' }}>
                    {isEdit ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Basic Info */}
                <div style={{ padding: 20, background: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Thông tin cơ bản</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Tiêu đề <span style={{ color: '#F44336' }}>*</span></label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Nhập tiêu đề bài học"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Mô tả ngắn <span style={{ color: '#F44336' }}>*</span></label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }}
                                placeholder="Mô tả ngắn về nội dung bài học"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Video URL (YouTube)
                                <span style={{ color: '#888', fontSize: 12, marginLeft: 8, fontWeight: 'normal' }}>
                                    (Nhập Video hoặc Nội dung)
                                </span>
                            </label>
                            <input
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="https://www.youtube.com/watch?v=..."
                                maxLength={255}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Thumbnail URL (Ảnh bìa)</label>
                            <input
                                name="thumbnailUrl"
                                value={formData.thumbnailUrl}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="https://example.com/image.jpg"
                                maxLength={255}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>
                                    Thời lượng (phút)
                                    {formData.videoUrl && <span style={{ color: '#F44336', marginLeft: 4, fontSize: 12 }}>(Bắt buộc vì có Video)</span>}
                                </label>
                                <input
                                    type="number"
                                    name="durationMinutes"
                                    value={formData.durationMinutes}
                                    onChange={handleChange}
                                    onKeyDown={(e) => e.preventDefault()} // Prevent typing, force use of arrows
                                    style={{ ...inputStyle, cursor: 'default' }}
                                    min="0" // Backend allows min 0
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Độ khó</label>
                                <select
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleChange}
                                    style={{
                                        ...inputStyle,
                                        backgroundColor: 'var(--surface-card)', // Use card background for better match
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="BASIC" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}>Cơ bản (Basic)</option>
                                    <option value="INTERMEDIATE" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}>Trung bình (Intermediate)</option>
                                    <option value="ADVANCED" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}>Nâng cao (Advanced)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Tags (Chọn các chủ đề liên quan)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                {AVAILABLE_TAGS.map(tag => {
                                    const isSelected = formData.tags.includes(tag);

                                    // Define colors for each tag
                                    const tagColors = {
                                        'BUDGETING': '#2196F3', // Blue
                                        'INVESTING': '#4CAF50', // Green
                                        'SAVING': '#FF9800',    // Orange
                                        'DEBT': '#F44336',      // Red
                                        'TAX': '#9C27B0'        // Purple
                                    };
                                    const color = tagColors[tag] || '#2196F3';

                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: 20,
                                                border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                                                background: isSelected ? color : 'var(--bg-secondary)',
                                                color: isSelected ? '#fff' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                fontWeight: 500,
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6
                                            }}
                                        >
                                            {isSelected && <CheckCircle size={14} />}
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: 20, background: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                    <div>
                        <label style={labelStyle}>
                            Nội dung bài học (HTML/Markdown)
                            <span style={{ color: '#888', fontSize: 12, marginLeft: 8, fontWeight: 'normal' }}>
                                (Nhập Video hoặc Nội dung)
                            </span>
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            style={{ ...inputStyle, minHeight: 200, fontFamily: 'monospace' }}
                            placeholder="Nhập nội dung bài học..."
                        />
                    </div>
                </div>

                {/* Quiz Builder */}
                <div style={{ padding: 20, background: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Tạo câu hỏi (Trắc nghiệm)</h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                type="button"
                                onClick={loadSampleQuiz}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                                title="Tạo 5 câu hỏi mẫu về tài chính"
                            >
                                Tạo dữ liệu mẫu
                            </button>
                            <button
                                type="button"
                                onClick={addQuestion}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    background: '#E3F2FD',
                                    color: '#2196F3',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                <Plus size={18} /> Thêm câu hỏi
                            </button>
                        </div>
                    </div>

                    {quizQuestions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Chưa có câu hỏi nào. Hãy thêm câu hỏi để tạo bài kiểm tra.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {quizQuestions.map((q, qIndex) => (
                                <div key={qIndex} style={{
                                    padding: 16,
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 8,
                                    border: '1px solid var(--border-subtle)',
                                    position: 'relative'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(qIndex)}
                                        style={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#F44336'
                                        }}
                                        title="Xóa câu hỏi"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div style={{ marginBottom: 12, paddingRight: 30 }}>
                                        <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                                            Câu hỏi {qIndex + 1}
                                        </label>
                                        <input
                                            value={q.question}
                                            onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                                            style={{ ...inputStyle, background: 'var(--bg-primary)' }}
                                            placeholder="Nhập nội dung câu hỏi..."
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Các lựa chọn (Tối đa 4):</label>
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setCorrectAnswer(qIndex, oIndex)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: q.correctAnswer === oIndex ? '#4CAF50' : '#ccc'
                                                    }}
                                                    title="Đặt làm đáp án đúng"
                                                >
                                                    {q.correctAnswer === oIndex ? <CheckCircle size={20} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #ccc' }} />}
                                                </button>
                                                <input
                                                    value={opt}
                                                    onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                                                    style={{ ...inputStyle, background: 'var(--bg-primary)', flex: 1 }}
                                                    placeholder={`Lựa chọn ${oIndex + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(qIndex, oIndex)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F44336' }}
                                                    disabled={q.options.length <= 2}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        {q.options.length < 4 && (
                                            <button
                                                type="button"
                                                onClick={() => addOption(qIndex)}
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#2196F3',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    marginTop: 4
                                                }}
                                            >
                                                <Plus size={14} /> Thêm lựa chọn
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" style={{ ...styles.authButton, marginTop: 16, marginBottom: 40 }}>
                    <Save size={20} style={{ marginRight: 8 }} /> Lưu bài học
                </button>
            </form>
        </div>
    );
};

export default CreateLessonPage;
