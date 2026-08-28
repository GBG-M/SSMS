# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a user with the given email and password.
        """
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        
        # Get username from extra_fields or create from email
        username = extra_fields.pop('username', email.split('@')[0])
        
        # Create the user object
        user = self.model(
            email=email,
            username=username,
            **extra_fields
        )
        
        # Set password and save
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        # If username is not provided, create from email
        if 'username' not in extra_fields:
            extra_fields['username'] = email.split('@')[0]
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # Basic fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    # Status fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Security fields
    must_reset_password = models.BooleanField(default=False)
    requires_totp = models.BooleanField(default=False)
    totp_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Relationships
    roles = models.ManyToManyField('Role', related_name='users', blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.username
    
    @property
    def role_names(self):
        return [role.name for role in self.roles.all()]


class Role(models.Model):
    # Predefined roles
    ADMIN = 'admin'
    ACADEMIC_COORDINATOR = 'academic_coordinator'
    TEACHER = 'teacher'
    STUDENT = 'student'
    PARENT = 'parent'
    
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (ACADEMIC_COORDINATOR, 'Academic Coordinator'),
        (TEACHER, 'Teacher'),
        (STUDENT, 'Student'),
        (PARENT, 'Parent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'roles'
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


class StudentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE,  related_name='account_student_profile')
    
    # Student specific fields
    student_id = models.CharField(max_length=50, unique=True, db_index=True)
    department = models.CharField(max_length=100)
    year = models.IntegerField(choices=[(1, 'Year 1'), (2, 'Year 2'), (3, 'Year 3'), (4, 'Year 4')])
    program = models.CharField(max_length=100)
    campus = models.CharField(max_length=50, default='MAIN')
    
    # Additional info
    enrollment_date = models.DateField(default=timezone.now)
    graduation_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_profiles'
        ordering = ['student_id']
    
    def __str__(self):
        return f"{self.user.full_name} ({self.student_id})"
    
    @property
    def full_name(self):
        return self.user.full_name if self.user else ""


class ParentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    
    # Parent specific fields
    phone_number = models.CharField(max_length=20, default='')  # Added default
    relationship = models.CharField(max_length=50, default='Parent')
    is_primary = models.BooleanField(default=True)
    
    # Children (students) linked to this parent
    students = models.ManyToManyField(StudentProfile, related_name='parents', blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'parent_profiles'
        ordering = ['user__first_name']
    
    def __str__(self):
        return f"{self.user.full_name} - {self.relationship}"


class PasswordResetRequest(models.Model):
    """Model to track password reset requests"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_resets')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'password_reset_requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.status}"
    
    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class LoginHistory(models.Model):
    """Track user login history"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_successful = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'login_history'
        ordering = ['-login_time']
    
    def __str__(self):
        return f"{self.user.email} - {self.login_time}"
