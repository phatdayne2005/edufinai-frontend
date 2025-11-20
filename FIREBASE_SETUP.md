## Firebase Push Notification Setup

Làm theo các bước sau để Firebase hoạt động trong dự án:

### 1. Tạo dự án Firebase & bật Cloud Messaging
1. Vào [Firebase Console](https://console.firebase.google.com/), tạo (hoặc chọn) project.
2. Truy cập **Build → Cloud Messaging** và bật Web Push.
3. Sao chép các thông số: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`, `VAPID key`.

### 2. Thêm biến môi trường
Tạo file `.env.local` (hoặc sử dụng file env hiện có, KHÔNG commit lên git) với nội dung:
```
REACT_APP_FIREBASE_API_KEY=xxxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=xxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxx
REACT_APP_FIREBASE_APP_ID=1:xxxxxxxxxx:web:xxxxxxxxxx
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_FIREBASE_VAPID_KEY=BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Tạo config riêng cho Service Worker
1. Copy file mẫu:
   ```
   cp public/firebase-config.sample.js public/firebase-config.js
   ```
2. Điền các giá trị thực tế vào `public/firebase-config.js`.
3. File `public/firebase-config.js` đã được thêm vào `.gitignore`, nên khóa Firebase không bị đẩy lên git.

### 4. Triển khai hosting / HTTPS
Web Push yêu cầu chạy trên HTTPS (hoặc `localhost`). Nếu deploy lên môi trường thật, đảm bảo domain hỗ trợ HTTPS.

### 5. Kiểm tra
1. Chạy `npm start`.
2. Đăng nhập → hệ thống hỏi bật thông báo → chấp nhận.
3. Kiểm tra DevTools > Application > Storage > IndexedDB để thấy token đã được lưu.
4. Backend nhận token (endpoint `/notification/register-token`), có thể gửi thử thông báo.

---

> Nếu cần thay đổi UI thông báo nền, chỉnh trong `public/firebase-messaging-sw.js`. Notification click sẽ mở tab hiện có hoặc tạo tab mới với `payload.data.url`.

