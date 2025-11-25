# Hướng Dẫn Phân Chia Trách Nhiệm - AI Service Integration

## 📋 Tổng Quan

Tài liệu này mô tả cách Frontend và Backend nên xử lý các trường hợp không có dữ liệu hoặc lỗi trong AI Service.

---

## 🎯 Nguyên Tắc Chung

### Backend (AI Service)
- **Trách nhiệm:** Quyết định khi nào có dữ liệu hợp lệ để tạo báo cáo/tư vấn
- **Hành động:** 
  - Daily Report: Trả về `null` cho `insight`, `rootCause`, `priorityAction` khi không có dữ liệu
  - Widget Cards: Trả về `null` hoặc `""` cho `answer` khi không có dữ liệu
- **Không nên:** Trả về text lỗi/thông báo trong các field (ví dụ: "Chưa đủ giao dịch...", "Chưa có dữ liệu...")

### Frontend
- **Trách nhiệm:** Hiển thị UI dựa trên dữ liệu backend trả về
- **Hành động:** 
  - Kiểm tra null/empty và hiển thị fallback message
  - Tạm thời: Kiểm tra từ khóa lỗi (temporary workaround cho đến khi backend cập nhật)
- **Không nên:** Parse/kiểm tra nội dung text để phát hiện lỗi (sẽ bỏ sau khi backend cập nhật)

---

## 📊 Daily Report API (`GET /ai/reports/daily`)

### ✅ Backend Nên Làm

### ✅ Backend Nên Làm

#### Khi KHÔNG có dữ liệu (không đủ giao dịch, gamification data trống):
```json
{
  "reportDate": "2024-01-15T00:00:00+07:00",
  "model": "gemini-2.5-flash",
  "insight": null,           // ← null thay vì text lỗi
  "rootCause": null,         // ← null thay vì text lỗi
  "priorityAction": null,    // ← null thay vì text lỗi
  "usagePromptTokens": 0,
  "usageCompletionTokens": 0,
  "usageTotalTokens": 0,
  "createdAt": "2024-01-15T02:15:00+07:00",
  "updatedAt": "2024-01-15T02:15:00+07:00"
}
```

**Hoặc có thể thêm flag:**
```json
{
  "reportDate": "2024-01-15T00:00:00+07:00",
  "hasData": false,          // ← Flag để frontend biết có dữ liệu không
  "insight": null,
  "rootCause": null,
  "priorityAction": null,
  ...
}
```

#### Khi CÓ dữ liệu:
```json
{
  "reportDate": "2024-01-15T00:00:00+07:00",
  "model": "gemini-2.5-flash",
  "insight": "Dòng tiền dương 5.2M VND",
  "rootCause": "Thu nhập 8M cao hơn chi 2.8M",
  "priorityAction": "Dành thêm 500k vào mục tiêu laptop",
  ...
}
```

### ✅ Frontend Đã Làm (Hiện Tại)

**File:** `src/pages/home/HomePage.jsx`

```javascript
// Kiểm tra null/empty đơn giản
const insight = dailyReport.insight?.trim();
const rootCause = dailyReport.rootCause?.trim();
const priorityAction = dailyReport.priorityAction?.trim();

const hasInsight = insight && insight.length > 0;
const hasRootCause = rootCause && rootCause.length > 0;
const hasPriorityAction = priorityAction && priorityAction.length > 0;

// Nếu tất cả đều null/empty → hiển thị fallback
if (!hasInsight && !hasRootCause && !hasPriorityAction) {
  return <p>Chưa đủ dữ liệu để tạo báo cáo. Vui lòng cập nhật dữ liệu.</p>;
}

// Nếu có dữ liệu → hiển thị bình thường
return (
  <div>
    {hasInsight && <p>{insight}</p>}
    {hasRootCause && <div>Lý do: {rootCause}</div>}
    {hasPriorityAction && <div>Ưu tiên: {priorityAction}</div>}
  </div>
);
```

---

## 💬 Widget Cards API (`POST /ai/chat/ask` với `context`)

### ✅ Backend Nên Làm

