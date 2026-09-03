from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime, timedelta
from accounts.models import Role
from .permissions import StudentAccessPermission
from .models import Student, AcademicRecord, Attendance, StudentDocument
from .serializers import (
    StudentSerializer, StudentListSerializer, 
    AcademicRecordSerializer, AttendanceSerializer,
    StudentDocumentSerializer
)


class StudentViewSet(viewsets.ModelViewSet):
    """Student ViewSet with CRUD operations and custom actions"""
    
    queryset = Student.objects.all()
    permission_classes = [IsAuthenticated, StudentAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'gender', 'current_grade', 'current_class']
    search_fields = ['first_name', 'last_name', 'student_id', 'email', 'phone_number']
    ordering_fields = ['created_at', 'first_name', 'last_name', 'student_id']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {r.name for r in user.roles.all()}

        # Role-based scoping
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            pass
        elif Role.TEACHER in role_names:
            pass
        elif Role.STUDENT in role_names:
            if hasattr(user, 'student_profile'):
                queryset = queryset.filter(id=user.student_profile.id)
            else:
                return queryset.none()
        elif Role.PARENT in role_names:
            if hasattr(user, 'parent_profile'):
                queryset = queryset.filter(id__in=user.parent_profile.students.values_list('id', flat=True))
            else:
                return queryset.none()
        else:
            return queryset.none()
        
        # Filter by search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(student_id__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        
        # Filter by grade
        grade = self.request.query_params.get('grade', None)
        if grade:
            queryset = queryset.filter(current_grade=grade)
        
        # Filter by class
        class_name = self.request.query_params.get('class', None)
        if class_name:
            queryset = queryset.filter(current_class=class_name)
        
        # Filter active students only
        active_only = self.request.query_params.get('active_only', 'false').lower() == 'true'
        if active_only:
            queryset = queryset.filter(status='ACTIVE')
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def academic_records(self, request, pk=None):
        """Get all academic records for a student"""
        student = self.get_object()
        records = student.academic_records.all()
        serializer = AcademicRecordSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_academic_record(self, request, pk=None):
        """Add academic record for a student"""
        student = self.get_object()
        serializer = AcademicRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=student)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """Get attendance records for a student"""
        student = self.get_object()
        
        # Filter by date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        records = student.attendances.all()
        
        if start_date:
            records = records.filter(date__gte=start_date)
        if end_date:
            records = records.filter(date__lte=end_date)
        
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_attendance(self, request, pk=None):
        """Mark attendance for a student"""
        student = self.get_object()
        
        # Check if attendance already exists for today
        today = datetime.now().date()
        existing = Attendance.objects.filter(student=student, date=today).first()
        
        if existing:
            return Response(
                {"error": "Attendance already marked for today"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AttendanceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                student=student,
                recorded_by=request.user,
                date=today
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get all documents for a student"""
        student = self.get_object()
        documents = student.documents.all()
        serializer = StudentDocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        """Upload a document for a student"""
        student = self.get_object()
        serializer = StudentDocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                student=student,
                uploaded_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change student status"""
        student = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {"error": "Status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = [choice[0] for choice in Student.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Must be one of: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        student.status = new_status
        student.save()
        
        return Response({
            "message": f"Student status updated to {new_status}",
            "student": StudentSerializer(student).data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get student statistics"""
        total_students = Student.objects.count()
        active_students = Student.objects.filter(status='ACTIVE').count()
        
        # Gender distribution
        male_count = Student.objects.filter(gender='MALE').count()
        female_count = Student.objects.filter(gender='FEMALE').count()
        
        # Grade distribution
        grade_distribution = {}
        for grade in Student.objects.values_list('current_grade', flat=True).distinct():
            count = Student.objects.filter(current_grade=grade).count()
            grade_distribution[grade] = count
        
        # Recent enrollments (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_enrollments = Student.objects.filter(
            enrollment_date__gte=thirty_days_ago
        ).count()
        
        return Response({
            "total_students": total_students,
            "active_students": active_students,
            "inactive_students": total_students - active_students,
            "gender_distribution": {
                "male": male_count,
                "female": female_count,
                "other": total_students - male_count - female_count
            },
            "grade_distribution": grade_distribution,
            "recent_enrollments_30_days": recent_enrollments,
        })


class AcademicRecordViewSet(viewsets.ModelViewSet):
    """Academic Record ViewSet"""
    
    queryset = AcademicRecord.objects.all()
    serializer_class = AcademicRecordSerializer
    permission_classes = [IsAuthenticated, StudentAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'term', 'academic_year']
    ordering_fields = ['academic_year', 'gpa', 'percentage']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {r.name for r in user.roles.all()}
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names or Role.TEACHER in role_names:
            pass
        elif Role.STUDENT in role_names:
            if hasattr(user, 'student_profile'):
                queryset = queryset.filter(student=user.student_profile)
            else:
                return queryset.none()
        elif Role.PARENT in role_names:
            if hasattr(user, 'parent_profile'):
                queryset = queryset.filter(student__in=user.parent_profile.students.all())
            else:
                return queryset.none()
        else:
            return queryset.none()
        
        # Filter by student
        student_id = self.request.query_params.get('student_id', None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset


class AttendanceViewSet(viewsets.ModelViewSet):
    """Attendance ViewSet"""
    
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, StudentAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'status', 'date']
    ordering_fields = ['date']
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {r.name for r in user.roles.all()}
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names or Role.TEACHER in role_names:
            pass
        elif Role.STUDENT in role_names:
            if hasattr(user, 'student_profile'):
                queryset = queryset.filter(student=user.student_profile)
            else:
                return queryset.none()
        elif Role.PARENT in role_names:
            if hasattr(user, 'parent_profile'):
                queryset = queryset.filter(student__in=user.parent_profile.students.all())
            else:
                return queryset.none()
        else:
            return queryset.none()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's attendance"""
        today = datetime.now().date()
        attendance = self.get_queryset().filter(date=today)
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)


class StudentDocumentViewSet(viewsets.ModelViewSet):
    """Student Document ViewSet"""
    
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [IsAuthenticated, StudentAccessPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'document_type']
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {r.name for r in user.roles.all()}
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names or Role.TEACHER in role_names:
            pass
        elif Role.STUDENT in role_names:
            if hasattr(user, 'student_profile'):
                queryset = queryset.filter(student=user.student_profile)
            else:
                return queryset.none()
        elif Role.PARENT in role_names:
            if hasattr(user, 'parent_profile'):
                queryset = queryset.filter(student__in=user.parent_profile.students.all())
            else:
                return queryset.none()
        else:
            return queryset.none()

        return queryset
