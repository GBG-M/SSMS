from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model

from accounts.models import Role
from .permissions import AcademicManagerPermission, AcademicStaffPermission, AcademicStudentPermission
from .models import (
    AcademicYear,
    Subject,
    Course,
    ClassSection,
    Enrollment,
    Assessment,
    GradeRecord,
    AcademicSummary,
)
from .serializers import (
    AcademicYearSerializer,
    SubjectSerializer,
    CourseSerializer,
    ClassSectionSerializer,
    EnrollmentSerializer,
    AssessmentSerializer,
    GradeRecordSerializer,
    AcademicSummarySerializer,
)

User = get_user_model()


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated, AcademicManagerPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']
    ordering_fields = ['start_date', 'end_date']


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, AcademicManagerPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'department']
    search_fields = ['name', 'code', 'department']
    ordering_fields = ['name', 'code', 'credit_hours']


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().select_related('subject', 'academic_year')
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, AcademicManagerPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['academic_year', 'subject', 'level', 'is_active']
    search_fields = ['course_code', 'title', 'subject__name', 'subject__code']
    ordering_fields = ['course_code', 'title', 'level', 'credit_hours']


class ClassSectionViewSet(viewsets.ModelViewSet):
    queryset = ClassSection.objects.all().select_related('academic_year', 'subject', 'teacher')
    serializer_class = ClassSectionSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['academic_year', 'subject', 'teacher', 'is_active']
    search_fields = ['name', 'section_code', 'subject__name', 'teacher__first_name', 'teacher__last_name']
    ordering_fields = ['name', 'section_code', 'capacity']

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Retrieve the roster of students enrolled in this section."""
        section = self.get_object()
        enrollments = section.enrollments.select_related('student').filter(status='ACTIVE')
        data = [
            {
                'enrollment_id': e.id,
                'student_id': e.student.id,
                'student_id_number': e.student.student_id,
                'full_name': e.student.full_name,
                'status': e.status,
                'enrolled_on': e.enrolled_on,
            }
            for e in enrollments
        ]
        return Response(data)


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().select_related('student', 'class_section', 'class_section__subject', 'class_section__academic_year')
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'class_section', 'status', 'class_section__academic_year']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id', 'class_section__name']
    ordering_fields = ['enrolled_on', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            roles = {r.name for r in user.roles.all()}
            if Role.STUDENT in roles:
                try:
                    return queryset.filter(student=user.student_profile)
                except Exception:
                    return queryset.none()
            if Role.PARENT in roles:
                try:
                    child_ids = user.parent_profile.students.values_list('id', flat=True)
                    return queryset.filter(student_id__in=child_ids)
                except Exception:
                    return queryset.none()
        return queryset


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all().select_related('class_section', 'class_section__subject')
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['class_section', 'assessment_type', 'class_section__academic_year']
    search_fields = ['name', 'class_section__name', 'class_section__section_code']
    ordering_fields = ['due_date', 'name', 'weight', 'max_marks']


class GradeRecordViewSet(viewsets.ModelViewSet):
    queryset = GradeRecord.objects.all().select_related(
        'enrollment', 'enrollment__student', 'assessment', 'assessment__class_section'
    )
    serializer_class = GradeRecordSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['enrollment', 'assessment', 'grade', 'assessment__class_section', 'enrollment__student']
    search_fields = ['enrollment__student__first_name', 'enrollment__student__last_name', 'grade', 'assessment__name']
    ordering_fields = ['score', 'recorded_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            roles = {r.name for r in user.roles.all()}
            if Role.STUDENT in roles:
                try:
                    return queryset.filter(enrollment__student=user.student_profile)
                except Exception:
                    return queryset.none()
            if Role.PARENT in roles:
                try:
                    child_ids = user.parent_profile.students.values_list('id', flat=True)
                    return queryset.filter(enrollment__student_id__in=child_ids)
                except Exception:
                    return queryset.none()
        return queryset


class AcademicSummaryViewSet(viewsets.ModelViewSet):
    queryset = AcademicSummary.objects.all().select_related('student', 'academic_year')
    serializer_class = AcademicSummarySerializer
    permission_classes = [IsAuthenticated, AcademicStudentPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id']
    ordering_fields = ['gpa', 'total_credits']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            roles = {r.name for r in user.roles.all()}
            if Role.STUDENT in roles:
                try:
                    return queryset.filter(student=user.student_profile)
                except Exception:
                    return queryset.none()
            if Role.PARENT in roles:
                try:
                    child_ids = user.parent_profile.students.values_list('id', flat=True)
                    return queryset.filter(student_id__in=child_ids)
                except Exception:
                    return queryset.none()
        return queryset
