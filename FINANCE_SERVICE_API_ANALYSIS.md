# Phân Tích Nhu Cầu API Từ Finance-Service

## Tổng Quan

Tài liệu này phân tích xem AI-service có nên yêu cầu Finance-service cung cấp thêm các API chi tiết hơn, phù hợp với từng tính năng cụ thể hay không.

## 📋 Tóm Tắt Nhanh

### Kết Luận: **ĐÃ TRIỂN KHAI 2 API MỚI** ✅

1. **`/api/summary/7days`** - Cho `/api/chat/ask` với context ✅ **ĐÃ TRIỂN KHAI**
   - Dữ liệu 7 ngày gần nhất
   - Phục vụ SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET
   - Thay thế việc dùng monthly data (không phù hợp)
   - **Cấu hình:** `services.finance.url7days` trong `application.yaml`

2. **`/api/summary/daily`** - Cho `/api/reports/daily` ✅ **ĐÃ TRIỂN KHAI**
   - Dữ liệu 1 ngày cụ thể
   - So sánh với ngày trước và trung bình 7 ngày
   - Tổng hợp ngắn gọn cho daily report
   - **Cấu hình:** `services.finance.urlDaily` trong `application.yaml`

### Lý Do Chính:
- ✅ Monthly data quá rộng, không phù hợp cho real-time analysis
- ✅ Context-based chat cần dữ liệu 7 ngày để phân tích chính xác
- ✅ Daily report cần dữ liệu 1 ngày với so sánh
- ✅ Tối ưu token usage và performance

### Trạng Thái Implementation:
- ✅ AI-service đã cấu hình và sử dụng cả 2 API mới
- ✅ ChatController tự động chọn `/api/summary/7days` khi có context
- ✅ ReportController sử dụng `/api/summary/daily` cho daily reports
- ⚠️ **Lưu ý:** Finance-service cần implement 2 endpoint này theo response structure đã định nghĩa

---

## 1. Tình Trạng Hiện Tại

### 1.1. AI-Service Chat API (`/api/chat/ask`)

**Chức năng:**
- Nhận context preset: `SPENDING_WIDGET`, `SAVING_WIDGET`, `GOAL_WIDGET`
- Nhận question tự do từ user
- Phân tích context để quyết định service nào cần gọi (ContextAnalyzer)
- Tạo prompt phù hợp với từng context và gọi Gemini AI

**Cách gọi Finance-service:**
- **Khi có context** (`SPENDING_WIDGET`, `SAVING_WIDGET`, `GOAL_WIDGET`): 
  - URL: `lb://FINANCE-SERVICE/api/summary/7days` (ưu tiên)
  - Fallback: `lb://FINANCE-SERVICE/api/summary/month-optimized`
- **Khi không có context**: 
  - URL: `lb://FINANCE-SERVICE/api/summary/month-optimized` (ưu tiên)
  - Fallback: `lb://FINANCE-SERVICE/api/summary/7days`
- **Cấu trúc response `/api/summary/7days` (đã được thiết kế):**
```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "summary": {
    "totalIncome": 15000000.00,
    "totalExpense": 5000000.00,
    "totalBalance": 10000000.00,
    "savingRate": 66.67,
    "averageDailyExpense": 166666.67
  },
  "Income": {
    "topCategories": [
      {
        "cat": "Lương",
        "amt": 15000000.00,
        "cnt": 1,
        "pct": 100.0
      }
    ]
  },
  "Expense": {
    "topCategories": [
      {
        "cat": "Ăn uống",
        "amt": 2000000.00,
        "cnt": 15,
        "pct": 40.0
      }
    ]
  },
  "goals": [
    {
      "title": "Mua laptop",
      "prog": 33.3,
      "days": 30,
      "risk": false
    }
  ],
  "trends": {
    "expenseChange": 15.5,
    "incomeChange": 0.0
  }
}
```
- **Vấn đề:** Endpoint này đang được cấu hình nhưng có thể chưa được implement trong Finance-service
- **Nhận xét:** Cấu trúc này rất tốt cho monthly summary, nhưng không phù hợp cho context-based analysis (cần 7 ngày)

