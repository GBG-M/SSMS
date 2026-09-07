from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import Role


class FinanceAccessPermission(BasePermission):
    """Restrict finance data by role and ownership with strict method-level RBAC."""

    message = 'You do not have access to manage or view this finance record.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        role_names = {role.name for role in request.user.roles.all()}

        # Read-only operations allowed for authorized finance stakeholders
        if request.method in SAFE_METHODS:
            return bool(role_names.intersection({
                Role.ADMIN,
                Role.ACADEMIC_COORDINATOR,
                Role.STUDENT,
                Role.PARENT,
            }))

        # Write operations (POST, PUT, PATCH, DELETE) strictly restricted to Admin
        return bool(role_names.intersection({Role.ADMIN}))

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        role_names = {role.name for role in request.user.roles.all()}
        if Role.ADMIN in role_names:
            return True

        # Non-admin roles cannot modify financial records
        if request.method not in SAFE_METHODS:
            return False

        # FeeType and FeeStructure models can be viewed by all authorized finance stakeholders
        if not hasattr(obj, 'student'):
            return bool(role_names.intersection({
                Role.ADMIN,
                Role.ACADEMIC_COORDINATOR,
                Role.STUDENT,
                Role.PARENT,
            }))

        if Role.STUDENT in role_names:
            try:
                current_student = request.user.student_profile
            except Exception:
                return False
            return obj.student_id == current_student.id or getattr(obj, 'student', None) == current_student

        if Role.PARENT in role_names:
            try:
                parent_profile = request.user.parent_profile
            except Exception:
                return False
            return (
                parent_profile.students.filter(pk=obj.student_id).exists() or
                parent_profile.students.filter(pk=getattr(obj.student, 'pk', None)).exists()
            )

        return False
