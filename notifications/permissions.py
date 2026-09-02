from rest_framework.permissions import BasePermission
from accounts.models import Role


class NotificationAccessPermission(BasePermission):
    """
    Role-based access control for notifications:
    - Admin / Coordinator: Can view, manage, and create all notifications.
    - Teachers: Can view own received/sent notifications and broadcast to their classes.
    - Students: Can view and mark as read their own notifications.
    - Parents: Can view and mark as read their own notifications + notifications linked to their enrolled children.
    """

    message = 'You do not have permission to access this notification.'

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

        # 1. Admin / Coordinator has full access
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return True

        # 2. Recipient owns the notification
        if obj.recipient_id == request.user.id:
            return True

        # 3. Sender / Teacher viewing sent notice
        if obj.sender_id == request.user.id:
            return True

        # 4. Parent access for linked children
        if Role.PARENT in role_names and hasattr(request.user, 'parent_profile'):
            parent_profile = request.user.parent_profile
            if obj.related_student_id and parent_profile.students.filter(pk=obj.related_student_id).exists():
                return True

        return False
