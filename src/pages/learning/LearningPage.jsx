import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Award, Filter, DollarSign, TrendingUp, PiggyBank, CreditCard, FileText, HelpCircle, Tag, Circle, AlertCircle, AlertTriangle, BookOpen, Clock, Check } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { learningService } from '../../services/learningService';
import { styles } from '../../styles/appStyles';

const getBadge = (difficulty) => {
  return <BookOpen size={24} color="#4CAF50" />;
};

const getDifficultyStyle = (difficulty) => {
  switch (difficulty) {
    case 'BASIC':
      return {
        bg: '#E8F5E9',
        color: '#2E7D32',
        icon: <Circle size={14} fill="#2E7D32" color="#2E7D32" />,
        text: 'Cơ bản'
      };
    case 'INTERMEDIATE':
      return {
        bg: '#FFF3E0',
        color: '#EF6C00',
        icon: <AlertCircle size={14} color="#EF6C00" />,
        text: 'Trung bình'
      };
    case 'ADVANCED':
      return {
        bg: '#FFEBEE',
        color: '#C62828',
        icon: <AlertTriangle size={14} color="#C62828" />,
        text: 'Nâng cao'
      };
    default:
      return {
        bg: '#F5F5F5',
        color: '#666',
        icon: <Circle size={14} color="#666" />,
        text: difficulty
      };
  }
};

const getTagIcon = (tag) => {
  switch (tag) {
    case 'BUDGETING': return <FileText size={14} />;
    case 'INVESTING': return <TrendingUp size={14} />;
    case 'SAVING': return <PiggyBank size={14} />;
    case 'DEBT': return <CreditCard size={14} />;
    case 'TAX': return <DollarSign size={14} />;
    default: return <HelpCircle size={14} />;
  }
};

