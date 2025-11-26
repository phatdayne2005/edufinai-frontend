import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Edit2,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createChallenge,
  deleteChallenge,
  getChallenges,
  resubmitChallenge,
  updateChallenge,
  getAllBadges,
} from '../../services/gamificationApi';

const statusStyles = {
  PENDING: { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#B45309' },
  APPROVED: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#047857' },
  REJECTED: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#B91C1C' },
};

const typeLabels = {
  QUIZ: 'Quiz',
  EXPENSE: 'Chi tiêu',
  GOAL: 'Mục tiêu',
  SCENARIO: 'Kịch bản',
  STREAK: 'Chuỗi ngày',
  CUSTOM: 'Tùy chỉnh',
};

const scopeLabels = {
  DAILY: 'Hằng ngày',
  WEEKLY: 'Hằng tuần',
  MONTHLY: 'Hằng tháng',
  SEASONAL: 'Theo mùa',
  ONEOFF: 'Một lần',
  ALLTIME: 'Xuyên suốt',
};

const createDefaultForm = () => ({
  title: '',
  description: '',
  type: 'QUIZ',
  scope: 'DAILY',
  targetValue: '1',
  rewardScore: '0',
  rewardBadgeCode: '',
  startAt: '',
  endAt: '',
  maxProgressPerDay: '',
  active: true,
  ruleConfig: {
    eventType: 'QUIZ',
    action: 'COMPLETE',
    minAccuracy: '',
    maxAccuracy: '',
    minScore: '',
    maxScore: '',
    maxProgressPerDay: '1',
  },
});

const parseRule = (rule) => {
  if (!rule) return {};
  if (typeof rule === 'object') return rule;
  try {
    return JSON.parse(rule);
  } catch (err) {
    console.warn('Could not parse challenge rule', err);
    return {};
  }
};

const extractChallengeId = (challenge) => challenge?.id || challenge?.challengeId;

const extractCreatorId = (challenge) =>
  challenge?.createdById ||
  challenge?.creatorId ||
  challenge?.creator?.id ||
  challenge?.createdBy?.id ||
  challenge?.createdByUserId ||
  challenge?.creator?.userId;

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
};

const formatDateRange = (start, end) => {
  if (!start && !end) return 'Không giới hạn thời gian';
  const format = (value) =>
    value ? new Date(value).toLocaleString('vi-VN', { hour12: false }) : 'Không xác định';
  return `${format(start)} → ${format(end)}`;
};