#### Khi KHÔNG có dữ liệu (SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET):
```json
{
  "userId": "user123",
  "question": "",
  "conversationId": null,
  "answer": null,              // ← null thay vì "Chào bạn, EduFinAI đây. Chưa đủ giao dịch..."
  "tips": [],
  "disclaimers": [],
  "model": "gemini-2.5-flash",
  ...
}
```

**Hoặc có thể trả về empty string:**
```json
{
  "answer": "",                // ← empty string thay vì text lỗi
  ...
}
```

#### Khi CÓ dữ liệu:
```json
{
  "userId": "user123",
  "answer": "Dựa trên dữ liệu 7 ngày gần nhất, bạn đã chi 2.5 triệu cho ăn uống...",
  "tips": ["Mẹo 1", "Mẹo 2"],
  "disclaimers": ["Lưu ý 1"],
  ...
}
```

### ✅ Frontend Cần Cập Nhật

**File:** `src/components/ai/AIWidgetCard.jsx`

Cần thêm logic kiểm tra null/empty và hiển thị fallback message tương tự Daily Report.

---

## 🔧 Cách Triển Khai

### Option 1: Backend Trả Về Null (Khuyến Nghị)

**Backend (Java/Spring Boot):**
```java
// ReportResponse.java
public class ReportResponse {
    private String insight;           // null khi không có dữ liệu
    private String rootCause;         // null khi không có dữ liệu
    private String priorityAction;    // null khi không có dữ liệu
    // ... other fields
}

// ReportService.java
public ReportResponse getDailyReport(String date) {
    // Kiểm tra dữ liệu
    if (!hasEnoughData()) {
        return ReportResponse.builder()
            .reportDate(date)
            .insight(null)           // ← Trả về null
            .rootCause(null)         // ← Trả về null
            .priorityAction(null)    // ← Trả về null
            .build();
    }
    
    // Có dữ liệu → tạo báo cáo bình thường
    return generateReport(date);
}
```

**Frontend (Đã implement):**
- Đã xử lý null/empty đúng cách
- Không cần thay đổi gì thêm

### Option 2: Backend Trả Về Flag `hasData`

**Backend:**
```java
public class ReportResponse {
    private Boolean hasData;          // true/false
    private String insight;
    private String rootCause;
    private String priorityAction;
    // ...
}
```

**Frontend (Cần update):**
```javascript
if (!dailyReport.hasData) {
  return <p>Chưa đủ dữ liệu để tạo báo cáo. Vui lòng cập nhật dữ liệu.</p>;
}
```

---

## 📝 Checklist Triển Khai

### Backend (AI Service)
- [ ] **Daily Report:** Khi không có dữ liệu, trả về `null` cho `insight`, `rootCause`, `priorityAction`
- [ ] **Widget Cards:** Khi không có dữ liệu, trả về `null` hoặc `""` cho `answer` (thay vì text "Chưa đủ giao dịch...")
- [ ] Không trả về text lỗi/thông báo trong các field này
- [ ] Có thể thêm flag `hasData: false` để rõ ràng hơn (optional)
- [ ] Test với trường hợp: không có giao dịch, không có gamification data, không có goals

### Frontend
- [x] **Daily Report:** Kiểm tra null/empty cho các field
- [x] **Daily Report:** Hiển thị fallback message khi tất cả field đều null/empty
- [x] **Widget Cards:** Tạm thời kiểm tra từ khóa lỗi (workaround)
- [ ] **Widget Cards:** Cần cập nhật để chỉ kiểm tra null/empty sau khi backend fix
- [x] Xử lý error 401 (redirect login)

---

## 🎯 Kết Luận

**Giải pháp tối ưu:**
1. **Backend:** Trả về `null` cho các field khi không có dữ liệu
2. **Frontend:** Đã implement đúng - chỉ cần kiểm tra null/empty

**Lợi ích:**
- ✅ Tách biệt trách nhiệm rõ ràng
- ✅ Frontend không cần parse text
- ✅ Dễ maintain và test
- ✅ Backend có thể thay đổi message mà không ảnh hưởng frontend

---

## 📞 Liên Hệ

Nếu có vấn đề, vui lòng:
1. Kiểm tra response từ backend (Network tab)
2. Xác nhận backend trả về `null` hay text lỗi
3. Cập nhật backend nếu cần

