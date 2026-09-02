# Notifications Module - Implementation Plan

## 📋 Overview

The notifications module is the final core module for SSMS, enabling real-time communication across the system. Users (admins, teachers, students, parents) receive notifications about:
- **Fee Updates**: Outstanding fees, payment reminders, payment confirmations
- **Academic Updates**: Grade postings, class schedule changes, exam announcements
- **Schedule Changes**: Class rescheduling, room changes, exam date updates
- **System Alerts**: Important announcements, maintenance notices

**Current State**: Empty/placeholder (models, views, urls, tests files need implementation)

**Goal**: Production-ready notifications module matching quality standards of finance, academics, and scheduling modules

---

## 🎯 Implementation Steps

### **STEP 1: Create Models** (notifications/models.py)

**Purpose**: Define notification domain model

**What to implement**:
```python
# Notification model fields:
- id: UUID (primary key)
- recipient: ForeignKey to User (who receives notification)
- notification_type: CharField (CHOICE: FEE_DUE, FEE_PAID, CLASS_SCHEDULE_CHANGED, EXAM_ANNOUNCED, GRADE_POSTED, SYSTEM_ALERT)
- title: CharField (max 200) - "Your fee is due"
- message: TextField - Full notification text
- recipient_role: CharField (CHOICE from Role model) - For efficient filtering
- related_student: ForeignKey to StudentProfile (nullable) - For parent notifications
- is_read: BooleanField (default False) - Track if user opened notification
- created_at: DateTimeField (auto_now_add)
- updated_at: DateTimeField (auto_now)
```