**Logic theo context:**
- `SPENDING_WIDGET`: Chỉ gọi Finance service
- `SAVING_WIDGET`: Gọi Finance + Gamification
- `GOAL_WIDGET`: Gọi Finance + Gamification
- Không có context: Gọi tất cả services (fallback)

### 1.2. AI-Service Reports Daily (`/api/reports/daily`)

**Chức năng:**
- Tạo báo cáo ngắn gọn hàng ngày
- Trả về: `insight`, `rootCause`, `priorityAction`
- Cần dữ liệu để phân tích xu hướng và đưa ra khuyến nghị

**Cách gọi Finance-service:**
- URL cấu hình: `lb://FINANCE-SERVICE/api/summary/daily` (đã được implement)
- **Response structure:** Dữ liệu 1 ngày cụ thể với so sánh ngày trước và trung bình 7 ngày
- Cũng gọi Gamification service

### 1.3. Finance-Service Hiện Có

**Endpoints hiện tại:**
- `/api/summary/month`: Chỉ trả về 4 fields cơ bản
- `/api/v1/transactions/recent`: Danh sách giao dịch gần đây (limit mặc định: 5)
- `/api/v1/transactions`: Danh sách giao dịch có phân trang
- `/api/v1/goals`: Danh sách tất cả goals
- `/api/v1/balance`: Thông tin số dư

---

## 2. Phân Tích Nhu Cầu Dữ Liệu Theo Context

### 2.1. SPENDING_WIDGET

**Mục đích:** Phân tích chi tiêu nổi bật trong 7 ngày gần nhất

**Dữ liệu cần thiết:**
- Danh sách giao dịch chi tiêu 7 ngày gần nhất
- Phân loại theo category với tổng số tiền
- So sánh với kỳ trước (nếu có)
- Top categories chi tiêu nhiều nhất
- Cảnh báo nếu có category vượt ngân sách

**Dữ liệu hiện tại có đủ không?**
- ❌ Không đủ: Endpoint `/api/summary/month` chỉ có tổng chi tiêu tháng, không có chi tiết theo category
- ❌ Không đủ: Endpoint `/api/v1/transactions/recent` chỉ có 5 giao dịch gần nhất, không đủ 7 ngày
- ❌ Không đủ: Không có dữ liệu so sánh với kỳ trước

**Kết luận:** Cần API mới chuyên biệt cho spending analysis

### 2.2. SAVING_WIDGET

**Mục đích:** Tóm tắt tiến độ tiết kiệm và gợi ý duy trì/đẩy nhanh mục tiêu

**Dữ liệu cần thiết:**
- Danh sách goals đang active với tiến độ (%)
- Số ngày còn lại cho từng goal
- Tổng số tiền đã tiết kiệm
- Tổng số tiền đang khóa trong goals
- Lịch sử nạp tiền vào goals (7 ngày gần nhất)
- Cảnh báo nếu goal sắp deadline hoặc tiến độ chậm

**Dữ liệu hiện tại có đủ không?**
- ⚠️ Một phần: `/api/v1/goals` có danh sách goals nhưng cần tính toán thêm (savedAmount, amount, endAt)
- ❌ Không đủ: Không có lịch sử nạp tiền vào goals theo thời gian
- ❌ Không đủ: Không có cảnh báo tự động về deadline hoặc tiến độ chậm
- ❌ Không đủ: Không có tổng hợp số tiền đang khóa trong goals

**Kết luận:** Cần API mới chuyên biệt cho saving progress analysis

### 2.3. GOAL_WIDGET

**Mục đích:** Xác định mục tiêu ưu tiên nhất cần làm ngay

**Dữ liệu cần thiết:**
- Danh sách goals với status và tiến độ
- Goals sắp deadline (ưu tiên cao)
- Goals có tiến độ chậm (savedAmount/amount < expected)
- Goals gần hoàn thành (savedAmount/amount > 80%)
- Số ngày còn lại cho từng goal
- Cảnh báo nếu goal có nguy cơ thất bại

**Dữ liệu hiện tại có đủ không?**
- ⚠️ Một phần: `/api/v1/goals` có dữ liệu cơ bản nhưng cần tính toán thêm
- ❌ Không đủ: Không có sắp xếp theo mức độ ưu tiên
- ❌ Không đủ: Không có cảnh báo tự động về nguy cơ thất bại
- ❌ Không đủ: Không có tính toán tiến độ expected vs actual

