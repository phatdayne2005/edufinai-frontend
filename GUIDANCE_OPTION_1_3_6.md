# Hướng Dẫn Option 1 + 3 + 6 (Phiên bản Dễ Hiểu)

> Nghĩ về hệ thống của chúng ta như một nhóm bạn nhỏ đang giúp nhau trả lời câu hỏi “Mình đã tiêu tiền thế nào?”. Mỗi bạn có một nhiệm vụ riêng, và chúng ta sẽ kể chuyện theo cách thật đơn giản.

---

## 1. Ba “người bạn” siêu nhân là ai?

| Tên gọi | Biệt danh | Nhiệm vụ chính | Ví dụ cực dễ hiểu |
|---------|-----------|----------------|-------------------|
| Option 1 | **Người nhắc bài** | Thì thầm với AI: “Nếu không có dữ liệu, nhớ nói bé xem trong mục Giao dịch nha!” | Giống cô giáo nhắc học sinh nhớ dặn bạn bè khi quên bài |
| Option 3 | **Bạn gác cổng từ khóa** | Nghe câu hỏi xem có chữ “giao dịch gần đây”, “hôm qua”… hay không | Giống người gác cổng chỉ mở đèn đỏ khi nghe đúng mật khẩu |
| Option 6 | **Cuốn sổ mẫu** | Chuẩn bị câu trả lời mẫu (template) để AI dùng khi cần | Giống tập thơ mẫu: thiếu ý thì mở ra đọc |

---

## 2. Kể chuyện từng bạn

### 2.1. Option 1 – “Người nhắc bài”
- Trước khi AI trả lời, ta viết thêm dòng ghi nhớ vào prompt:  
  “Nếu không có dữ liệu chi tiết, hãy nhẹ nhàng bảo user mở mục Giao dịch nhé.”
- Khi AI nhìn thấy lời nhắc, AI sẽ biết phải trả lời kiểu:  
  “Mình chưa có bảng giao dịch chi tiết đâu. Bạn mở mục *Giao dịch* sẽ thấy ngay nhé!”

**Ví dụ nhỏ:**
> User hỏi: “Hôm qua mình mua gì?”  
> AI (được nhắc trước): “Mình không có danh sách chi tiết cho ngày hôm qua. Bạn mở mục **Giao dịch** để xem đầy đủ nhé.”

### 2.2. Option 3 – “Bạn gác cổng từ khóa”
- Bạn này nghe câu hỏi để xem user nói “giao dịch”, “hôm qua”, “tuần này”... hay không.
- Nếu nghe thấy, bạn ấy bật cờ đỏ nói với AI: “Ê, nhớ áp dụng template hướng dẫn nha!”
- Nếu không nghe gì đặc biệt, bạn ấy im lặng cho AI trả lời bình thường.

**Danh sách từ khóa được phát hiện (theo code hiện tại):**

**Finance - Giao dịch:**
- "giao dịch gần đây", "giao dịch hôm qua", "giao dịch hôm nay"
- "chi tiêu tuần này", "chi tiêu tháng này"
- "đã chi gì", "thu nhập nào"
- "ghi chú giao dịch"
- "chi cho mục", "giao dịch theo mục"

**Finance - Mục tiêu:**
- "tiến độ mục tiêu", "mục tiêu đã hoàn thành"
- "mục tiêu sắp hết hạn", "mục tiêu bị chậm"
- "nạp tiền vào mục tiêu", "rút tiền khỏi mục tiêu"

**Finance - Báo cáo:**
- "biểu đồ chi tiêu", "xem chi tiêu theo mục"

**Learning - Bài học:**
- "tiếp tục bài", "tiếp tục khóa"
- "bài học đã hoàn thành"
- "bài thuộc chủ đề", "bài cấp độ"
- "điểm quiz", "kết quả bài test", "xem điểm bài"

**Gamification - Thử thách:**
- "chi tiết thử thách", "deadline thử thách"
- "còn bao nhiêu nhiệm vụ", "tiến độ thử thách"

