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

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        """Set this academic year as active and deactivate all others."""
        year = self.get_object()
        AcademicYear.objects.exclude(pk=year.pk).filter(is_active=True).update(is_active=False)
        year.is_active = True
        year.save()
        serializer = self.get_serializer(year)
        return Response({
            'message': f"Academic year '{year.name}' is now active.",
            'academic_year': serializer.data
        }, status=status.HTTP_200_OK)


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

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            roles = {r.name for r in user.roles.all()}
            if Role.STUDENT in roles:
                try:
                    enrolled_section_ids = user.student_profile.class_enrollments.filter(status='ACTIVE').values_list('class_section_id', flat=True)
                    return queryset.filter(id__in=enrolled_section_ids)
                except Exception:
                    return queryset.none()
            if Role.PARENT in roles:
                try:
                    child_ids = user.parent_profile.students.values_list('id', flat=True)
                    enrolled_section_ids = Enrollment.objects.filter(student_id__in=child_ids, status='ACTIVE').values_list('class_section_id', flat=True)
                    return queryset.filter(id__in=enrolled_section_ids)
                except Exception:
                    return queryset.none()
        return queryset


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

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            roles = {r.name for r in user.roles.all()}
            if Role.STUDENT in roles:
                try:
                    enrolled_section_ids = user.student_profile.class_enrollments.filter(status='ACTIVE').values_list('class_section_id', flat=True)
                    return queryset.filter(class_section_id__in=enrolled_section_ids)
                except Exception:
                    return queryset.none()
            if Role.PARENT in roles:
                try:
                    child_ids = user.parent_profile.students.values_list('id', flat=True)
                    enrolled_section_ids = Enrollment.objects.filter(student_id__in=child_ids, status='ACTIVE').values_list('class_section_id', flat=True)
                    return queryset.filter(class_section_id__in=enrolled_section_ids)
                except Exception:
                    return queryset.none()
        return queryset


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

    @action(detail=False, methods=['post'], url_path='recalculate')
    def recalculate(self, request):
        """Calculate and update AcademicSummary for a student and academic year based on grade records."""
        student_id = request.data.get('student')
        academic_year_id = request.data.get('academic_year')
        if not student_id or not academic_year_id:
            return Response(
                {'error': 'Both student and academic_year IDs are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from students.models import Student as StudentModel
        student = StudentModel.objects.filter(id=student_id).first()
        academic_year = AcademicYear.objects.filter(id=academic_year_id).first()
        if not student or not academic_year:
            return Response({'error': 'Student or Academic Year not found.'}, status=status.HTTP_404_NOT_FOUND)

        enrollments = Enrollment.objects.filter(student=student, class_section__academic_year=academic_year)
        grade_records = GradeRecord.objects.filter(enrollment__in=enrollments).select_related(
            'assessment', 'enrollment__class_section__subject'
        )

        total_credits = 0
        credits_earned = 0
        course_percentages = []

        section_grades = {}
        for gr in grade_records:
            sec_id = gr.enrollment.class_section_id
            if sec_id not in section_grades:
                section_grades[sec_id] = {'weights': 0, 'weighted_scores': 0, 'subject': gr.enrollment.class_section.subject}
            max_m = float(gr.assessment.max_marks) if gr.assessment.max_marks > 0 else 100.0
            pct = (float(gr.score) / max_m) * 100.0
            wt = float(gr.assessment.weight) if gr.assessment.weight > 0 else 1.0
            section_grades[sec_id]['weights'] += wt
            section_grades[sec_id]['weighted_scores'] += pct * wt

        for sec_id, data in section_grades.items():
            credit = data['subject'].credit_hours if data['subject'] else 1
            total_credits += credit
            if data['weights'] > 0:
                final_pct = data['weighted_scores'] / data['weights']
                course_percentages.append((final_pct, credit))
                if final_pct >= 60.0:
                    credits_earned += credit

        total_pts = 0.0
        for pct, credit in course_percentages:
            if pct >= 90.0:
                pts = 4.0
            elif pct >= 80.0:
                pts = 3.0
            elif pct >= 70.0:
                pts = 2.0
            elif pct >= 60.0:
                pts = 1.0
            else:
                pts = 0.0
            total_pts += pts * credit

        calculated_gpa = round(total_pts / max(total_credits, 1), 2) if course_percentages else 0.00

        summary, _ = AcademicSummary.objects.update_or_create(
            student=student,
            academic_year=academic_year,
            defaults={
                'gpa': calculated_gpa,
                'total_credits': total_credits,
                'credits_earned': credits_earned,
                'remarks': f"Calculated from {len(grade_records)} grade records across {len(section_grades)} courses."
            }
        )
        serializer = self.get_serializer(summary)
        return Response(serializer.data, status=status.HTTP_200_OK)
