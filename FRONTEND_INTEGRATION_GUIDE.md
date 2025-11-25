# Hướng Dẫn Tích Hợp Frontend - AI Service

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [🚀 Hướng Dẫn Nhanh Cho Frontend](#-hướng-dẫn-nhanh-cho-frontend) ⭐ **BẮT ĐẦU TỪ ĐÂY**
3. [Setup và Configuration](#setup-và-configuration)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Notification Handling](#notification-handling)
8. [Best Practices](#best-practices)
9. [TypeScript Types](#typescript-types)
10. [Code Examples](#code-examples)

---

## Tổng Quan

AI Service cung cấp các API để:
- **Chat với AI**: Tư vấn tài chính thông minh với lịch sử conversation
- **Daily Reports**: Báo cáo tóm tắt tài chính & học tập hàng ngày
- **Conversation Management**: Quản lý lịch sử hội thoại

**Base URL:**
- Qua Gateway: `http://localhost:8080/ai`
- Trực tiếp (dev): `http://localhost:8202`

**Tất cả endpoints yêu cầu JWT token** (trừ `/actuator/health`)

---

## 🚀 Hướng Dẫn Nhanh Cho Frontend

Bảng mapping giữa các trang/tính năng Frontend và API cần gọi:

| Trang/Tính Năng FE | API Cần Gọi | Ghi Chú Quan Trọng |
|-------------------|-------------|-------------------|
| **Trang chủ → Ô Báo cáo hôm nay** | `GET /ai/reports/daily` | - Lấy `insight`, `rootCause`, `priorityAction` từ response<br>- Nếu trống hoặc null → hiển thị thông báo "Chưa đủ dữ liệu để tạo báo cáo. Vui lòng thử lại sau."<br>- Không cần query parameter `date` (mặc định: hôm nay)<br>- **Lưu ý**: Nếu lỗi 401 → kiểm tra JWT token, có thể token expired → redirect về login |
| **Trang chủ → Nút "Tạo báo cáo mới"** | `GET /ai/reports/daily` | - Gọi lại API này (không có endpoint POST)<br>- Hệ thống tạo báo cáo **on-demand** mỗi lần gọi<br>- Có thể mất vài giây để AI tạo báo cáo → hiển thị loading state |
| **Trang cá nhân → Thẻ Tư vấn AI (3 thẻ)** | `POST /ai/chat/ask` với `context` | - **Thẻ "Phân tích chi tiêu"**: `context = "SPENDING_WIDGET"`<br>- **Thẻ "Gợi ý tiết kiệm"**: `context = "SAVING_WIDGET"`<br>- **Thẻ "Mục tiêu tiếp theo"**: `context = "GOAL_WIDGET"`<br>- **Không cần** `question` (backend tự tạo prompt)<br>- **Không lưu lịch sử** (skipHistory = true)<br>- Request body: `{ context: "SPENDING_WIDGET" }`<br>- **Lưu ý**: Nếu lỗi 401 → kiểm tra JWT token trong header Authorization |
| **Trang AI Chat (chatbot toàn màn hình)** | `POST /ai/chat/ask` với `question` | - **Lần đầu**: Không gửi `conversationId` → backend tạo mới và trả về<br>- **Lần sau**: Gửi `conversationId` từ response trước để tiếp tục cuộc hội thoại<br>- **Lưu `conversationId`** vào localStorage/state để dùng lại<br>- Request body: `{ question: "...", conversationId: "..." }` |
| **Màn danh sách hội thoại** | `GET /ai/chat/conversations` | - Trả về danh sách conversation của user trong JWT<br>- Hiển thị: `title`, `messageCount`, `relativeTime`, `updatedAt`<br>- Sắp xếp theo `updatedAt` DESC (mới nhất trước) |
| **Chi tiết hội thoại** | `GET /ai/chat/conversations/{conversationId}` | - Hiển thị toàn bộ lịch sử chat của conversation<br>- Mỗi message có: `question`, `answer`, `tips`, `disclaimers`, `createdAt`<br>- Sắp xếp theo `createdAt` ASC (cũ nhất trước) |
| **Xóa hội thoại** | `DELETE /ai/chat/conversations/{conversationId}` | - Sau khi xóa thành công → conversation biến mất khỏi list FE<br>- Cập nhật UI ngay lập tức (optimistic update)<br>- Nếu lỗi → rollback và hiển thị thông báo |

### 📝 Lưu Ý Quan Trọng

#### 1. **Notification Handling**
- Khi gửi `POST /ai/chat/ask`, luôn gửi `activeConversationId` (conversation user đang xem)
- Nếu `activeConversationId != conversationId` → user sẽ nhận notification
- Nếu `activeConversationId == conversationId` → không gửi notification (user đang xem)

```javascript
// Ví dụ: User đang xem conversation A, nhưng AI trả lời ở conversation B
await chatService.askQuestion(
  question,
  conversationIdB,        // conversation AI đang trả lời
  conversationIdA         // conversation user đang xem
);
// → activeConversationId != conversationId → gửi notification
```

#### 2. **Context Widgets (3 Thẻ Tư Vấn AI)**
- **Thẻ "Phân tích chi tiêu"**: `context = "SPENDING_WIDGET"`
- **Thẻ "Gợi ý tiết kiệm"**: `context = "SAVING_WIDGET"`
- **Thẻ "Mục tiêu tiếp theo"**: `context = "GOAL_WIDGET"`
- **Không lưu lịch sử** (mỗi lần click → gọi API mới → nhận response mới)
- **Không cần** `question` (backend tự tạo prompt)
- **Không cần** quản lý `conversationId` cho widgets

**Ví dụ Code cho Widget:**

```javascript
// widgetService.js
export const widgetService = {
  /**
   * Lấy tư vấn AI cho widget "Phân tích chi tiêu"
   */
  async getSpendingAnalysis() {
    try {
      const response = await apiClient.post('/api/chat/ask', {
        context: 'SPENDING_WIDGET'
        // Không cần question, conversationId
      });
      return response.data.answer; // Hiển thị answer trong widget
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired → redirect login
        window.location.href = '/login';
        return null;
      }
      throw error;
    }
  },

  /**
   * Lấy tư vấn AI cho widget "Gợi ý tiết kiệm"
   */
  async getSavingSuggestions() {
    try {
      const response = await apiClient.post('/api/chat/ask', {
        context: 'SAVING_WIDGET'
      });
      return response.data.answer;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
        return null;
      }
      throw error;
    }
  },

  /**
   * Lấy tư vấn AI cho widget "Mục tiêu tiếp theo"
   */
  async getNextGoal() {
    try {
      const response = await apiClient.post('/api/chat/ask', {
        context: 'GOAL_WIDGET'
      });
      return response.data.answer;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
        return null;
      }
      throw error;
    }
  }
};
```

**React Component cho Widget:**

```jsx
// AIWidgetCard.jsx
import React, { useState, useEffect } from 'react';
import { widgetService } from './services/widgetService';

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
      setAnswer(result);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('HTTP 401 - Phiên đăng nhập đã hết hạn');
      } else {
        setError('Không thể tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvice();
  }, []);

  return (
    <div className="ai-widget-card">
      <h3>{title}</h3>
      <p className="description">{description}</p>
      
      {loading && <div>Đang tải...</div>}
      
      {error && (
        <div className="error">
          <span>{error}</span>
          <button onClick={loadAdvice}>Thử lại</button>
        </div>
      )}
      
      {answer && !loading && !error && (
        <div className="answer">{answer}</div>
      )}
    </div>
  );
}

// Sử dụng:
// <AIWidgetCard 
//   title="Phân tích chi tiêu"
//   description="Phân tích khoản chi nổi bật 7 ngày gần nhất."
//   context="SPENDING_WIDGET"
// />
```

#### 3. **Daily Report**
- Báo cáo được tạo **on-demand** (không có cache)
- Mỗi lần gọi API → AI tạo báo cáo mới dựa trên dữ liệu hiện tại
- Có thể mất 5-10 giây → cần loading state

#### 4. **Conversation Management**
- `conversationId` được backend tạo và trả về ở response đầu tiên
- Frontend **phải lưu** `conversationId` để tiếp tục cuộc hội thoại
- Nếu mất `conversationId` → tạo conversation mới (mất lịch sử)

#### 5. **Xử Lý Lỗi 401 (Unauthorized) - QUAN TRỌNG**

**Nguyên nhân:**
- JWT token không hợp lệ, expired, hoặc thiếu
- Token không được gửi trong header `Authorization: Bearer <token>`

**Cách xử lý trong Axios Interceptor:**

```javascript
// api/client.js
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 1. Xóa token cũ
      localStorage.removeItem('jwt_token');
      
      // 2. Hiển thị thông báo (nếu có toast/notification system)
      // toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      
      // 3. Redirect về login
      window.location.href = '/login';
      
      // Hoặc nếu có refresh token mechanism:
      // return refreshToken().then(token => {
      //   error.config.headers.Authorization = `Bearer ${token}`;
      //   return apiClient.request(error.config);
      // });
    }
    return Promise.reject(error);
  }
);
```

**Xử lý trong Component (hiển thị nút "Thử lại"):**

```jsx
// Component với error handling
function DailyReportCard() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/reports/daily');
      setReport(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('HTTP 401 - Phiên đăng nhập đã hết hạn');
      } else {
        setError('Không thể tải báo cáo');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <div className="daily-report-card">
      <h3>Báo cáo hôm nay</h3>
      
      {loading && <div>Đang tải...</div>}
      
      {error && (
        <div className="error">
          <span>{error}</span>
          <button onClick={loadReport}>Thử lại</button>
        </div>
      )}
      
      {report && !loading && !error && (
        <div>
          <p>{report.insight}</p>
          <p>{report.priorityAction}</p>
        </div>
      )}
    </div>
  );
}
```

**Checklist khi gặp lỗi 401:**
1. ✅ Kiểm tra token có trong `localStorage.getItem('jwt_token')` không
2. ✅ Kiểm tra header `Authorization: Bearer <token>` có được gửi không (xem Network tab)
3. ✅ Kiểm tra token có expired không (decode JWT và xem `exp` field)
4. ✅ Nếu token expired → gọi API refresh token hoặc redirect login
5. ✅ Hiển thị thông báo rõ ràng cho user: "Phiên đăng nhập đã hết hạn"
6. ✅ Cung cấp nút "Thử lại" để user có thể refresh token và retry

---

## Setup và Configuration

### 1. Environment Variables

```javascript
// config.js hoặc .env
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/ai',
  AUTH_SERVICE_URL: process.env.REACT_APP_AUTH_URL || 'http://localhost:9000',
  GATEWAY_URL: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:8080'
};
```

### 2. Axios/Fetch Setup

```javascript
// api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Thêm JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Xử lý errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired hoặc invalid
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Authentication

### Lấy JWT Token

```javascript
// auth.js
async function getToken(username, password) {
  const response = await fetch(`${API_CONFIG.AUTH_SERVICE_URL}/identity/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  const data = await response.json();
  localStorage.setItem('jwt_token', data.token);
  return data.token;
}
```

### Sử dụng Token

Token sẽ được tự động thêm vào header `Authorization: Bearer <token>` bởi axios interceptor.

---

## API Endpoints

### 1. Chat với AI

**Endpoint:** `POST /api/chat/ask`

**Request Body:**
```typescript
interface ChatRequest {
  question?: string;                    // Câu hỏi của user
  conversationId?: string;               // ID conversation (để tiếp tục cuộc hội thoại)
  context?: string;                      // Context preset (SPENDING_WIDGET, SAVING_WIDGET, etc.)
  activeConversationId?: string;         // ID conversation user đang xem (để tránh gửi notification)
}
```

**Response:**
```typescript
interface ChatResponse {
  userId: string;
  question: string;
  conversationId: string;
  answer: string;                       // Câu trả lời từ AI
  tips: string[];                       // Mẹo/tips
  disclaimers: string[];                // Lưu ý/disclaimers
  model: string;                        // Model AI sử dụng
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;                    // ISO 8601 format
}
```

**Ví dụ Code:**

```javascript
// chatService.js
import apiClient from './api/client';

export const chatService = {
  /**
   * Gửi câu hỏi đến AI
   */
  async askQuestion(question, conversationId = null, activeConversationId = null) {
    try {
      const response = await apiClient.post('/api/chat/ask', {
        question,
        conversationId,
        activeConversationId
      });
      return response.data;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  },

  /**
   * Chat với context preset (widget)
   */
  async askWithContext(context, activeConversationId = null) {
    try {
      const response = await apiClient.post('/api/chat/ask', {
        context, // SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET
        activeConversationId
      });
      return response.data;
    } catch (error) {
      console.error('Chat with context error:', error);
      throw error;
    }
  }
};
```

**React Hook Example:**

```javascript
// useChat.js
import { useState } from 'react';
import { chatService } from './services/chatService';

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const askQuestion = async (question, activeConversationId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatService.askQuestion(
        question,
        conversationId,
        activeConversationId
      );
      
      // Lưu conversationId để tiếp tục cuộc hội thoại
      if (response.conversationId) {
        setConversationId(response.conversationId);
        localStorage.setItem('current_conversation_id', response.conversationId);
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { askQuestion, loading, error, conversationId };
}
```

**React Component Example:**

```jsx
// ChatComponent.jsx
import React, { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { askQuestion, loading, conversationId } = useChat();
  const currentConversationId = conversationId || localStorage.getItem('current_conversation_id');

  const handleSend = async () => {
    if (!input.trim()) return;

    // Thêm message của user
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Gửi câu hỏi đến AI
      const response = await askQuestion(input, currentConversationId, currentConversationId);
      
      // Thêm response từ AI
      const aiMessage = {
        role: 'assistant',
        content: response.answer,
        tips: response.tips,
        disclaimers: response.disclaimers
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Hiển thị error message
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.tips && (
              <div className="tips">
                {msg.tips.map((tip, i) => (
                  <span key={i}>{tip}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nhập câu hỏi..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Đang gửi...' : 'Gửi'}
        </button>
      </div>
    </div>
  );
}
```

---

### 2. Lấy Danh Sách Conversations

**Endpoint:** `GET /api/chat/conversations`

**Response:**
```typescript
interface ConversationSummary {
  conversationId: string;
  userId: string;
  title: string;                        // Câu hỏi đầu tiên hoặc preview
  messageCount: number;
  createdAt: string;                    // ISO 8601
  updatedAt: string;                    // ISO 8601
  relativeTime: string;                 // "2 phút trước", "Hôm qua"
}
```

**Ví dụ Code:**

```javascript
// conversationService.js
export const conversationService = {
  async getConversations() {
    try {
      const response = await apiClient.get('/api/chat/conversations');
      return response.data;
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  }
};
```

---

### 3. Lấy Chi Tiết Conversation

**Endpoint:** `GET /api/chat/conversations/{conversationId}`

**Response:**
```typescript
interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  question: string;
  answer: string;
  tips: string[];
  disclaimers: string[];
  createdAt: string;
}
```

**Ví dụ Code:**

```javascript
export const conversationService = {
  async getConversationDetail(conversationId) {
    try {
      const response = await apiClient.get(`/api/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Get conversation detail error:', error);
      throw error;
    }
  }
};
```

---

### 4. Xóa Conversation

**Endpoint:** `DELETE /api/chat/conversations/{conversationId}`

**Ví dụ Code:**

```javascript
export const conversationService = {
  async deleteConversation(conversationId) {
    try {
      await apiClient.delete(`/api/chat/conversations/${conversationId}`);
      return true;
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }
};
```

---

### 5. Lấy Báo Cáo Hàng Ngày

**Endpoint:** `GET /api/reports/daily?date=YYYY-MM-DD`

**Query Parameters:**
- `date` (optional): Ngày báo cáo (format: YYYY-MM-DD). Mặc định: hôm nay

**Response:**
```typescript
interface ReportResponse {
  reportDate: string;                    // ISO 8601
  model: string;
  rawSummary: string;                    // Báo cáo gốc từ AI
  sanitizedSummary: string;              // Báo cáo đã được sanitize
  insight: string;                       // Insight chính
  rootCause: string;                     // Nguyên nhân gốc
  priorityAction: string;                // Hành động ưu tiên
  usagePromptTokens: number;
  usageCompletionTokens: number;
  usageTotalTokens: number;
  createdAt: string;
  updatedAt: string;
}
```

**Ví dụ Code:**

```javascript
// reportService.js
export const reportService = {
  async getDailyReport(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await apiClient.get('/api/reports/daily', { params });
      return response.data;
    } catch (error) {
      console.error('Get daily report error:', error);
      throw error;
    }
  }
};
```

**React Component Example:**

```jsx
// DailyReportComponent.jsx
import React, { useState, useEffect } from 'react';
import { reportService } from './services/reportService';

function DailyReportComponent() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadReport();
  }, [date]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getDailyReport(date);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!report) return <div>Không có dữ liệu</div>;

  return (
    <div className="daily-report">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <h2>Báo Cáo Ngày {new Date(report.reportDate).toLocaleDateString('vi-VN')}</h2>
      <div className="summary">
        <h3>Tóm Tắt</h3>
        <p>{report.sanitizedSummary}</p>
      </div>
      <div className="insight">
        <h3>Insight</h3>
        <p>{report.insight}</p>
      </div>
      <div className="action">
        <h3>Hành Động Ưu Tiên</h3>
        <p>{report.priorityAction}</p>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
```

### Error Handling Utility

```javascript
// utils/errorHandler.js
export function handleApiError(error) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return `Lỗi: ${data.message || 'Dữ liệu không hợp lệ'}`;
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện hành động này.';
      case 404:
        return 'Không tìm thấy dữ liệu.';
      case 500:
        return 'Lỗi server. Vui lòng thử lại sau.';
      default:
        return `Lỗi: ${data.message || 'Đã xảy ra lỗi không xác định'}`;
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
  } else {
    // Something else happened
    return `Lỗi: ${error.message}`;
  }
}
```

### Sử dụng trong Component

```javascript
try {
  const response = await chatService.askQuestion(question);
  // Handle success
} catch (error) {
  const errorMessage = handleApiError(error);
  // Hiển thị error message cho user
  toast.error(errorMessage);
}
```

---

## Notification Handling

### FCM Notification Payload

Khi nhận notification từ Firebase Cloud Messaging:

```json
{
  "title": "EduFinAI đã hoàn thành giải đáp câu hỏi của bạn",
  "body": "Câu hỏi: Tôi nên tiết kiệm bao nhiêu mỗi tháng?",
  "data": {
    "type": "chat",
    "conversationId": "abc-123-def-456",
    "question": "Tôi nên tiết kiệm bao nhiêu mỗi tháng?"
  }
}
```

### Xử Lý Notification trong Frontend

```javascript
// services/notificationService.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const notificationService = {
  /**
   * Request permission và lấy FCM token
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY'
        });
        
        // Gửi token đến backend để đăng ký
        await fetch(`${API_CONFIG.BASE_URL}/api/notifications/register-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token,
            platform: 'web',
            deviceInfo: navigator.userAgent
          })
        });
        
        return token;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  },

  /**
   * Lắng nghe foreground messages
   */
  onMessage(callback) {
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
};
```

### Xử Lý Notification Tap

```javascript
// App.js hoặc main.js
import { notificationService } from './services/notificationService';

// Khi app khởi động
notificationService.requestPermission();

// Lắng nghe foreground messages
notificationService.onMessage((payload) => {
  // Hiển thị notification trong app
  showInAppNotification(payload);
});

// Xử lý khi user tap vào notification (background)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  if (data.type === 'chat') {
    // Navigate đến conversation
    event.waitUntil(
      clients.openWindow(`/chat/${data.conversationId}`)
    );
  }
});
```

### React Hook cho Notifications

```javascript
// hooks/useNotifications.js
import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

