import React from 'react';
import { ChevronRight, Award } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/appStyles';

const LearningPage = () => {
  const { lessons } = useApp();

  return (
    <div style={styles.page}>
      <Header title="Học tập" subtitle="Nâng cao kiến thức tài chính" />

      <div style={styles.progressCard}>
        <p style={styles.progressLabel}>Tiến độ tổng thể</p>
        <div style={styles.progressStats}>
          <div>
            <h3 style={styles.progressNumber}>2/3</h3>
            <p style={styles.progressText}>Bài hoàn thành</p>
          </div>
          <div>
            <h3 style={styles.progressNumber}>13/18</h3>
            <p style={styles.progressText}>Quiz đã làm</p>
          </div>
          <div>
            <h3 style={styles.progressNumber}>2</h3>
            <p style={styles.progressText}>Badge đạt được</p>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Khóa học</h3>
        {lessons.map((lesson) => (
          <div key={lesson.id} style={styles.lessonCard}>
            <div style={styles.lessonBadge}>{lesson.badge}</div>
            <div style={styles.lessonContent}>
              <h4 style={styles.lessonTitle}>{lesson.title}</h4>
              <p style={styles.lessonProgress}>
                {lesson.progress}/{lesson.total} bài học
              </p>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${(lesson.progress / lesson.total) * 100}%`,
                  }}
                />
              </div>
            </div>
            <ChevronRight size={24} color="#666" />
          </div>
        ))}
      </div>

      <div style={styles.quizCard}>
        <Award size={32} color="#FFD700" />
        <div>
          <h4 style={styles.quizTitle}>Quiz hàng ngày</h4>
          <p style={styles.quizText}>Trả lời 5 câu hỏi để nhận 100 điểm!</p>
        </div>
        <button type="button" style={styles.quizButton}>
          Bắt đầu
        </button>
      </div>
    </div>
  );
};

export default LearningPage;

