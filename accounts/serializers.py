# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Role, StudentProfile, ParentProfile

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})
        
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for force password reset
    """
    pre_auth_user_id = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })
        
        # Validate password strength
        try:
            validate_password(new_password)
        except ValidationError as e:
            raise serializers.ValidationError({
                "new_password": list(e.messages)
            })
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    full_name = serializers.SerializerMethodField()
    role_names = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name',
            'full_name',
            'role_names',
            'is_active', 
            'is_staff', 
            'is_superuser',
            'date_joined', 
            'last_login',
            'must_reset_password',
            'requires_totp',
            'totp_enabled'
        ]
        read_only_fields = [
            'id', 
            'date_joined', 
            'last_login',
            'is_superuser'
        ]
    
    def get_full_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username
    
    def get_role_names(self, obj):
        if hasattr(obj, 'roles'):
            return [role.name for role in obj.roles.all()]
        return []
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        old_password = attrs.get('old_password')
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if not old_password:
            raise serializers.ValidationError({
                "old_password": "Current password is required."
            })
        
        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "New passwords do not match."
            })
        
        if old_password == new_password:
            raise serializers.ValidationError({
                "new_password": "New password cannot be the same as the old password."
            })
        
        # Validate password strength
        try:
            validate_password(new_password)
        except ValidationError as e:
            raise serializers.ValidationError({
                "new_password": list(e.messages)
            })
        
        return attrs


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for Role model
    """
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Student Profile
    """
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'id', 
            'user',
            'student_id',
            'full_name',
            'department',
            'year',
            'program',
            'campus',
            'enrollment_date',
            'graduation_date',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return ""


class ParentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for Parent Profile
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ParentProfile
        fields = [
            'id',
            'user',
            'phone_number',
            'relationship',
            'is_primary',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProvisionStudentSerializer(serializers.Serializer):
    """
    Serializer for provisioning a student account
    """
    # Student data
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    
    # Student profile data
    student_id = serializers.CharField(required=True)
    department = serializers.CharField(required=True)
    year = serializers.IntegerField(required=True, min_value=1, max_value=6)
    program = serializers.CharField(required=True)
    campus = serializers.CharField(required=False, default='MAIN')
    
    # Parent data
    parent_email = serializers.EmailField(required=True)
    parent_phone = serializers.CharField(required=True)
    parent_first_name = serializers.CharField(required=False)
    parent_last_name = serializers.CharField(required=False)
    relationship = serializers.CharField(required=False, default='Parent')
    
    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                "email": "A user with this email already exists."
            })
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                "username": "A user with this username already exists."
            })
        
        # Check if student_id already exists
        student_id = attrs.get('student_id')
        from students.models import Student
        if Student.objects.filter(student_id=student_id).exists():
            raise serializers.ValidationError({
                "student_id": "A student with this ID already exists."
            })
        
        # Validate password strength
        password = attrs.get('password')
        try:
            validate_password(password)
        except ValidationError as e:
            raise serializers.ValidationError({
                "password": list(e.messages)
            })
        
        return attrs


class ForcePasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for admin to force password reset for a user
    """
    user_id = serializers.UUIDField(required=True)
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this ID does not exist.")
        return value


class UserRoleUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating user roles
    """
    role_names = serializers.ListField(
        child=serializers.CharField(),
        required=True
    )
    
    def validate_role_names(self, value):
        valid_roles = ['admin', 'academic_coordinator', 'teacher', 'student', 'parent']
        for role in value:
            if role.lower() not in valid_roles:
                raise serializers.ValidationError(
                    f"Invalid role: {role}. Must be one of: {', '.join(valid_roles)}"
                )
        return value


class UserBulkCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk user creation
    """
    users = serializers.ListField(
        child=UserSerializer(),
        required=True
    )
    
    def validate_users(self, value):
        if len(value) == 0:
            raise serializers.ValidationError("At least one user must be provided.")
        if len(value) > 100:
            raise serializers.ValidationError("Cannot create more than 100 users at once.")
        return value


class UserExportSerializer(serializers.Serializer):
    """
    Serializer for user export options
    """
    format = serializers.ChoiceField(choices=['csv', 'json', 'excel'], default='csv')
    fields = serializers.ListField(
        child=serializers.ChoiceField(
            choices=['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active']
        ),
        required=False
    )
    role_filter = serializers.CharField(required=False)


class UserSearchSerializer(serializers.Serializer):
    """
    Serializer for user search/filter
    """
    search = serializers.CharField(required=False)
    role = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False)
    department = serializers.CharField(required=False)
    year = serializers.IntegerField(required=False, min_value=1, max_value=6)
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    per_page = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)