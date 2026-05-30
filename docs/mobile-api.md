# Mobile API Documentation (v1)

This document outlines the Mobile API layer (`/api/mobile/v1/*`), which provides the backend endpoints for the React Native / Flutter parent app.

## Overview

- **Base URL:** `/api/mobile/v1`
- **Authentication:** Auth.js session-based (`requireMobileAuth()`)
- **Rate Limiting:** 100 requests per minute per user
- **Content Type:** `application/json`

## Endpoints

### 1. Authentication & Context
**GET `/auth/session`**
Returns the current authenticated parent user and their school memberships.
- **Response:**
  ```json
  {
    "user": { "id": "...", "name": "...", "email": "...", "phone": "...", "avatar": "..." },
    "schools": [ { "id": "...", "name": "...", "logoUrl": "...", "primaryColor": "..." } ],
    "activeSchool": { "id": "..." }
  }
  ```

### 2. Dashboard
**GET `/dashboard`**
Aggregated metrics and summaries for the home screen.
- **Response:**
  ```json
  {
    "students": [ ...StudentDTO ],
    "attendanceRate": 95.5,
    "pendingAmount": 15000,
    "unreadNotifications": 3,
    "upcomingExams": [ ...ExamDTO ],
    "recentPayments": [ ...PaymentDTO ]
  }
  ```

### 3. Students & Attendance
**GET `/attendance?studentId={id}&month=YYYY-MM`**
Retrieve attendance records and calculated percentages.
- **Parameters:**
  - `studentId` (optional): Filter by specific child.
  - `month` (optional): Filter by month (`2026-05`).
- **Response:**
  ```json
  {
    "attendanceRate": 94.2,
    "records": [ ...AttendanceDTO ]
  }
  ```

### 4. Academics
**GET `/results?studentId={id}`**
Fetch published exam results.
- **Response:**
  ```json
  {
    "exams": ["Term 1", "Mid Terms"],
    "results": [ ...ExamResultDTO ],
    "averagePercentage": 82.5
  }
  ```

### 5. Financials
**GET `/invoices`**
Fetch all pending and paid invoices.
- **Response:**
  ```json
  {
    "pendingInvoices": [ ...InvoiceDTO ],
    "paidInvoices": [ ...InvoiceDTO ],
    "totalOutstanding": 5000
  }
  ```

**GET `/payments`**
Fetch historical payment records.
- **Response:**
  ```json
  {
    "payments": [ ...PaymentDTO ],
    "totalPaid": 45000
  }
  ```

### 6. Communication
**GET `/notifications?page=1&limit=20`**
Fetch notifications for the parent.
- **Response:** `{ "notifications": [ ...NotificationDTO ], "unreadCount": 5 }`

**PATCH `/notifications`**
Mark notifications as read or archive them.
- **Body:** `{ "action": "MARK_ALL_READ" }` or `{ "action": "READ", "notificationId": "..." }`

**GET `/announcements?page=1&limit=10`**
Fetch global school announcements.
- **Response:** `{ "announcements": [ ...AnnouncementDTO ], "pagination": { ... } }`

### 7. Surveys
**GET `/surveys`**
Fetch pending and completed surveys.
- **Response:** `{ "pending": [ ...SurveyDTO ], "completed": [ ...SurveyDTO ] }`

**GET `/surveys/[id]`**
Fetch survey questions.

**POST `/surveys/[id]`**
Submit survey responses.
- **Body:** `{ "answers": [ { "questionId": "...", "answer": "..." } ] }`

### 8. Offline Sync
**GET `/sync?since=YYYY-MM-DDTHH:mm:ss.sssZ`**
Fetch incremental updates for offline sync databases (WatermelonDB / SQLite).
- **Response:**
  ```json
  {
    "lastSyncAt": "...",
    "updatedNotifications": [],
    "updatedInvoices": [],
    "updatedResults": []
  }
  ```

## Teacher APIs

All Teacher APIs live under `/api/mobile/v1/teacher/*` and require a valid teacher session (`requireTeacherMobileAuth()`). 

- **Dashboard**: `GET /teacher/dashboard` - Aggregated overview of classes, students, pending attendance, assignments.
- **Classes**: 
  - `GET /teacher/classes` - List all batches assigned to the teacher.
  - `GET /teacher/classes/[id]` - Details of a specific class and enrolled students.
  - `GET /teacher/students` - Directory of students taught by the teacher (supports `?classId`, `?search`, `?page`).
- **Attendance**:
  - `GET /teacher/attendance?batchId=...&date=...` - Fetch attendance sheet.
  - `POST /teacher/attendance` - Submit attendance bulk. Payload: `{ batchId, date, records: [{ studentId, status }] }`.
- **Results**:
  - `GET /teacher/results?examId=...` - Fetch results entry sheet.
  - `POST /teacher/results` - Submit results bulk. Payload: `{ examId, records: [{ studentId, marks, status }] }`.
- **Assignments**:
  - `GET /teacher/assignments` - List assignments.
  - `POST /teacher/assignments` - Create assignment. Payload: `{ title, dueDate, subjectId, batchId }`.
  - `GET|PATCH|DELETE /teacher/assignments/[id]` - Manage specific assignment.
- **Communication**:
  - `GET /teacher/announcements` - List active announcements.
  - `POST /teacher/announcements` - Create an announcement.
  - `GET|PATCH /teacher/notifications` - View and manage notifications.
- **Sync**:
  - `GET /teacher/sync?since=...` - Fetch offline sync data.

## DTO Models
All responses are strictly typed using Data Transfer Objects (DTOs) found in `lib/mobile/dto.ts` and `lib/mobile/teacher-dto.ts` to prevent internal Prisma schema leaks.

## Push Notifications & Devices

### 1. Register Device
**POST `/device/register`**
Registers a mobile device for Push Notifications (FCM).
- **Payload:**
  ```json
  {
    "token": "fcm-device-token",
    "platform": "ANDROID" | "IOS",
    "appVersion": "1.0.0",
    "deviceModel": "iPhone 13"
  }
  ```
- **Response:** `{ "success": true }`

### 2. Unregister Device
**DELETE `/device/unregister?token=fcm-device-token`**
Unregisters a device to stop receiving push notifications.
- **Response:** `{ "success": true }`

## Offline Mutation Sync

### 1. Sync Parent Mutations
**POST `/sync/mutations`**
Syncs offline parent actions (e.g., reading notifications). Uses Last-Write-Wins based on `actionAt`.
- **Payload:**
  ```json
  {
    "mutations": [
      {
        "id": "uuid-1234",
        "type": "MARK_NOTIFICATION_READ",
        "payload": { "notificationId": "n-1" },
        "actionAt": "2024-03-10T10:00:00Z"
      }
    ]
  }
  ```
- **Response:** `{ "processed": 1, "failed": [] }`

### 2. Sync Teacher Mutations
**POST `/teacher/sync/mutations`**
Syncs offline teacher actions (e.g., marking attendance). Uses Last-Write-Wins based on `actionAt`.
- **Payload:**
  ```json
  {
    "mutations": [
      {
        "id": "uuid-5678",
        "type": "MARK_ATTENDANCE",
        "payload": { "studentId": "s-1", "classId": "c-1", "date": "2024-03-10T00:00:00Z", "status": "PRESENT" },
        "actionAt": "2024-03-10T10:05:00Z"
      }
    ]
  }
  ```
- **Response:** `{ "processed": 1, "failed": [] }`