const CreatorChallengeManager = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(createDefaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilter, setShowFilter] = useState(false);
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getChallenges();
      const normalized = Array.isArray(data) ? data : data?.result || [];
      setChallenges(normalized);
    } catch (err) {
      console.error('Failed to load challenges', err);
      setError(err.message || 'Không thể tải danh sách thử thách');
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setBadgesLoading(true);
      const data = await getAllBadges();
      const normalized = Array.isArray(data) ? data : data?.result || [];
      setBadges(normalized);
    } catch (err) {
      console.error('Failed to load badges', err);
      setBadges([]);
    } finally {
      setBadgesLoading(false);
    }
  };

  const myChallenges = useMemo(() => {
    let filtered = challenges;
    
    // Filter by creator
    if (user?.id) {
      const own = challenges.filter((challenge) => {
        const creatorId = extractCreatorId(challenge);
        return !creatorId || creatorId === user.id;
      });
      filtered = own.length > 0 ? own : challenges;
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((challenge) => {
        const status = (challenge.approvalStatus || (challenge.active ? 'APPROVED' : 'PENDING')).toUpperCase();
        return status === statusFilter;
      });
    }

    return filtered;
  }, [challenges, user?.id, statusFilter]);

  const resetForm = () => {
    setFormState(createDefaultForm());
    setEditingChallenge(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (challenge) => {
    const parsedRule = parseRule(challenge.rule);
    setFormState({
      title: challenge.title || '',
      description: challenge.description || '',
      type: challenge.type || 'QUIZ',
      scope: challenge.scope || 'DAILY',
      targetValue: String(challenge.targetValue ?? parsedRule.count ?? ''),
      rewardScore: String(challenge.rewardScore ?? 0),
      rewardBadgeCode: challenge.rewardBadgeCode || '',
      startAt: toInputDateTime(challenge.startAt),
      endAt: toInputDateTime(challenge.endAt),
      maxProgressPerDay: String(challenge.maxProgressPerDay ?? ''),
      active: challenge.active ?? true,
      ruleConfig: {
        eventType: parsedRule.eventType || 'QUIZ',
        action: parsedRule.action || 'COMPLETE',
        minAccuracy: parsedRule.minAccuracy !== undefined ? String(parsedRule.minAccuracy) : '',
        maxAccuracy: parsedRule.maxAccuracy !== undefined ? String(parsedRule.maxAccuracy) : '',
        minScore: parsedRule.minScore !== undefined ? String(parsedRule.minScore) : '',
        maxScore: parsedRule.maxScore !== undefined ? String(parsedRule.maxScore) : '',
        maxProgressPerDay: String(parsedRule.maxProgressPerDay ?? challenge.maxProgressPerDay ?? ''),
      },
    });
    setEditingChallenge(challenge);
    setModalOpen(true);
  };

  const sanitizeNumber = (value) => {
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  };

  const buildPayload = () => {
    const rulePayload = {
      eventType: formState.ruleConfig.eventType,
      action: formState.ruleConfig.action,
    };

    // minAccuracy và maxAccuracy (khuyến nghị cho QUIZ)
    const accuracyFields = ['minAccuracy', 'maxAccuracy'];
    accuracyFields.forEach((field) => {
      const value = formState.ruleConfig[field];
      if (value !== '' && value !== undefined && value !== null) {
        const num = sanitizeNumber(value);
        if (num !== undefined) {
          rulePayload[field] = num;
        }
      }
    });

    // minScore và maxScore (backward compatibility, không khuyến nghị)
    const scoreFields = ['minScore', 'maxScore'];
    scoreFields.forEach((field) => {
      const value = formState.ruleConfig[field];
      if (value !== '' && value !== undefined && value !== null) {
        const num = sanitizeNumber(value);
        if (num !== undefined) {
          rulePayload[field] = num;
        }
      }
    });

    // maxProgressPerDay (có thể ở rule hoặc challenge level)
    if (formState.ruleConfig.maxProgressPerDay !== '' && formState.ruleConfig.maxProgressPerDay !== undefined && formState.ruleConfig.maxProgressPerDay !== null) {
      const num = sanitizeNumber(formState.ruleConfig.maxProgressPerDay);
      if (num !== undefined) {
        rulePayload.maxProgressPerDay = num;
      }
    }

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      type: formState.type,
      scope: formState.scope,
      targetValue: sanitizeNumber(formState.targetValue),
      startAt: formState.startAt ? new Date(formState.startAt).toISOString() : null,
      endAt: formState.endAt ? new Date(formState.endAt).toISOString() : null,
      active: formState.active,
      rewardScore: sanitizeNumber(formState.rewardScore) ?? 0,
      rewardBadgeCode: formState.rewardBadgeCode?.trim() || null,
      maxProgressPerDay: sanitizeNumber(formState.maxProgressPerDay),
      rule: JSON.stringify(rulePayload),
    };

    if (!payload.targetValue) {
      delete payload.targetValue;
    }
    if (!payload.maxProgressPerDay) {
      delete payload.maxProgressPerDay;
    }
    if (!payload.rewardBadgeCode) {
      delete payload.rewardBadgeCode;
    }
    if (!payload.startAt) {
      delete payload.startAt;
    }
    if (!payload.endAt) {
      delete payload.endAt;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const payload = buildPayload();
      if (!payload.title || !payload.description) {
        alert('Vui lòng nhập đầy đủ tiêu đề và mô tả');
        return;
      }
      if (editingChallenge) {
        const challengeId = extractChallengeId(editingChallenge);
        await updateChallenge(challengeId, payload);
        alert('Đã cập nhật thử thách');
      } else {
        await createChallenge(payload);
        alert('Đã tạo thử thách mới và gửi duyệt');
      }
      closeModal();
      fetchChallenges();
    } catch (err) {
      console.error('Failed to submit challenge', err);
      alert(err.message || 'Không thể lưu thử thách');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (challenge) => {
    const challengeId = extractChallengeId(challenge);
    if (!challengeId) return;
    if (!window.confirm('Xóa thử thách này? Hành động không thể hoàn tác.')) {
      return;
    }
    try {
      await deleteChallenge(challengeId);
      alert('Đã xóa thử thách');
      fetchChallenges();
    } catch (err) {
      console.error('Failed to delete challenge', err);
      alert(err.message || 'Không thể xóa thử thách');
    }
  };

  const handleResubmit = async (challenge) => {
    const challengeId = extractChallengeId(challenge);
    if (!challengeId) return;
    if (!window.confirm('Gửi thử thách này để duyệt lại?')) {
      return;
    }
    try {
      await resubmitChallenge(challengeId);
      alert('Đã gửi lại thử thách để duyệt');
      fetchChallenges();
    } catch (err) {
      console.error('Failed to resubmit challenge', err);
      alert(err.message || 'Không thể gửi lại thử thách');
    }
  };

  const renderStatusPill = (status) => {
    const normalized = (status || '').toUpperCase();
    const style = statusStyles[normalized] || statusStyles.PENDING;
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          ...style,
        }}
      >
        {normalized || 'PENDING'}
      </span>
    );
  };

  return (
    <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Thử thách của tôi</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Theo dõi trạng thái và gửi duyệt các thử thách tùy chỉnh
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchChallenges}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-muted)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <button
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundImage: 'var(--gradient-brand)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Tạo thử thách
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Status Filter */}
      <div style={{ marginTop: '20px', marginBottom: '16px' }}>
        <button
          onClick={() => setShowFilter(!showFilter)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <Filter size={18} />
          Lọc theo trạng thái
        </button>

        {showFilter && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', marginTop: 0 }}>
              Trạng thái:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {STATUS_FILTERS.map((status) => {
                const isActive = statusFilter === status;
                const statusStyle = statusStyles[status] || { backgroundColor: 'rgba(156, 163, 175, 0.15)', color: '#6B7280' };
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      border: isActive ? `2px solid ${statusStyle.color}` : '1px solid var(--border-subtle)',
                      background: isActive ? statusStyle.backgroundColor : 'var(--bg-primary)',
                      color: isActive ? statusStyle.color : 'var(--text-secondary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {status === 'APPROVED' && <CheckCircle2 size={14} />}
                    {status === 'REJECTED' && <AlertCircle size={14} />}
                    {status === 'PENDING' && <Loader2 size={14} />}
                    {status}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0 }}>
              Hiển thị: {myChallenges.length} thử thách
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={28} />
          <p>Đang tải danh sách thử thách...</p>
        </div>
      ) : myChallenges.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Chưa có thử thách nào được tạo.</p>
        </div>
      ) : (
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {myChallenges.map((challenge) => {
            const challengeId = extractChallengeId(challenge);
            const status = (challenge.approvalStatus || (challenge.active ? 'APPROVED' : 'PENDING')).toUpperCase();
            const note = challenge.approvalNote || challenge.latestApprovalNote || challenge.note;
            const rule = parseRule(challenge.rule);
            const target = challenge.targetValue ?? rule.count;
            return (
              <div key={challengeId} style={{ border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px', backgroundColor: 'var(--surface-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{challenge.title}</p>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {typeLabels[challenge.type] || challenge.type} • {scopeLabels[challenge.scope] || challenge.scope}
                    </span>
                  </div>
                  {renderStatusPill(status)}
                </div>

                <p style={{ margin: '12px 0', color: 'var(--text-secondary)', fontSize: '14px', minHeight: '40px' }}>
                  {challenge.description || 'Không có mô tả'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarDays size={14} />
                    {formatDateRange(challenge.startAt, challenge.endAt)}
                  </div>
                  <div>
                    🎯 Mục tiêu: {target || 'N/A'} • 🎁 {challenge.rewardScore || 0} điểm
                  </div>
                  {rule.eventType && (
                    <div>
                      ⚙️ Rule: {rule.eventType}/{rule.action} • mỗi ngày tối đa {rule.maxProgressPerDay || challenge.maxProgressPerDay || '∞'}
                    </div>
                  )}
                  {note && (
                    <div style={{ color: '#B45309' }}>
                      📝 Ghi chú: {note}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', color: status === 'APPROVED' ? '#059669' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {status === 'APPROVED' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {status === 'APPROVED' ? 'Đang hoạt động' : 'Chờ duyệt'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(status === 'PENDING' || status === 'REJECTED') && (
                      <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                        title="Chỉnh sửa"
                        onClick={() => openEditModal(challenge)}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {status === 'REJECTED' && (
                      <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: '#F97316' }}
                        title="Gửi duyệt lại"
                        onClick={() => handleResubmit(challenge)}
                      >
                        <Repeat size={16} />
                      </button>
                    )}
                    <button
                      style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: '#EF4444' }}
                      title="Xóa"
                      onClick={() => handleDelete(challenge)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '16px',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '95vh',
              overflowY: 'auto',
              backgroundColor: 'var(--surface-card)',
              borderRadius: '24px',
              padding: '28px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0 }}>{editingChallenge ? 'Chỉnh sửa thử thách' : 'Tạo thử thách mới'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Tiêu đề</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Mô tả</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Loại</label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  >
                    {Object.keys(typeLabels).map((key) => (
                      <option key={key} value={key}>
                        {typeLabels[key]}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Phạm vi</label>
                  <select
                    value={formState.scope}
                    onChange={(e) => setFormState((prev) => ({ ...prev, scope: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  >
                    {Object.keys(scopeLabels).map((key) => (
                      <option key={key} value={key}>
                        {scopeLabels[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Mục tiêu</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.targetValue}
                    onChange={(e) => setFormState((prev) => ({ ...prev, targetValue: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Điểm thưởng</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.rewardScore}
                    onChange={(e) => setFormState((prev) => ({ ...prev, rewardScore: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Badge (tùy chọn)</label>
                  <select
                    value={formState.rewardBadgeCode || ''}
                    onChange={(e) => setFormState((prev) => ({ ...prev, rewardBadgeCode: e.target.value || '' }))}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-subtle)', 
                      marginTop: '4px',
                      backgroundColor: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    disabled={badgesLoading}
                  >
                    <option value="">Không</option>
                    {badges.map((badge) => (
                      <option key={badge.id || badge.code} value={badge.code}>
                        {badge.name || badge.code} {badge.type ? `(${badge.type})` : ''}
                      </option>
                    ))}
                  </select>
                  {badgesLoading && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0 0' }}>
                      Đang tải danh sách badge...
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Giới hạn tiến độ/ngày (Challenge)</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.maxProgressPerDay}
                    onChange={(e) => setFormState((prev) => ({ ...prev, maxProgressPerDay: e.target.value }))}
                    placeholder="Để trống nếu không giới hạn"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formState.startAt}
                    onChange={(e) => setFormState((prev) => ({ ...prev, startAt: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formState.endAt}
                    onChange={(e) => setFormState((prev) => ({ ...prev, endAt: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '8px', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Rule xử lý sự kiện</p>
                <p style={{ margin: '4px 0 12px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Lưu ý: Mục tiêu (target) được lấy từ trường "Mục tiêu" ở trên, không lấy từ rule. Rule chỉ chứa điều kiện filter event.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Event Type</label>
                    <input
                      type="text"
                      value={formState.ruleConfig.eventType}
                      onChange={(e) => setFormState((prev) => ({ ...prev, ruleConfig: { ...prev.ruleConfig, eventType: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Action</label>
                    <input
                      type="text"
                      value={formState.ruleConfig.action}
                      onChange={(e) => setFormState((prev) => ({ ...prev, ruleConfig: { ...prev.ruleConfig, action: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Max/Ngày</label>
                    <input
                      type="number"
                      min="1"
                      value={formState.ruleConfig.maxProgressPerDay}
                      onChange={(e) => setFormState((prev) => ({ ...prev, ruleConfig: { ...prev.ruleConfig, maxProgressPerDay: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
                    ✅ Khuyến nghị cho QUIZ: Sử dụng Accuracy (%)
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Min Accuracy (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formState.ruleConfig.minAccuracy}
                        onChange={(e) => setFormState((prev) => ({ ...prev, ruleConfig: { ...prev.ruleConfig, minAccuracy: e.target.value } }))}
                        placeholder="VD: 80"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Max Accuracy (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formState.ruleConfig.maxAccuracy}
                        onChange={(e) => setFormState((prev) => ({ ...prev, ruleConfig: { ...prev.ruleConfig, maxAccuracy: e.target.value } }))}
                        placeholder="VD: 100"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(156, 163, 175, 0.1)', border: '1px solid rgba(156, 163, 175, 0.2)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                    ⚠️ Backward Compatibility: Score (không khuyến nghị dùng mới)
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Min Score</label>
                      <input
                        type="number"
                        value={formState.ruleConfig.minScore}
                        onChange={(e) => setFormState((prev) => ({ ...prev, ruleConfig: { ...prev.ruleConfig, minScore: e.target.value } }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Max Score</label>
                      <input
                        type="number"
                        value={formState.ruleConfig.maxScore}
                        onChange={(e) => setFormState((prev) => ({ ...prev, ruleConfig: { ...prev.ruleConfig, maxScore: e.target.value } }))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundImage: 'var(--gradient-brand)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Đang lưu...' : editingChallenge ? 'Cập nhật thử thách' : 'Tạo thử thách'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorChallengeManager;