const getEnrollmentStatus = (enrollment) => {
  if (enrollment && (enrollment.status === 'COMPLETED' || enrollment.progressPercent === 100)) {
    return { text: 'Đã hoàn thành', color: '#4CAF50', bgColor: '#E8F5E9' };
  }

  if (enrollment && enrollment.progressPercent > 0) {
    return { text: 'Đang làm', color: '#FF9800', bgColor: '#FFF3E0' };
  }

  // Gộp cả chưa đăng ký và chưa bắt đầu (progress = 0)
  return { text: 'Chưa bắt đầu', color: '#F44336', bgColor: '#FFEBEE' };
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

const LearningPage = () => {
  const [lessons, setLessons] = useState([]);
  const [learnerProfile, setLearnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [showFilter, setShowFilter] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const TAGS = ['BUDGETING', 'INVESTING', 'SAVING', 'DEBT', 'TAX'];
  const DIFFICULTIES = ['ALL', 'BASIC', 'INTERMEDIATE', 'ADVANCED'];

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching learning data...');

        // Fetch learner profile to show points and level
        const profile = await learningService.getLearnerProfile(token).catch(() => null);
        setLearnerProfile(profile);

        // Fetch all lessons
        let lessonsData = await learningService.getAllLessons(token);

        // Filter to show only APPROVED lessons for learners
        lessonsData = lessonsData.filter(l => l.status === 'APPROVED');

        // Apply tag filter (client-side for multi-select)
        if (selectedTags.length > 0 && selectedTags.length < TAGS.length) {
          lessonsData = lessonsData.filter(lesson =>
            lesson.tags && lesson.tags.some(tag => selectedTags.includes(tag))
          );
        }

        // Apply difficulty filter
        if (filterDifficulty !== 'ALL') {
          lessonsData = lessonsData.filter(l => l.difficulty === filterDifficulty);
        }

        // Fetch enrollments and merge with lessons
        const enrollmentsData = await learningService.getMyEnrollments(token).catch(() => []);

        console.log('Lessons fetched:', lessonsData);
        console.log('Enrollments fetched:', enrollmentsData);

        const merged = (lessonsData || []).map((lesson) => {
          const enrollment = (enrollmentsData || []).find((e) => e.lessonId === lesson.id);

          // Count questions
          let questionCount = 0;
          if (lesson.quizJson) {
            try {
              const quizData = typeof lesson.quizJson === 'string'
                ? JSON.parse(lesson.quizJson)
                : lesson.quizJson;
              questionCount = quizData.questions?.length || 0;
            } catch (e) {
              console.error('Failed to parse quiz:', e);
            }
          }

          return {
            ...lesson,
            enrollment,
            questionCount,
            badge: getBadge(lesson.difficulty),
          };
        });
        setLessons(merged);
      } catch (error) {
        console.error('Failed to fetch learning data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken, selectedTags, filterDifficulty]);

  return (
    <div style={styles.page}>
      <Header title="Học tập" subtitle="Nâng cao kiến thức tài chính" />

      {/* Learner Stats Card */}
      {learnerProfile && (
        <div style={{
          ...styles.progressCard,
          border: '1px solid #E0E0E0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <p style={styles.progressLabel}>Hồ sơ học viên</p>
          <div style={styles.progressStats}>
            <div>
              <h3 style={styles.progressNumber}>{learnerProfile.level || 'BEGINNER'}</h3>
              <p style={styles.progressText}>Cấp độ</p>
            </div>
            <div>
              <h3 style={styles.progressNumber}>{learnerProfile.totalPointsLearning || 0}</h3>
              <p style={styles.progressText}>Điểm tích lũy</p>
            </div>
            <div>
              <h3 style={styles.progressNumber}>
                {lessons.filter(l => l.enrollment?.status === 'COMPLETED').length}
              </h3>
              <p style={styles.progressText}>Bài hoàn thành</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Card */}
      <div style={styles.progressCard}>
        <p style={styles.progressLabel}>Tiến độ tổng thể</p>
        <div style={styles.progressStats}>
          <div>
            <h3 style={styles.progressNumber}>
              {lessons.filter(l => l.enrollment?.status === 'COMPLETED').length}/{lessons.length}
            </h3>
            <p style={styles.progressText}>Bài hoàn thành</p>
          </div>
          <div>
            <h3 style={styles.progressNumber}>
              {lessons.filter(l => l.enrollment && l.enrollment.progressPercent > 0 && l.enrollment.status !== 'COMPLETED').length}
            </h3>
            <p style={styles.progressText}>Đang học</p>
          </div>
          <div>
            <h3 style={styles.progressNumber}>
              {lessons.filter(l => !l.enrollment || (l.enrollment && l.enrollment.progressPercent === 0)).length}
            </h3>
            <p style={styles.progressText}>Chưa bắt đầu</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
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
            Lọc bài học
            {(selectedTags.length > 0 || filterDifficulty !== 'ALL') && (
              <span style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {selectedTags.length > 0 && filterDifficulty !== 'ALL'
                  ? selectedTags.length + 1
                  : selectedTags.length > 0
                    ? selectedTags.length
                    : 1}
              </span>
            )}
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
            {/* Tag Filter */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Chủ đề: {selectedTags.length === 0 ? '(Tất cả)' : `(${selectedTags.length} được chọn)`}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* ALL Button */}
                <button
                  onClick={() => {
                    setSelectedTags([]);
                    setFilterDifficulty('ALL');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: selectedTags.length === 0 ? '2px solid #4CAF50' : '1px solid var(--border-subtle)',
                    background: selectedTags.length === 0 ? 'rgba(76, 175, 80, 0.1)' : 'var(--bg-primary)',
                    color: selectedTags.length === 0 ? '#4CAF50' : 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: selectedTags.length === 0 ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  Tất cả
                </button>

                {TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  const tagColor = getTagColor(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        let newSelectedTags;
                        if (isSelected) {
                          // Deselect tag
                          newSelectedTags = selectedTags.filter(t => t !== tag);
                        } else {
                          // Select tag
                          newSelectedTags = [...selectedTags, tag];
                          // Auto-switch to ALL if all tags selected
                          if (newSelectedTags.length === TAGS.length) {
                            newSelectedTags = [];
                          }
                        }
                        setSelectedTags(newSelectedTags);
                        setFilterDifficulty('ALL');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: isSelected ? `2px solid ${tagColor.color}` : '1px solid var(--border-subtle)',
                        background: isSelected ? tagColor.bg : 'var(--bg-primary)',
                        color: isSelected ? tagColor.color : 'var(--text-secondary)',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: isSelected ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {getTagIcon(tag)}
                      {tag}
                      {isSelected && (
                        <Check size={12} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Độ khó:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff}
                    onClick={() => {
                      setFilterDifficulty(diff);
                      setSelectedTags([]);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: filterDifficulty === diff ? '2px solid #2196F3' : '1px solid var(--border-subtle)',
                      background: filterDifficulty === diff ? 'rgba(33, 150, 243, 0.1)' : 'var(--bg-primary)',
                      color: filterDifficulty === diff ? '#2196F3' : 'var(--text-secondary)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontWeight: filterDifficulty === diff ? 600 : 400
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Khóa học
          {selectedTags.length > 0 && ` (${selectedTags.map(t => t).join(', ')})`}
          {filterDifficulty !== 'ALL' && ` (${filterDifficulty})`}
        </h3>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Đang tải...</p>
        ) : lessons.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Chưa có bài học nào{selectedTags.length > 0 && ' với chủ đề đã chọn'}.
          </p>
        ) : (
          lessons.map((lesson) => {
            const status = getEnrollmentStatus(lesson.enrollment);
            const difficultyInfo = getDifficultyStyle(lesson.difficulty);

            return (
              <div
                key={lesson.id}
                style={styles.lessonCard}
                onClick={() => navigate(`/learning/lesson/${lesson.slug}`)}
              >
                <div style={styles.lessonBadge}>{lesson.badge}</div>
                <div style={styles.lessonContent}>
                  <h4 style={styles.lessonTitle}>{lesson.title}</h4>

                  {/* Description */}
                  {lesson.description && (
                    <p style={{
                      fontSize: 13,
                      color: '#666',
                      marginBottom: 8,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {lesson.description}
                    </p>
                  )}

                  {/* Meta info */}
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Difficulty Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: difficultyInfo.bg,
                      color: difficultyInfo.color,
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {difficultyInfo.icon}
                      {difficultyInfo.text}
                    </div>

                    {lesson.tags && lesson.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Tag size={14} />
                          {lesson.tags.map(tag => {
                            const tagStyle = getTagColor(tag);
                            return (
                              <span key={tag} style={{
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
                      </>
                    )}
                    <span>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} />
                      <span>{lesson.durationMinutes} phút</span>
                    </div>
                    <span>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HelpCircle size={14} />
                      <span>{lesson.questionCount} câu hỏi</span>
                    </div>
                  </div>

                  {/* Enrollment status */}
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 12,
                    backgroundColor: status.bgColor,
                    color: status.color,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8
                  }}>
                    {status.text}
                    {lesson.enrollment?.score && ` • ${lesson.enrollment.score} điểm`}
                  </div>

                  {/* Progress bar */}
                  {lesson.enrollment && (
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${lesson.enrollment.progressPercent || 0}%`,
                          backgroundColor: status.color
                        }}
                      />
                    </div>
                  )}
                </div>
                <ChevronRight size={24} color="#666" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LearningPage;
