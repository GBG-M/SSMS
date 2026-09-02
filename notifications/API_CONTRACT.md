# Notifications API Contract

## Overview

The Notifications API provides endpoints for real-time alerts and communication between school administrators, teachers, students, and parents.

**Base Path**: `/api/notifications/`

---

## Authentication & Authorization

All endpoints require standard token authentication:
`Authorization: Token <token>` or `Authorization: Bearer <jwt>`

### Role Permissions

| Role | Read Notifications | Mark as Read | Create Notifications | Class Broadcast |
| :--- | :---: | :---: | :---: | :---: |
| **Admin** | All | All | Yes | Yes |
| **Academic Coordinator** | All | All | Yes | Yes |
| **Teacher** | Own (sent + received) | Own | Yes | Yes (assigned classes) |
| **Student** | Own | Own | No | No |
| **Parent** | Own + Linked Children | Own + Linked Children | No | No |

---

## Endpoints

### 1. List Notifications

**`GET /api/notifications/`**

Returns a paginated list of notifications accessible to the authenticated user.

#### Query Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `is_read` | `boolean` | Filter by read status (`true` / `false`) |
| `notification_type` | `string` | `FEE_DUE`, `FEE_PAID`, `CLASS_SCHEDULE_CHANGED`, `EXAM_ANNOUNCED`, `GRADE_POSTED`, `ATTENDANCE_ALERT`, `TEACHER_MESSAGE`, `SCHOOL_ANNOUNCEMENT`, `SYSTEM_ALERT` |
| `priority` | `string` | `LOW`, `NORMAL`, `HIGH`, `URGENT` |
| `related_student` | `uuid` | Filter notifications associated with a specific student (useful for parents with multiple children) |
| `search` | `string` | Search across `title`, `message`, sender names, and recipient names |
| `ordering` | `string` | Order by field (default: `-created_at`, options: `created_at`, `priority`, `is_read`) |

#### Response (200 OK)

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "c1f729cb-08f3-4e31-893d-d9b897ce53ec",
      "recipient": "8f8b8c5e-8ff4-4db2-9445-6453d8650dfb",
      "recipient_name": "Delia Ketchum",
      "recipient_email": "parent1@ssms.test",
      "sender": "a17f2231-c4d3-46ea-9a8c-a616238b7762",
      "sender_name": "Professor Oak",
      "notification_type": "GRADE_POSTED",
      "notification_type_display": "Grade Posted",
      "priority": "NORMAL",
      "priority_display": "Normal",
      "title": "[Ash Ketchum] Grade Posted: Midterm Exam",
      "message": "New grade posted for Midterm Exam in Science 10-A. Score: 95.00/100 (A). Feedback: Outstanding work!",
      "recipient_role": "parent",
      "related_student": "71343751-2495-46aa-bd1a-e9caefb8a594",
      "related_student_name": "Ash Ketchum",
      "is_read": false,
      "read_at": null,
      "created_at": "2026-09-02T14:30:00Z",
      "updated_at": "2026-09-02T14:30:00Z"
    }
  ]
}
```

---

### 2. Get Unread Count

**`GET /api/notifications/unread-count/`**

Quick endpoint for UI badges in navigation bars.

#### Response (200 OK)

```json
{
  "unread_count": 3
}
```

---

### 3. Mark Single Notification as Read

**`POST /api/notifications/{id}/mark-read/`**

#### Response (200 OK)

```json
{
  "message": "Notification marked as read.",
  "notification": {
    "id": "c1f729cb-08f3-4e31-893d-d9b897ce53ec",
    "is_read": true,
    "read_at": "2026-09-02T14:35:12Z"
  }
}
```

---

### 4. Mark Single Notification as Unread

**`POST /api/notifications/{id}/mark-unread/`**

#### Response (200 OK)

```json
{
  "message": "Notification marked as unread.",
  "notification": {
    "id": "c1f729cb-08f3-4e31-893d-d9b897ce53ec",
    "is_read": false,
    "read_at": null
  }
}
```

---

### 5. Mark All Notifications as Read

**`POST /api/notifications/mark-all-read/`**

Marks all unread notifications for the current authenticated user as read.

#### Response (200 OK)

```json
{
  "message": "3 notifications marked as read.",
  "count": 3
}
```

---

### 6. Create / Send Direct Notification (Staff & Teachers)

**`POST /api/notifications/`**

#### Request Body

```json
{
  "recipient_id": "8f8b8c5e-8ff4-4db2-9445-6453d8650dfb",
  "title": "Field Trip Permission Slip",
  "message": "Please sign and return the permission slip for the science museum trip by Friday.",
  "notification_type": "TEACHER_MESSAGE",
  "priority": "HIGH",
  "related_student_id": "71343751-2495-46aa-bd1a-e9caefb8a594"
}
```

#### Response (201 Created)

```json
{
  "id": "e30e7195-2c8e-49b9-873b-b6d396d91fca",
  "title": "Field Trip Permission Slip",
  "message": "Please sign and return the permission slip for the science museum trip by Friday.",
  "notification_type": "TEACHER_MESSAGE",
  "priority": "HIGH",
  "is_read": false,
  "created_at": "2026-09-02T14:40:00Z"
}
```

---

### 7. Broadcast Announcement to Class Section

**`POST /api/notifications/broadcast-class/`**

Sends a notification to all active students and linked parents in a class section.

#### Request Body

```json
{
  "class_section_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Lab Materials Reminder",
  "message": "Please remember to bring your lab coats and notebooks for tomorrow's chemistry practical.",
  "priority": "NORMAL",
  "include_parents": true
}
```

#### Response (201 Created)

```json
{
  "message": "Successfully sent 56 notifications.",
  "count": 56,
  "class_section": "Chemistry 101 - Section A"
}
```
