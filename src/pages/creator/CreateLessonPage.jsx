import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';

const CreateLessonPage = () => {
    const navigate = useNavigate();
    const { lessonId } = useParams();
    const { getToken } = useAuth();
    const isEdit = !!lessonId;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        durationMinutes: 15,
        difficulty: 'BASIC',
        thumbnailUrl: '',
        videoUrl: '',
        tags: [],
        quizJson: ''
    });

    useEffect(() => {
        if (isEdit) {
            const fetchLesson = async () => {
                const token = getToken();
                const lessons = await learningService.getAllLessons(token);
                const lesson = lessons.find(l => l.id === lessonId);
                if (lesson) {
                    setFormData({
                        title: lesson.title,
                        description: lesson.description,
                        content: lesson.content,
                        durationMinutes: lesson.durationMinutes,
                        difficulty: lesson.difficulty,
                        thumbnailUrl: lesson.thumbnailUrl || '',
                        videoUrl: lesson.videoUrl || '',
                        tags: lesson.tags || [],
                        quizJson: typeof lesson.quizJson === 'object' ? JSON.stringify(lesson.quizJson, null, 2) : (lesson.quizJson || '')
                    });
                }
            };
            fetchLesson();
        }
    }, [isEdit, lessonId, getToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = getToken();

        try {
            const payload = {
                ...formData,
                tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.split(',').map(t => t.trim()),
                // Try to parse quizJson if it's a string
                quizJson: formData.quizJson
            };

            if (isEdit) {
                await learningService.updateLesson(token, lessonId, payload);
            } else {
                await learningService.createLesson(token, payload);
            }
            navigate('/creator/dashboard');
        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('Lỗi khi lưu bài học.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 16, color: '#666' }}
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <h1 style={styles.headerTitle}>{isEdit ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label style={styles.authLabel}>Tiêu đề</label>
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        style={styles.authInput}
                        required
                    />
                </div>

                <div>
                    <label style={styles.authLabel}>Mô tả ngắn</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        style={{ ...styles.authInput, minHeight: 80, fontFamily: 'inherit' }}
                    />
                </div>

                <div>
                    <label style={styles.authLabel}>Nội dung (HTML/Markdown)</label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        style={{ ...styles.authInput, minHeight: 200, fontFamily: 'monospace' }}
                        required
                    />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.authLabel}>Thời lượng (phút)</label>
                        <input
                            type="number"
                            name="durationMinutes"
                            value={formData.durationMinutes}
                            onChange={handleChange}
                            style={styles.authInput}
                            required
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.authLabel}>Độ khó</label>
                        <select
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            style={styles.authInput}
                        >
                            <option value="BASIC">Cơ bản</option>
                            <option value="INTERMEDIATE">Trung bình</option>
                            <option value="ADVANCED">Nâng cao</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label style={styles.authLabel}>Video URL</label>
                    <input
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleChange}
                        style={styles.authInput}
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label style={styles.authLabel}>Quiz JSON</label>
                    <textarea
                        name="quizJson"
                        value={formData.quizJson}
                        onChange={handleChange}
                        style={{ ...styles.authInput, minHeight: 150, fontFamily: 'monospace' }}
                        placeholder='[{"question": "...", "options": ["A", "B"], "correctAnswer": 0}]'
                    />
                </div>

                <button type="submit" style={styles.authButton}>
                    <Save size={20} style={{ marginRight: 8 }} /> Lưu bài học
                </button>
            </form>
        </div>
    );
};

export default CreateLessonPage;
