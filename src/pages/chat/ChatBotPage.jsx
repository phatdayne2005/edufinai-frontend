import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Plus, Loader2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { styles } from '../../styles/appStyles';
import {
  askQuestion,
  getConversationHistory,
  getUserConversations,
  deleteConversation,
} from '../../services/aiService';

const welcomeMessage = {
  id: 'welcome',
  type: 'bot',
  content: 'Xin chào! Tôi có thể hỗ trợ bạn về ngân sách, tiết kiệm, đầu tư hoặc mục tiêu tài chính.',
  timestamp: new Date(),
};

const ChatBotPage = () => {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const activeConversationRef = useRef(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    activeConversationRef.current = conversationId;
  }, [conversationId]);

  const loadConversations = async (selectLatest = false) => {
    setIsLoadingConversations(true);
    try {
      const data = await getUserConversations();
      setConversations(data);
      if (selectLatest && data.length > 0) {
        handleSelectConversation(data[0].conversationId);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách hội thoại');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const formatMessagesFromHistory = (history = []) => {
    return history
      .map((msg) => {
        const userMsg = {
          id: `user-${msg.id}`,
          type: 'user',
          content: msg.question || '',
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        };
        const botMsg = {
          id: `bot-${msg.id}`,
          type: 'bot',
          content: buildFullContent(msg),
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        };
        return [userMsg, botMsg];
      })
      .flat();
  };

  const handleSelectConversation = async (id) => {
    if (!id) return;
    setIsLoadingHistory(true);
    setConversationId(id);
    try {
      const history = await getConversationHistory(id);
      const formatted = formatMessagesFromHistory(history.messages || []);
      setMessages(formatted.length > 0 ? formatted : [welcomeMessage]);
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử hội thoại');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteConversation = async (id) => {
    if (!window.confirm('Bạn muốn xóa hội thoại này chứ?')) {
      return;
    }
    try {
      await deleteConversation(id);
      if (id === conversationId) {
        setConversationId(null);
        setMessages([welcomeMessage]);
      }
      loadConversations();
    } catch (err) {
      setError(err.message || 'Không thể xóa hội thoại');
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([welcomeMessage]);
  };

  const buildFullContent = (payload) => {
    const answer = payload.answer || '';
    const tips = Array.isArray(payload.tips) ? payload.tips.filter((tip) => tip && tip.trim() !== '') : [];
    const disclaimers = Array.isArray(payload.disclaimers)
      ? payload.disclaimers.filter((item) => item && item.trim() !== '')
      : [];

    let full = answer.trim();

    if (tips.length > 0) {
      if (full && !/[.!?]$/.test(full)) {
        full += '.';
      }
      full += '\n\n' + tips.map((tip) => `• ${tip}`).join('\n');
    }

    if (disclaimers.length > 0) {
      full += `${full ? '\n\n' : ''}${disclaimers.map((d) => `⚠️ ${d}`).join('\n')}`;
    }

    return full || 'Không có dữ liệu để hiển thị.';
  };

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const targetConversationId = conversationId;
    const isViewingOriginalConversation = () => {
      const currentId = activeConversationRef.current;
      if (!currentId && !targetConversationId) {
        return true;
      }
      return currentId === targetConversationId;
    };

    try {
      // Send activeConversationId (the conversation user is currently viewing)
      // This helps backend manage notifications: if activeConversationId != conversationId,
      // backend will send notification; otherwise, no notification (user is viewing)
      const response = await askQuestion({
        question,
        conversationId,
        activeConversationId: conversationId, // User is viewing this conversation
      });

      if (isViewingOriginalConversation()) {
        const botMessage = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: buildFullContent(response),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setConversationId(response.conversationId || conversationId);
      } else {
        console.info('[Chat] Response received for a different conversation. Skipping UI update.');
      }
      loadConversations();
    } catch (err) {
      if (isViewingOriginalConversation()) {
        const errorMessage = {
          id: `error-${Date.now()}`,
          type: 'error',
          content: err.message || 'Không thể kết nối tới AI. Vui lòng thử lại.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setError(err.message);
      } else {
        console.error('[Chat] Error returned for non-active conversation:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.page}>
      <Header title="AI Chat" subtitle="Hỏi đáp tài chính với EduFinAI" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 280px) 1fr',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            type="button"
            onClick={handleNewConversation}
            style={{
              ...styles.addButton,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              marginBottom: 0,
            }}
          >
            <Plus size={18} />
            Cuộc trò chuyện mới
          </button>

          <div style={{ ...styles.section, marginBottom: 0 }}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Hội thoại gần đây</h3>
              <button
                type="button"
                onClick={() => loadConversations(true)}
                style={{ ...styles.refreshButton, border: 'none', padding: '6px 10px' }}
                className={isLoadingConversations ? 'is-loading' : ''}
              >
                {isLoadingConversations ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshCw size={16} />
                )}
                Làm mới
              </button>
            </div>

            <div
              style={{
                maxHeight: '420px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {isLoadingConversations ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang tải hội thoại...</span>
                </div>
              ) : conversations.length === 0 ? (
                <p style={{ ...styles.aiCardText, margin: 0 }}>Chưa có hội thoại nào.</p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.conversationId}
                    style={{
                      borderRadius: 12,
                      border: conversation.conversationId === conversationId ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      cursor: 'pointer',
                      backgroundColor: conversation.conversationId === conversationId ? 'var(--surface-muted)' : 'transparent',
                    }}
                    onClick={() => handleSelectConversation(conversation.conversationId)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {conversation.title || 'Không tiêu đề'}
                      </strong>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteConversation(conversation.conversationId);
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#F44336',
                          cursor: 'pointer',
                        }}
                        title="Xóa hội thoại"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{conversation.relativeTime || ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <section
          style={{
            ...styles.section,
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '16px',
            minHeight: '520px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MessageSquare size={20} color="var(--color-primary)" />
            <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Cuộc trò chuyện</h3>
            {isLoadingHistory && (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#666' }} />
            )}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '380px',
              maxHeight: '480px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingRight: 4,
            }}
          >
            {messages.map((message) => {
              if (message.type === 'error') {
                return (
                  <div
                    key={message.id}
                    style={{
                      alignSelf: 'center',
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      padding: '12px 16px',
                      borderRadius: 12,
                      display: 'flex',
                      gap: 8,
                      color: '#F44336',
                      maxWidth: '80%',
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>{message.content}</span>
                  </div>
                );
              }

              const isUser = message.type === 'user';
              return (
                <div
                  key={message.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    backgroundColor: isUser ? 'var(--color-primary)' : 'var(--surface-card)',
                    backgroundImage: isUser ? 'var(--gradient-brand)' : 'none',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  {message.content}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 16,
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 16,
            }}
          >
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
              style={{
                flex: 1,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                padding: '12px',
                minHeight: '56px',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              style={{
                borderRadius: 12,
                border: 'none',
                backgroundImage: 'var(--gradient-brand)',
                color: '#fff',
                padding: '0 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading || !inputValue.trim() ? 0.6 : 1,
              }}
            >
              {isLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatBotPage;


