# Flow Dữ Liệu API Chat - EduFinAI

## Tổng quan

Tài liệu này giải thích cách ChatBot nhận và xử lý dữ liệu từ API `/api/chat/ask`.

## Flow Dữ Liệu

### 1. User gửi câu hỏi

**Trong ChatBotPage.jsx:**
```javascript
const response = await askQuestion(question, userId);
```

### 2. Service gửi request đến API

**Trong edufinaiApi.js - askQuestion():**
```javascript
// Tạo request body
const body = {
  question: question.trim(),
  userId: userId || undefined  // optional
};

// Gửi POST request đến /api/chat/ask
const response = await apiRequest('/api/chat/ask', {
  method: 'POST',
  body,
});
```

**Request được gửi:**
```
POST http://localhost:8080/api/chat/ask
Content-Type: application/json

{
  "question": "Tôi nên tiết kiệm bao nhiêu mỗi tháng?",
  "userId": "user123"  // optional
}
```

### 3. API Backend xử lý và trả về

**Response từ API:**
```json
{
  "userId": "user123",
  "question": "Tôi nên tiết kiệm bao nhiêu mỗi tháng?",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "Chào bạn! Dựa trên thu nhập hiện tại...",
  "tips": [
    "Giữ mức tiết kiệm ổn định 20% thu nhập",
    "Tự động chuyển tiền sang tài khoản tiết kiệm sau khi nhận lương"
  ],
  "disclaimers": [
    "Thông tin chỉ mang tính tham khảo, không phải tư vấn đầu tư"
  ],
  "model": "gemini-2.5-flash",
  "promptTokens": 150,
  "completionTokens": 200,
  "totalTokens": 350,
  "createdAt": "2024-01-15T10:30:00+07:00"
}
```

**Lưu ý quan trọng:**
- Backend hiện trả về `answer`, `tips`, `disclaimers` ở cấp cao nhất
- Không còn cần parse JSON string thủ công (nhưng frontend vẫn hỗ trợ legacy `answerJson` nếu backend cũ còn trả về)

### 4. Service chuẩn hóa response

**Trong edufinaiApi.js:**
```javascript
const sections = extractAnswerSections(response); // Lấy answer/tips/disclaimers, fallback legacy nếu cần

const result = {
  ...response,
  ...sections,
};
```

### 5. ChatBotPage nhận và hiển thị

**Trong ChatBotPage.jsx:**
```javascript
// Nhận response đã được parse
const response = await askQuestion(question, userId);

// Tạo message object
const botMessage = {
  id: `bot-${Date.now()}`,
  type: 'bot',
  content: response.answer,           // Nội dung từ parsed answer
  tips: response.tips,                 // Mảng tips
  disclaimers: response.disclaimers,   // Mảng disclaimers
  metadata: {
    model: response.model,
    tokens: response.totalTokens
  }
};

// Thêm vào danh sách messages
setMessages((prev) => [...prev, botMessage]);
```

## Cấu Trúc Dữ Liệu

### Request Body
```typescript
{
  question: string;    // Required
  userId?: string;     // Optional, mặc định "anonymous"
}
```

### API Response (Raw)
```typescript
{
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
```

### Final Response (sau khi parse)
```typescript
{
  // Tất cả field từ API response
  userId: string;
  question: string;
  conversationId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;
  
  // Các field đã được chuẩn hóa
  answer: string;
  tips: string[];
  disclaimers: string[];

  // Metadata khác nếu backend bổ sung (formattedAnswer, flags, v.v.)
}
```

### Bot Message Object
```typescript
{
  id: string;
  type: 'bot' | 'user' | 'error';
  content: string;
  tips?: string[];
  disclaimers?: string[];
  timestamp: Date;
  metadata?: {
    model: string;
    tokens: number;
    promptTokens?: number;
    completionTokens?: number;
  };
}
```

## Debug

Để debug, mở **Browser Console** (F12) và xem các log:

1. **Khi gửi request:**
   ```
   [EduFinAI API] Sending request: { endpoint: '/api/chat/ask', body: {...} }
   ```

2. **Khi nhận response:**
   ```
   [EduFinAI API] Raw response received: {...}
   [EduFinAI API] Final processed response: {...}
   ```

3. **Trong ChatBot:**
   ```
   [ChatBot] Sending question: {...}
   [ChatBot] Received response from API: {...}
   [ChatBot] Created bot message: {...}
   ```

## Xử Lý Lỗi

### Legacy `answerJson`
- Nếu backend cũ vẫn trả về `answerJson`, frontend sẽ tự động parse
- Nếu parse thất bại, chuỗi raw (nếu là plain text) sẽ được dùng làm answer

### Lỗi Network
- Hiển thị error message trong chat
- Log error vào console

### Lỗi API (400, 500)
- API trả về error object với `code` và `message`
- Service throw Error với message từ API
- ChatBot hiển thị error message

## Ví Dụ Hoàn Chỉnh

### 1. User nhập: "Tôi nên tiết kiệm bao nhiêu?"

### 2. Request gửi đi:
```json
POST /api/chat/ask
{
  "question": "Tôi nên tiết kiệm bao nhiêu?",
  "userId": "user@example.com"
}
```

### 3. API trả về:
```json
{
  "userId": "user@example.com",
  "question": "Tôi nên tiết kiệm bao nhiêu?",
  "answer": "Nên tiết kiệm ít nhất 20% thu nhập...",
  "tips": ["Tự động chuyển tiền", "Theo dõi chi tiêu"],
  "disclaimers": ["Thông tin tham khảo"],
  "model": "gemini-2.5-flash",
  "totalTokens": 350
}
```

### 4. Service parse:
```javascript
const sections = {
  answer: "Nên tiết kiệm ít nhất 20% thu nhập...",
  tips: ["Tự động chuyển tiền", "Theo dõi chi tiêu"],
  disclaimers: ["Thông tin tham khảo"]
};
```

### 5. ChatBot hiển thị:
- **Message bubble:** "Nên tiết kiệm ít nhất 20% thu nhập..."
- **Tips section:** 
  - Tự động chuyển tiền
  - Theo dõi chi tiêu
- **Disclaimers:** ⚠️ Thông tin tham khảo

