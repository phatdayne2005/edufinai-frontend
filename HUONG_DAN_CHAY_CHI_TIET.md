# Hướng dẫn chạy hệ thống EduFinAI - Chi tiết từng bước

## 📋 Tổng quan

Hệ thống EduFinAI bao gồm các thành phần sau:
1. **Eureka Server** (Port 8761) - Service Discovery
2. **Auth Service** (Port 9000) - Xác thực và quản lý người dùng
3. **Gateway** (Port 8080) - API Gateway với CORS
4. **Frontend** (Port 3000) - React Application
5. **MySQL Database** (Port 3306) - Database

## ⚙️ Yêu cầu hệ thống

- **Java**: JDK 21 trở lên
- **Maven**: 3.6+ (hoặc sử dụng Maven Wrapper `mvnw`)
- **Node.js**: 14+ và npm
- **MySQL**: 8.0+ đang chạy
- **IDE**: IntelliJ IDEA, Eclipse, hoặc VS Code (tùy chọn)

---

## 🗄️ BƯỚC 1: Chuẩn bị Database MySQL

### 1.1. Khởi động MySQL Server

Đảm bảo MySQL đang chạy trên port 3306 (mặc định).

### 1.2. Tạo Database

Mở MySQL Command Line hoặc MySQL Workbench và chạy:

```sql
CREATE DATABASE IF NOT EXISTS identity;
```

### 1.3. Kiểm tra kết nối

Auth Service sẽ tự động tạo các bảng khi khởi động (do `ddl-auto: update`).

**Thông tin kết nối mặc định:**
- **Host**: `localhost:3306`
- **Database**: `identity`
- **Username**: `root`
- **Password**: `123456`

> **Lưu ý**: Nếu MySQL của bạn có username/password khác, bạn có thể:
> - Sửa trong file `edufinai/auth-service/src/main/resources/application.yaml`
> - Hoặc set environment variables: `DBMS_USERNAME` và `DBMS_PASSWORD`

---

## 🔍 BƯỚC 2: Khởi động Eureka Server (Port 8761)

Eureka Server là service discovery, các service khác sẽ đăng ký với nó.

### 2.1. Mở Terminal/Command Prompt

### 2.2. Di chuyển đến thư mục Eureka

```bash
cd edufinai/eureka
```

### 2.3. Chạy Eureka Server

**Trên Windows:**
```bash
.\mvnw.cmd spring-boot:run
```

**Trên Linux/Mac:**
```bash
./mvnw spring-boot:run
```

**Hoặc nếu đã cài Maven:**
```bash
mvn spring-boot:run
```

### 2.4. Kiểm tra Eureka đã chạy

Mở trình duyệt và truy cập:
```
http://localhost:8761
```

Bạn sẽ thấy Eureka Dashboard. Lúc này chưa có service nào đăng ký (sẽ có sau khi chạy Auth Service và Gateway).

> **Lưu ý**: Giữ terminal này mở, đừng tắt. Eureka cần chạy liên tục.

---

## 🔐 BƯỚC 3: Khởi động Auth Service (Port 9000)

### 3.1. Mở Terminal/Command Prompt MỚI

> **Quan trọng**: Mở terminal mới, không đóng terminal của Eureka.

### 3.2. Di chuyển đến thư mục Auth Service

```bash
cd edufinai/auth-service
```

### 3.3. Kiểm tra cấu hình Eureka (nếu cần)

Mở file `src/main/resources/application.yaml` và đảm bảo có cấu hình Eureka:

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
    register-with-eureka: true
    fetch-registry: true
```

> **Lưu ý**: Nếu file `application.yaml` chưa có phần `eureka`, bạn cần thêm vào.

### 3.4. Chạy Auth Service

**Trên Windows:**
```bash
.\mvnw.cmd spring-boot:run
```

**Trên Linux/Mac:**
```bash
./mvnw spring-boot:run
```

**Hoặc nếu đã cài Maven:**
```bash
mvn spring-boot:run
```

### 3.5. Kiểm tra Auth Service đã chạy

Bạn sẽ thấy log như:
```
Started AuthServiceApplication in X.XXX seconds
```

**Kiểm tra trong Eureka Dashboard:**
- Mở lại `http://localhost:8761`
- Bạn sẽ thấy service **AUTH-SERVICE** đã đăng ký

