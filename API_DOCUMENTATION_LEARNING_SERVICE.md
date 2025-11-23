# Learning Service API Documentation

## Base URL
```
http://localhost:8080/learning
```

## Authentication
All endpoints (except public lesson listing) require JWT authentication.

**Header:**
```
Authorization: Bearer <jwt_token>
```

The JWT token is obtained from the Auth Service (`/identity/auth/token`).

---

## 1. Learner APIs

### 1.1 Get My Learner Profile
Retrieve the profile of the currently logged-in learner.

**Endpoint:** `GET /api/learners/me`

**Headers:**
- `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "level": "BEGINNER | INTERMEDIATE | ADVANCED",
  "totalPointsLearning": 0
}
```

### 1.2 Get Learner by ID
**Endpoint:** `GET /api/learners/{id}`

**Response:** `200 OK` (Same as 1.1)

### 1.3 List All Learners
**Endpoint:** `GET /api/learners`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "level": "BEGINNER",
    "totalPointsLearning": 0
  }
]
```

### 1.4 List Learners by Level
**Endpoint:** `GET /api/learners/level/{level}`

**Path Parameters:**
- `level`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED`

**Response:** `200 OK` (Array of LearnerRes)

---

## 2. Creator APIs

### 2.1 Get My Creator Profile
**Endpoint:** `GET /api/creators/me`

**Auth:** Required (Creator role)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "totalLessons": 0
}
```

### 2.2 Get Creator by ID
**Endpoint:** `GET /api/creators/{id}`

**Response:** `200 OK` (Same as 2.1)

### 2.3 List All Creators
**Endpoint:** `GET /api/creators`

**Response:** `200 OK` (Array of CreatorRes)

---

## 3. Lesson APIs

### 3.1 List All Lessons
**Endpoint:** `GET /api/lessons`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Introduction to Budgeting",
    "description": "Learn the basics of budgeting",
    "slug": "introduction-to-budgeting",
    "content": "Full lesson content...",
    "status": "DRAFT | PENDING | APPROVED | REJECTED",
    "difficulty": "BASIC | INTERMEDIATE | ADVANCED",
    "durationMinutes": 30,
    "tags": ["BUDGETING", "SAVING"],
    "thumbnailUrl": "https://...",
    "videoUrl": "https://...",
    "commentByMod": "Optional feedback from moderator",
    "quizJson": { ... },
    "creatorId": "uuid",
    "moderatorId": "uuid",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "publishedAt": "2024-01-01T10:00:00Z"
  }
]
```

### 3.2 Filter Lessons by Tag
**Endpoint:** `GET /api/lessons/tags/{tag}`

**Path Parameters:**
- `tag`: `BUDGETING` | `INVESTING` | `SAVING` | `DEBT` | `TAX`

**Response:** `200 OK` (Array of LessonRes)

### 3.3 Filter Lessons by Difficulty
**Endpoint:** `GET /api/lessons/difficulty/{difficulty}`

**Path Parameters:**
- `difficulty`: `BASIC` | `INTERMEDIATE` | `ADVANCED`

**Response:** `200 OK` (Array of LessonRes)

### 3.4 Filter Lessons by Status
**Endpoint:** `GET /api/lessons/status/{status}`

**Path Parameters:**
- `status`: `DRAFT` | `PENDING` | `APPROVED` | `REJECTED`

**Response:** `200 OK` (Array of LessonRes)

### 3.5 Create Lesson
**Endpoint:** `POST /api/lessons`

**Auth:** Required (`SCOPE_ROLE_CREATOR`)

**Request Body:**
```json
{
  "title": "string (required, max 150 chars)",
  "description": "string (max 1000 chars)",
  "content": "string (required, lesson content)",
  "durationMinutes": 30,
  "difficulty": "BASIC | INTERMEDIATE | ADVANCED (required)",
  "thumbnailUrl": "string (max 255 chars)",
  "videoUrl": "string (max 255 chars)",
  "tags": ["BUDGETING", "INVESTING"],
  "quizJson": {
    "questions": [
      {
        "id": 1,
        "question": "What is budgeting?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0
      }
    ]
  }
}
```

**Response:** `201 Created` (LessonRes)

**Note:** Lesson is created with status `DRAFT` and a unique slug is auto-generated from the title.

### 3.6 Update Lesson
**Endpoint:** `PUT /api/lessons/{lessonId}`

**Auth:** Required (`SCOPE_ROLE_CREATOR`, must be owner)

**Request Body:** (All fields optional)
```json
{
  "title": "string",
  "description": "string",
  "content": "string",
  "durationMinutes": 30,
  "difficulty": "BASIC | INTERMEDIATE | ADVANCED",
  "thumbnailUrl": "string",
  "videoUrl": "string",
  "tags": ["BUDGETING"],
  "quizJson": { ... }
}
```

**Response:** `200 OK` (LessonRes)

**Note:** Updating a lesson resets its status to `DRAFT`.

### 3.7 Submit Lesson for Review
**Endpoint:** `PUT /api/lessons/{lessonId}/submit`

**Auth:** Required (`SCOPE_ROLE_CREATOR`, must be owner)

**Response:** `200 OK` (LessonRes)

**Note:** Changes lesson status from `DRAFT` to `PENDING`.

### 3.8 Delete Lesson
**Endpoint:** `DELETE /api/lessons/{lessonId}`

**Auth:** Required (`SCOPE_ROLE_CREATOR`, must be owner)

