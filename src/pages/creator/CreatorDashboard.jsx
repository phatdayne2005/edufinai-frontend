import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, Layout, BookOpen, BarChart2, Loader2, X, Edit2, Trash2, Send, FileText, Youtube, Plus, ChevronUp, ChevronDown, FileUp } from 'lucide-react';
import { getMyLessons, getCreatorStats, createLesson, deleteLesson, updateLesson, submitLesson } from '../../services/learningApi';
import { GlobalWorkerOptions, getDocument, version } from 'pdfjs-dist';

// Set worker source for PDF.js
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const lessonListRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for hidden file input
  const [stats, setStats] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [contentBlocks, setContentBlocks] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false); // Loading state for PDF extraction
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'BEGINNER',
    timeEstimate: 30
  });

  const fetchAllData = async () => {
    try {
      // setLoading(true); // Only for initial load or explicit refresh
      const [statsData, lessonsData] = await Promise.all([
        getCreatorStats(),
        getMyLessons()
      ]);
      setStats(statsData);
      setLessons(lessonsData);
    } catch (err) {
      console.error('Error fetching creator data:', err);
      setLessons([]);
      setStats({ totalLessons: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAllData();
  }, []);

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    try {
        if (isEditing) {
            const updated = await updateLesson(currentLesson.id, formData);
            setCurrentLesson(updated);
            alert('Cập nhật thông tin thành công!');
            setShowCreateModal(false);
            // Open content modal after edit info? Optional. User said "edit that lesson", so maybe let them choose.
            // For now, just close info modal. User can click Edit Content if they want.
        } else {
            const newLesson = await createLesson(formData);
            setCurrentLesson(newLesson);
            setContentBlocks([]); // New lesson has no content yet
            alert('Tạo bài học thành công! Hãy thêm nội dung chi tiết.');
            setShowCreateModal(false);
            setShowContentModal(true); // Switch to content modal
        }
        fetchAllData();
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
  };

  const handleSaveContent = async () => {
      try {
          const updatedLesson = { ...currentLesson, content: contentBlocks };
          await updateLesson(currentLesson.id, updatedLesson);
          alert('Lưu nội dung thành công!');
          setShowContentModal(false);
          setCurrentLesson(null);
          setContentBlocks([]);
          fetchAllData();
      } catch (err) {
          alert('Lỗi lưu nội dung: ' + err.message);
      }
  };

  const handleDelete = async (id) => {
      if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
      try {
          await deleteLesson(id);
          fetchAllData();
      } catch (err) {
          alert('Lỗi khi xóa: ' + err.message);
      }
  };

  const handleEdit = (lesson) => {
      setCurrentLesson(lesson);
      setFormData({
          title: lesson.title,
          description: lesson.description,
          difficulty: lesson.difficulty,
          timeEstimate: lesson.timeEstimate
      });
      setIsEditing(true);
      setShowCreateModal(true);
  };

  const handleEditContent = (lesson) => {
      setCurrentLesson(lesson);
      setContentBlocks(lesson.content || []);
      setShowContentModal(true);
  };

  const handleRequestReview = async (id) => {
      if (!window.confirm('Gửi bài học này để kiểm duyệt? Bạn sẽ không thể chỉnh sửa trong khi chờ duyệt.')) return;
      try {
          await submitLesson(id);
          alert('Đã gửi yêu cầu duyệt!');
          fetchAllData();
      } catch (err) {
          alert('Lỗi: ' + err.message);
      }
  };

  const closeModal = () => {
      setShowCreateModal(false);
      setShowStatsModal(false);
      setShowContentModal(false);
      setIsEditing(false);
      setCurrentLesson(null);
      setFormData({ title: '', description: '', difficulty: 'BEGINNER', timeEstimate: 30 });
  };

  const scrollToLessons = () => {
      if (lessonListRef.current) {
          lessonListRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  };

  // Content Block Handlers
  const addBlock = (type, initialData = '') => {
      const newBlock = {
          id: Date.now().toString(),
          type,
          data: initialData
      };
      setContentBlocks(prev => [...prev, newBlock]);
  };

  const updateBlockData = (id, data) => {
      setContentBlocks(contentBlocks.map(b => b.id === id ? { ...b, data } : b));
  };

  const removeBlock = (id) => {
      if (!window.confirm('Xóa block này?')) return;
      setContentBlocks(contentBlocks.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
      const newBlocks = [...contentBlocks];
      if (direction === 'up' && index > 0) {
          [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      } else if (direction === 'down' && index < newBlocks.length - 1) {
          [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      }
      setContentBlocks(newBlocks);
  };

  // PDF Extraction Handler
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Vui lòng chọn file PDF.');
      return;
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      let extractedText = '';
      
      // Iterate through all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += `--- Trang ${i} ---\n${pageText}\n\n`;
      }

      if (extractedText.trim()) {
        addBlock('text', extractedText);
        alert('Đã trích xuất văn bản từ PDF thành công!');
      } else {
        alert('Không tìm thấy văn bản trong file PDF này (có thể là ảnh scan).');
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      alert('Lỗi khi đọc file PDF: ' + error.message);
    } finally {
      setIsExtracting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: 'var(--surface-app)',
      padding: '32px',
      color: 'var(--text-primary)',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--text-muted)',
      marginBottom: '32px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'color 0.2s',
    },
    headerCard: {
      backgroundColor: 'var(--surface-card)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border-subtle)',
      padding: '32px',
      marginBottom: '32px',
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    },
    iconBox: {
      padding: '12px',
      backgroundColor: 'var(--color-primary-soft)',
      borderRadius: '12px',
      color: 'var(--color-primary)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--text-primary)',
      margin: 0,
    },
    subtitle: {
      color: 'var(--text-muted)',
      marginTop: '4px',
      fontSize: '14px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginTop: '32px',
    },
    card: {
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      backgroundColor: 'var(--surface-card)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      minHeight: '160px',
    },
    cardIcon: {
        marginBottom: '16px',
        color: 'var(--color-primary)',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: 'var(--text-primary)',
    },
    cardText: {
      color: 'var(--text-muted)',
      fontSize: '14px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '16px',
        color: 'var(--text-primary)',
    },
    lessonList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    lessonItem: {
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
    },
    lessonInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        minWidth: '200px',
    },
    lessonTitle: {
        fontWeight: '600',
        color: 'var(--text-primary)',
    },
    lessonMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: 'var(--text-muted)',
    },
    lessonStatus: {
        fontSize: '12px',
        fontWeight: '500',
        padding: '4px 8px',
        borderRadius: '99px',
        width: 'fit-content',
    },
    statusDraft: { backgroundColor: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-muted)' },
    statusPending: { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#F59E0B' },
    statusApproved: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' },
    statusRejected: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' },
    
    actions: {
        display: 'flex',
        gap: '8px',
    },
    iconBtn: {
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        transition: 'background 0.2s',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modalContent: {
        backgroundColor: 'var(--surface-card)',
        padding: '32px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        color: 'var(--text-primary)',
    },
    modalContentLarge: {
        backgroundColor: 'var(--surface-card)',
        padding: '32px',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '800px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        color: 'var(--text-primary)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '700',
        margin: 0,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
    },
    formGroup: {
        marginBottom: '16px',
    },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--surface-muted)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        marginTop: '8px',
        outline: 'none',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    submitButton: {
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '16px',
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
    },
    statLabel: {
        color: 'var(--text-secondary)',
        fontSize: '15px',
    },
    statValue: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: 'var(--text-primary)',
    },
    progressBarContainer: {
        height: '8px',
        backgroundColor: 'var(--surface-muted)',
        borderRadius: '99px',
        overflow: 'hidden',
        marginTop: '8px',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: 'var(--color-primary)',
        borderRadius: '99px',
    },
    // Content Editor Styles
    editorToolbar: {
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'var(--surface-muted)',
        borderRadius: '12px',
    },
    toolbarBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'var(--surface-card)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: 'var(--shadow-sm)',
    },
    editorBody: {
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
    },
    blockItem: {
        marginBottom: '24px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        backgroundColor: 'var(--surface-card)',
        position: 'relative',
    },
    blockControls: {
        position: 'absolute',
        right: '12px',
        top: '12px',
        display: 'flex',
        gap: '4px',
    },
    blockLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-muted)',
        marginBottom: '8px',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    textArea: {
        width: '100%',
        minHeight: '120px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--surface-muted)',
        color: 'var(--text-primary)',
        fontSize: '15px',
        lineHeight: '1.6',
        outline: 'none',
        resize: 'vertical',
    }
  };

  const getStatusStyle = (status) => {
      switch (status) {
          case 'DRAFT': return styles.statusDraft;
          case 'PENDING': return styles.statusPending;
          case 'APPROVED': return styles.statusApproved;
          case 'REJECTED': return styles.statusRejected;
          default: return styles.statusDraft;
      }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button 
          onClick={() => navigate('/')}
          style={styles.backButton}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={20} />
          Quay lại trang chủ
        </button>
        
        <div style={styles.headerCard}>
          <div style={styles.headerContent}>
            <div style={styles.iconBox}>
              <PenTool size={32} />
            </div>
            <div>
              <h1 style={styles.title}>Creator Dashboard</h1>
              <p style={styles.subtitle}>Quản lý nội dung và khóa học của bạn</p>
            </div>
          </div>
          
          <div style={styles.grid}>
            <div 
                style={styles.card}
                onClick={scrollToLessons}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
            >
                <div style={styles.cardIcon}><BookOpen size={32} /></div>
                <h3 style={styles.cardTitle}>{stats?.totalLessons || 0}</h3>
                <p style={styles.cardText}>Bài viết của tôi</p>
            </div>
            <div 
                style={styles.card}
                onClick={() => { setIsEditing(false); setShowCreateModal(true); }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
            >
                <div style={styles.cardIcon}><PenTool size={32} /></div>
                <h3 style={styles.cardTitle}>Tạo mới</h3>
                <p style={styles.cardText}>Soạn thảo bài học mới</p>
            </div>
            <div 
                style={styles.card}
                onClick={() => setShowStatsModal(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
            >
                <div style={styles.cardIcon}><BarChart2 size={32} /></div>
                <h3 style={styles.cardTitle}>Thống kê</h3>
                <p style={styles.cardText}>Lượt xem và tương tác</p>
            </div>
          </div>
        </div>

        <div ref={lessonListRef}>
            <h2 style={styles.sectionTitle}>Danh sách bài học</h2>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" />
                </div>
            ) : lessons.length > 0 ? (
                <div style={styles.lessonList}>
                    {lessons.map((lesson) => (
                        <div key={lesson.id} style={styles.lessonItem}>
                            <div style={styles.lessonInfo}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={styles.lessonTitle}>{lesson.title}</span>
                                    <span style={{...styles.lessonStatus, ...getStatusStyle(lesson.status)}}>{lesson.status}</span>
                                </div>
                                <div style={styles.lessonMeta}>
                                    <span>{new Date(lesson.updatedAt || lesson.createdAt).toLocaleDateString('vi-VN')}</span>
                                    <span>• {lesson.difficulty}</span>
                                    <span>• {lesson.timeEstimate} phút</span>
                                </div>
                                {lesson.status === 'REJECTED' && lesson.commentByMod && (
                                    <div style={{ fontSize: '13px', color: '#EF4444', marginTop: '4px' }}>
                                        Lý do từ chối: {lesson.commentByMod}
                                    </div>
                                )}
                            </div>
                            <div style={styles.actions}>
                                {lesson.status === 'DRAFT' || lesson.status === 'REJECTED' ? (
                                    <>
                                        <button 
                                            style={styles.iconBtn} 
                                            title="Soạn nội dung"
                                            onClick={() => handleEditContent(lesson)}
                                        >
                                            <FileText size={18} color="var(--color-primary)" />
                                        </button>
                                        <button 
                                            style={styles.iconBtn} 
                                            title="Gửi duyệt"
                                            onClick={() => handleRequestReview(lesson.id)}
                                        >
                                            <Send size={18} color="#10B981" />
                                        </button>
                                        <button 
                                            style={styles.iconBtn} 
                                            title="Chỉnh sửa thông tin"
                                            onClick={() => handleEdit(lesson)}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            style={styles.iconBtn} 
                                            title="Xóa"
                                            onClick={() => handleDelete(lesson.id)}
                                        >
                                            <Trash2 size={18} color="#EF4444" />
                                        </button>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        {lesson.status === 'PENDING' ? 'Đang chờ duyệt' : 'Đã xuất bản'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Chưa có bài học nào. Hãy tạo bài học đầu tiên!
                </div>
            )}
        </div>
      </div>

      {/* Create/Edit Info Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>{isEditing ? 'Cập nhật thông tin' : 'Tạo bài học mới'}</h2>
                    <button style={styles.closeButton} onClick={closeModal}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmitLesson}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Tiêu đề</label>
                        <input 
                            style={styles.input} 
                            type="text" 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                            placeholder="Nhập tiêu đề bài học..."
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Mô tả ngắn</label>
                        <textarea 
                            style={{...styles.input, minHeight: '100px', resize: 'vertical'}} 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Mô tả nội dung bài học..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label style={styles.label}>Độ khó</label>
                            <select 
                                style={styles.input}
                                value={formData.difficulty}
                                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                            >
                                <option value="BEGINNER">Cơ bản</option>
                                <option value="INTERMEDIATE">Trung bình</option>
                                <option value="ADVANCED">Nâng cao</option>
                            </select>
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                            <label style={styles.label}>Thời gian (phút)</label>
                            <input 
                                style={styles.input}
                                type="number"
                                value={formData.timeEstimate}
                                onChange={(e) => setFormData({...formData, timeEstimate: parseInt(e.target.value)})}
                                min="1"
                            />
                        </div>
                    </div>
                    <button type="submit" style={styles.submitButton}>
                        {isEditing ? 'Lưu thông tin' : 'Tạo & Soạn nội dung'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Content Editor Modal */}
      {showContentModal && (
        <div style={styles.modalOverlay} onClick={() => {
            if (window.confirm('Đóng mà không lưu?')) closeModal();
        }}>
            <div style={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <div>
                        <h2 style={styles.modalTitle}>Soạn thảo nội dung</h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                            {currentLesson?.title}
                        </p>
                    </div>
                    <button style={styles.closeButton} onClick={() => {
                        if (window.confirm('Đóng mà không lưu?')) closeModal();
                    }}>
                        <X size={24} />
                    </button>
                </div>
                
                <div style={styles.editorToolbar}>
                    <button style={styles.toolbarBtn} onClick={() => addBlock('text')}>
                        <FileText size={16} /> Thêm đoạn văn
                    </button>
                    <button style={styles.toolbarBtn} onClick={() => addBlock('video')}>
                        <Youtube size={16} /> Thêm Video YouTube
                    </button>
                    <button style={styles.toolbarBtn} onClick={() => fileInputRef.current?.click()} disabled={isExtracting}>
                        {isExtracting ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />} 
                        {isExtracting ? ' Đang đọc...' : ' Import PDF'}
                    </button>
                    {/* Hidden File Input */}
                    <input 
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                    />
                </div>

                <div style={styles.editorBody}>
                    {contentBlocks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            Chưa có nội dung. Hãy thêm các khối nội dung bên trên.
                        </div>
                    ) : (
                        contentBlocks.map((block, index) => (
                            <div key={block.id} style={styles.blockItem}>
                                <div style={styles.blockControls}>
                                    <button style={styles.iconBtn} onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                                        <ChevronUp size={16} />
                                    </button>
                                    <button style={styles.iconBtn} onClick={() => moveBlock(index, 'down')} disabled={index === contentBlocks.length - 1}>
                                        <ChevronDown size={16} />
                                    </button>
                                    <button style={styles.iconBtn} onClick={() => removeBlock(block.id)}>
                                        <Trash2 size={16} color="#EF4444" />
                                    </button>
                                </div>
                                
                                {block.type === 'text' && (
                                    <>
                                        <div style={styles.blockLabel}><FileText size={14} /> Văn bản</div>
                                        <textarea 
                                            style={styles.textArea}
                                            value={block.data}
                                            onChange={(e) => updateBlockData(block.id, e.target.value)}
                                            placeholder="Nhập nội dung bài học..."
                                        />
                                    </>
                                )}

                                {block.type === 'video' && (
                                    <>
                                        <div style={styles.blockLabel}><Youtube size={14} /> YouTube URL</div>
                                        <input 
                                            style={styles.input}
                                            type="text"
                                            value={block.data}
                                            onChange={(e) => updateBlockData(block.id, e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                        />
                                        {block.data && (
                                            <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
                                                {/* Preview placeholder */}
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#fff', fontSize: '13px' }}>
                                                    Video Preview: {block.data}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
                    <button style={styles.submitButton} onClick={handleSaveContent}>
                        Lưu tất cả nội dung
                    </button>
                </div>
            </div>
        </div>
      )}

      {showStatsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStatsModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Thống kê chi tiết</h2>
                    <button style={styles.closeButton} onClick={() => setShowStatsModal(false)}>
                        <X size={24} />
                    </button>
                </div>
                
                <div style={styles.statRow}>
                    <span style={styles.statLabel}>Tổng lượt xem</span>
                    <span style={styles.statValue}>{stats?.totalViews?.toLocaleString() || '1,250'}</span>
                </div>
                <div style={styles.statRow}>
                    <span style={styles.statLabel}>Đánh giá trung bình</span>
                    <span style={styles.statValue}>{stats?.avgRating || '4.5'} / 5.0</span>
                </div>
                <div style={styles.statRow}>
                    <span style={styles.statLabel}>Bài học đã xuất bản</span>
                    <span style={styles.statValue}>{stats?.approvedLessons || 0}</span>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>Top bài học quan tâm</h3>
                    
                    {[
                        { title: 'Nhập môn Tài chính', views: 540, percent: '80%' },
                        { title: 'Đầu tư Chứng khoán', views: 320, percent: '50%' },
                        { title: 'Quản lý chi tiêu', views: 150, percent: '25%' }
                    ].map((item, index) => (
                        <div key={index} style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                <span>{item.title}</span>
                                <span>{item.views} views</span>
                            </div>
                            <div style={styles.progressBarContainer}>
                                <div style={{ ...styles.progressBarFill, width: item.percent }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
