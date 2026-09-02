# Scheduling API Contract

Base URL: `/api/scheduling/`

Authentication:
- All endpoints require `Authorization: Token <token>`
- This project is using DRF Token Authentication

Role-based access rules:
- **Admin & Academic Coordinator**: Full access to all rooms, class schedules, and exam schedules
- **Teachers**: Can view and manage only their own assigned class and exam schedules
- **Students**: Can view class schedules for their enrolled active classes and exam schedules for those classes
- **Parents**: Can view schedules for their linked children's enrolled classes

## 1) Rooms

### GET /api/scheduling/rooms/
Returns all available rooms. Supports filtering and search.

Query parameters:
- `building` - Filter by building name
- `is_active` - Filter by status (true/false)
- `capacity` - Filter by room capacity
- `search` - Search by room name, number, or building

Example response:
```json
[
  {
    "id": "f5c4b8a1-9d2e-4b7c-8e5a-3f1d2c4b5a6e",
    "name": "Room A1",
    "room_number": "A1",
    "building": "Main Block",
    "capacity": 30,
    "is_active": true,
    "total_schedules": 5,
    "created_at": "2025-01-15T09:00:00Z",
    "updated_at": "2025-01-15T09:00:00Z"
  },
  {
    "id": "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    "name": "Lab 1",
    "room_number": "L1",
    "building": "Science Block",
    "capacity": 20,
    "is_active": true,
    "total_schedules": 3,
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

### POST /api/scheduling/rooms/
Create a new room (Admin/Academic Coordinator only).

Request body:
```json
{
  "name": "Room B2",
  "room_number": "B2",
  "building": "Annex Block",
  "capacity": 25,
  "is_active": true
}
```

### GET /api/scheduling/rooms/{id}/
Retrieve a specific room.

### PUT /api/scheduling/rooms/{id}/
Update a room (Admin/Academic Coordinator only).

Request body:
```json
{
  "name": "Room B2 - Updated",
  "capacity": 28,
  "is_active": true
}
```

### DELETE /api/scheduling/rooms/{id}/
Delete a room (Admin/Academic Coordinator only).

---

## 2) Class Schedules

### GET /api/scheduling/class-schedules/
Returns class schedules visible to the authenticated user.

Query parameters:
- `class_section` - Filter by class section ID
- `room` - Filter by room ID
- `teacher` - Filter by teacher ID (Admin/Coordinator only)
- `day_of_week` - Filter by day (MONDAY, TUESDAY, etc.)
- `academic_year` - Filter by academic year ID
- `term` - Filter by term (Term 1, Term 2, etc.)
- `search` - Search by class section name, teacher name, or room name
- `ordering` - Order by field (e.g., `day_of_week`, `start_time`, `-start_time`)

Automatic filtering by role:
- Admin/Coordinator: See all schedules
- Teachers: See only their assigned schedules
- Students: See schedules for their enrolled active class sections
- Parents: See schedules for their children's enrolled class sections

Example response:
```json
[
  {
    "id": "b7a1c8d2-4e5f-4g6h-7i8j-9k0l1m2n3o4p",
    "class_section": "2a3b4c5d-6e7f-8g9h-0i1j-2k3l4m5n6o7p",
    "class_section_name": "Mathematics 101 A",
    "subject_code": "MATH101",
    "room": "f5c4b8a1-9d2e-4b7c-8e5a-3f1d2c4b5a6e",
    "room_name": "Room A1",
    "teacher": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    "teacher_name": "Mr. Smith",
    "academic_year": "2c3d4e5f-6g7h-8i9j-0k1l-2m3n4o5p6q7r",
    "academic_year_name": "2025/2026",
    "day_of_week": "MONDAY",
    "start_time": "09:00:00",
    "end_time": "10:00:00",
    "term": "Term 1",
    "notes": "Core mathematics course",
    "created_at": "2025-01-15T09:15:00Z",
    "updated_at": "2025-01-15T09:15:00Z"
  }
]
```

### POST /api/scheduling/class-schedules/
Create a new class schedule (Admin/Academic Coordinator only).

Request body:
```json
{
  "class_section": "2a3b4c5d-6e7f-8g9h-0i1j-2k3l4m5n6o7p",
  "room": "f5c4b8a1-9d2e-4b7c-8e5a-3f1d2c4b5a6e",
  "teacher": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
  "academic_year": "2c3d4e5f-6g7h-8i9j-0k1l-2m3n4o5p6q7r",
  "day_of_week": "MONDAY",
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "term": "Term 1",
  "notes": "Core mathematics course"
}
```

### GET /api/scheduling/class-schedules/{id}/
Retrieve a specific class schedule.

### PUT /api/scheduling/class-schedules/{id}/
Update a class schedule (Admin/Academic Coordinator only).

Request body:
```json
{
  "room": "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
  "start_time": "09:30:00",
  "end_time": "10:30:00"
}
```

### DELETE /api/scheduling/class-schedules/{id}/
Delete a class schedule (Admin/Academic Coordinator only).

---

## 3) Exam Schedules

### GET /api/scheduling/exam-schedules/
Returns exam schedules visible to the authenticated user.

Query parameters:
- `class_section` - Filter by class section ID
- `room` - Filter by room ID
- `exam_type` - Filter by exam type (MIDTERM, FINAL, QUIZ, PRACTICAL)
- `academic_year` - Filter by academic year ID
- `search` - Search by class section name, teacher name, or room name
- `ordering` - Order by field (e.g., `exam_date`, `start_time`)

Automatic filtering by role:
- Admin/Coordinator: See all exam schedules
- Teachers: See only exam schedules for their assigned class sections
- Students: See exam schedules for their enrolled active class sections
- Parents: See exam schedules for their children's enrolled class sections

Example response:
```json
[
  {
    "id": "d3e4f5g6-7h8i-9j0k-1l2m-3n4o5p6q7r8s",
    "class_section": "2a3b4c5d-6e7f-8g9h-0i1j-2k3l4m5n6o7p",
    "class_section_name": "Mathematics 101 A",
    "subject_code": "MATH101",
    "room": "f5c4b8a1-9d2e-4b7c-8e5a-3f1d2c4b5a6e",
    "room_name": "Room A1",
    "teacher_name": "Mr. Smith",
    "exam_type": "MIDTERM",
    "exam_date": "2025-10-15",
    "start_time": "09:00:00",
    "end_time": "11:00:00",
    "academic_year": "2c3d4e5f-6g7h-8i9j-0k1l-2m3n4o5p6q7r",
    "academic_year_name": "2025/2026",
    "created_at": "2025-01-15T09:30:00Z",
    "updated_at": "2025-01-15T09:30:00Z"
  }
]
```

### POST /api/scheduling/exam-schedules/
Create a new exam schedule (Admin/Academic Coordinator only).

Request body:
```json
{
  "class_section": "2a3b4c5d-6e7f-8g9h-0i1j-2k3l4m5n6o7p",
  "room": "f5c4b8a1-9d2e-4b7c-8e5a-3f1d2c4b5a6e",
  "exam_type": "MIDTERM",
  "exam_date": "2025-10-15",
  "start_time": "09:00:00",
  "end_time": "11:00:00",
  "academic_year": "2c3d4e5f-6g7h-8i9j-0k1l-2m3n4o5p6q7r"
}
```

### GET /api/scheduling/exam-schedules/{id}/
Retrieve a specific exam schedule.

### PUT /api/scheduling/exam-schedules/{id}/
Update an exam schedule (Admin/Academic Coordinator only).

Request body:
```json
{
  "room": "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
  "start_time": "09:30:00",
  "end_time": "11:30:00"
}
```

### DELETE /api/scheduling/exam-schedules/{id}/
Delete an exam schedule (Admin/Academic Coordinator only).

---

## Validation Rules

### Schedule Conflict Prevention
- **Room double-booking**: A room cannot have overlapping class or exam schedules on the same day
- **Teacher double-booking**: A teacher cannot have overlapping schedules on the same day
- Adjacent time slots (e.g., 9:00-10:00 and 10:00-11:00) are allowed on the same day

### Error Response
When validation fails:
```json
{
  "non_field_errors": [
    "Room is already booked for this time slot"
  ]
}
```

---

## Access Control Matrix

| Endpoint | Admin | Coordinator | Teacher | Student | Parent |
|----------|-------|-------------|---------|---------|--------|
| GET /rooms/ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /rooms/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| PUT /rooms/{id}/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| DELETE /rooms/{id}/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| GET /class-schedules/ | All | All | Own only | Enrolled | Linked children |
| POST /class-schedules/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| PUT /class-schedules/{id}/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| DELETE /class-schedules/{id}/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| GET /exam-schedules/ | All | All | Own only | Enrolled | Linked children |
| POST /exam-schedules/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| PUT /exam-schedules/{id}/ | ✓ | ✓ | ✗ | ✗ | ✗ |
| DELETE /exam-schedules/{id}/ | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Recommended Frontend Usage

### For Admin/Coordinator Dashboard
```javascript
// View all schedules for planning
GET /api/scheduling/class-schedules/
GET /api/scheduling/exam-schedules/
GET /api/scheduling/rooms/

// Create new schedule
POST /api/scheduling/class-schedules/
POST /api/scheduling/exam-schedules/
```

### For Teacher Dashboard
```javascript
// View own assigned schedules
GET /api/scheduling/class-schedules/
GET /api/scheduling/exam-schedules/
```

### For Student Dashboard
```javascript
// View enrolled class schedules
GET /api/scheduling/class-schedules/?academic_year=<year_id>

// View upcoming exams
GET /api/scheduling/exam-schedules/?academic_year=<year_id>
```

### For Parent Dashboard
```javascript
// View child's class schedule
GET /api/scheduling/class-schedules/

// View child's exam dates
GET /api/scheduling/exam-schedules/
```

---

This contract is designed to match the current backend implementation in [scheduling/views.py](scheduling/views.py), [scheduling/serializers.py](scheduling/serializers.py), and [scheduling/permissions.py](scheduling/permissions.py).
