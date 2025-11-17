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
  "answerJson": "{\"answer\":\"Dựa trên thu nhập...\",\"tips\":[\"Mẹo 1\"],\"disclaimers\":[\"Lưu ý 1\"]}",
  "model": "gemini-2.5-flash",
  "promptTokens": 150,
  "completionTokens": 200,
  "totalTokens": 350,
  "createdAt": "2024-01-15T10:30:00+07:00"
}
```

**Lưu ý quan trọng:**
- `answerJson` là một **JSON string**, không phải object
- Cần parse `answerJson` để lấy `answer`, `tips`, `disclaimers`

### 4. Service parse response

**Trong edufinaiApi.js:**
```javascript
// Parse answerJson từ string thành object
const parsedAnswer = JSON.parse(response.answerJson);
// parsedAnswer = {
//   "answer": "Dựa trên thu nhập...",
//   "tips": ["Mẹo 1"],
//   "disclaimers": ["Lưu ý 1"]
// }

// Trả về object đã được xử lý
return {
  ...response,                    // Giữ nguyên tất cả field từ API
  answer: parsedAnswer.answer,    // Extract answer
  tips: parsedAnswer.tips,        // Extract tips array
  disclaimers: parsedAnswer.disclaimers,  // Extract disclaimers array
  rawAnswerJson: response.answerJson  // Giữ raw để debug
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
  answerJson: string;        // JSON string cần parse
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;         // ISO 8601
}
```

### Parsed answerJson
```typescript
{
  answer: string;
  tips: string[];
  disclaimers: string[];
}
```

### Final Response (sau khi parse)
```typescript
{
  // Tất cả field từ API response
  userId: string;
  question: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;
  
  // Các field đã được parse từ answerJson
  answer: string;
  tips: string[];
  disclaimers: string[];
  
  // Raw data để debug
  rawAnswerJson: string;
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
   [EduFinAI API] Parsed answerJson: {...}
   [EduFinAI API] Final processed response: {...}
   ```

3. **Trong ChatBot:**
   ```
   [ChatBot] Sending question: {...}
   [ChatBot] Received response from API: {...}
   [ChatBot] Created bot message: {...}
   ```

## Xử Lý Lỗi

### Lỗi Parse JSON
Nếu `answerJson` không phải là JSON hợp lệ:
- Code sẽ catch error
- Trả về `rawAnswerJson` như là `answer`
- `tips` và `disclaimers` sẽ là mảng rỗng

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
  "answerJson": "{\"answer\":\"Nên tiết kiệm ít nhất 20% thu nhập...\",\"tips\":[\"Tự động chuyển tiền\",\"Theo dõi chi tiêu\"],\"disclaimers\":[\"Thông tin tham khảo\"]}",
  "model": "gemini-2.5-flash",
  "totalTokens": 350
}
```

### 4. Service parse:
```javascript
parsedAnswer = {
  answer: "Nên tiết kiệm ít nhất 20% thu nhập...",
  tips: ["Tự động chuyển tiền", "Theo dõi chi tiêu"],
  disclaimers: ["Thông tin tham khảo"]
}
```

### 5. ChatBot hiển thị:
- **Message bubble:** "Nên tiết kiệm ít nhất 20% thu nhập..."
- **Tips section:** 
  - Tự động chuyển tiền
  - Theo dõi chi tiêu
- **Disclaimers:** ⚠️ Thông tin tham khảo