**Response:** `204 No Content`

---

## 4. Enrollment APIs (Learning Progress)

### 4.1 Enroll in a Lesson
**Endpoint:** `POST /api/enrollments`

**Auth:** Required (`SCOPE_ROLE_LEARNER`)

**Request Body:**
```json
{
  "lessonId": "uuid (required)"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "learnerId": "uuid",
  "lessonId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 0,
  "score": null,
  "attempts": 0,
  "startedAt": "2024-01-01T10:00:00",
  "completedAt": null,
  "lastActivityAt": "2024-01-01T10:00:00",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

**Note:** If already enrolled, returns the existing enrollment.

### 4.2 Get My Enrollments
**Endpoint:** `GET /api/enrollments`

**Auth:** Required (`SCOPE_ROLE_LEARNER`)

**Response:** `200 OK` (Array of EnrollmentRes)

### 4.3 Get Enrollment Detail
**Endpoint:** `GET /api/enrollments/{enrollmentId}`

**Auth:** Required (`SCOPE_ROLE_LEARNER`, must be owner)

**Response:** `200 OK` (EnrollmentRes)

### 4.4 Update Progress
**Endpoint:** `PUT /api/enrollments/{enrollmentId}/progress`

**Auth:** Required (`SCOPE_ROLE_LEARNER`, must be owner)

**Request Body:**
```json
{
  "status": "IN_PROGRESS | COMPLETED | DROPPED (required)",
  "progressPercent": 100,
  "score": 80,
  "addAttempt": 1
}
```

**Response:** `200 OK`

**Notes:**
- When `status` is `COMPLETED`, `progressPercent` should be 100.
- `score` is automatically converted to learning points and added to the learner's profile.
- Points are only added once (when transitioning to COMPLETED for the first time).

---

## 5. Moderator APIs

### 5.1 List All Moderators
**Endpoint:** `GET /api/moderators`

**Auth:** Required (`SCOPE_ROLE_MODERATOR`)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "comment": "string",
    "pendingAssigned": 0
  }
]
```

### 5.2 List Lessons for Moderation
**Endpoint:** `GET /api/moderators/lessons`

**Auth:** Required (`SCOPE_ROLE_MODERATOR`)

**Query Parameters:**
- `status` (optional): `PENDING` | `APPROVED` | `REJECTED` (default: `PENDING`)

**Response:** `200 OK` (Array of LessonRes)

**Note:** Moderators cannot view `DRAFT` lessons. Attempting to filter by `DRAFT` returns `403 Forbidden`.

### 5.3 View Lesson Detail
**Endpoint:** `GET /api/moderators/lessons/{lessonId}`

**Auth:** Required (`SCOPE_ROLE_MODERATOR`)

**Response:** `200 OK` (LessonRes) or `403 Forbidden` if lesson is `DRAFT`

### 5.4 Moderate Lesson (Approve/Reject)
**Endpoint:** `POST /api/moderators/lessons/{lessonId}/decision`

**Auth:** Required (`SCOPE_ROLE_MODERATOR`)

**Request Body:**
```json
{
  "status": "APPROVED | REJECTED (required)",
  "commentByMod": "string (max 2000 chars, feedback for creator)"
}
```

**Response:** `200 OK` (LessonRes)

---

## Error Responses

### 400 Bad Request
Invalid input data (validation errors).

### 401 Unauthorized
Missing or invalid JWT token.

### 403 Forbidden
User does not have permission to access the resource.

### 404 Not Found
Resource (lesson, enrollment, etc.) not found.

### 500 Internal Server Error
Server error.

**Error Response Format:**
```json
{
  "code": 9999,
  "message": "Error description"
}
```

---

## Enums Reference

### LearnerLevel
- `BEGINNER`
- `INTERMEDIATE`
- `ADVANCED`

### LessonDifficulty
- `BASIC`
- `INTERMEDIATE`
- `ADVANCED`

### LessonStatus
- `DRAFT` - Created but not submitted
- `PENDING` - Submitted for review
- `APPROVED` - Approved by moderator
- `REJECTED` - Rejected by moderator

### LessonTag
- `BUDGETING`
- `INVESTING`
- `SAVING`
- `DEBT`
- `TAX`

### EnrollmentStatus
- `IN_PROGRESS` - Learner is currently taking the lesson
- `COMPLETED` - Lesson completed
- `DROPPED` - Learner stopped taking the lesson

---

## Notes for Frontend Integration

1. **Authentication Flow:**
   - Login via Auth Service: `POST /identity/auth/token`
   - Store JWT token
   - Include token in all subsequent requests

2. **User Roles:**
   - `SCOPE_ROLE_LEARNER` - Can enroll in lessons and track progress
   - `SCOPE_ROLE_CREATOR` - Can create and manage lessons
   - `SCOPE_ROLE_MODERATOR` - Can approve/reject lessons

3. **Lesson Workflow:**
   - Creator: Create → Submit → (Wait for approval)
   - Moderator: Review → Approve/Reject
   - Learner: Enroll → Learn → Complete

4. **Learning Progress:**
   - Learners earn points by completing lessons
   - Points are calculated based on quiz score
   - Progress is tracked per enrollment

5. **Quiz Structure:**
   The `quizJson` field should follow this structure:
   ```json
   {
     "questions": [
       {
         "id": 1,
         "question": "Question text?",
         "options": ["Option A", "Option B", "Option C", "Option D"],
         "correctAnswer": 0
       }
     ]
   }
   ```
