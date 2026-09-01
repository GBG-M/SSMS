from rest_framework.permissions import BasePermission

from accounts.models import Role


class AcademicManagerPermission(BasePermission):
    """Allows admin + academic coordinator to manage academic structure."""

    message = 'Only admin and academic coordinator users can manage academic records.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role_names = {role.name for role in request.user.roles.all()}
        return role_names.intersection({Role.ADMIN, Role.ACADEMIC_COORDINATOR})


class AcademicStaffPermission(BasePermission):
    """Allows academic staff and teachers to view or manage assigned academic content."""

    message = 'Only academic staff can access academic content.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role_names = {role.name for role in request.user.roles.all()}
        return role_names.intersection({
            Role.ADMIN,
            Role.ACADEMIC_COORDINATOR,
            Role.TEACHER,
        })


class AcademicStudentPermission(BasePermission):
    """Students can only read their own academic data."""

    message = 'Students can only access their own academic records.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.roles.filter(name=Role.STUDENT).exists()

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.roles.filter(name=Role.STUDENT).exists():
            return True
        try:
            student = request.user.student_profile
        except Exception:
            return False
        return obj.student_id == student.id or getattr(obj, 'student', None) == student
