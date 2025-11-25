import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle, Brain } from 'lucide-react';
import { widgetService } from '../../services/widgetService';

/**
 * AI Widget Card Component
 * Displays AI advice for a specific context (SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET)
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {string} props.context - Context type: 'SPENDING_WIDGET', 'SAVING_WIDGET', or 'GOAL_WIDGET'
 */
function AIWidgetCard({ title, description, context }) {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (context) {
        case 'SPENDING_WIDGET':
          result = await widgetService.getSpendingAnalysis();
          break;
        case 'SAVING_WIDGET':
          result = await widgetService.getSavingSuggestions();
          break;
        case 'GOAL_WIDGET':
          result = await widgetService.getNextGoal();
          break;
        default:
          throw new Error('Invalid context');
      }
      
      // Check if result is null/empty or contains error message
      // Backend should return null/empty when no data, not error messages
      const trimmedResult = result?.trim() || '';
      
      // If result is empty or contains "chưa đủ"/"chưa có dữ liệu" → treat as no data
      if (!trimmedResult || 
          trimmedResult.toLowerCase().includes('chưa đủ') ||
          trimmedResult.toLowerCase().includes('chưa có dữ liệu')) {
        setAnswer(null); // Set to null to show fallback message
      } else {
        setAnswer(trimmedResult);
      }
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('hết hạn')) {
        setError('Phiên đăng nhập đã hết hạn');
        // Redirect will be handled by aiService
      } else {
        setError(err.message || 'Không thể tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvice();
  }, [context]);

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{
            padding: '8px',
            background: 'var(--color-primary)',
            borderRadius: '10px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Brain size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}>
              {title}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              {description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadAdvice}
          disabled={loading}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            opacity: loading ? 0.5 : 1,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--surface-muted)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="Làm mới"
        >
          {loading ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '16px',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Đang phân tích dữ liệu...</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
        }}>
          <AlertCircle size={16} color="#F44336" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#F44336',
              marginBottom: '8px',
            }}>
              {error}
            </p>
            <button
              type="button"
              onClick={loadAdvice}
              style={{
                padding: '6px 12px',
                background: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#D32F2F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F44336';
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {answer && !loading && !error && (
        <div style={{
          padding: '12px',
          background: 'var(--surface-muted)',
          borderRadius: '10px',
          fontSize: '14px',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>
          {answer}
        </div>
      )}
      
      {!answer && !loading && !error && (
        <div style={{
          padding: '12px',
          background: 'var(--surface-muted)',
          borderRadius: '10px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          textAlign: 'center',
        }}>
          Chưa đủ dữ liệu để tư vấn. Vui lòng cập nhật dữ liệu.
        </div>
      )}
    </div>
  );
}

export default AIWidgetCard;

