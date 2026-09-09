# accounts/serializers.py
import secrets
import string
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Role, StudentProfile, ParentProfile

User = get_user_model()


def generate_secure_temporary_password(length=12):
    """Generate a cryptographically secure temporary password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login supporting email or username
    """
    email = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        email_or_username = attrs.get('email', '').strip()
        password = attrs.get('password', '')
        
        if not email_or_username:
            raise serializers.ValidationError({"email": "Email or username is required."})
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})
        
        attrs['email'] = email_or_username.lower() if '@' in email_or_username else email_or_username
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
    Serializer for User model with full creation and update capabilities
    """
    full_name = serializers.SerializerMethodField()
    role_names = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    student_profile = serializers.SerializerMethodField()
    taught_classes_summary = serializers.SerializerMethodField()
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    roles = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    
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
            'children',
            'student_profile',
            'taught_classes_summary',
            'roles',
            'password',
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

    def get_children(self, obj):
        """Returns linked students if user has a ParentProfile."""
        if hasattr(obj, 'parent_profile'):
            students = obj.parent_profile.students.all()
            return [
                {
                    'id': str(student.id),
                    'student_id': student.student_id,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'full_name': student.full_name,
                    'current_grade': student.current_grade,
                    'current_class': student.current_class,
                    'academic_year': student.academic_year,
                    'status': student.status,
                    'gender': student.gender,
                    'email': student.email,
                    'date_of_birth': str(student.date_of_birth) if student.date_of_birth else None,
                }
                for student in students
            ]
        return []

    def get_student_profile(self, obj):
        """Returns student enrollment and linked guardian records if user is a student."""
        if hasattr(obj, 'student_profile') and obj.student_profile is not None:
            sp = obj.student_profile
            linked_parents = [
                {
                    'id': str(p.id),
                    'user_id': str(p.user.id),
                    'full_name': p.user.full_name,
                    'email': p.user.email,
                    'phone_number': p.phone_number,
                    'relationship': p.relationship,
                    'is_primary': p.is_primary,
                }
                for p in sp.parents.select_related('user').all()
            ] if hasattr(sp, 'parents') else []

            return {
                'id': str(sp.id),
                'student_id': sp.student_id,
                'first_name': sp.first_name,
                'last_name': sp.last_name,
                'full_name': sp.full_name,
                'current_grade': sp.current_grade,
                'current_class': sp.current_class,
                'academic_year': sp.academic_year,
                'status': sp.status,
                'gender': sp.gender,
                'email': sp.email,
                'phone_number': sp.phone_number,
                'address': sp.address,
                'guardian_name': sp.guardian_name,
                'guardian_phone': sp.guardian_phone,
                'guardian_email': sp.guardian_email,
                'guardian_relationship': sp.guardian_relationship,
                'linked_parents': linked_parents,
            }
        return None

    def get_taught_classes_summary(self, obj):
        """Returns assigned class sections if user is a teacher."""
        if hasattr(obj, 'taught_classes'):
            classes = obj.taught_classes.filter(is_active=True).select_related('subject', 'academic_year')
            return [
                {
                    'id': str(cs.id),
                    'section_code': cs.section_code,
                    'name': cs.name,
                    'subject_name': cs.subject.name if cs.subject else '',
                    'subject_code': cs.subject.code if cs.subject else '',
                    'academic_year': cs.academic_year.name if cs.academic_year else '',
                    'room_number': cs.room_number,
                    'capacity': cs.capacity,
                    'enrolled_students_count': cs.enrolled_students_count,
                }
                for cs in classes
            ]
        return []
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        role_names = (
            self.initial_data.get('role_names')
            or validated_data.pop('roles', None)
            or self.initial_data.get('roles', [])
        )

        email = validated_data.get('email')
        if not validated_data.get('username'):
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            validated_data['username'] = username

        # Auto-generate temporary password if omitted or blank
        raw_password = password.strip() if password else generate_secure_temporary_password(12)
        validated_data['must_reset_password'] = validated_data.get('must_reset_password', True)

        user = User.objects.create_user(password=raw_password, **validated_data)

        # Assign specified roles
        if role_names and isinstance(role_names, list):
            for r_name in role_names:
                role_obj, _ = Role.objects.get_or_create(name=str(r_name).lower())
                user.roles.add(role_obj)

        # Automatically mark as staff if administrative or teacher role
        staff_roles = ['admin', 'academic_coordinator', 'teacher']
        if any(str(r).lower() in staff_roles for r in (role_names or [])):
            user.is_staff = True
            user.save(update_fields=['is_staff'])

        # Store raw password temporarily on instance so view can return it
        user._raw_password = raw_password
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        request = self.context.get('request')
        is_admin_or_staff = (
            request and (request.user.is_staff or request.user.is_superuser)
        ) if request else True

        # If user is not staff, disallow altering privileged fields
        if not is_admin_or_staff:
            validated_data.pop('is_staff', None)
            validated_data.pop('is_superuser', None)
            validated_data.pop('is_active', None)
            validated_data.pop('must_reset_password', None)
            validated_data.pop('requires_totp', None)
            validated_data.pop('totp_enabled', None)
        else:
            role_names = self.initial_data.get('role_names') or self.initial_data.get('roles')
            if role_names is not None and isinstance(role_names, list):
                instance.roles.clear()
                cleaned_roles = []
                for r_name in role_names:
                    role_obj, _ = Role.objects.get_or_create(name=str(r_name).lower())
                    instance.roles.add(role_obj)
                    cleaned_roles.append(role_obj.name)

                # Sync is_staff flag if administrative or faculty role
                staff_roles = ['admin', 'academic_coordinator', 'teacher']
                if not instance.is_superuser:
                    instance.is_staff = any(r in staff_roles for r in cleaned_roles)

                if 'parent' in cleaned_roles:
                    ParentProfile.objects.get_or_create(user=instance)

        if password and is_admin_or_staff:
            instance.set_password(password)

        # Support updating linked students for parents (Admin only)
        if is_admin_or_staff:
            student_ids = self.initial_data.get('student_ids') or self.initial_data.get('children_ids')
            if student_ids is not None and isinstance(student_ids, list):
                parent_profile, _ = ParentProfile.objects.get_or_create(user=instance)
                from students.models import Student
                from django.db.models import Q
                import uuid
                
                pks = []
                codes = []
                for s in student_ids:
                    s_str = str(s).strip()
                    if s_str.isdigit():
                        pks.append(int(s_str))
                    else:
                        codes.append(s_str)
                        try:
                            pks.append(uuid.UUID(s_str))
                        except (ValueError, AttributeError):
                            pass

                matched_students = Student.objects.filter(
                    Q(id__in=pks) | Q(student_id__in=codes)
                )
                parent_profile.students.set(matched_students)

        return super().update(instance, validated_data)


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
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = ParentProfile
        fields = [
            'id',
            'user',
            'phone_number',
            'relationship',
            'is_primary',
            'children',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_children(self, obj):
        return [
            {
                'id': str(s.id),
                'student_id': s.student_id,
                'first_name': s.first_name,
                'last_name': s.last_name,
                'full_name': s.full_name,
                'current_grade': s.current_grade,
                'current_class': s.current_class,
                'academic_year': s.academic_year,
                'status': s.status,
                'email': s.email,
            }
            for s in obj.students.all()
        ]


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


class RegisterSerializer(serializers.Serializer):
    """
    Serializer for secure public and applicant registration.
    Enforces strong password validation, unique email, and RBAC protection.
    """
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(required=False, default='student')
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized

    def validate_role(self, value):
        role_cleaned = str(value).strip().lower()
        allowed_self_roles = ['student', 'parent', 'teacher']
        if role_cleaned in ['admin', 'academic_coordinator']:
            raise serializers.ValidationError(
                "Administrative and coordinator roles cannot be self-registered. Please contact IT administration."
            )
        if role_cleaned not in allowed_self_roles:
            raise serializers.ValidationError(
                f"Invalid account type. Allowed types: {', '.join(allowed_self_roles)}"
            )
        return role_cleaned

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        # Validate password strength using Django's password validators
        try:
            validate_password(password)
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        role_name = validated_data.pop('role', 'student').lower()
        phone_number = validated_data.pop('phone_number', '')

        email = validated_data['email']
        username = validated_data.get('username')
        if not username:
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            validated_data['username'] = username

        # Create user
        user = User.objects.create_user(
            password=password,
            must_reset_password=False,
            **validated_data
        )

        # Assign role
        role_obj, _ = Role.objects.get_or_create(name=role_name)
        user.roles.add(role_obj)

        # Create profile if parent
        if role_name == 'parent':
            ParentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone_number': phone_number,
                    'is_primary': True,
                    'relationship': 'Parent'
                }
            )

        return user