**Gamification - Điểm thưởng:**
- "điểm thưởng", "thử thách nào nhận thưởng"

**Gamification - Bảng xếp hạng:**
- "bảng xếp hạng", "thứ hạng của tôi"
- "top tuần", "top tháng"

**Ví dụ nhỏ:**
- User hỏi “Mình đã tiêu gì trong tuần này?” → Có từ “tuần này” ⇒ bật cờ đỏ (FINANCE_TRANSACTIONS).
- User hỏi “Tình hình tiết kiệm ra sao?” → Không có keyword ⇒ không bật cờ đỏ.

### 2.3. Option 6 – “Cuốn sổ mẫu”
- Trong sổ có nhiều câu trả lời mẫu (templates) cho từng chủ đề.
- Khi bạn gác cổng (Option 3) bật cờ, AI mở sổ và chọn mẫu phù hợp rồi “pha chế” lại cho tự nhiên.

**Danh sách templates hiện có (theo code):**

**FINANCE_TRANSACTIONS:**
```
Message: "Để xem chi tiết giao dịch, bạn mở tab 'Tài chính' → 'Thu chi' rồi chỉnh hai ô ngày về đúng khoảng thời gian cần xem. Nếu muốn xem theo từng mục, chuyển sang 'Báo cáo' và chạm vào mục tương ứng."
Tip: "Trong Thu chi, bạn có thể đặt cùng một ngày cho cả hai ô để xem giao dịch của ngày cụ thể."
```

**FINANCE_GOALS:**
```
Message: "Tiến độ, trạng thái hoàn thành cũng như thao tác nạp/rút nằm tại 'Tài chính' → 'Mục tiêu'. Chọn mục tiêu bạn quan tâm để xem % tiến độ, ngày bắt đầu/kết thúc và dùng nút Nạp hoặc Rút tiền."
Tip: "Phần lịch sử giao dịch mục tiêu cho bạn biết đã nạp hoặc rút bao nhiêu lần."
```

**FINANCE_REPORTS:**
```
Message: "Các biểu đồ chi tiêu nằm ở 'Tài chính' → 'Báo cáo'. Tại đây bạn xem được phân bổ chi tiêu theo từng mục hoặc chuyển mốc thời gian để so sánh."
Tip: "Kéo xuống dưới cùng để xem danh sách mục và số liệu chi tiết."
```

**LEARNING_LESSON:**
```
Message: "Phần học tập chia bài theo Chủ đề và Cấp độ. Bạn mở tab 'Học tập' → 'Lọc bài tập', chọn đúng chủ đề/cấp độ của bài để xem trạng thái hoàn thành và điểm."
Tip: "Hệ thống chưa lưu lịch sử theo thời gian nên bạn cần chọn đúng chủ đề/cấp độ của bài vừa học."
```

**GAMIFICATION_CHALLENGE:**
```
Message: "Chi tiết mỗi thử thách (mô tả, tiến độ %, số nhiệm vụ và hạn hoàn thành) nằm trong tab 'Thử thách'. Bạn chỉ cần chọn thử thách tương ứng để xem thông tin."
Tip: "Nếu muốn tập trung vào thử thách đang làm, hãy ghim nó trong danh sách Thử thách."
```

**GAMIFICATION_POINTS:**
```
Message: "Khi hoàn thành thử thách, hệ thống tự cộng điểm và hiển thị ngay trên thẻ thử thách trong tab 'Thử thách'. Bạn có thể mở lại thẻ đó để xem mức điểm hiện tại."
Tip: "Không cần thao tác nhận thưởng riêng; chỉ cần hoàn thành thử thách là điểm sẽ cập nhật."
```

**GAMIFICATION_LEADERBOARD:**
```
Message: "Bảng xếp hạng nằm trong tab 'Thử thách'. Sử dụng bộ lọc Hằng ngày / Hằng tuần / Hằng tháng / Tất cả để xem thứ hạng và điểm của bạn."
Tip: "Sau khi chọn bộ lọc, hệ thống sẽ highlight vị trí của bạn trong danh sách."
```

---

## 3. Cả ba bạn phối hợp thế nào?

