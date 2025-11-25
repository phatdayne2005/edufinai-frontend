# Hướng Dẫn Chạy Frontend với Docker

## Yêu Cầu
- Docker đã được cài đặt
- Docker Compose (tùy chọn, nếu dùng docker-compose)

## Cách 1: Sử dụng Docker Compose (Khuyến nghị)

### Build và chạy:
```bash
docker-compose up --build
```

### Chạy ở background:
```bash
docker-compose up -d --build
```

### Dừng container:
```bash
docker-compose down
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Cách 2: Sử dụng Docker trực tiếp

### Build image:
```bash
docker build -t finance-edu-frontend .
```

### Chạy container:
```bash
docker run -d -p 3000:80 --name finance-edu-frontend finance-edu-frontend
```

### Xem logs:
```bash
docker logs -f finance-edu-frontend
```

### Dừng và xóa container:
```bash
docker stop finance-edu-frontend
docker rm finance-edu-frontend
```

## Cấu Trúc Docker

### Multi-stage Build
1. **Build Stage**: Sử dụng Node.js để build React app
2. **Production Stage**: Sử dụng Nginx để serve static files

### Nginx Configuration
- Port: 80 (trong container), map ra 3000 (host)
- Hỗ trợ React Router (SPA routing)
- Gzip compression enabled
- Cache static assets
- Health check endpoint tại `/health`

## Lưu Ý Quan Trọng

### API Gateway URL
Hiện tại các service APIs đang hardcode `http://localhost:8080`. Khi chạy trong Docker:

1. **Nếu Gateway chạy trên host machine:**
   - Sử dụng `host.docker.internal:8080` thay vì `localhost:8080`
   - Hoặc dùng IP của host machine

2. **Nếu Gateway cũng chạy trong Docker:**
   - Sử dụng service name trong docker-compose network
   - Ví dụ: `http://gateway:8080` (nếu service name là `gateway`)

### Environment Variables (Tùy chọn)
Nếu muốn config API URL qua environment variables, cần:
1. Tạo file `.env` với các biến cần thiết
2. Sử dụng `REACT_APP_*` prefix cho React env vars
3. Rebuild image sau khi thay đổi

Ví dụ `.env`:
```
REACT_APP_API_GATEWAY_URL=http://localhost:8080
```

## Troubleshooting

### Container không start
```bash
# Kiểm tra logs
docker logs finance-edu-frontend

# Kiểm tra container status
docker ps -a
```

### Port đã được sử dụng
Thay đổi port mapping trong `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Thay 3000 bằng port khác
```

### Build fails
```bash
# Xóa cache và build lại
docker-compose build --no-cache
```

### Cần rebuild sau khi thay đổi code
```bash
docker-compose up --build
```

## Health Check
Kiểm tra container có chạy không:
```bash
curl http://localhost:3000/health
```

Kết quả mong đợi: `healthy`

