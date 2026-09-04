from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import Role


class AcademicManagerPermission(BasePermission):
    """Allows admin + academic coordinator to manage academic structure (years, subjects, courses)."""

    message = 'Only admin and academic coordinator users can manage academic structure.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        role_names = {role.name for role in request.user.roles.all()}
        if request.method in SAFE_METHODS:
            return bool(role_names.intersection({
                Role.ADMIN,
                Role.ACADEMIC_COORDINATOR,
                Role.TEACHER,
                Role.STUDENT,
                Role.PARENT,
            }))
        return bool(role_names.intersection({Role.ADMIN, Role.ACADEMIC_COORDINATOR}))


class AcademicStaffPermission(BasePermission):
    """
    Allows academic staff and teachers to view or manage assigned academic content.
    Students and parents have read-only access.
    """

    message = 'Only academic staff can modify academic content.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        role_names = {role.name for role in request.user.roles.all()}
        if request.method in SAFE_METHODS:
            return bool(role_names.intersection({
                Role.ADMIN,
                Role.ACADEMIC_COORDINATOR,
                Role.TEACHER,
                Role.STUDENT,
                Role.PARENT,
            }))
        return bool(role_names.intersection({
            Role.ADMIN,
            Role.ACADEMIC_COORDINATOR,
            Role.TEACHER,
        }))


class AcademicStudentPermission(BasePermission):
    """
    Access control for student academic summaries:
    - Admins & Academic Coordinators have full access.
    - Teachers have view/update access.
    - Students and parents have read-only access to their own summaries.
    """

    message = 'You do not have permission to access these academic records.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        role_names = {role.name for role in request.user.roles.all()}
        if request.method in SAFE_METHODS:
            return bool(role_names.intersection({
                Role.ADMIN,
                Role.ACADEMIC_COORDINATOR,
                Role.TEACHER,
                Role.STUDENT,
                Role.PARENT,
            }))
        return bool(role_names.intersection({
            Role.ADMIN,
            Role.ACADEMIC_COORDINATOR,
            Role.TEACHER,
        }))

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        role_names = {role.name for role in request.user.roles.all()}
        if role_names.intersection({Role.ADMIN, Role.ACADEMIC_COORDINATOR, Role.TEACHER}):
            return True
        if request.method not in SAFE_METHODS:
            return False
        if Role.STUDENT in role_names:
            try:
                student = request.user.student_profile
                return obj.student_id == student.id or getattr(obj, 'student', None) == student
            except Exception:
                return False
        if Role.PARENT in role_names:
            try:
                parent = request.user.parent_profile
                child_ids = set(parent.students.values_list('id', flat=True))
                return obj.student_id in child_ids or getattr(obj, 'student_id', None) in child_ids
            except Exception:
                return False
        return False