**Kết luận:** Cần API mới chuyên biệt cho goal priority analysis

### 2.4. Reports Daily

**Mục đích:** Tạo báo cáo tổng hợp với insight, rootCause, priorityAction

**Dữ liệu cần thiết:**
- Tổng hợp tài chính 7 ngày gần nhất
- Xu hướng thu nhập và chi tiêu
- Phân tích theo category
- Tiến độ goals
- So sánh với kỳ trước
- Điểm nổi bật và cảnh báo

**Dữ liệu hiện tại có đủ không?**
- ❌ Không đủ: `/api/summary/month` chỉ có dữ liệu tháng hiện tại, không có 7 ngày
- ❌ Không đủ: Không có xu hướng và so sánh
- ❌ Không đủ: Không có phân tích chi tiết theo category

**Kết luận:** Cần API mới chuyên biệt cho daily report

---

## 3. Đánh Giá: Có Nên Yêu Cầu Thêm API Không?

### 3.1. Kết Luận: **CÓ, NÊN YÊU CẦU**

**Lý do:**

1. **Tối ưu hiệu năng:**
   - Hiện tại AI-service phải gọi nhiều endpoint và tự tính toán
   - Finance-service có thể tính toán sẵn và trả về dữ liệu đã được xử lý
   - Giảm số lượng API calls và giảm token usage khi gửi cho Gemini

2. **Tối ưu dữ liệu:**
   - Mỗi context cần dữ liệu khác nhau nhưng đang dùng chung một endpoint generic
   - API chuyên biệt sẽ trả về đúng dữ liệu cần thiết, không thừa
   - Giảm kích thước response và tăng tốc độ xử lý

3. **Tối ưu bảo trì:**
   - Logic tính toán nằm ở Finance-service (single source of truth)
   - AI-service chỉ cần gọi và sử dụng, không cần hiểu business logic phức tạp
   - Dễ dàng cập nhật logic mà không ảnh hưởng AI-service

4. **Tối ưu token usage:**
   - Dữ liệu đã được tổng hợp và format sẵn
   - Không cần gửi toàn bộ transactions/goals raw data cho Gemini
   - Giảm chi phí API calls đến Gemini

5. **Tính nhất quán:**
   - Endpoint `/api/summary/month-optimized` đang được cấu hình nhưng không tồn tại
   - Cần có endpoint thực sự hoạt động

---

## 4. Đề Xuất Các API Mới

### 4.1. `/api/summary/7days` (Cho `/api/chat/ask` với context)

**Mục đích:** Phục vụ `/api/chat/ask` với các context: SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET

**Lý do:**
- Context-based analysis cần dữ liệu 7 ngày gần nhất để phân tích chính xác
- Monthly data quá rộng, không phù hợp cho real-time chat analysis
- Cần dữ liệu chi tiết hơn để AI có thể đưa ra lời khuyên cụ thể

**Response structure (đã tinh gọn – chỉ cung cấp dữ liệu thô cho AI):**
```json
{
  "period": {
    "startDate": "2025-11-24",
    "endDate": "2025-11-30",
    "days": 7
  },
  "summary": {
    "totalIncome": 5000000.0,
    "totalExpense": 3500000.0,
    "totalBalance": 10000000.0,
    "savingRate": 30.0,
    "averageDailyExpense": 500000.0,
    "averageDailyIncome": 714285.71
  },
  "expense": {
    "topCategories": [
      { "cat": "Ăn uống", "amt": 1500000.0, "cnt": 12, "pct": 42.86 },
      { "cat": "Giải trí", "amt": 1000000.0, "cnt": 8, "pct": 28.57 }
    ],
    "dailyBreakdown": [
      { "date": "2025-11-30", "total": 500000.0, "count": 4 },
      { "date": "2025-11-29", "total": 600000.0, "count": 5 }
    ]
  },
  "income": {
    "topSources": [
      { "source": "Lương", "amt": 5000000.0, "cnt": 1, "pct": 100.0 }
    ]
  },
  "goals": [
    {
      "title": "Mua laptop",
      "progressPct": 33.3,
      "daysRemaining": 30
    }
  ]
}
```

