from rest_framework.permissions import BasePermission

from accounts.models import Role


class SchedulingAccessPermission(BasePermission):
    """Restrict schedule access to academic staff and owners."""

    message = 'You do not have permission to access scheduling records.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role_names = {role.name for role in request.user.roles.all()}
        return bool(role_names.intersection({
            Role.ADMIN,
            Role.ACADEMIC_COORDINATOR,
            Role.TEACHER,
            Role.STUDENT,
            Role.PARENT,
        }))

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        role_names = {role.name for role in request.user.roles.all()}
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return True

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
