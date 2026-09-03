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

        # For student profile creation, modification, and document administration: Admin and Coordinator only
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
            return False

        # Non-staff roles (Student and Parent) cannot perform write operations
        if request.method not in SAFE_METHODS:
            return False

        # Student viewing own record
        if Role.STUDENT in role_names:
            try:
                student_profile = request.user.student_profile
            except Exception:
                return False

            if isinstance(obj, Student):
                return obj.id == student_profile.id or obj.user_id == request.user.id

            if hasattr(obj, 'student_id') and not isinstance(obj, Student):
                return obj.student_id == student_profile.id

            if hasattr(obj, 'student'):
                return obj.student.id == student_profile.id

            return False

        # Parent viewing linked child's record
        if Role.PARENT in role_names:
            try:
                parent_profile = request.user.parent_profile
            except Exception:
                return False

            child_ids = set(parent_profile.students.values_list('id', flat=True))

            if isinstance(obj, Student):
                return obj.id in child_ids

            if hasattr(obj, 'student_id') and not isinstance(obj, Student):
                return obj.student_id in child_ids

            if hasattr(obj, 'student'):
                return obj.student.id in child_ids

            return False

        return False