**Key Features**:
- Denormalized `recipient_role` field for efficient filtering (students get fee notifications, teachers get class changes)
- Nullable `related_student` for parent notifications (parent can see child's notifications)
- `is_read` status for frontend "unread badge"
- UUID primary key for consistency with other modules

**Validation**:
- notification_type must be valid choice
- recipient_role must match recipient.roles
- No duplicate read status updates (idempotent)

---

### **STEP 2: Create Permissions** (notifications/permissions.py)

**Purpose**: Role-based access control for notification endpoints

**What to implement**:
```python
class NotificationAccessPermission(BasePermission):
    """
    - Users can only see their own notifications
    - Admin/Academic Coordinator can see all notifications (for management)
    - Parents can see notifications for their linked children
    - Users can mark only their own notifications as read
    """
    
    has_permission():
        - Return True if user is authenticated
        
    has_object_permission():
        - If notification.recipient == user: Allow (my own notification)
        - If user.roles.contains(ADMIN, ACADEMIC_COORDINATOR): Allow (admin view all)
        - If user is parent AND notification.related_student in user.children: Allow
        - Return False otherwise
```

**Access Rules**:
| Role | Can View | Can Mark as Read |
|------|----------|------------------|
| Admin | All notifications | Yes (all) |
| Academic Coordinator | All notifications | Yes (all) |
| Teacher | Own notifications | Yes (own) |
| Student | Own notifications | Yes (own) |
| Parent | Own + children's | Yes (linked children) |

---

### **STEP 3: Create Serializers** (notifications/serializers.py)

**Purpose**: DRF serializers for API responses

**What to implement**:
```python
class NotificationSerializer(ModelSerializer):
    Fields:
    - id (read_only)
    - recipient_id (read_only) - user who receives
    - recipient_name (SerializerMethodField) - recipient.get_full_name()
    - notification_type (read_only) - Choice field
    - title (read_only)
    - message (read_only)
    - recipient_role (read_only)
    - is_read (writable) - Allows PATCH to mark as read
    - related_student_id (read_only, nullable)
    - related_student_name (SerializerMethodField)
    - created_at (read_only)
    - updated_at (read_only)
    
    Meta:
        - model = Notification
        - fields = [explicit list, not '__all__']
        - read_only_fields = (all except is_read)
```

**Key Features**:
- `recipient_name` computed field for frontend display
- `related_student_name` for parent notifications
- Explicit field list for API stability
- `is_read` writable to support PATCH /api/notifications/{id}/ endpoint

---

### **STEP 4: Create ViewSets** (notifications/views.py)

**Purpose**: API endpoints for notification management

**What to implement**:
```python
class NotificationViewSet(viewsets.ModelViewSet):
    Actions:
    - GET /api/notifications/ - List my notifications
    - GET /api/notifications/{id}/ - Retrieve one notification
    - PATCH /api/notifications/{id}/ - Mark as read (partial_update)
    
    Filters:
    - is_read: True/False - Filter by read status
    - notification_type: FEE_DUE, CLASS_SCHEDULE_CHANGED, etc.
    - created_at: Date range filter
    
    Search:
    - title, message fields
    
    Ordering:
    - -created_at (newest first, default)
    - -updated_at, is_read
    
    get_queryset():
        - Return user's own notifications
        - If parent: include children's notifications
        - If admin/coordinator: return all
        - Optimize with select_related('recipient', 'related_student')
    
    partial_update():
        - Only allow updating is_read field
        - Prevent other field changes
        - Return 200 with updated notification
```

**API Endpoints**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/notifications/ | List my unread/all notifications |
| GET | /api/notifications/{id}/ | Get notification detail |
| PATCH | /api/notifications/{id}/ | Mark as read |
| DELETE | /api/notifications/{id}/ | Delete notification (optional) |

**Query Examples**:
```
GET /api/notifications/?is_read=false - Show unread only
GET /api/notifications/?notification_type=FEE_DUE - Filter by type
GET /api/notifications/?ordering=-created_at - Newest first
GET /api/notifications/?search=fee - Search by title/message
```

---

### **STEP 5: Create URL Routing** (notifications/urls.py)

**Purpose**: Register viewset routes

**What to implement**:
```python
from rest_framework.routers import SimpleRouter
from .views import NotificationViewSet

router = SimpleRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls
```

**Routes Generated**:
- GET /api/notifications/
- POST /api/notifications/ (create - admin only)
- GET /api/notifications/{id}/
- PATCH /api/notifications/{id}/ (mark as read)
- DELETE /api/notifications/{id}/

---

### **STEP 6: Create Admin Interface** (notifications/admin.py)

**Purpose**: Django admin for staff management

**What to implement**:
```python
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'recipient_role', 'created_at')
    search_fields = ('title', 'message', 'recipient__email', 'recipient__first_name')
    
    fieldsets = (
        ('Recipient', {'fields': ('recipient', 'recipient_role', 'related_student')}),
        ('Content', {'fields': ('notification_type', 'title', 'message')}),
        ('Status', {'fields': ('is_read',)}),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    actions = ['mark_as_read', 'mark_as_unread']
    
    # Bulk actions to mark notifications read/unread
```

**Admin Features**:
- Filter by type, read status, role, date
- Search by title, message, recipient email
- Bulk mark as read/unread actions
- Readonly timestamps

---

### **STEP 7: Create Tests** (notifications/tests.py)

**Purpose**: Comprehensive validation and access control tests

**What to implement**:
```python
class NotificationModelTests(TestCase):
    - test_notification_creation_basic
    - test_notification_type_choices_valid
    - test_notification_title_required
    - test_notification_message_required
    
class NotificationAccessControlTests(TestCase):
    - test_user_can_see_own_notifications_only
    - test_admin_can_see_all_notifications
    - test_parent_can_see_children_notifications
    - test_parent_cannot_see_unrelated_students_notifications
    - test_teacher_cannot_see_other_teacher_notifications
    
class NotificationAPITests(TestCase):
    - test_list_notifications_returns_own_only
    - test_get_notification_detail_unauthorized
    - test_mark_notification_as_read
    - test_mark_notification_as_unread
    - test_filter_by_is_read_status
    - test_filter_by_notification_type
    - test_search_by_title_and_message
    - test_ordering_by_created_at_desc
    - test_unauthenticated_user_cannot_access
    
class NotificationCreationHelperTests(TestCase):
    - test_fee_notification_created_on_fee_overdue
    - test_grade_notification_created_on_grade_posted
    - test_schedule_notification_created_on_class_rescheduled
```

**Expected**: 15+ tests, all passing

---

### **STEP 8: Create Database Migration**

**Purpose**: Schema creation

**Command**:
```bash
python manage.py makemigrations notifications
python manage.py migrate notifications
```

**Generated Migration**:
- Creates notifications_notification table
- Indexes on (recipient, created_at) for efficient filtering
- Foreign key constraints to auth_user, student_profile

---

### **STEP 9: Integrate into Project** (SSMS/urls.py)

**Purpose**: Register notifications API in main project

**What to update**:
```python
# SSMS/urls.py
urlpatterns = [
    ...
    path('api/notifications/', include('notifications.urls', namespace='notifications-api')),
    ...
]
```

---

### **STEP 10: Create API Contract** (notifications/API_CONTRACT.md)

**Purpose**: Frontend integration documentation

**What to include**:
- Complete endpoint specifications with examples
- Response schemas (notification object structure)
- Error responses (401, 403, 404)
- Query parameters reference
- Access control matrix by role
- Frontend usage patterns (React)
- Real-time considerations (polling vs WebSocket)

**Example endpoints documented**:
```
GET /api/notifications/ - List my notifications
GET /api/notifications/?is_read=false - Unread only
PATCH /api/notifications/{id}/ - Mark as read
GET /api/notifications/?notification_type=FEE_DUE - Filter by type
```

---

## 🔄 Communication Flow

The notification system enables one-way communication FROM the system TO users:

1. **System Event** (e.g., fee becomes overdue)
2. **Notification Created** (admin creates or system auto-creates)
3. **User Receives** (appears in notification center)
4. **User Reads** (marks is_read = true)
5. **Dashboard Displays** (notification badge updates)

**Note**: This is one-way notification. Future versions could add:
- Two-way messaging (user replies)
- Notification preferences (user chooses notification types)
- WebSocket real-time delivery instead of polling

---

## 📊 Project Architecture Integration

```
┌─ User
│  └─ Has many Notifications
│  └─ Can be Recipient
│
├─ StudentProfile
│  └─ Referenced in Notification.related_student
│  └─ For parent notifications
│
├─ Role
│  └─ Stored in Notification.recipient_role
│  └─ For efficient role-based filtering
│
└─ Finance/Academics/Scheduling modules
   └─ Trigger notification creation
   └─ E.g., FeeType creation → FEE_DUE notifications
```

---

## ✅ Quality Checklist

- [ ] Models with UUID PK, timestamps, validation
- [ ] Permissions with role-based access control
- [ ] Serializers with computed fields, explicit field lists
- [ ] ViewSets with filters, search, ordering
- [ ] Admin interface with fieldsets, filters, readonly fields
- [ ] URL routing integrated into SSMS/urls.py
- [ ] 15+ comprehensive tests (models, access, API)
- [ ] Database migrations created and applied
- [ ] API_CONTRACT.md documentation for frontend
- [ ] Django system check passed (no issues)
- [ ] All tests passing (100% success rate)

---

## 🚀 Implementation Order

**Phase 1 - Core**:
1. Models → Permissions → Serializers (understanding data structure)
2. ViewSets → URL routing (API layer)
3. Admin interface (staff management)

**Phase 2 - Testing & Docs**:
4. Tests (validate everything works)
5. Migrations (database schema)
6. API_CONTRACT.md (frontend integration)

**Phase 3 - Integration**:
7. Add to SSMS/urls.py
8. Run full test suite
9. Git commit & push

---

## 📁 Files to Create/Modify

| File | Status | Lines | Purpose |
|------|--------|-------|---------|
| notifications/models.py | Create | ~80 | Notification model with validation |
| notifications/permissions.py | Create | ~40 | NotificationAccessPermission class |
| notifications/serializers.py | Create | ~50 | NotificationSerializer |
| notifications/views.py | Create | ~60 | NotificationViewSet with role filtering |
| notifications/urls.py | Create | ~15 | SimpleRouter registration |
| notifications/admin.py | Create | ~30 | NotificationAdmin with fieldsets |
| notifications/tests.py | Enhance | ~200 | 15+ comprehensive tests |
| notifications/migrations/0001_initial.py | Generate | ~50 | Database schema migration |
| notifications/API_CONTRACT.md | Create | ~150 | Frontend integration documentation |
| SSMS/urls.py | Modify | +1 | Include notifications routes |
| SSMS/settings.py | Verify | - | 'notifications' already in INSTALLED_APPS |

**Total Implementation**: ~2-3 hours of development

---

## 🎓 Key Principles

1. **Consistency**: Follow patterns from finance, academics, scheduling modules
2. **Security**: Role-based access control prevents unauthorized access
3. **Performance**: Denormalized fields for efficient filtering
4. **Scalability**: UUID PKs, proper indexing, select_related optimization
5. **Testability**: Comprehensive test coverage for models, views, permissions
6. **Documentation**: API_CONTRACT.md for frontend team clarity

---

## Next: STEP-BY-STEP IMPLEMENTATION

Ready to implement notifications module following this plan?

**Suggested approach**:
1. Create feature/notifications-module branch from main
2. Implement files in order: models → permissions → serializers → views → urls → admin → tests → migrations
3. Run Django check and test suite after each major step
4. Create API_CONTRACT.md documentation
5. Commit and push to GitHub
6. Create PR for review and merge

**Proceed?** ✅
