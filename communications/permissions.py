from rest_framework import permissions
from accounts.models import Role


class IsThreadParticipantOrStaff(permissions.BasePermission):
    """
    Ensures that only participants of a thread or institutional staff
    (Admin, Academic Coordinator) can view or reply to a thread.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        role_names = {role.name for role in user.roles.all()}
        
        # Staff can inspect any thread for safety and supervision
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return True

        from .models import ConversationThread, ThreadMessage
        if isinstance(obj, ConversationThread):
            return obj.participants.filter(id=user.id).exists()
        elif isinstance(obj, ThreadMessage):
            return obj.thread.participants.filter(id=user.id).exists()

        return False


class CanManageAnnouncements(permissions.BasePermission):
    """
    Staff and teachers can publish announcements.
    All authenticated users can read announcements intended for their audience.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        # Writing / Editing requires Staff or Teacher role
        role_names = {role.name for role in request.user.roles.all()}
        allowed_roles = {Role.ADMIN, Role.ACADEMIC_COORDINATOR, Role.TEACHER}
        return bool(role_names.intersection(allowed_roles))