- `period` + `summary`: cho AI biết cửa sổ 7 ngày và các con số tổng quan.
- `expense.topCategories/dailyBreakdown`: đủ dữ liệu để trả lời “chi nhiều cho gì / ngày nào chi nhiều”.
- `income.topSources`: giúp giải thích nguồn thu chính.
- `goals`: chỉ giữ thông tin cần thiết (tiến độ %, số ngày còn lại) để AI tự suy luận.
### 4.2. `/api/summary/daily` (Cho `/api/reports/daily`)

**Mục đích:** Phục vụ `/api/reports/daily` - tạo báo cáo ngắn gọn hàng ngày

**Lý do:**
- Reports daily cần dữ liệu của ngày cụ thể để phân tích
- Cần so sánh với ngày trước và xu hướng để đưa ra insight
- Cần tổng hợp ngắn gọn để AI tạo báo cáo 3 dòng

**Response structure (đã tinh gọn – dữ liệu của 1 ngày):**
```json
{
  "reportDate": "2025-11-30",
  "summary": {
    "totalIncome": 0.0,
    "totalExpense": 500000.0,
    "netAmount": -500000.0,
    "transactionCount": 4,
    "avgTransactionAmount": 125000.0
  },
  "expenseBreakdown": {
    "byCategory": [
      { "cat": "Ăn uống", "amt": 300000.0, "cnt": 2, "pct": 60.0 },
      { "cat": "Di chuyển", "amt": 200000.0, "cnt": 2, "pct": 40.0 }
    ],
    "largestTransaction": {
      "name": "Ăn trưa",
      "amount": 200000.0,
      "category": "Ăn uống",
      "time": "2025-11-30T12:30:00"
    }
  },
  "comparison": {
    "previousDay": { "date": "2025-11-29", "totalExpense": 600000.0, "totalIncome": 0.0 },
    "expenseChangePct": -16.67,
    "incomeChangePct": 0.0,
    "avg7Days": { "expense": 500000.0, "income": 714285.71 }
  },
  "goals": {
    "activeCount": 3,
    "totalSavedToday": 0.0,
    "totalSaved7Days": 2000000.0,
    "goalsProgress": [
      {
        "title": "Mua laptop",
        "progressPct": 33.3,
        "daysRemaining": 30,
        "risk": false
      }
    ]
  }
}
```

- `summary`: snapshot các con số của riêng ngày đó.
- `expenseBreakdown`: giúp AI biết hạng mục nào nổi trội và khoản chi lớn nhất.
- `comparison`: đủ dữ liệu để tự tính insight/rootCause (so với hôm qua và trung bình 7 ngày).
- `goals`: cung cấp hoạt động tiết kiệm trong ngày để AI đề xuất priorityAction.

### 4.3. `/api/summary/month-optimized` (Legacy - vẫn giữ cho monthly overview)

**Mục đích:** Tổng hợp tài chính theo tháng (đã được thiết kế từ đầu)

**Response structure (đã có):**
```json
{
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "summary": {
    "totalIncome": 15000000.00,
    "totalExpense": 5000000.00,
    "totalBalance": 10000000.00,
    "savingRate": 66.67,
    "averageDailyExpense": 166666.67
  },
  "Income": {
    "topCategories": [
      {
        "cat": "Lương",
        "amt": 15000000.00,
        "cnt": 1,
        "pct": 100.0
      }
    ]
  },
  "Expense": {
    "topCategories": [
      {
        "cat": "Ăn uống",
        "amt": 2000000.00,
        "cnt": 15,
        "pct": 40.0
      }
    ]
  },
  "goals": [
    {
      "title": "Mua laptop",
      "prog": 33.3,
      "days": 30,
      "risk": false
    }
  ],
  "trends": {
    "expenseChange": 15.5,
    "incomeChange": 0.0
  }
}
```

**Sử dụng:**
- Phù hợp cho monthly overview
- Không phù hợp cho context-based chat analysis (cần 7 ngày)
- Không phù hợp cho daily report (cần 1 ngày)

