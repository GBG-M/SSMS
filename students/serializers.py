from rest_framework import serializers
from django.contrib.auth import get_user_model
from datetime import date
from .models import Student, AcademicRecord, Attendance, StudentDocument
from accounts.serializers import UserSerializer, generate_secure_temporary_password
from accounts.models import Role, ParentProfile

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    """Main Student Serializer with automatic User and Parent synchronization"""
    
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    user_details = UserSerializer(source='user', read_only=True)
    temporary_password = serializers.SerializerMethodField()
    parent_temporary_password = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'user', 'user_details',
            'temporary_password', 'parent_temporary_password',
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
        read_only_fields = ['created_at', 'updated_at', 'enrollment_date', 'temporary_password', 'parent_temporary_password']
    
    def get_temporary_password(self, obj):
        return getattr(obj, '_temporary_password', None)

    def get_parent_temporary_password(self, obj):
        return getattr(obj, '_parent_temporary_password', None)

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

        student_id = validated_data['student_id']
        email = validated_data.get('email')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        guardian_email = validated_data.get('guardian_email')
        guardian_phone = validated_data.get('guardian_phone', '')
        guardian_name = validated_data.get('guardian_name', '')
        guardian_relationship = validated_data.get('guardian_relationship', 'Parent')

        # Auto-provision portal User account for the student if user is not passed
        user = validated_data.get('user')
        temp_student_password = None
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                base_username = f"student_{student_id.lower()}"
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                temp_student_password = generate_secure_temporary_password(12)
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=temp_student_password,
                    first_name=first_name,
                    last_name=last_name,
                    must_reset_password=True,
                )
            student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
            user.roles.add(student_role)
            validated_data['user'] = user

        student = super().create(validated_data)
        if temp_student_password:
            student._temporary_password = temp_student_password

        # Auto-provision or link Guardian/Parent account & profile if guardian_email is supplied
        if guardian_email:
            temp_parent_password = None
            parent_user = User.objects.filter(email__iexact=guardian_email).first()
            if not parent_user:
                base_p_username = f"parent_{student_id.lower()}"
                p_username = base_p_username
                p_counter = 1
                while User.objects.filter(username=p_username).exists():
                    p_username = f"{base_p_username}_{p_counter}"
                    p_counter += 1

                p_parts = guardian_name.split(' ', 1) if guardian_name else ['Parent', '']
                p_first = p_parts[0] if p_parts else 'Parent'
                p_last = p_parts[1] if len(p_parts) > 1 else ''
                temp_parent_password = generate_secure_temporary_password(12)
                parent_user = User.objects.create_user(
                    username=p_username,
                    email=guardian_email,
                    password=temp_parent_password,
                    first_name=p_first,
                    last_name=p_last,
                    must_reset_password=True,
                )
            parent_role, _ = Role.objects.get_or_create(name=Role.PARENT)
            parent_user.roles.add(parent_role)

            parent_profile, _ = ParentProfile.objects.get_or_create(
                user=parent_user,
                defaults={
                    'phone_number': guardian_phone,
                    'relationship': guardian_relationship,
                    'is_primary': True,
                }
            )
            parent_profile.students.add(student)
            if temp_parent_password:
                student._parent_temporary_password = temp_parent_password

        return student


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
    date = serializers.DateField(required=False, default=date.today)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'date', 'status', 'check_in_time', 'check_out_time',
            'class_period', 'reason', 'recorded_by', 'recorded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


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