import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import Header from '../../components/layout/Header';

const CreatorDashboard = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyLessons = async () => {
            const token = getToken();
            if (!token) return;
            try {
                // In a real app, we might have an API to get ONLY my created lessons
                // For now, we fetch all and filter (assuming we can identify ownership, or just show all)
                // The API doc says "Get My Profile (Creator)" but not "Get My Lessons".
                // We'll assume getAllLessons returns everything and we filter by creatorId if possible.
                // Or just show all for demo.
                const allLessons = await learningService.getAllLessons(token);

                // Fetch creator profile to get ID
                const creatorProfile = await learningService.getCreatorProfile(token).catch(() => null);

                if (creatorProfile) {
                    const myLessons = allLessons.filter(l => l.creatorId === creatorProfile.id);
                    setLessons(myLessons);
                } else {
                    // Fallback if not a creator or API fails
                    setLessons(allLessons);
                }
            } catch (error) {
                console.error('Error fetching lessons:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyLessons();
    }, [getToken]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return;
        const token = getToken();
        try {
            await learningService.deleteLesson(token, id);
            setLessons(lessons.filter(l => l.id !== id));
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Không thể xóa bài học.');
        }
    };

    return (
        <div style={styles.page}>
            <Header title="Creator Dashboard" subtitle="Quản lý bài học của bạn" />

            <button
                onClick={() => navigate('/creator/lesson/new')}
                style={styles.addButton}
            >
                <Plus size={20} /> Tạo bài học mới
            </button>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Danh sách bài học</h3>
                {loading ? <p>Đang tải...</p> : (
                    lessons.length === 0 ? <p>Bạn chưa tạo bài học nào.</p> : (
                        lessons.map(lesson => (
                            <div key={lesson.id} style={{ ...styles.lessonCard, display: 'block' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h4 style={{ ...styles.lessonTitle, margin: 0 }}>{lesson.title}</h4>
                                    <span style={{
                                        fontSize: 12,
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        backgroundColor: lesson.status === 'APPROVED' ? '#E8F5E9' : '#FFF3E0',
                                        color: lesson.status === 'APPROVED' ? '#2E7D32' : '#EF6C00'
                                    }}>
                                        {lesson.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{lesson.description}</p>

                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => navigate(`/creator/lesson/edit/${lesson.id}`)}
                                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #2196F3', background: '#fff', color: '#2196F3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <Edit size={14} /> Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lesson.id)}
                                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #F44336', background: '#fff', color: '#F44336', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <Trash2 size={14} /> Xóa
                                    </button>
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
