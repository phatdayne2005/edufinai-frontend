import React, { useEffect, useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { learningService } from '../../services/learningService';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/appStyles';
import Header from '../../components/layout/Header';

const ModeratorDashboard = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');

    useEffect(() => {
        const fetchLessons = async () => {
            const token = getToken();
            if (!token) return;
            setLoading(true);
            try {
                const data = await learningService.getModerationLessons(token, statusFilter);
                setLessons(data || []);
            } catch (error) {
                console.error('Error fetching lessons:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLessons();
    }, [getToken, statusFilter]);

    const handleDecision = async (id, status) => {
        const token = getToken();
        const comment = prompt('Nhập lý do/nhận xét (tùy chọn):');

        try {
            await learningService.moderateLesson(token, id, {
                status: status,
                commentByMod: comment || ''
            });
            setLessons(lessons.filter(l => l.id !== id));
            alert(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} bài học.`);
        } catch (error) {
            console.error('Error moderating:', error);
            alert('Có lỗi xảy ra.');
        }
    };

    return (
        <div style={styles.page}>
            <Header title="Moderator Dashboard" subtitle="Duyệt bài học" />

            {/* Tabs for filtering */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: statusFilter === status ? 'none' : '1px solid #E0E0E0',
                            background: statusFilter === status ? '#4CAF50' : '#fff',
                            color: statusFilter === status ? '#fff' : '#666',
                            cursor: 'pointer',
                            fontWeight: statusFilter === status ? 600 : 400,
                            fontSize: 14
                        }}
                    >
                        {status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : 'Bị từ chối'}
                    </button>
                ))}
            </div>

            <div style={styles.section}>
                {loading ? <p>Đang tải...</p> : (
                    lessons.length === 0 ? <p>Không có bài học nào.</p> : (
                        lessons.map(lesson => (
                            <div key={lesson.id} style={styles.lessonCard}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={styles.lessonTitle}>{lesson.title}</h4>
                                    <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                                        Tạo bởi: {lesson.creatorId}
                                    </p>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => navigate(`/learning/lesson/${lesson.id}`)}
                                            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #666', background: '#fff', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                            <Eye size={14} /> Xem
                                        </button>
                                        {statusFilter === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleDecision(lesson.id, 'APPROVED')}
                                                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #4CAF50', background: '#fff', color: '#4CAF50', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <Check size={14} /> Duyệt
                                                </button>
                                                <button
                                                    onClick={() => handleDecision(lesson.id, 'REJECTED')}
                                                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #F44336', background: '#fff', color: '#F44336', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <X size={14} /> Từ chối
                                                </button>
                                            </>
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

export default ModeratorDashboard;
