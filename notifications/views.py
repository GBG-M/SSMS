from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from accounts.models import Role
from .models import Notification
from .permissions import NotificationAccessPermission
from .serializers import (
    NotificationSerializer,
    NotificationCreateSerializer,
    BroadcastClassSerializer,
)
from .services import create_notification, notify_class_section


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notifications:
    - List/retrieve notifications scoped to user role.
    - Mark notifications as read / unread.
    - Unread count badge counter.
    - Teacher/Admin class broadcasts and direct messaging.
    """

    queryset = Notification.objects.select_related('recipient', 'sender', 'related_student').all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, NotificationAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'priority', 'recipient_role', 'related_student']
    search_fields = [
        'title',
        'message',
        'sender__first_name',
        'sender__last_name',
        'sender__email',
        'recipient__first_name',
        'recipient__last_name',
        'recipient__email',
    ]
    ordering_fields = ['created_at', 'priority', 'is_read', 'notification_type']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}

        # 1. Admin & Coordinator see all
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset

        # 2. Teacher sees received + sent notices
        if Role.TEACHER in role_names:
            return queryset.filter(Q(recipient=user) | Q(sender=user))

        # 3. Parent sees received notices + notices regarding their linked children
        if Role.PARENT in role_names:
            parent_query = Q(recipient=user)
            if hasattr(user, 'parent_profile'):
                parent_students = user.parent_profile.students.all()
                parent_query |= Q(related_student__in=parent_students)
            return queryset.filter(parent_query)

        # 4. Student sees received notices
        if Role.STUDENT in role_names:
            student_query = Q(recipient=user)
            if hasattr(user, 'student_profile'):
                student_query |= Q(related_student=user.student_profile)
            return queryset.filter(student_query)

        return queryset.filter(recipient=user)

    def create(self, request, *args, **kwargs):
        """Allow staff/teachers to send notifications."""
        user_roles = {r.name for r in request.user.roles.all()}
        allowed_roles = {Role.ADMIN, Role.ACADEMIC_COORDINATOR, Role.TEACHER}

        if not user_roles.intersection(allowed_roles):
            return Response(
                {'error': 'Only staff and teachers can create notifications.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = NotificationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from django.contrib.auth import get_user_model
        User = get_user_model()
        recipient = User.objects.get(id=data['recipient_id'])

        notification = create_notification(
            recipient=recipient,
            title=data['title'],
            message=data['message'],
            notification_type=data.get('notification_type', 'TEACHER_MESSAGE'),
            sender=request.user,
            related_student=data.get('related_student_id'),
            priority=data.get('priority', 'NORMAL'),
        )

        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, *args, **kwargs):
        """Update notification (primarily for toggling is_read)."""
        instance = self.get_object()
        if 'is_read' in request.data:
            is_read = bool(request.data['is_read'])
            if is_read:
                instance.mark_as_read()
            else:
                instance.mark_as_unread()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({
            'message': 'Notification marked as read.',
            'notification': NotificationSerializer(notification).data
        })

    @action(detail=True, methods=['post'], url_path='mark-unread')
    def mark_unread(self, request, pk=None):
        """Mark a single notification as unread."""
        notification = self.get_object()
        notification.mark_as_unread()
        return Response({
            'message': 'Notification marked as unread.',
            'notification': NotificationSerializer(notification).data
        })

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all unread notifications for current user as read."""
        user = request.user
        unread_qs = self.get_queryset().filter(recipient=user, is_read=False)
        count = unread_qs.count()
        unread_qs.update(is_read=True, read_at=timezone.now(), updated_at=timezone.now())

        return Response({
            'message': f'{count} notifications marked as read.',
            'count': count
        })

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get the count of unread notifications for dashboard badges."""
        user = request.user
        unread_count = self.get_queryset().filter(recipient=user, is_read=False).count()
        return Response({'unread_count': unread_count})

    @action(detail=False, methods=['post'], url_path='broadcast-class')
    def broadcast_class(self, request):
        """Broadcast an announcement or alert to all students and parents of a class section."""
        user_roles = {r.name for r in request.user.roles.all()}
        allowed_roles = {Role.ADMIN, Role.ACADEMIC_COORDINATOR, Role.TEACHER}

        if not user_roles.intersection(allowed_roles):
            return Response(
                {'error': 'Only staff and teachers can broadcast class notifications.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BroadcastClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        class_section = data['class_section_id']

        # If teacher, verify they teach this section
        if Role.TEACHER in user_roles and Role.ADMIN not in user_roles and Role.ACADEMIC_COORDINATOR not in user_roles:
            if class_section.teacher_id != request.user.id:
                return Response(
                    {'error': 'You can only broadcast to class sections assigned to you.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        notifications = notify_class_section(
            class_section=class_section,
            title=data['title'],
            message=data['message'],
            notification_type='TEACHER_MESSAGE',
            sender=request.user,
            priority=data.get('priority', 'NORMAL'),
            include_parents=data.get('include_parents', True),
        )

        return Response({
            'message': f'Successfully sent {len(notifications)} notifications.',
            'count': len(notifications),
            'class_section': class_section.name,
        }, status=status.HTTP_201_CREATED)