---

## 5. Mapping API và Use Case

### 5.1. Tóm Tắt Mapping

| Use Case | API Endpoint | Period | Mục đích |
|----------|--------------|--------|----------|
| `/api/chat/ask` với context | `/api/summary/7days` | 7 ngày gần nhất | Phân tích real-time cho SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET |
| `/api/reports/daily` | `/api/summary/daily` | 1 ngày cụ thể | Tạo báo cáo ngắn gọn với insight, rootCause, priorityAction |
| Monthly overview (nếu có) | `/api/summary/month-optimized` | 1 tháng | Tổng hợp tài chính theo tháng |

### 5.2. So Sánh Dữ Liệu

**7 ngày vs 1 tháng:**
- ✅ 7 ngày: Phù hợp cho real-time analysis, dữ liệu gần đây, phản ánh xu hướng ngắn hạn
- ❌ 1 tháng: Quá rộng, không phù hợp cho context-based chat analysis

**1 ngày vs 7 ngày:**
- ✅ 1 ngày: Phù hợp cho daily report, so sánh với ngày trước, tổng hợp ngắn gọn
- ✅ 7 ngày: Phù hợp cho chat analysis, có đủ context để đưa ra lời khuyên

### 5.3. Cấu Hình AI-Service

**ChatController:**
```yaml
services:
  finance:
    # Khi có context (SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET)
    url: lb://FINANCE-SERVICE/api/summary/7days
    # Khi không có context (fallback)
    # url: lb://FINANCE-SERVICE/api/summary/month-optimized
```

**ReportController:**
```yaml
services:
  finance:
    url: lb://FINANCE-SERVICE/api/summary/daily
```

---

## 6. Lợi Ích Của Việc Có API Chuyên Biệt

### 5.1. Cho AI-Service

1. **Giảm complexity:**
   - Không cần tự tính toán và tổng hợp dữ liệu
   - Chỉ cần gọi API và sử dụng response

2. **Tối ưu token usage:**
   - Dữ liệu đã được format sẵn, không cần gửi raw data
   - Giảm kích thước prompt gửi cho Gemini

3. **Tăng tốc độ:**
   - Ít API calls hơn (1 call thay vì nhiều calls)
   - Dữ liệu đã được xử lý sẵn

4. **Dễ bảo trì:**
   - Logic tính toán nằm ở Finance-service
   - AI-service không cần hiểu business logic phức tạp

### 5.2. Cho Finance-Service

1. **Single source of truth:**
   - Tất cả logic tính toán ở một nơi
   - Dễ dàng cập nhật và maintain

2. **Tái sử dụng:**
   - Các API này có thể được sử dụng bởi services khác
   - Không chỉ phục vụ AI-service

3. **Performance:**
   - Có thể cache kết quả tính toán
   - Tối ưu database queries

---

## 7. Kế Hoạch Triển Khai

### 6.1. Ưu Tiên

1. **Cao:** `/api/summary/7days` - Cho `/api/chat/ask` với context
   - Phục vụ SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET
   - Thay thế việc dùng monthly data cho context-based analysis
   
2. **Cao:** `/api/summary/daily` - Cho `/api/reports/daily`
   - Phục vụ daily report với insight, rootCause, priorityAction
   - So sánh với ngày trước và trung bình 7 ngày
   
3. **Trung bình:** `/api/summary/month-optimized` (đã có)
   - Giữ lại cho monthly overview
   - Có thể dùng cho các tính năng khác cần monthly data

### 6.2. Migration Path

✅ **Phase 1:** AI-service đã cấu hình và sử dụng `/api/summary/7days`
   - ChatController tự động chọn URL dựa trên context
   - Cấu hình trong `application.yaml`: `services.finance.url7days`
   
✅ **Phase 2:** AI-service đã cấu hình và sử dụng `/api/summary/daily`
   - ReportController sử dụng `services.finance.urlDaily`
   - Cấu hình trong `application.yaml`: `services.finance.urlDaily`
   
