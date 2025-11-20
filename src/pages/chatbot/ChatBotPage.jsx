import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, MessageSquare, Plus, History, Trash2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import { styles } from '../../styles/appStyles';
import { askQuestion, getUserConversations, getConversationHistory, deleteConversation } from '../../services/edufinaiApi';
import { useAuth } from '../../context/AuthContext';

const ChatBotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      content: 'Xin chào! Tôi là trợ lý tài chính AI của bạn. Tôi có thể giúp bạn tư vấn về tài chính, đầu tư, tiết kiệm và quản lý ngân sách. Bạn muốn hỏi gì?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(() => {
    // Load conversationId từ localStorage khi component mount
    return localStorage.getItem('chatbot_conversationId') || null;
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasLoadedHistory = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history khi có conversationId (chỉ load 1 lần)
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!conversationId || hasLoadedHistory.current) return;

      setIsLoadingHistory(true);
      hasLoadedHistory.current = true;
      try {
        console.log('[ChatBot] Loading conversation history:', conversationId);
        const history = await getConversationHistory(conversationId);
        
        if (history && history.messages && Array.isArray(history.messages)) {
          // Convert messages từ API format sang format của component
          // Parse timestamp đúng cách (xử lý nhiều format từ backend)
          // Backend có thể trả về: ZonedDateTime (ISO string), epoch timestamp (number), hoặc string
          const parseDate = (dateValue) => {
            if (!dateValue) return new Date();
            try {
              let date;
              
              if (typeof dateValue === 'number') {
                // Nếu là epoch timestamp (milliseconds)
                date = new Date(dateValue);
              } else if (typeof dateValue === 'string') {
                // Nếu là string
                const trimmed = dateValue.trim();
                if (/^\d+$/.test(trimmed)) {
                  // Nếu là số dạng string (epoch timestamp)
                  date = new Date(parseInt(trimmed, 10));
                } else {
                  // Nếu là ISO string (ZonedDateTime format: "2024-01-15T10:30:00+07:00")
                  date = new Date(trimmed);
                }
              } else {
                date = new Date(dateValue);
              }
              
              if (isNaN(date.getTime())) {
                console.warn('[ChatBot] Invalid date value:', dateValue, typeof dateValue);
                return new Date();
              }
              
              // Kiểm tra nếu là epoch date (1970-01-01) - có thể là lỗi
              if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
                console.warn('[ChatBot] Epoch date detected, might be invalid:', dateValue);
              }
              
              return date;
            } catch (e) {
              console.error('[ChatBot] Error parsing date:', dateValue, typeof dateValue, e);
              return new Date();
            }
          };

          const formattedMessages = history.messages.map((msg) => {
            // Tạo user message
            const userMsg = {
              id: `user-${msg.id}`,
              type: 'user',
              content: msg.question || '',
              timestamp: parseDate(msg.createdAt),
            };

            // Tạo bot message với formatted content
            const botMsg = {
              id: `bot-${msg.id}`,
              type: 'bot',
              content: msg.formattedContent || msg.content || '',
              timestamp: parseDate(msg.createdAt),
            };

            return [userMsg, botMsg];
          }).flat(); // Flatten array of arrays

          // Chỉ set messages nếu có dữ liệu
          if (formattedMessages.length > 0) {
            setMessages(formattedMessages);
            console.log('[ChatBot] Loaded conversation history:', formattedMessages.length, 'messages');
          }
        }
      } catch (err) {
        console.error('[ChatBot] Failed to load conversation history:', err);
        // Không hiển thị error, chỉ log - có thể conversation không tồn tại
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversationHistory();
  }, [conversationId]);

  // Load danh sách conversations
  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const userId = user?.id || user?.email || null;
      const convs = await getUserConversations(userId);
      setConversations(convs);
      console.log('[ChatBot] Loaded conversations:', convs.length);
    } catch (err) {
      console.error('[ChatBot] Failed to load conversations:', err);
      // Hiển thị error message cho user
      setError('Không thể tải danh sách cuộc hội thoại. Vui lòng thử lại sau.');
      // Hiển thị error message trong UI
      const errorMessage = {
        id: `error-conversations-${Date.now()}`,
        type: 'error',
        content: 'Không thể tải danh sách cuộc hội thoại. Có thể do lỗi backend database. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      // Không thêm vào messages, chỉ log
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Tạo conversation mới
  const handleNewChat = () => {
    setConversationId(null);
    localStorage.removeItem('chatbot_conversationId');
    hasLoadedHistory.current = false;
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        content: 'Xin chào! Tôi là trợ lý tài chính AI của bạn. Tôi có thể giúp bạn tư vấn về tài chính, đầu tư, tiết kiệm và quản lý ngân sách. Bạn muốn hỏi gì?',
        timestamp: new Date(),
      },
    ]);
    setShowConversationsList(false);
  };

  // Chọn conversation từ danh sách
  const handleSelectConversation = async (convId) => {
    setConversationId(convId);
    localStorage.setItem('chatbot_conversationId', convId);
    hasLoadedHistory.current = false;
    setShowConversationsList(false);
    setIsLoadingHistory(true);
    
    try {
      const history = await getConversationHistory(convId);
      if (history && history.messages && Array.isArray(history.messages)) {
        const formattedMessages = history.messages.map((msg) => {
          // Parse timestamp đúng cách (xử lý nhiều format từ backend)
          const parseDate = (dateValue) => {
            if (!dateValue) return new Date();
            try {
              let date;
              
              if (typeof dateValue === 'number') {
                date = new Date(dateValue);
              } else if (typeof dateValue === 'string') {
                const trimmed = dateValue.trim();
                if (/^\d+$/.test(trimmed)) {
                  date = new Date(parseInt(trimmed, 10));
                } else {
                  date = new Date(trimmed);
                }
              } else {
                date = new Date(dateValue);
              }
              
              if (isNaN(date.getTime())) {
                console.warn('[ChatBot] Invalid date value:', dateValue);
                return new Date();
              }
              
              if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
                console.warn('[ChatBot] Epoch date detected:', dateValue);
              }
              
              return date;
            } catch (e) {
              console.error('[ChatBot] Error parsing date:', dateValue, e);
              return new Date();
            }
          };

          const userMsg = {
            id: `user-${msg.id}`,
            type: 'user',
            content: msg.question || '',
            timestamp: parseDate(msg.createdAt),
          };
          const botMsg = {
            id: `bot-${msg.id}`,
            type: 'bot',
            content: msg.formattedContent || msg.content || '',
            timestamp: parseDate(msg.createdAt),
          };
          return [userMsg, botMsg];
        }).flat();
        
        if (formattedMessages.length > 0) {
          setMessages(formattedMessages);
        }
      }
    } catch (err) {
      console.error('[ChatBot] Failed to load conversation:', err);
    } finally {
      setIsLoadingHistory(false);
      hasLoadedHistory.current = true;
    }
  };

  // Xóa conversation
  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation(); // Ngăn chặn event bubble lên button cha
    
    // Xác nhận trước khi xóa
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc hội thoại này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      console.log('[ChatBot] Deleting conversation:', convId);
      await deleteConversation(convId);
      
      // Nếu đang xem conversation bị xóa, reset về welcome
      if (convId === conversationId) {
        handleNewChat();
      }
      
      // Reload danh sách conversations
      await loadConversations();
      
      console.log('[ChatBot] Conversation deleted successfully');
    } catch (err) {
      console.error('[ChatBot] Failed to delete conversation:', err);
      alert('Không thể xóa cuộc hội thoại. Vui lòng thử lại.');
    }
  };

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const userId = user?.id || user?.email || null;
      
      console.log('[ChatBot] Sending question:', {
        question,
        userId,
        conversationId,
      });

      // Gọi API để lấy phản hồi từ AI (với conversationId nếu có)
      const response = await askQuestion(question, userId, conversationId);

      console.log('[ChatBot] Received response from API:', response);

      // Kiểm tra và xử lý response
      if (!response) {
        throw new Error('Không nhận được phản hồi từ server');
      }

      // Lọc và xử lý dữ liệu từ API
      // Đảm bảo chỉ lấy dữ liệu đã được parse, không dùng raw JSON
      let answer = (response.answer && typeof response.answer === 'string') 
        ? response.answer.trim() 
        : '';
      let tips = Array.isArray(response.tips) 
        ? response.tips.filter(tip => tip && typeof tip === 'string' && tip.trim() !== '').map(tip => tip.trim())
        : [];
      let disclaimers = Array.isArray(response.disclaimers)
        ? response.disclaimers.filter(disclaimer => disclaimer && typeof disclaimer === 'string' && disclaimer.trim() !== '').map(disclaimer => disclaimer.trim())
        : [];

      console.log('[ChatBot] Processed data:', { answer, tips, disclaimers });
      console.log('[ChatBot] Full response:', response);
      
      // Kiểm tra nếu không có dữ liệu hợp lệ, thử fallback
      if (!answer && tips.length === 0 && disclaimers.length === 0) {
        console.error('[ChatBot] No valid content found in response:', response);
        throw new Error('Không nhận được nội dung phản hồi từ AI. Vui lòng thử lại.');
      }

      // Gộp tất cả nội dung thành một message text tự nhiên như ChatGPT
      let fullContent = '';
      
      // Thêm answer
      if (answer) {
        fullContent += answer;
      }
      
      // Thêm tips như một phần tự nhiên của message
      if (tips.length > 0) {
        if (fullContent && !fullContent.endsWith('.') && !fullContent.endsWith('!') && !fullContent.endsWith('?')) {
          fullContent += '.';
        }
        if (fullContent) {
          fullContent += '\n\n';
        }
        tips.forEach((tip, index) => {
          if (index > 0) fullContent += '\n';
          fullContent += `• ${tip}`;
        });
      }
      
      // Thêm disclaimers ở cuối
      if (disclaimers.length > 0) {
        if (fullContent) {
          fullContent += '\n\n';
        }
        disclaimers.forEach((disclaimer, index) => {
          if (index > 0) fullContent += '\n';
          fullContent += `⚠️ ${disclaimer}`;
        });
      }

      // Chỉ tạo message nếu có nội dung
      if (!fullContent.trim()) {
        throw new Error('Không nhận được nội dung phản hồi từ AI');
      }

      // Lưu conversationId từ response để tiếp tục conversation
      if (response.conversationId) {
        const newConvId = response.conversationId;
        // Chỉ update nếu conversationId thay đổi
        if (newConvId !== conversationId) {
          setConversationId(newConvId);
          localStorage.setItem('chatbot_conversationId', newConvId);
          hasLoadedHistory.current = false;
          console.log('[ChatBot] Conversation ID saved:', newConvId);
        }
      }

      // Tạo message đơn giản như ChatGPT - chỉ có content
      const botMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: fullContent.trim(),
        timestamp: new Date(),
      };

      console.log('[ChatBot] Created bot message:', botMessage);

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('[ChatBot] Error occurred:', err);
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: err.message || 'Đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 140px)',
      maxHeight: 'calc(100vh - 140px)',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      paddingBottom: '80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    message: {
      display: 'flex',
      gap: '12px',
      maxWidth: '85%',
      animation: 'fadeIn 0.3s ease-in',
    },
    messageUser: {
      alignSelf: 'flex-end',
      flexDirection: 'row-reverse',
    },
    messageBot: {
      alignSelf: 'flex-start',
    },
    messageError: {
      alignSelf: 'center',
      maxWidth: '90%',
    },
    messageAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    messageAvatarUser: {
      backgroundColor: '#4CAF50',
      color: '#fff',
    },
    messageAvatarBot: {
      backgroundColor: '#E8F5E9',
      color: '#4CAF50',
    },
    messageAvatarError: {
      backgroundColor: '#FFEBEE',
      color: '#F44336',
    },
    messageContent: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '18px',
      fontSize: '14px',
      lineHeight: '1.5',
      wordWrap: 'break-word',
    },
    messageContentUser: {
      backgroundColor: '#4CAF50',
      color: '#fff',
      borderBottomRightRadius: '4px',
    },
    messageContentBot: {
      backgroundColor: '#F5F5F5',
      color: '#212121',
      borderBottomLeftRadius: '4px',
    },
    messageContentError: {
      backgroundColor: '#FFEBEE',
      color: '#C62828',
      border: '1px solid #FFCDD2',
    },
    messageText: {
      fontSize: '14px',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
    },
    tipsInline: {
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    tipInline: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: '13px',
      lineHeight: '1.5',
    },
    tipBullet: {
      color: '#4CAF50',
      fontWeight: 'bold',
      fontSize: '16px',
      lineHeight: '1.2',
      flexShrink: 0,
      marginTop: '2px',
    },
    tipText: {
      flex: 1,
      color: '#424242',
    },
    disclaimersInline: {
      marginTop: '12px',
      padding: '12px',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      borderRadius: '8px',
      borderLeft: '3px solid #FF9800',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    disclaimerInline: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: '12px',
      lineHeight: '1.5',
    },
    disclaimerIcon: {
      flexShrink: 0,
      fontSize: '14px',
    },
    disclaimerText: {
      flex: 1,
      color: '#E65100',
    },
    inputContainer: {
      // Vị trí: Container cố định ở cuối màn hình, không scroll theo
      position: 'fixed',        // Cố định vị trí
      bottom: '70px',           // Cách đáy 70px (tránh bottom navigation bar)
      left: '50%',              // Bắt đầu từ giữa màn hình
      transform: 'translateX(-50%)', // Dịch sang trái 50% để căn giữa hoàn hảo
      
      // Kích thước: Responsive, tối đa 500px (giảm từ 600px)
      maxWidth: '600px',         // Chiều rộng tối đa (giảm từ 600px)
      width: '100%',              // Chiều rộng 95% (giảm từ 100%)
      
      // Khoảng cách và nền
      padding: '12px 0px',       // Giảm padding: 8px trên/dưới, 12px trái/phải
    backgroundColor: '#ffffff00',   // Nền vàng
    //   borderTop: '1px solid #E0E0E0', // Viền trên màu xám nhạt (tách biệt với nội dung)
      
      // Layout: Flexbox để textarea và button nằm ngang
      display: 'flex',           // Layout flexbox
      gap: '12px',               // Giảm khoảng cách giữa textarea và button từ 12px
      alignItems: 'center',      // Căn giữa các items theo chiều dọc
      
      // Hiệu ứng: Bóng đổ và layer
    //   boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', // Giảm bóng đổ
      zIndex: 100,               // Layer cao (luôn hiển thị trên các element khác)
    },
    inputWrapper: {
      flex: 1,                   // Chiếm toàn bộ không gian còn lại (textarea mở rộng)
      position: 'relative', 
      marginLeft: '8px'     // Vị trí tương đối (để đặt các element con nếu cần)
    },
    textarea: {
      width: '100%',
      minHeight: '44px',
      maxHeight: '120px',
      padding: '10px 16px',
      paddingRight: '48px',
      borderRadius: '24px',
      border: '1px solid #E0E0E0',
      fontSize: '15px',
      fontFamily: 'inherit',
      resize: 'none',
      outline: 'none',
      backgroundColor: '#F5F5F5',
      transition: 'all 0.2s',
      lineHeight: '24px',
      color: '#212121',
      boxSizing: 'border-box',
      verticalAlign: 'middle',
    },
    sendButton: {
      width: '44px',
      height: '44px',
      minWidth: '44px',
      minHeight: '44px',
      marginLeft: '0px',
      marginRight: '8px',
      borderRadius: '50%',
      backgroundColor: '#4CAF50',
      color: '#fff',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
      transition: 'all 0.2s',
      flexShrink: 0,
      alignSelf: 'center',
    },
    loadingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      backgroundColor: '#F5F5F5',
      borderRadius: '18px',
      fontSize: '13px',
      color: '#666',
      maxWidth: '85%',
      alignSelf: 'flex-start',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#999',
    },
    metadata: {
      fontSize: '11px',
      color: '#999',
      marginTop: '4px',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Header 
          title="AI Tư vấn" 
          subtitle="Trợ lý tài chính thông minh" 
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleNewChat}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={18} />
            <span>Chat mới</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!showConversationsList) {
                loadConversations();
              }
              setShowConversationsList(!showConversationsList);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: showConversationsList ? '#E8F5E9' : '#F5F5F5',
              color: showConversationsList ? '#4CAF50' : '#212121',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <History size={18} />
            <span>Lịch sử</span>
          </button>
        </div>
      </div>

      {/* Danh sách conversations */}
      {showConversationsList && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #E0E0E0',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {isLoadingConversations ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
              <div>Đang tải...</div>
            </div>
          ) : error && error.includes('tải danh sách') ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#F44336' }}>
              <AlertCircle size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>Không thể tải danh sách</div>
              <button
                type="button"
                onClick={loadConversations}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              Chưa có cuộc hội thoại nào
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {conversations.map((conv) => (
                <div
                  key={conv.conversationId}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'stretch',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectConversation(conv.conversationId)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: conv.conversationId === conversationId ? '#E8F5E9' : '#F5F5F5',
                      border: conv.conversationId === conversationId ? '2px solid #4CAF50' : '1px solid #E0E0E0',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (conv.conversationId !== conversationId) {
                        e.target.style.backgroundColor = '#F0F0F0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (conv.conversationId !== conversationId) {
                        e.target.style.backgroundColor = '#F5F5F5';
                      }
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#212121', marginBottom: '4px' }}>
                      {conv.title || 'Cuộc hội thoại'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{conv.messageCount} tin nhắn</span>
                      <span>
                        {conv.updatedAt 
                          ? (() => {
                              try {
                                let date;
                                
                                // Xử lý nhiều format từ backend
                                if (typeof conv.updatedAt === 'number') {
                                  // Nếu là epoch timestamp (milliseconds)
                                  date = new Date(conv.updatedAt);
                                } else if (typeof conv.updatedAt === 'string') {
                                  // Nếu là string, có thể là ISO string hoặc epoch string
                                  if (/^\d+$/.test(conv.updatedAt.trim())) {
                                    // Nếu là số dạng string (epoch timestamp)
                                    date = new Date(parseInt(conv.updatedAt, 10));
                                  } else {
                                    // Nếu là ISO string
                                    date = new Date(conv.updatedAt);
                                  }
                                } else {
                                  date = new Date(conv.updatedAt);
                                }
                                
                                // Kiểm tra date hợp lệ
                                if (isNaN(date.getTime())) {
                                  console.warn('[ChatBot] Invalid date:', conv.updatedAt);
                                  return 'N/A';
                                }
                                
                                // Kiểm tra nếu là epoch date (1970-01-01) - có thể là lỗi
                                if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
                                  console.warn('[ChatBot] Epoch date detected, might be invalid:', conv.updatedAt);
                                  // Vẫn hiển thị nhưng log warning
                                }
                                
                                // Hiển thị theo timezone local của browser
                                return date.toLocaleString('vi-VN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                });
                              } catch (e) {
                                console.error('[ChatBot] Error formatting date:', conv.updatedAt, typeof conv.updatedAt, e);
                                return 'N/A';
                              }
                            })()
                          : 'N/A'}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(conv.conversationId, e)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#FFEBEE',
                      border: '1px solid #FFCDD2',
                      borderRadius: '8px',
                      color: '#F44336',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      minWidth: '44px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#FFCDD2';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#FFEBEE';
                    }}
                    title="Xóa cuộc hội thoại"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={chatStyles.container}>
        <div style={chatStyles.messagesContainer}>
          {isLoadingHistory && (
            <div style={chatStyles.loadingIndicator}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Đang tải lịch sử chat...</span>
            </div>
          )}
          
          {messages.map((message) => {
            if (message.type === 'error') {
              return (
                <div
                  key={message.id}
                  style={{
                    ...chatStyles.message,
                    ...chatStyles.messageError,
                  }}
                >
                  <div
                    style={{
                      ...chatStyles.messageAvatar,
                      ...chatStyles.messageAvatarError,
                    }}
                  >
                    <AlertCircle size={20} />
                  </div>
                  <div
                    style={{
                      ...chatStyles.messageContent,
                      ...chatStyles.messageContentError,
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              );
            }

            const isUser = message.type === 'user';
            return (
              <div
                key={message.id}
                style={{
                  ...chatStyles.message,
                  ...(isUser ? chatStyles.messageUser : chatStyles.messageBot),
                }}
              >
                <div
                  style={{
                    ...chatStyles.messageAvatar,
                    ...(isUser
                      ? chatStyles.messageAvatarUser
                      : chatStyles.messageAvatarBot),
                  }}
                >
                  {isUser ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      ...chatStyles.messageContent,
                      ...(isUser
                        ? chatStyles.messageContentUser
                        : chatStyles.messageContentBot),
                    }}
                  >
                    {/* Hiển thị nội dung như ChatGPT - chỉ là text thuần túy */}
                    {message.content && message.content.trim() !== '' && (
                      <div style={chatStyles.messageText}>
                        {message.content.split('\n').map((line, index, array) => {
                          const isEmpty = line.trim() === '';
                          
                          if (isEmpty) {
                            return <br key={index} />;
                          }
                          
                          return (
                            <div key={index} style={{ marginBottom: index < array.length - 1 ? '8px' : '0' }}>
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={chatStyles.loadingIndicator}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>AI đang suy nghĩ...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={chatStyles.inputContainer}>
          <div style={chatStyles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              rows={1}
              style={{
                ...chatStyles.textarea,
                ...(inputValue ? {
                  border: '1px solid #4CAF50',
                  backgroundColor: '#fff',
                  boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.1)',
                } : {}),
              }}
              disabled={isLoading}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            style={chatStyles.sendButton}
            onMouseEnter={(e) => {
              if (!isLoading && inputValue.trim()) {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.backgroundColor = '#45a049';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.backgroundColor = '#4CAF50';
            }}
            title="Gửi tin nhắn"
          >
            {isLoading ? (
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>

      <style>
        {`
          textarea::placeholder {
            color: #999;
            opacity: 1;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChatBotPage;

