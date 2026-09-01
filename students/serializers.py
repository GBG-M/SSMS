from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Student, AcademicRecord, Attendance, StudentDocument
from accounts.serializers import UserSerializer

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    """Main Student Serializer"""
    
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'user', 'user_details',
            'first_name', 'last_name', 'middle_name', 'full_name',
            'date_of_birth', 'age', 'gender',
            'email', 'phone_number', 'address',
            'emergency_contact_name', 'emergency_contact_phone',
            'enrollment_date', 'current_grade', 'current_class',
            'academic_year',
            'guardian_name', 'guardian_relationship', 
            'guardian_phone', 'guardian_email',
            'status', 'is_active',
            'nationality', 'religion', 'medical_conditions', 'allergies',
            'profile_picture',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'enrollment_date']
    
    def create(self, validated_data):
        # Auto-generate student_id if not provided
        if not validated_data.get('student_id'):
            last_student = Student.objects.order_by('-id').first()
            last_id = 0
            if last_student and last_student.student_id:
                digits = ''.join(filter(str.isdigit, last_student.student_id))
                if digits:
                    try:
                        last_id = int(digits)
                    except ValueError:
                        last_id = 0
            validated_data['student_id'] = f"STU{last_id + 1:06d}"
        return super().create(validated_data)


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight Student Serializer for List Views"""
    
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'first_name', 'last_name', 'full_name',
            'gender', 'age', 'email', 'phone_number',
            'current_grade', 'current_class', 'status', 'profile_picture'
        ]


class AcademicRecordSerializer(serializers.ModelSerializer):
    """Academic Records Serializer"""
    
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    
    class Meta:
        model = AcademicRecord
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'term', 'academic_year', 'subjects',
            'gpa', 'total_marks', 'percentage',
            'class_rank', 'remarks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AttendanceSerializer(serializers.ModelSerializer):
    """Attendance Serializer"""
    
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'date', 'status', 'check_in_time', 'check_out_time',
            'class_period', 'reason', 'recorded_by', 'recorded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'date']


class StudentDocumentSerializer(serializers.ModelSerializer):
    """Student Documents Serializer"""
    
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = StudentDocument
        fields = [
            'id', 'student', 'student_name',
            'document_type', 'title', 'file', 'description',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['uploaded_at']