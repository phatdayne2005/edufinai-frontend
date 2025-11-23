# Gamification Service API Documentation

## Thông tin tổng quan

- **Service Name**: Gamification Service
- **Direct Base URL**: `http://localhost:8203/api/v1/gamify`
- **Gateway Base URL**: `http://localhost:8080/gamification`
- **Version**: 1.0.0
- **Content-Type**: `application/json`

**Lưu ý**: Tất cả requests qua Gateway sẽ được rewrite từ `/gamification/**` → `/api/v1/gamify/**`

---

## Mục lục

1. [Reward APIs](#1-reward-apis)
2. [Leaderboard APIs](#2-leaderboard-apis)
3. [Badge APIs](#3-badge-apis)
4. [Challenge APIs](#4-challenge-apis)
5. [Challenge Progress APIs](#5-challenge-progress-apis)
6. [Authentication & Testing](#6-authentication--testing)

---

## 1. Reward APIs

### 1.1. Thêm phần thưởng cho user

**Endpoint**: `POST /api/v1/gamify/reward`

**Mô tả**: Thêm điểm thưởng và badge cho một user cụ thể.

**Request Body**:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "badge": "QUIZ_MASTER",
  "score": 100,
  "reason": "Hoàn thành 10 quiz trong ngày"
}
```

**Request Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | UUID | ✅ Yes | ID của user nhận thưởng |
| `badge` | String | ✅ Yes | Tên badge (không được để trống) |
| `score` | Integer | ✅ Yes | Điểm số được cộng (không được null) |
| `reason` | String | ❌ No | Lý do trao thưởng (tùy chọn) |

**Response** (200 OK):

```json
{
  "rewardId": "660e8400-e29b-41d4-a716-446655440001",
  "status": "SUCCESS"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `rewardId` | UUID | ID của bản ghi reward vừa tạo |
| `status` | String | Trạng thái xử lý (thường là "SUCCESS") |

**Error Responses**:

- **400 Bad Request**: Dữ liệu request không hợp lệ
  ```json
  {
    "timestamp": "2025-01-15T10:30:00Z",
    "status": 400,
    "error": "Bad Request",
    "message": "User ID không được để trống",
    "path": "/api/v1/gamify/reward"
  }
  ```

- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X POST http://localhost:8080/gamification/reward \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "badge": "QUIZ_MASTER",
    "score": 100,
    "reason": "Hoàn thành 10 quiz trong ngày"
  }'

# Trực tiếp
curl -X POST http://localhost:8203/api/v1/gamify/reward \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "badge": "QUIZ_MASTER",
    "score": 100,
    "reason": "Hoàn thành 10 quiz trong ngày"
  }'
```

---

### 1.2. Lấy thông tin phần thưởng của user hiện tại

**Endpoint**: `GET /api/v1/gamify/reward`

**Mô tả**: Lấy tổng điểm thưởng và chi tiết các phần thưởng của user hiện tại (từ JWT token).

**Authentication**: ✅ Required - Cần JWT token trong header `Authorization: Bearer <token>`

**Path Parameters**: Không có

**Response** (200 OK):

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "totalScore": 1250.0,
  "rewardDetail": [
    {
      "rewardId": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "badge": "QUIZ_MASTER",
      "score": 100,
      "reason": "Hoàn thành 10 quiz trong ngày",
      "sourceType": "CHALLENGE",
      "lessonId": "880e8400-e29b-41d4-a716-446655440003",
      "enrollId": "enroll-123",
      "challengeId": "990e8400-e29b-41d4-a716-446655440004",
      "createdAt": "2025-01-15T10:30:00"
    },
    {
      "rewardId": "770e8400-e29b-41d4-a716-446655440002",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "badge": "STREAK_7",
      "score": 50,
      "reason": "7 ngày liên tiếp hoàn thành quiz",
      "sourceType": "LESSON",
      "lessonId": null,
      "enrollId": null,
      "challengeId": null,
      "createdAt": "2025-01-14T09:15:00"
    }
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `userId` | UUID | ID của user (từ JWT token) |
| `totalScore` | Double | Tổng điểm thưởng hiện tại của user (từ ALLTIME leaderboard) |
| `rewardDetail` | Array | Danh sách chi tiết các phần thưởng đã nhận |
| `rewardDetail[].rewardId` | UUID | ID của phần thưởng |
| `rewardDetail[].userId` | UUID | ID của user nhận thưởng |
| `rewardDetail[].badge` | String | Tên badge (có thể null) |
| `rewardDetail[].score` | Integer | Điểm số của phần thưởng |
| `rewardDetail[].reason` | String | Lý do trao thưởng (có thể null) |
| `rewardDetail[].sourceType` | String (Enum) | Loại nguồn: `CHALLENGE`, `LESSON`, `MANUAL`, etc. (có thể null) |
| `rewardDetail[].lessonId` | UUID | ID của lesson liên quan (có thể null) |
| `rewardDetail[].enrollId` | String | ID của enrollment liên quan (có thể null) |
| `rewardDetail[].challengeId` | UUID | ID của challenge liên quan (có thể null) |
| `rewardDetail[].createdAt` | DateTime | Thời gian nhận thưởng (LocalDateTime) |

**Error Responses**:

- **401 Unauthorized**: Không có hoặc token không hợp lệ
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/reward \
  -H "Authorization: Bearer <token>"

# Trực tiếp
curl -X GET http://localhost:8203/api/v1/gamify/reward \
  -H "Authorization: Bearer <token>"
```

---

## 2. Leaderboard APIs

### 2.1. Lấy bảng xếp hạng

**Endpoint**: `GET /api/v1/gamify/leaderboard/{type}/{topNumber}`

**Mô tả**: Lấy danh sách top N users trong bảng xếp hạng theo loại (DAILY, WEEKLY, MONTHLY, ALLTIME).

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | String | ✅ Yes | Loại leaderboard: `DAILY`, `WEEKLY`, `MONTHLY`, `ALLTIME` (không phân biệt hoa thường) |
| `topNumber` | Integer | ✅ Yes | Số lượng user top muốn lấy (ví dụ: 10, 20, 50) |

**Response** (200 OK):

```json
{
  "result": [
    {
      "name": "",
      "score": 5000.0,
      "top": 1
    },
    {
      "name": "",
      "score": 4500.0,
      "top": 2
    },
    {
      "name": "",
      "score": 4000.0,
      "top": 3
    }
  ],
  "status": "SUCCESS"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `result` | Array | Danh sách các entry trong leaderboard, sắp xếp theo điểm giảm dần |
| `result[].name` | String | Tên user (thường là empty string) |
| `result[].score` | Double | Tổng điểm của user trong khoảng thời gian tương ứng |
| `result[].top` | Integer | Vị trí xếp hạng (1 = top 1, 2 = top 2, ...) |
| `status` | String | Trạng thái response (thường là "SUCCESS") |

**Leaderboard Types**:

| Type | Mô tả |
|------|-------|
| `DAILY` | Bảng xếp hạng theo ngày (từ 00:00 đến 23:59 cùng ngày) |
| `WEEKLY` | Bảng xếp hạng theo tuần (từ đầu tuần đến cuối tuần) |
| `MONTHLY` | Bảng xếp hạng theo tháng (từ đầu tháng đến cuối tháng) |
| `ALLTIME` | Bảng xếp hạng tổng thể (tất cả thời gian) |

**Error Responses**:

- **400 Bad Request**: Loại leaderboard không hợp lệ
  ```json
  {
    "result": [],
    "status": "Invalid leaderboard type. Valid types: DAILY, WEEKLY, MONTHLY, ALLTIME"
  }
  ```

- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Lấy top 10 daily leaderboard (qua Gateway)
curl -X GET http://localhost:8080/gamification/leaderboard/DAILY/10 \
  -H "Authorization: Bearer <token>"

# Lấy top 20 weekly leaderboard (trực tiếp)
curl -X GET http://localhost:8203/api/v1/gamify/leaderboard/WEEKLY/20 \
  -H "Authorization: Bearer <token>"

# Lấy top 50 all-time leaderboard
curl -X GET http://localhost:8080/gamification/leaderboard/ALLTIME/50 \
  -H "Authorization: Bearer <token>"
```

---

### 2.2. Lấy vị trí xếp hạng của user hiện tại

**Endpoint**: `GET /api/v1/gamify/leaderboard/{type}/me`

**Mô tả**: Lấy vị trí xếp hạng và điểm số của user hiện tại (từ JWT token) trong leaderboard.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | String | ✅ Yes | Loại leaderboard: `DAILY`, `WEEKLY`, `MONTHLY`, `ALLTIME` |

**Authentication**: ✅ Required - Cần JWT token trong header `Authorization: Bearer <token>`

**Response** (200 OK):

```json
{
  "code": 200,
  "result": {
    "name": "",
    "score": 3500.0,
    "top": 5
  },
  "message": "SUCCESS"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `code` | Integer | HTTP status code (200 = success) |
| `result` | Object | Thông tin xếp hạng của user |
| `result.name` | String | Tên user (thường là empty string) |
| `result.score` | Double | Tổng điểm của user trong khoảng thời gian tương ứng |
| `result.top` | Integer | Vị trí xếp hạng (1 = top 1, -1 nếu không có trong top) |
| `message` | String | Thông báo (thường là "SUCCESS") |

**Error Responses**:

- **401 Unauthorized**: Không có hoặc token không hợp lệ
- **400 Bad Request**: Loại leaderboard không hợp lệ
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/leaderboard/DAILY/me \
  -H "Authorization: Bearer <token>"

# Trực tiếp
curl -X GET http://localhost:8203/api/v1/gamify/leaderboard/WEEKLY/me \
  -H "Authorization: Bearer <token>"
```

---

## 3. Badge APIs

### 3.1. Lấy danh sách badge của user hiện tại

**Endpoint**: `GET /api/v1/gamify/badge/me`

**Mô tả**: Lấy danh sách tất cả các badge mà user hiện tại đã đạt được.

**Authentication**: ✅ Required - Cần JWT token trong header `Authorization: Bearer <token>`

**Path Parameters**: Không có

**Response** (200 OK):

```json
{
  "code": 200,
  "result": [
    {
      "badgeCode": "QUIZ_MASTER",
      "badgeName": "Quiz Master",
      "badgeDescription": "Hoàn thành nhiều quiz",
      "badgeType": "ACHIEVEMENT",
      "iconUrl": "https://example.com/icons/quiz-master.png",
      "count": 5,
      "firstEarnedAt": "2025-01-10T10:30:00",
      "lastEarnedAt": "2025-01-15T10:30:00",
      "sourceChallengeId": "990e8400-e29b-41d4-a716-446655440004"
    },
    {
      "badgeCode": "STREAK_7",
      "badgeName": "7 Day Streak",
      "badgeDescription": "Hoàn thành quiz 7 ngày liên tiếp",
      "badgeType": "STREAK",
      "iconUrl": "https://example.com/icons/streak-7.png",
      "count": 1,
      "firstEarnedAt": "2025-01-14T09:15:00",
      "lastEarnedAt": "2025-01-14T09:15:00",
      "sourceChallengeId": null
    }
  ],
  "message": "Badges retrieved successfully"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `code` | Integer | HTTP status code (200 = success) |
| `result` | Array | Danh sách badge của user |
| `result[].badgeCode` | String | Mã badge |
| `result[].badgeName` | String | Tên badge |
| `result[].badgeDescription` | String | Mô tả badge |
| `result[].badgeType` | String (Enum) | Loại badge: `ACHIEVEMENT`, `STREAK`, `MILESTONE`, etc. |
| `result[].iconUrl` | String | URL icon của badge (có thể null) |
| `result[].count` | Integer | Số lần đạt được badge này |
| `result[].firstEarnedAt` | DateTime | Thời gian lần đầu đạt được (LocalDateTime, có thể null) |
| `result[].lastEarnedAt` | DateTime | Thời gian lần cuối đạt được (LocalDateTime, có thể null) |
| `result[].sourceChallengeId` | UUID | ID của challenge liên quan (có thể null) |
| `message` | String | Thông báo |

**Error Responses**:

- **401 Unauthorized**: Không có hoặc token không hợp lệ
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/badge/me \
  -H "Authorization: Bearer <token>"

# Trực tiếp
curl -X GET http://localhost:8203/api/v1/gamify/badge/me \
  -H "Authorization: Bearer <token>"
```

---

## 4. Challenge APIs

### 4.1. Lấy danh sách tất cả challenges

**Endpoint**: `GET /api/v1/gamify/challenge`

**Mô tả**: Lấy danh sách tất cả các challenge có trong hệ thống.

**Query Parameters**: Không có

**Response** (200 OK):

```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "title": "Hoàn thành 5 quiz trong ngày",
    "description": "Thử thách hoàn thành 5 bài quiz trong một ngày",
    "type": "QUIZ",
    "scope": "DAILY",
    "targetValue": 5,
    "startAt": "2025-01-15T00:00:00+07:00[Asia/Ho_Chi_Minh]",
    "endAt": "2025-01-15T23:59:59+07:00[Asia/Ho_Chi_Minh]",
    "active": true,
    "rule": "{\"eventType\":\"QUIZ\",\"action\":\"COMPLETE\",\"count\":5}",
    "rewardScore": 100,
    "rewardBadgeCode": "QUIZ_MASTER",
    "maxProgressPerDay": null,
    "createdAt": "2025-01-10T10:00:00+07:00[Asia/Ho_Chi_Minh]",
    "updatedAt": null
  },
  {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "title": "Tiết kiệm 1 triệu trong tuần",
    "description": "Thử thách tiết kiệm 1 triệu đồng trong một tuần",
    "type": "EXPENSE",
    "scope": "WEEKLY",
    "targetValue": 1000000,
    "startAt": "2025-01-13T00:00:00+07:00[Asia/Ho_Chi_Minh]",
    "endAt": "2025-01-19T23:59:59+07:00[Asia/Ho_Chi_Minh]",
    "active": true,
    "rule": "{\"eventType\":\"EXPENSE\",\"action\":\"SAVE\",\"amount\":1000000}",
    "rewardScore": 500,
    "rewardBadgeCode": null,
    "maxProgressPerDay": null,
    "createdAt": "2025-01-10T10:00:00+07:00[Asia/Ho_Chi_Minh]",
    "updatedAt": null
  }
]
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | ID của challenge |
| `title` | String | Tiêu đề challenge |
| `description` | String | Mô tả chi tiết challenge |
| `type` | String (Enum) | Loại challenge: `QUIZ`, `EXPENSE`, `GOAL`, `SCENARIO`, `STREAK`, `CUSTOM` |
| `scope` | String (Enum) | Phạm vi thời gian: `DAILY`, `WEEKLY`, `SEASONAL`, `ONEOFF` |
| `targetValue` | Integer | Mục tiêu cần đạt (số lượng hoặc giá trị) |
| `startAt` | DateTime (ISO 8601) | Thời gian bắt đầu challenge (ZonedDateTime) |
| `endAt` | DateTime (ISO 8601) | Thời gian kết thúc challenge (ZonedDateTime) |
| `active` | Boolean | Trạng thái active của challenge |
| `rule` | String (JSON) | Rule JSON mô tả điều kiện để hoàn thành challenge |
| `rewardScore` | Integer | Điểm thưởng khi hoàn thành challenge (có thể null) |
| `rewardBadgeCode` | String | Mã badge thưởng khi hoàn thành challenge (có thể null) |
| `maxProgressPerDay` | Integer | Giới hạn tiến độ tối đa mỗi ngày (có thể null) |
| `createdAt` | DateTime (ISO 8601) | Thời gian tạo challenge (ZonedDateTime) |
| `updatedAt` | DateTime (ISO 8601) | Thời gian cập nhật gần nhất (ZonedDateTime, có thể null) |

**Challenge Types**:

| Type | Mô tả |
|------|-------|
| `QUIZ` | Challenge liên quan đến quiz |
| `EXPENSE` | Challenge liên quan đến chi tiêu/tiết kiệm |
| `GOAL` | Challenge liên quan đến mục tiêu |
| `SCENARIO` | Challenge theo kịch bản |
| `STREAK` | Challenge về chuỗi ngày liên tiếp |
| `CUSTOM` | Challenge tùy chỉnh |

**Challenge Scopes**:

| Scope | Mô tả |
|-------|-------|
| `DAILY` | Challenge theo ngày |
| `WEEKLY` | Challenge theo tuần |
| `SEASONAL` | Challenge theo mùa/kỳ |
| `ONEOFF` | Challenge một lần |

**Error Responses**:

- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/challenge \
  -H "Authorization: Bearer <token>"

# Trực tiếp
curl -X GET http://localhost:8203/api/v1/gamify/challenge \
  -H "Authorization: Bearer <token>"
```

---

### 4.2. Tạo challenge mới

**Endpoint**: `POST /api/v1/gamify/challenge`

**Mô tả**: Tạo một challenge mới (dành cho admin).

**Request Body**:

```json
{
  "title": "Hoàn thành 10 quiz trong tuần",
  "description": "Thử thách hoàn thành 10 bài quiz trong một tuần",
  "type": "QUIZ",
  "scope": "WEEKLY",
  "targetValue": 10,
  "startAt": "2025-01-13T00:00:00+07:00[Asia/Ho_Chi_Minh]",
  "endAt": "2025-01-19T23:59:59+07:00[Asia/Ho_Chi_Minh]",
  "active": true,
  "rule": "{\"eventType\":\"QUIZ\",\"action\":\"COMPLETE\",\"count\":10}",
  "rewardScore": 200,
  "rewardBadgeCode": "QUIZ_WEEKLY",
  "maxProgressPerDay": null
}
```

**Request Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ Yes | Tiêu đề challenge |
| `description` | String | ✅ Yes | Mô tả chi tiết |
| `type` | String (Enum) | ✅ Yes | Loại challenge: `QUIZ`, `EXPENSE`, `GOAL`, `SCENARIO`, `STREAK`, `CUSTOM` |
| `scope` | String (Enum) | ✅ Yes | Phạm vi: `DAILY`, `WEEKLY`, `SEASONAL`, `ONEOFF` |
| `targetValue` | Integer | ❌ No | Mục tiêu cần đạt (có thể null) |
| `startAt` | DateTime (ISO 8601) | ✅ Yes | Thời gian bắt đầu (ZonedDateTime) |
| `endAt` | DateTime (ISO 8601) | ✅ Yes | Thời gian kết thúc (ZonedDateTime) |
| `active` | Boolean | ✅ Yes | Trạng thái active |
| `rule` | String (JSON) | ✅ Yes | Rule JSON mô tả điều kiện |
| `rewardScore` | Integer | ❌ No | Điểm thưởng khi hoàn thành (có thể null) |
| `rewardBadgeCode` | String | ❌ No | Mã badge thưởng khi hoàn thành (có thể null) |
| `maxProgressPerDay` | Integer | ❌ No | Giới hạn tiến độ tối đa mỗi ngày (có thể null) |

**Lưu ý**: 
- Field `id` sẽ được tự động generate, không cần truyền
- Field `createdAt` sẽ được tự động set khi tạo
- Field `updatedAt` có thể null

**Response** (200 OK):

```json
{
  "challengeId": "aa0e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS"
}
```

**Lưu ý**: Response trả về `ChallengeResponse` với `challengeId` và `status`.

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `challengeId` | UUID | ID của challenge vừa tạo |
| `status` | String | Trạng thái xử lý (thường là "SUCCESS") |

**Error Responses**:

- **400 Bad Request**: Dữ liệu request không hợp lệ
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X POST http://localhost:8080/gamification/challenge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Hoàn thành 10 quiz trong tuần",
    "description": "Thử thách hoàn thành 10 bài quiz trong một tuần",
    "type": "QUIZ",
    "scope": "WEEKLY",
    "targetValue": 10,
    "startAt": "2025-01-13T00:00:00+07:00[Asia/Ho_Chi_Minh]",
    "endAt": "2025-01-19T23:59:59+07:00[Asia/Ho_Chi_Minh]",
    "active": true,
    "rule": "{\"eventType\":\"QUIZ\",\"action\":\"COMPLETE\",\"count\":10}",
    "rewardScore": 200,
    "rewardBadgeCode": "QUIZ_WEEKLY"
  }'
```

---

### 4.3. Xóa challenge

**Endpoint**: `DELETE /api/v1/gamify/challenge/{challengeId}`

**Mô tả**: Xóa một challenge theo ID (dành cho admin).

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `challengeId` | UUID | ✅ Yes | ID của challenge cần xóa |

**Response** (200 OK):

```json
{
  "status": "SUCCESS"
}
```

**Lưu ý**: Response trả về `SimpleResponse` với field `status`.

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `status` | String | Trạng thái xử lý (thường là "SUCCESS") |

**Error Responses**:

- **404 Not Found**: Không tìm thấy challenge với ID tương ứng
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X DELETE http://localhost:8080/gamification/challenge/880e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"

# Trực tiếp
curl -X DELETE http://localhost:8203/api/v1/gamify/challenge/880e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

---

## 5. Challenge Progress APIs

### 5.1. Publish challenge event (Service-to-Service)

**Endpoint**: `POST /api/v1/gamify/challenge/event`

**Mô tả**: Endpoint để các service khác gửi event để cập nhật tiến độ challenge cho user. Đây là endpoint dành cho service-to-service communication.

**Request Body**:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "QUIZ",
  "action": "COMPLETE",
  "lessonId": "880e8400-e29b-41d4-a716-446655440003",
  "enrollId": "enroll-123",
  "score": 85,
  "amount": 1,
  "occurredAt": "2025-01-15T10:30:00+07:00[Asia/Ho_Chi_Minh]"
}
```

**Request Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | UUID | ✅ Yes | ID của user thực hiện event |
| `eventType` | String | ✅ Yes | Loại event: `QUIZ`, `LESSON`, `EXPENSE`, etc. |
| `action` | String | ✅ Yes | Hành động: `COMPLETE`, `START`, `SAVE`, etc. |
| `lessonId` | UUID | ❌ No | ID của lesson liên quan (nếu có) |
| `enrollId` | String | ❌ No | ID của enrollment liên quan (nếu có) |
| `score` | Integer | ❌ No | Điểm số (nếu có) |
| `amount` | Integer | ❌ No | Số lượng (mặc định là 1) |
| `occurredAt` | DateTime (ISO 8601) | ❌ No | Thời gian xảy ra event (ZonedDateTime, mặc định là hiện tại) |

**Response** (200 OK):

```json
{
  "code": 200,
  "result": null,
  "message": "Event processed"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `code` | Integer | HTTP status code (200 = success) |
| `result` | null | Không có data trả về |
| `message` | String | Thông báo |

**Error Responses**:

- **400 Bad Request**: Dữ liệu request không hợp lệ (thiếu userId, eventType, hoặc action)
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X POST http://localhost:8080/gamification/challenge/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "QUIZ",
    "action": "COMPLETE",
    "lessonId": "880e8400-e29b-41d4-a716-446655440003",
    "score": 85,
    "amount": 1
  }'
```

---

### 5.2. Lấy tiến độ của một challenge cụ thể

**Endpoint**: `GET /api/v1/gamify/challenge/{challengeId}/progress`

**Mô tả**: Lấy tiến độ hiện tại của user đối với một challenge cụ thể.

**Authentication**: ✅ Required - Cần JWT token trong header `Authorization: Bearer <token>`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `challengeId` | UUID | ✅ Yes | ID của challenge cần tra cứu |

**Response** (200 OK):

```json
{
  "code": 200,
  "result": {
    "challengeId": "990e8400-e29b-41d4-a716-446655440004",
    "title": "Hoàn thành 10 quiz trong tuần",
    "currentProgress": 7,
    "targetProgress": 10,
    "completed": false,
    "completedAt": null
  },
  "message": "Progress retrieved"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `code` | Integer | HTTP status code (200 = success) |
| `result` | Object | Thông tin tiến độ challenge |
| `result.challengeId` | UUID | ID của challenge |
| `result.title` | String | Tiêu đề challenge |
| `result.currentProgress` | Integer | Tiến độ hiện tại |
| `result.targetProgress` | Integer | Mục tiêu cần đạt |
| `result.completed` | Boolean | Đã hoàn thành hay chưa |
| `result.completedAt` | DateTime (ISO 8601) | Thời gian hoàn thành (ZonedDateTime, null nếu chưa hoàn thành) |
| `message` | String | Thông báo |

**Response khi không có progress** (200 OK):

```json
{
  "code": 200,
  "result": null,
  "message": "No progress found"
}
```

**Error Responses**:

- **401 Unauthorized**: Không có hoặc token không hợp lệ
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/challenge/990e8400-e29b-41d4-a716-446655440004/progress \
  -H "Authorization: Bearer <token>"
```

---

### 5.3. Lấy danh sách challenge đang active của user hiện tại

**Endpoint**: `GET /api/v1/gamify/challenge/me/active`

**Mô tả**: Lấy danh sách tất cả các challenge đang active (chưa hoàn thành) của user hiện tại.

**Authentication**: ✅ Required - Cần JWT token trong header `Authorization: Bearer <token>`

**Path Parameters**: Không có

**Response** (200 OK):

```json
{
  "code": 200,
  "result": [
    {
      "challengeId": "990e8400-e29b-41d4-a716-446655440004",
      "title": "Hoàn thành 10 quiz trong tuần",
      "currentProgress": 7,
      "targetProgress": 10,
      "completed": false,
      "completedAt": null
    },
    {
      "challengeId": "aa0e8400-e29b-41d4-a716-446655440005",
      "title": "Hoàn thành 5 quiz trong ngày",
      "currentProgress": 3,
      "targetProgress": 5,
      "completed": false,
      "completedAt": null
    }
  ],
  "message": "Active challenges retrieved"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `code` | Integer | HTTP status code (200 = success) |
| `result` | Array | Danh sách challenge đang active |
| `result[].challengeId` | UUID | ID của challenge |
| `result[].title` | String | Tiêu đề challenge |
| `result[].currentProgress` | Integer | Tiến độ hiện tại |
| `result[].targetProgress` | Integer | Mục tiêu cần đạt |
| `result[].completed` | Boolean | Luôn là `false` (vì đây là active challenges) |
| `result[].completedAt` | DateTime (ISO 8601) | Luôn là `null` |
| `message` | String | Thông báo |

**Error Responses**:

- **401 Unauthorized**: Không có hoặc token không hợp lệ
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/challenge/me/active \
  -H "Authorization: Bearer <token>"
```

---

### 5.4. Lấy danh sách challenge đã hoàn thành của user hiện tại

**Endpoint**: `GET /api/v1/gamify/challenge/me/completed`

**Mô tả**: Lấy danh sách tất cả các challenge đã hoàn thành của user hiện tại.

**Authentication**: ✅ Required - Cần JWT token trong header `Authorization: Bearer <token>`

**Path Parameters**: Không có

**Response** (200 OK):

```json
{
  "code": 200,
  "result": [
    {
      "challengeId": "bb0e8400-e29b-41d4-a716-446655440006",
      "title": "Hoàn thành 5 quiz trong ngày",
      "currentProgress": 5,
      "targetProgress": 5,
      "completed": true,
      "completedAt": "2025-01-14T15:30:00+07:00[Asia/Ho_Chi_Minh]"
    }
  ],
  "message": "Completed challenges retrieved"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `code` | Integer | HTTP status code (200 = success) |
| `result` | Array | Danh sách challenge đã hoàn thành |
| `result[].challengeId` | UUID | ID của challenge |
| `result[].title` | String | Tiêu đề challenge |
| `result[].currentProgress` | Integer | Tiến độ hiện tại (bằng targetProgress) |
| `result[].targetProgress` | Integer | Mục tiêu cần đạt |
| `result[].completed` | Boolean | Luôn là `true` |
| `result[].completedAt` | DateTime (ISO 8601) | Thời gian hoàn thành (ZonedDateTime) |
| `message` | String | Thông báo |

**Error Responses**:

- **401 Unauthorized**: Không có hoặc token không hợp lệ
- **500 Internal Server Error**: Lỗi server

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/challenge/me/completed \
  -H "Authorization: Bearer <token>"
```

---

## 6. Authentication & Testing

### 6.1. Test JWT Token (Debug Endpoint)

**Endpoint**: `GET /api/v1/gamify/me`

**Mô tả**: Endpoint để test và xem thông tin từ JWT token (dùng cho debugging).

**Authentication**: ✅ Required - Cần JWT token trong header `Authorization: Bearer <token>`

**Response** (200 OK):

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "scope": "USER"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `sub` | String | Subject claim từ JWT (thường là userId) |
| `scope` | String | Scope claim từ JWT (quyền của user) |

**Example cURL**:

```bash
# Qua Gateway
curl -X GET http://localhost:8080/gamification/me \
  -H "Authorization: Bearer <token>"

# Trực tiếp
curl -X GET http://localhost:8203/api/v1/gamify/me \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling

### Cấu trúc Error Response chuẩn

Tất cả các lỗi từ API sẽ trả về format tương tự:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Chi tiết lỗi cụ thể",
  "path": "/api/v1/gamify/endpoint"
}
```

### HTTP Status Codes

| Status Code | Mô tả |
|-------------|-------|
| `200` | OK - Request thành công |
| `400` | Bad Request - Dữ liệu request không hợp lệ |
| `401` | Unauthorized - Không có hoặc token không hợp lệ |
| `404` | Not Found - Không tìm thấy resource |
| `500` | Internal Server Error - Lỗi server |

---

## Data Types

### UUID
Format: `550e8400-e29b-41d4-a716-446655440000`

### DateTime
Format: ISO 8601 với timezone (ZonedDateTime)
Ví dụ: `2025-01-15T10:30:00+07:00[Asia/Ho_Chi_Minh]`

### Boolean
`true` hoặc `false`

### JSON String
Rule field là một JSON string, cần parse khi sử dụng:
```json
"{\"eventType\":\"QUIZ\",\"action\":\"COMPLETE\",\"count\":5}"
```

---

## Notes cho Frontend

1. **Base URL**: 
   - Qua Gateway: `http://localhost:8080/gamification`
   - Trực tiếp: `http://localhost:8203/api/v1/gamify`

2. **Content-Type**: Luôn sử dụng `application/json` cho request body

3. **Authentication**: Hầu hết endpoints cần JWT token trong header:
   ```
   Authorization: Bearer <token>
   ```

4. **UUID Format**: Tất cả UUID phải đúng format chuẩn

5. **DateTime Format**: Sử dụng ISO 8601 format với timezone (ZonedDateTime)

6. **Error Handling**: Luôn kiểm tra status code và xử lý error response phù hợp

7. **Validation**: 
   - `userId`, `badge`, `score` là required trong RewardRequest
   - Các field trong Challenge model đều required (trừ `id`, `createdAt`, `updatedAt`)

8. **Leaderboard Type**: Không phân biệt hoa thường, nhưng nên gửi uppercase để nhất quán

9. **Challenge Rule**: Field `rule` là JSON string, cần parse khi hiển thị hoặc validate

10. **Gateway Routing**: 
    - Tất cả requests qua Gateway sẽ được rewrite: `/gamification/**` → `/api/v1/gamify/**`
    - Gateway tự động forward `Authorization` header xuống backend

---

## Changelog

### Version 1.1.0 (2025-01-15)
- **Updated**: Reward API - Changed GET endpoint from `/reward/{userId}` to `/reward` (gets current user's rewards)
- **Updated**: Leaderboard API - Updated response structure for `/me` endpoint to use `ApiResponse<LeaderboardEntry>`
- **Updated**: Leaderboard API - Changed `userId` field to `name` field in `LeaderboardEntry`
- **Added**: Badge APIs - Get badges of current user (`/badge/me`)
- **Added**: Challenge Progress APIs - Publish event, Get progress, Get active challenges, Get completed challenges
- **Updated**: Reward response - Added more fields: `sourceType`, `lessonId`, `enrollId`, `challengeId`

### Version 1.0.0 (2025-01-15)
- Initial release
- Reward APIs: Add reward, Get user reward (với rewardDetail)
- Leaderboard APIs: Get leaderboard by type, Get my leaderboard position
- Challenge APIs: Get all, Create, Delete
- Authentication: Test endpoint `/me` để debug JWT

---

## Liên hệ

Nếu có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ team backend.
