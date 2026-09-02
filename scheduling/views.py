from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from accounts.models import Role
from .models import Room, ClassSchedule, ExamSchedule
from .permissions import SchedulingAccessPermission
from .serializers import RoomSerializer, ClassScheduleSerializer, ExamScheduleSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, SchedulingAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['building', 'is_active', 'capacity']
    search_fields = ['name', 'room_number', 'building']
    ordering_fields = ['name', 'room_number', 'capacity']


class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.select_related('class_section', 'room', 'teacher', 'academic_year').all()
    serializer_class = ClassScheduleSerializer
    permission_classes = [IsAuthenticated, SchedulingAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['class_section', 'room', 'teacher', 'day_of_week', 'academic_year', 'term']
    search_fields = ['class_section__name', 'teacher__first_name', 'teacher__last_name', 'room__name']
    ordering_fields = ['day_of_week', 'start_time', 'end_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset

        if Role.TEACHER in role_names:
            return queryset.filter(teacher=user)

        if Role.STUDENT in role_names:
            try:
                student = user.student_profile
            except Exception:
                return queryset.none()
            return queryset.filter(class_section__enrollments__student=student, class_section__enrollments__status='ACTIVE')

        if Role.PARENT in role_names:
            try:
                parent_profile = user.parent_profile
            except Exception:
                return queryset.none()
            return queryset.filter(class_section__enrollments__student__in=parent_profile.students.all())

        return queryset.none()


class ExamScheduleViewSet(viewsets.ModelViewSet):
    queryset = ExamSchedule.objects.select_related('class_section', 'room', 'academic_year').all()
    serializer_class = ExamScheduleSerializer
    permission_classes = [IsAuthenticated, SchedulingAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['class_section', 'room', 'exam_type', 'academic_year']
    search_fields = ['class_section__name', 'room__name', 'exam_type']
    ordering_fields = ['exam_date', 'start_time', 'end_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset

        if Role.TEACHER in role_names:
            return queryset.filter(class_section__teacher=user)

        if Role.STUDENT in role_names:
            try:
                student = user.student_profile
            except Exception:
                return queryset.none()
            return queryset.filter(class_section__enrollments__student=student, class_section__enrollments__status='ACTIVE')

        if Role.PARENT in role_names:
            try:
                parent_profile = user.parent_profile
            except Exception:
                return queryset.none()
            return queryset.filter(class_section__enrollments__student__in=parent_profile.students.all())

        return queryset.none()
