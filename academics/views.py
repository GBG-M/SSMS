from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

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


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated, AcademicManagerPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['start_date', 'end_date']


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, AcademicManagerPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'department']
    ordering_fields = ['name', 'code']


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['academic_year', 'subject', 'level', 'is_active']
    search_fields = ['course_code', 'title']
    ordering_fields = ['course_code', 'title']


class ClassSectionViewSet(viewsets.ModelViewSet):
    queryset = ClassSection.objects.all()
    serializer_class = ClassSectionSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['academic_year', 'subject', 'teacher', 'is_active']
    search_fields = ['name', 'section_code', 'subject__name']
    ordering_fields = ['name', 'section_code']


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'class_section', 'status']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id']
    ordering_fields = ['enrolled_on', 'status']


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['class_section', 'assessment_type']
    search_fields = ['name']
    ordering_fields = ['due_date', 'name']


class GradeRecordViewSet(viewsets.ModelViewSet):
    queryset = GradeRecord.objects.all()
    serializer_class = GradeRecordSerializer
    permission_classes = [IsAuthenticated, AcademicStaffPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['enrollment', 'assessment', 'grade', 'academic_year']
    search_fields = ['enrollment__student__first_name', 'enrollment__student__last_name', 'grade']
    ordering_fields = ['score', 'recorded_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        request = getattr(self, 'request', None)
        if request is None:
            return queryset
        user = getattr(request, 'user', None)
        if user is not None and user.is_authenticated and user.roles.filter(name=Role.STUDENT).exists():
            try:
                student = user.student_profile
            except Exception:
                return queryset.none()
            queryset = queryset.filter(enrollment__student=student)
        return queryset


class AcademicSummaryViewSet(viewsets.ModelViewSet):
    queryset = AcademicSummary.objects.all()
    serializer_class = AcademicSummarySerializer
    permission_classes = [IsAuthenticated, AcademicStudentPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id']
    ordering_fields = ['gpa', 'total_credits']

    def get_queryset(self):
        queryset = super().get_queryset()
        request = getattr(self, 'request', None)
        if request is None:
            return queryset
        user = getattr(request, 'user', None)
        if user is not None and user.is_authenticated and user.roles.filter(name=Role.STUDENT).exists():
            try:
                student = user.student_profile
            except Exception:
                return queryset.none()
            queryset = queryset.filter(student=student)
        return queryset