⏳ **Phase 3:** Finance-service cần implement 2 endpoint này
   - `/api/summary/7days`: Dựa trên logic của `/api/summary/month-optimized` nhưng filter 7 ngày gần nhất
   - `/api/summary/daily`: Focus vào 1 ngày cụ thể, so sánh với ngày trước và trung bình 7 ngày
   - Response structure đã được định nghĩa chi tiết trong tài liệu này
   
⏳ **Phase 4:** Testing và optimization
   - Test với các context khác nhau
   - Verify token usage giảm
   - Monitor performance

---

## 8. Đánh Giá: `/api/summary/month-optimized` Cho Chat Không Context

### 8.1. Phân Tích Cấu Trúc Hiện Tại

**Cấu trúc `/api/summary/month-optimized` mà bạn đề xuất:**
```json
{
  "period": { "startDate": "2025-11-01", "endDate": "2025-11-30" },
  "summary": { "totalIncome", "totalExpense", "totalBalance", "savingRate", "averageDailyExpense" },
  "Income": { "topCategories": [...] },
  "Expense": { "topCategories": [...] },
  "goals": [{ "title", "prog", "days", "risk" }],
  "trends": { "expenseChange", "incomeChange" }
}
```

### 8.2. Khi Không Có Context

**Từ code:**
- Gọi tất cả services (finance, learning, gamification)
- User có thể hỏi bất kỳ câu hỏi nào về tài chính
- Prompt không có instruction đặc biệt, chỉ có question và data
- AI tự phân tích và trả lời dựa trên dữ liệu có sẵn

### 8.3. Đánh Giá Phù Hợp

#### ✅ **PHÙ HỢP** cho các câu hỏi:

1. **Câu hỏi tổng quan:**
   - "Tình hình tài chính của tôi tháng này như thế nào?"
   - "Tôi đã tiết kiệm được bao nhiêu tháng này?"
   - "Tỷ lệ tiết kiệm của tôi là bao nhiêu?"

2. **Câu hỏi về xu hướng:**
   - "Chi tiêu tháng này so với tháng trước như thế nào?"
   - "Thu nhập có tăng không?"
   - "Xu hướng chi tiêu của tôi ra sao?"

3. **Câu hỏi về categories:**
   - "Tôi chi nhiều nhất vào hạng mục nào?"
   - "Top 3 hạng mục chi tiêu của tôi là gì?"
   - "Tôi có nên giảm chi tiêu ở hạng mục nào không?"

4. **Câu hỏi về goals:**
   - "Mục tiêu tài chính của tôi đang ở đâu?"
   - "Mục tiêu nào có nguy cơ thất bại?"
   - "Tôi nên ưu tiên mục tiêu nào?"

#### ⚠️ **KHÔNG PHÙ HỢP** cho các câu hỏi:

1. **Câu hỏi về giao dịch gần đây:**
   - "Giao dịch gần đây nhất của tôi là gì?"
   - "Hôm qua tôi chi bao nhiêu?"
   - "Tôi đã chi gì trong 3 ngày qua?"

2. **Câu hỏi chi tiết theo ngày:**
   - "Ngày nào tôi chi nhiều nhất tuần này?"
   - "Chi tiêu hôm nay so với hôm qua như thế nào?"
   - "Tôi có giao dịch nào hôm nay không?"

3. **Câu hỏi real-time:**
   - "Tôi đã chi bao nhiêu tuần này?"
   - "Tiến độ tiết kiệm 7 ngày qua như thế nào?"
   - "Có gì bất thường trong chi tiêu gần đây không?"

### 8.4. Kết Luận

**Cấu trúc `/api/summary/month-optimized` CÓ PHÙ HỢP cho `/api/chat/ask` không có context, NHƯNG:**

#### ✅ **Phù hợp vì:**
1. **Đủ thông tin tổng quan:** summary, categories, goals, trends
2. **Phù hợp với câu hỏi tổng quát:** Khi không có context, user thường hỏi về tình hình tổng thể
3. **Có xu hướng:** trends giúp AI phân tích và so sánh
4. **Có goals:** Đủ để tư vấn về mục tiêu tài chính

#### ⚠️ **Hạn chế:**
1. **Không có dữ liệu chi tiết theo ngày:** Không thể trả lời câu hỏi về giao dịch gần đây
2. **Dữ liệu 1 tháng có thể quá rộng:** Một số câu hỏi cần dữ liệu ngắn hạn hơn
3. **Không có daily breakdown:** Không thể phân tích chi tiết theo ngày

