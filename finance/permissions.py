from rest_framework.permissions import BasePermission

from accounts.models import Role


class FinanceAccessPermission(BasePermission):
    """Restrict finance data by role and ownership."""

    message = 'You do not have access to this finance record.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role_names = {role.name for role in request.user.roles.all()}
        return role_names.intersection({Role.ADMIN, Role.STUDENT, Role.PARENT})

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        role_names = {role.name for role in request.user.roles.all()}
        if Role.ADMIN in role_names:
            return True

        if Role.STUDENT in role_names:
            try:
                current_student = request.user.student_profile
            except Exception:
                return False
            if hasattr(obj, 'student'):
                return obj.student_id == current_student.id or obj.student == current_student
            return False

        if Role.PARENT in role_names:
            try:
                parent_profile = request.user.parent_profile
            except Exception:
                return False
            if hasattr(obj, 'student'):
                return parent_profile.students.filter(pk=obj.student_id).exists() or parent_profile.students.filter(pk=getattr(obj.student, 'pk', None)).exists()
            return False

        return False
