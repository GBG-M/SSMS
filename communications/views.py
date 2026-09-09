from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from accounts.models import Role
from .models import ConversationThread, ThreadMessage, SchoolAnnouncement
from .permissions import IsThreadParticipantOrStaff, CanManageAnnouncements
from .serializers import (
    ConversationThreadListSerializer,
    ConversationThreadDetailSerializer,
    ConversationThreadCreateSerializer,
    ThreadMessageSerializer,
    ThreadMessageCreateSerializer,
    SchoolAnnouncementSerializer,
)
from .services import (
    send_thread_message,
    resolve_thread,
    mark_thread_messages_as_read,
    get_eligible_contacts_for_user,
)


class ConversationThreadViewSet(viewsets.ModelViewSet):
    """
    Manages institutional inquiry and conversation threads.
    - Parents: can view and participate in threads involving their children.
    - Teachers: can participate in threads involving students in their classes.
    - Admins: full supervisory visibility across all threads.
    """
    queryset = ConversationThread.objects.select_related('student', 'created_by').prefetch_related('participants', 'messages').all()
    permission_classes = [IsAuthenticated, IsThreadParticipantOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'student']
    search_fields = [
        'subject',
        'student__first_name',
        'student__last_name',
        'student__student_id',
        'messages__content',
    ]
    ordering_fields = ['updated_at', 'created_at', 'status']
    ordering = ['-updated_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}

        # 1. Staff and Superusers can view all institutional conversations
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset


        # 2. Others can only view threads they participate in
        return queryset.filter(participants=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationThreadListSerializer
        elif self.action == 'create':
            return ConversationThreadCreateSerializer
        return ConversationThreadDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Automatically mark messages as read for the user viewing the thread
        mark_thread_messages_as_read(instance, request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()
        return Response(
            ConversationThreadDetailSerializer(thread, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='messages')
    def post_message(self, request, pk=None):
        """Append a reply to this thread."""
        thread = self.get_object()
        serializer = ThreadMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = send_thread_message(
            thread=thread,
            sender=request.user,
            content=serializer.validated_data['content']
        )

        return Response(
            ThreadMessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        """Mark an inquiry thread as resolved."""
        thread = self.get_object()
        thread = resolve_thread(thread, request.user)
        return Response(
            ConversationThreadDetailSerializer(thread, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Explicitly mark all unread messages as read."""
        thread = self.get_object()
        count = mark_thread_messages_as_read(thread, request.user)
        return Response({'message': f'{count} messages marked as read.', 'count': count})


class ContactsDirectoryAPIView(APIView):
    """
    Returns eligible contacts for direct messaging based on institutional roles:
    - Parents: Their children + each child's active teachers and school office.
    - Teachers: Their active classes + enrolled students + linked parents.
    - Staff: Full directory.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contacts_data = get_eligible_contacts_for_user(request.user)
        return Response(contacts_data, status=status.HTTP_200_OK)


class SchoolAnnouncementViewSet(viewsets.ModelViewSet):
    """
    Institutional announcements, circulars, and official bulletins.
    """
    queryset = SchoolAnnouncement.objects.select_related('author').all()
    serializer_class = SchoolAnnouncementSerializer
    permission_classes = [CanManageAnnouncements]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['target_audience', 'priority', 'is_published']
    search_fields = ['title', 'content', 'author__first_name', 'author__last_name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}

        # Staff can see all (including unpublished drafts)
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset

        # Filter by audience and published status for standard users
        allowed_audiences = ['ALL']
        if Role.PARENT in role_names:
            allowed_audiences.append('PARENTS')
        if Role.TEACHER in role_names:
            allowed_audiences.append('TEACHERS')
        if Role.STUDENT in role_names:
            allowed_audiences.append('STUDENTS')

        return queryset.filter(is_published=True, target_audience__in=allowed_audiences)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