**Kiểm tra trực tiếp Auth Service:**
- Mở trình duyệt: `http://localhost:9000/identity/auth/token`
- Nếu thấy lỗi 405 (Method Not Allowed) là bình thường (vì cần POST, không phải GET)
- Nếu thấy lỗi 404, kiểm tra lại context-path: `/identity`

> **Lưu ý**: Giữ terminal này mở, đừng tắt.

---

## 🌐 BƯỚC 4: Khởi động Gateway (Port 8080)

### 4.1. Mở Terminal/Command Prompt MỚI

> **Quan trọng**: Mở terminal mới, không đóng các terminal trước.

### 4.2. Di chuyển đến thư mục Gateway

```bash
cd edufinai/gateway
```

### 4.3. Chạy Gateway

**Trên Windows:**
```bash
.\mvnw.cmd spring-boot:run
```

**Trên Linux/Mac:**
```bash
./mvnw spring-boot:run
```

**Hoặc nếu đã cài Maven:**
```bash
mvn spring-boot:run
```

### 4.4. Kiểm tra Gateway đã chạy

Bạn sẽ thấy log như:
```
Started GatewayApplication in X.XXX seconds
```

**Kiểm tra trong Eureka Dashboard:**
- Mở lại `http://localhost:8761`
- Bạn sẽ thấy service **GATEWAY** đã đăng ký

**Kiểm tra Gateway routing:**
- Mở trình duyệt: `http://localhost:8080/auth/users`
- Nếu thấy lỗi 401 (Unauthorized) là bình thường (vì cần token)
- Nếu thấy lỗi 404, kiểm tra lại route configuration

> **Lưu ý**: Giữ terminal này mở, đừng tắt.

---

## 🎨 BƯỚC 5: Khởi động Frontend (Port 3000)

### 5.1. Mở Terminal/Command Prompt MỚI

> **Quan trọng**: Mở terminal mới, không đóng các terminal trước.

### 5.2. Di chuyển đến thư mục Frontend

```bash
cd edufinai-frontend
```

### 5.3. Cài đặt dependencies (nếu chưa cài)

```bash
npm install
```

> **Lưu ý**: Chỉ cần chạy lần đầu, hoặc khi có thay đổi `package.json`.

### 5.4. Chạy Frontend

```bash
npm start
```

Frontend sẽ tự động mở tại: **http://localhost:3000**

> **Lưu ý**: Giữ terminal này mở, đừng tắt.

---

## ✅ BƯỚC 6: Kiểm tra toàn bộ hệ thống

### 6.1. Kiểm tra các service đang chạy

**Eureka Dashboard** (`http://localhost:8761`):
- ✅ **EUREKA-SERVER** (chính nó)
- ✅ **AUTH-SERVICE** (port 9000)
- ✅ **GATEWAY** (port 8080)

### 6.2. Test đăng ký tài khoản mới

1. Mở `http://localhost:3000`
2. Điều hướng đến trang **Đăng ký** (Register)
3. Điền thông tin:
   - **Username**: tối thiểu 4 ký tự (ví dụ: `testuser`)
   - **Password**: tối thiểu 6 ký tự (ví dụ: `password123`)
   - Các trường khác tùy chọn
4. Click **Đăng ký**
5. Nếu thành công, bạn sẽ được tự động đăng nhập

### 6.3. Test đăng nhập

1. Nếu chưa đăng nhập, điều hướng đến trang **Đăng nhập** (Login)
2. Nhập:
   - **Username**: `testuser` (hoặc username đã tạo)
   - **Password**: `password123`
3. Click **Đăng nhập**
4. Nếu thành công, bạn sẽ được chuyển đến trang chính

### 6.4. Test API qua Gateway (tùy chọn)

