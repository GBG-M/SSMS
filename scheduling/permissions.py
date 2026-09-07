from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import Role


class SchedulingAccessPermission(BasePermission):
    """Restrict schedule access to academic staff and owners with strict method-level enforcement."""

    message = 'You do not have permission to access or modify scheduling records.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        role_names = {role.name for role in request.user.roles.all()}

        # Read-only operations allowed for all active school community roles
        if request.method in SAFE_METHODS:
            return bool(role_names.intersection({
                Role.ADMIN,
                Role.ACADEMIC_COORDINATOR,
                Role.TEACHER,
                Role.STUDENT,
                Role.PARENT,
            }))

        # Write operations (POST, PUT, PATCH, DELETE) require administrative/coordinator authority
        return bool(role_names.intersection({Role.ADMIN, Role.ACADEMIC_COORDINATOR}))

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        role_names = {role.name for role in request.user.roles.all()}
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return True

        # Non-staff roles cannot modify schedules
        if request.method not in SAFE_METHODS:
            return False

        # Room models can be read by all authenticated roles
        if obj.__class__.__name__ == 'Room':
            return bool(role_names.intersection({
                Role.ADMIN,
                Role.ACADEMIC_COORDINATOR,
                Role.TEACHER,
                Role.STUDENT,
                Role.PARENT,
            }))

        if Role.TEACHER in role_names:
            if hasattr(obj, 'teacher') and obj.teacher_id == request.user.id:
                return True
            if hasattr(obj, 'class_section') and obj.class_section.teacher_id == request.user.id:
                return True
            return False

        if Role.STUDENT in role_names:
            try:
                student = request.user.student_profile
            except Exception:
                return False
            if hasattr(obj, 'class_section'):
                return obj.class_section.enrollments.filter(student_id=student.id, status='ACTIVE').exists()
            if hasattr(obj, 'student'):
                return obj.student_id == student.id
            return False

        if Role.PARENT in role_names:
            try:
                parent_profile = request.user.parent_profile
            except Exception:
                return False
            if hasattr(obj, 'class_section'):
                return parent_profile.students.filter(pk__in=obj.class_section.enrollments.values_list('student_id', flat=True)).exists()
            return False

        return False