export function useNotifications() {
  const navigate = useNavigate();

  useEffect(() => {
    // Request permission khi component mount
    notificationService.requestPermission();

    // Lắng nghe foreground messages
    const unsubscribe = notificationService.onMessage((payload) => {
      const { data } = payload;
      
      if (data.type === 'chat') {
        // Hiển thị toast notification
        toast.info(payload.notification.body, {
          onClick: () => {
            navigate(`/chat/${data.conversationId}`);
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);
}
```

---

## Best Practices

### 1. Quản Lý Conversation ID

```javascript
// utils/conversationStorage.js
export const conversationStorage = {
  getCurrentConversationId() {
    return localStorage.getItem('current_conversation_id');
  },
  
  setCurrentConversationId(conversationId) {
    localStorage.setItem('current_conversation_id', conversationId);
  },
  
  clearCurrentConversationId() {
    localStorage.removeItem('current_conversation_id');
  }
};
```

### 2. Optimistic Updates

```javascript
// Khi gửi message, hiển thị ngay (optimistic update)
const handleSend = async () => {
  // 1. Thêm message ngay lập tức
  setMessages(prev => [...prev, { role: 'user', content: input }]);
  setInput('');
  
  // 2. Gửi request
  try {
    const response = await askQuestion(input);
    // 3. Cập nhật với response thực tế
    setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
  } catch (error) {
    // 4. Rollback nếu lỗi
    setMessages(prev => prev.slice(0, -1));
    toast.error('Gửi tin nhắn thất bại');
  }
};
```

### 3. Debounce cho Search/Filter

```javascript
import { useDebounce } from './hooks/useDebounce';

function ConversationList() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearch) {
      // Search conversations
    }
  }, [debouncedSearch]);
}
```

### 4. Loading States

```javascript
// Hiển thị loading state rõ ràng
{loading && (
  <div className="loading">
    <Spinner />
    <p>AI đang suy nghĩ...</p>
  </div>
)}
```

### 5. Error Boundaries

```jsx
// ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Đã xảy ra lỗi. Vui lòng thử lại.</h2>;
    }

    return this.props.children;
  }
}
```

---

## TypeScript Types

```typescript
// types/ai-service.ts