Mở trình duyệt hoặc Postman và test:

**1. Đăng nhập qua Gateway:**
```bash
POST http://localhost:8080/auth/auth/token
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Response:**
```json
{
  "code": 1000,
  "result": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "authenticated": true
  }
}
```

**2. Lấy thông tin user (cần token):**
```bash
GET http://localhost:8080/auth/users/my-info
Authorization: Bearer <token_từ_bước_1>
```

---

## 🔧 Troubleshooting

### ❌ Lỗi: "Port 8761 already in use"

**Nguyên nhân**: Eureka đã chạy hoặc port bị chiếm.

**Giải pháp**:
- Kiểm tra xem Eureka đã chạy chưa
- Hoặc đổi port trong `eureka/src/main/resources/application.properties`

### ❌ Lỗi: "Port 9000 already in use"

**Nguyên nhân**: Auth Service đã chạy hoặc port bị chiếm.

**Giải pháp**:
- Kiểm tra xem Auth Service đã chạy chưa
- Hoặc đổi port trong `auth-service/src/main/resources/application.yaml`

### ❌ Lỗi: "Port 8080 already in use"

**Nguyên nhân**: Gateway đã chạy hoặc port bị chiếm.

**Giải pháp**:
- Kiểm tra xem Gateway đã chạy chưa
- Hoặc đổi port trong `gateway/src/main/resources/application.yml`

### ❌ Lỗi: "Port 3000 already in use"

**Nguyên nhân**: Frontend đã chạy hoặc port bị chiếm.

**Giải pháp**:
- Frontend sẽ tự động hỏi bạn có muốn dùng port khác không
- Hoặc chạy: `PORT=3001 npm start`

### ❌ Lỗi: "Cannot connect to database"

**Nguyên nhân**: MySQL chưa chạy hoặc thông tin kết nối sai.

**Giải pháp**:
1. Kiểm tra MySQL đang chạy
2. Kiểm tra username/password trong `application.yaml`
3. Kiểm tra database `identity` đã tạo chưa

### ❌ Lỗi: "Unable to find instance for AUTH-SERVICE" hoặc "AUTH-SERVICE not found in Eureka"

**Nguyên nhân**: Gateway không tìm thấy AUTH-SERVICE trong Eureka registry.

**Giải pháp từng bước**:

#### Bước 1: Kiểm tra Eureka đang chạy
1. Mở trình duyệt: `http://localhost:8761`
2. Đảm bảo Eureka Dashboard hiển thị

#### Bước 2: Kiểm tra Auth Service đã đăng ký với Eureka
1. Trong Eureka Dashboard (`http://localhost:8761`), tìm phần **Instances currently registered with Eureka**
2. Kiểm tra xem có service tên **AUTH-SERVICE** không
3. Nếu không thấy, Auth Service chưa đăng ký thành công

#### Bước 3: Kiểm tra log của Auth Service
Trong terminal chạy Auth Service, tìm các log:
- ✅ **Thành công**: `DiscoveryClient_AUTH-SERVICE - registration status: 204` hoặc `Registered instance AUTH-SERVICE`
- ❌ **Lỗi**: `Cannot execute request on any known server` hoặc `Connection refused`

#### Bước 4: Kiểm tra cấu hình Auth Service
Đảm bảo file `edufinai/auth-service/src/main/resources/application.yaml` có:
```yaml
spring:
  application:
    name: AUTH-SERVICE  # Phải viết hoa và khớp với Gateway

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
    register-with-eureka: true
    fetch-registry: true
```

#### Bước 5: Kiểm tra Auth Service đang chạy
1. Kiểm tra log: `Started AuthServiceApplication`
2. Test trực tiếp: `http://localhost:9000/identity/auth/token` (POST request)

#### Bước 6: Restart Auth Service (nếu cần)
1. Dừng Auth Service (Ctrl+C)
2. Đợi 5-10 giây
3. Chạy lại: `.\mvnw.cmd spring-boot:run` (Windows) hoặc `./mvnw spring-boot:run` (Linux/Mac)
4. Đợi log: `DiscoveryClient_AUTH-SERVICE - registration status: 204`
5. Kiểm tra lại Eureka Dashboard