1. **Option 3** nghe câu hỏi trước – nếu có từ khóa đặc biệt thì hú báo động.
2. Khi có báo động:
   - **Option 6** đưa cho AI một câu mẫu (đã thế chỗ dữ liệu như ngày tháng).
   - **Option 1** nhắc AI đưa câu mẫu này vào câu trả lời thật nhẹ nhàng.
3. AI trả lời: vừa đưa thông tin tổng quan đang có, vừa chỉ đường xem giao dịch chi tiết.

---

## 4. Ví dụ đầy đủ (kể như truyện)

**Bối cảnh:**  
User hỏi: “Hôm qua mình đã mua gì và hết bao nhiêu?”

1. **Bạn gác cổng** nghe thấy chữ “hôm qua” → bật cờ báo động.
2. **Cuốn sổ mẫu** đưa template:  
   “Mình không có dữ liệu chi tiết cho ngày {date}. Bạn xem mục Giao dịch và lọc theo ngày {date} nhé.”  
   (ngày {date} sẽ được thay bằng 29/11/2025 chẳng hạn).
3. **Người nhắc bài** nhắc AI: “Nhớ dùng template này nha!”
4. **AI trả lời**:
   ```
   {
     "answer": "Hiện mình chỉ thấy tổng chi tiêu tháng này là 5 triệu, trong đó ăn uống chiếm 40%. Còn danh sách giao dịch ngày 29/11/2025 thì bạn mở mục Giao dịch để xem chi tiết nhé.",
     "tips": [
       "Vào mục Giao dịch rồi lọc ngày 29/11/2025 để xem đầy đủ",
       "Bạn có thể tạo nhãn riêng cho những khoản chi muốn theo dõi kỹ"
     ],
     "disclaimers": [
       "Thông tin chỉ mang tính tham khảo",
       "Hãy cập nhật đủ dữ liệu để hệ thống chính xác hơn"
     ]
   }
   ```

---

## 5. Vì sao cách này tốt?

- **Nhẹ nhàng:** User vẫn nhận được thông tin tổng quan thay vì câu “mình không biết”.
- **Nhất quán:** Template giúp câu trả lời luôn lịch sự, dễ hiểu.
- **Thông minh:** Không phải câu nào cũng dính template; chỉ khi Option 3 phát hiện từ khóa.
- **Dễ mở rộng:** Sau này chỉ cần thêm template mới (ví dụ cho “chi theo cửa hàng”).

---

## 6. Ghi nhớ nhanh (TL;DR)

- Option 1 = Viết lời nhắc để AI luôn nhớ hướng dẫn user.
- Option 3 = Bộ lọc từ khóa để biết khi nào cần hướng dẫn (7 topics: Finance Transactions/Goals/Reports, Learning Lesson, Gamification Challenge/Points/Leaderboard).
- Option 6 = Tủ câu trả lời mẫu, đảm bảo câu chữ gọn gàng (7 templates tương ứng với 7 topics).
- Ba bạn phối hợp → User luôn biết rằng “hãy mở mục Giao dịch nếu muốn chi tiết”.

## 7. Implementation Details

**Trong code:**
- `QuestionAnalyzer.java`: Phát hiện keywords và trả về `GuidanceTopic`
- `GuidanceTemplateService.java`: Cung cấp template cho từng topic
- `PromptBuilder.java`: Đưa guidance message và tip vào prompt (Option 1)
- `ChatController.java`: Tích hợp tất cả 3 options vào flow xử lý

**Flow hoạt động:**
1. User gửi câu hỏi → `QuestionAnalyzer.analyze()` phát hiện keyword
2. Nếu có keyword → `GuidanceTemplateService.getTemplate()` lấy template
3. `PromptBuilder.buildChatPrompt()` đưa template vào prompt với instruction
4. AI nhận prompt có guidance → trả lời tự nhiên kèm hướng dẫn

> Chỉ cần nhớ câu chuyện 3 người bạn này, bạn sẽ không còn rối khi nghĩ về Option 1 + 3 + 6 nữa!