### 8.5. Đề Xuất

**Option 1: Giữ nguyên `/api/summary/month-optimized` cho chat không context**
- ✅ Phù hợp cho câu hỏi tổng quan (chiếm đa số)
- ⚠️ Không trả lời được câu hỏi về giao dịch gần đây
- 💡 **Giải pháp:** Nếu user hỏi về giao dịch gần đây, AI có thể trả lời: "Tôi không có dữ liệu chi tiết về giao dịch gần đây. Bạn có thể xem trong mục Giao dịch."

**Option 2: Dùng `/api/summary/7days` cho chat không context**
- ✅ Có dữ liệu chi tiết hơn, phù hợp với câu hỏi real-time
- ✅ Có daily breakdown
- ⚠️ Thiếu dữ liệu tổng quan dài hạn (1 tháng)
- 💡 **Giải pháp:** Có thể kết hợp cả 2: 7days cho chi tiết, month-optimized cho tổng quan

**Option 3: Hybrid Approach (Khuyến nghị)**
- Khi không có context: Gọi cả `/api/summary/month-optimized` và `/api/summary/7days`
- AI có đủ dữ liệu để trả lời cả câu hỏi tổng quan và chi tiết
- ⚠️ Tăng token usage nhưng tăng độ chính xác

### 8.6. Khuyến Nghị Cuối Cùng

**Cho chat không context, nên dùng `/api/summary/month-optimized` vì:**

1. ✅ **Phù hợp với use case chính:** User không có context thường hỏi câu hỏi tổng quan
2. ✅ **Đủ thông tin:** Có summary, categories, goals, trends
3. ✅ **Tối ưu token:** Dữ liệu đã được tổng hợp, không quá chi tiết
4. ✅ **Dễ hiểu:** AI có thể dễ dàng phân tích và trả lời

**Lưu ý:**
- Nếu user hỏi về giao dịch gần đây, AI có thể hướng dẫn user xem trong mục Giao dịch
- Có thể bổ sung thêm field `recentTransactions` (top 5-10 giao dịch gần nhất) vào response nếu cần

---


> Chi tiết triển khai cho Option 2 (bao gồm các hướng 1, 3, 6) đã được chuyển sang `GUIDANCE_OPTION_1_3_6.md` để bạn dễ tra cứu hơn.

---

## 9. Kết Luận

**Có, bạn NÊN yêu cầu Finance-service cung cấp thêm các API chi tiết hơn.**

**Lý do chính:**
1. Endpoint hiện tại không đủ dữ liệu cho từng use case cụ thể
2. Tối ưu hiệu năng và token usage
3. Giảm complexity cho AI-service
4. Tăng tính nhất quán và dễ bảo trì

**Đề xuất cụ thể:**

1. **Xây dựng `/api/summary/7days` cho `/api/chat/ask`:**
   - Dữ liệu 7 ngày gần nhất
   - Phù hợp cho context-based analysis (SPENDING_WIDGET, SAVING_WIDGET, GOAL_WIDGET)
   - Bao gồm daily breakdown, recent deposits, alerts
   - So sánh với 7 ngày trước đó

2. **Xây dựng `/api/summary/daily` cho `/api/reports/daily`:**
   - Dữ liệu của 1 ngày cụ thể
   - So sánh với ngày trước và trung bình 7 ngày
   - Tổng hợp ngắn gọn với highlights
   - Phù hợp để AI tạo báo cáo 3 dòng

3. **Giữ `/api/summary/month-optimized`:**
   - Đã có cấu trúc tốt
   - Phù hợp cho monthly overview
   - Có thể dùng cho các tính năng khác

**Lợi ích:**
- Tối ưu token usage: Dữ liệu phù hợp với từng use case, không thừa
- Tăng độ chính xác: Dữ liệu 7 ngày/1 ngày phù hợp hơn monthly data cho real-time analysis
- Dễ bảo trì: Logic tính toán tập trung ở Finance-service
- Performance tốt hơn: Ít dữ liệu hơn, xử lý nhanh hơn