#### Bước 7: Kiểm tra Gateway đã fetch registry
1. Trong log của Gateway, tìm: `Fetching registry from Eureka`
2. Nếu Gateway chạy trước Auth Service, restart Gateway sau khi Auth Service đã đăng ký

#### Bước 8: Kiểm tra tên service trong Eureka
- Eureka có thể tự động uppercase tên service
- Trong Eureka Dashboard, tìm service có tên **AUTH-SERVICE** (viết hoa)
- Nếu thấy tên khác (ví dụ: `auth-service`), cập nhật Gateway route để khớp

#### Bước 9: Test trực tiếp qua Gateway
```bash
# Test đăng ký user
curl -X POST http://localhost:8080/auth/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Nếu vẫn lỗi, thử giải pháp tạm thời:**
Thay đổi Gateway route để gọi trực tiếp Auth Service (không qua Eureka):
```yaml
# Trong gateway/src/main/resources/application.yml
- id: auth-service
  uri: http://localhost:9000  # Gọi trực tiếp thay vì lb://AUTH-SERVICE
  predicates:
    - Path=/auth/**
  filters:
    - name: RewritePath
      args:
        regexp: /auth/?(?<segment>.*)
        replacement: /identity/${segment}
```
> **Lưu ý**: Giải pháp này chỉ dùng tạm thời. Nên sửa để dùng Eureka đúng cách.

### ❌ Lỗi: "CORS error" trong browser console

**Nguyên nhân**: Gateway chưa cấu hình CORS đúng.

**Giải pháp**:
1. Kiểm tra Gateway đang chạy: `http://localhost:8080`
2. Kiểm tra CORS config trong `gateway/src/main/resources/application.yml`
3. Đảm bảo `allowedOrigins` có `http://localhost:3000`

### ❌ Lỗi: "401 Unauthenticated" khi gọi API

**Nguyên nhân**: Token không hợp lệ hoặc chưa gửi token.

**Giải pháp**:
1. Kiểm tra token đã được lưu trong localStorage chưa
2. Kiểm tra token còn valid không (gọi `/auth/auth/introspect`)
3. Kiểm tra request có header `Authorization: Bearer <token>` không

---

## 📝 Tóm tắt các cổng (Ports)

| Service | Port | URL |
|---------|------|-----|
| Eureka Server | 8761 | http://localhost:8761 |
| Auth Service | 9000 | http://localhost:9000/identity |
| Gateway | 8080 | http://localhost:8080 |
| Frontend | 3000 | http://localhost:3000 |
| MySQL | 3306 | localhost:3306 |

---

## 🎯 Thứ tự khởi động (Tóm tắt)

1. ✅ **MySQL** - Đảm bảo đang chạy
2. ✅ **Eureka Server** (Port 8761)
3. ✅ **Auth Service** (Port 9000)
4. ✅ **Gateway** (Port 8080)
5. ✅ **Frontend** (Port 3000)

---

## 📚 Tài liệu tham khảo

- **API Documentation**: `edufinai/auth-service/API_DOCUMENTATION.md`
- **Frontend Guide**: `edufinai-frontend/HUONG_DAN_CHAY_FRONTEND.md`
- **JWT Guide**: `edufinai/gateway/JWT_AUTHENTICATION_GUIDE.md`

---

## 💡 Tips

1. **Mở nhiều terminal**: Mỗi service nên chạy trong terminal riêng để dễ theo dõi log
2. **Kiểm tra log**: Luôn xem log của từng service để phát hiện lỗi sớm
3. **Eureka Dashboard**: Thường xuyên kiểm tra Eureka để đảm bảo các service đã đăng ký
4. **Browser DevTools**: Mở Console và Network tab để debug frontend
5. **Postman/Insomnia**: Dùng để test API trực tiếp

---

**Chúc bạn chạy thành công! 🎉**

