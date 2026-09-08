from rest_framework.permissions import BasePermission, SAFE_METHODS
from accounts.models import Role
from .models import Student


class StudentAccessPermission(BasePermission):
    """
    Role-based access control for Student domain models:
    - Admins & Academic Coordinators: Full CRUD.
    - Teachers: Can view students, record academic results, and mark attendance.
    - Students: Strictly read-only access scoped to their own records.
    - Parents: Strictly read-only access scoped to their linked children.
    """

    message = 'You do not have permission to perform this action on student records.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        role_names = {role.name for role in request.user.roles.all()}
        allowed_roles = {
            Role.ADMIN,
            Role.ACADEMIC_COORDINATOR,
            Role.TEACHER,
            Role.STUDENT,
            Role.PARENT,
        }
        if not role_names.intersection(allowed_roles):
            return False

        # Read-only requests are allowed for all valid roles
        if request.method in SAFE_METHODS:
            return True

        # Write operations:
        # Teachers, Coordinators, and Admins can record attendance and academic records
        view_name = view.__class__.__name__
        action_name = getattr(view, 'action', '')

        if view_name in ['AttendanceViewSet', 'AcademicRecordViewSet'] or action_name in ['mark_attendance', 'add_academic_record']:
            return bool(role_names.intersection({Role.ADMIN, Role.ACADEMIC_COORDINATOR, Role.TEACHER}))

        # Document uploads and document management
        if (view_name == 'StudentDocumentViewSet' and request.method in ['POST', 'DELETE', 'PUT', 'PATCH']) or action_name == 'upload_document':
            return True

        # For student profile creation, modification, and status changes: Admin and Coordinator only
        return bool(role_names.intersection({Role.ADMIN, Role.ACADEMIC_COORDINATOR}))

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        role_names = {role.name for role in request.user.roles.all()}

        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return True

        view_name = view.__class__.__name__
        action_name = getattr(view, 'action', '')

        # Teachers
        if Role.TEACHER in role_names:
            if request.method in SAFE_METHODS:
                return True
            if view_name in ['AttendanceViewSet', 'AcademicRecordViewSet'] or action_name in ['mark_attendance', 'add_academic_record']:
                return True
            if view_name == 'StudentDocumentViewSet' and request.method in ['POST', 'DELETE']:
                return True
            return False

        # Student viewing or managing own record
        if Role.STUDENT in role_names:
            try:
                student_profile = request.user.student_profile
            except Exception:
                return False

            is_own_record = False
            if isinstance(obj, Student):
                is_own_record = (obj.id == student_profile.id or obj.user_id == request.user.id)
            elif hasattr(obj, 'student_id') and not isinstance(obj, Student):
                is_own_record = (obj.student_id == student_profile.id)
            elif hasattr(obj, 'student'):
                is_own_record = (obj.student.id == student_profile.id)

            if not is_own_record:
                return False

            if request.method in SAFE_METHODS:
                return True

            # Students can manage documents belonging to their student profile
            if view_name == 'StudentDocumentViewSet' and request.method in ['DELETE', 'PATCH', 'PUT']:
                return is_own_record

            return False

        # Parent viewing or managing linked child's record
        if Role.PARENT in role_names:
            try:
                parent_profile = request.user.parent_profile
            except Exception:
                return False

            child_ids = set(parent_profile.students.values_list('id', flat=True))
            is_child_record = False
            if isinstance(obj, Student):
                is_child_record = (obj.id in child_ids)
            elif hasattr(obj, 'student_id') and not isinstance(obj, Student):
                is_child_record = (obj.student_id in child_ids)
            elif hasattr(obj, 'student'):
                is_child_record = (obj.student.id in child_ids)

            if not is_child_record:
                return False

            if request.method in SAFE_METHODS:
                return True

            # Parents can delete/manage documents uploaded by themselves for their child
            if view_name == 'StudentDocumentViewSet' and request.method in ['DELETE', 'PATCH', 'PUT']:
                return getattr(obj, 'uploaded_by_id', None) == request.user.id

            return False

        return False