export interface ChatRequest {
  question?: string;
  conversationId?: string;
  context?: 'SPENDING_WIDGET' | 'SAVING_WIDGET' | 'GOAL_WIDGET';
  activeConversationId?: string;
}

export interface ChatResponse {
  userId: string;
  question: string;
  conversationId: string;
  answer: string;
  tips: string[];
  disclaimers: string[];
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;
}

export interface ConversationSummary {
  conversationId: string;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  relativeTime: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  question: string;
  answer: string;
  tips: string[];
  disclaimers: string[];
  createdAt: string;
}

export interface ReportResponse {
  reportDate: string;
  model: string;
  rawSummary: string;
  sanitizedSummary: string;
  insight: string;
  rootCause: string;
  priorityAction: string;
  usagePromptTokens: number;
  usageCompletionTokens: number;
  usageTotalTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
```

---

## Code Examples

### Complete Chat Component với TypeScript

```tsx
// components/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { ChatResponse } from '../types/ai-service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tips?: string[];
  disclaimers?: string[];
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    localStorage.getItem('current_conversation_id')
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response: ChatResponse = await chatService.askQuestion(
        input,
        conversationId || undefined,
        conversationId || undefined
      );

      if (response.conversationId) {
        setConversationId(response.conversationId);
        localStorage.setItem('current_conversation_id', response.conversationId);
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: response.answer,
        tips: response.tips,
        disclaimers: response.disclaimers
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.tips && msg.tips.length > 0 && (
              <div className="tips">
                {msg.tips.map((tip, i) => (
                  <span key={i} className="tip">{tip}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message assistant loading">
            <p>AI đang suy nghĩ...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nhập câu hỏi..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Gửi
        </button>
      </div>
    </div>
  );
};
```

---

## Tổng Kết

### Checklist Tích Hợp

- [ ] Setup API client với axios/fetch
- [ ] Implement authentication (JWT token)
- [ ] Implement chat functionality
- [ ] Implement conversation management
- [ ] Implement daily reports
- [ ] Setup FCM notifications
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add TypeScript types (nếu dùng TS)
- [ ] Test tất cả endpoints
- [ ] Handle edge cases

### Tài Liệu Tham Khảo

- [API Documentation](./API-DOCUMENTATION.md)
- [Service Features](./AI_SERVICE_FEATURES.md)
- [Guidance Options](./GUIDANCE_OPTION_1_3_6.md)

### Support

Nếu có vấn đề khi tích hợp, vui lòng kiểm tra:
1. JWT token có hợp lệ không
2. CORS configuration
3. Gateway routing
4. Service dependencies (Finance, Learning, Gamification services)

---

**Chúc bạn tích hợp thành công! 🚀**

