import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
    Group
)
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    """Manager for custom user model where email is the unique identifier."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    """Lightweight Role model for UI display and permission mapping."""
    ADMIN = 'ADMIN'
    TEACHER = 'TEACHER'
    PARENT = 'PARENT'
    STUDENT = 'STUDENT'
    FINANCE = 'FINANCE'
    ACADEMIC_COORDINATOR = 'ACADEMIC_COORDINATOR'

    ROLE_CHOICES = [
        (ADMIN, 'Administrator'),
        (TEACHER, 'Teacher'),
        (PARENT, 'Parent'),
        (STUDENT, 'Student'),
        (FINANCE, 'Finance Officer'),
        (ACADEMIC_COORDINATOR, 'Academic Coordinator'),
    ]

    name = models.CharField(max_length=30, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    group = models.OneToOneField(
        Group, 
        on_delete=models.CASCADE, 
        related_name='role', 
        null=True, 
        blank=True
    )

    def __str__(self):
        return self.get_name_display()


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model extending AbstractBaseUser with email login."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, blank=True)
    
    roles = models.ManyToManyField(Role, related_name='users', blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    must_reset_password = models.BooleanField(
        default=True, 
        help_text="Forces password reset on first login for staff-created accounts."
    )
    
    # TOTP settings
    totp_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=32, blank=True, null=True)

    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def requires_totp(self):
        """Enforce TOTP for sensitive roles."""
        sensitive_roles = [Role.ADMIN, Role.FINANCE]
        return self.roles.filter(name__in=sensitive_roles).exists()


class StudentProfile(models.Model):
    """Profile metadata specific to Students."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(
        max_length=30, 
        unique=True, 
        help_text="Format: YEAR-CAMPUS-SEQ (e.g., 2026-MAIN-00231)"
    )
    date_of_birth = models.DateField(null=True, blank=True)
    grade_level = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"


class ParentProfile(models.Model):
    """Profile metadata specific to Parents/Guardians."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    emergency_contact = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"Parent: {self.user.get_full_name()}"


class ParentGuardianLink(models.Model):
    """Junction table supporting blended families & multiple guardians per student."""
    RELATION_CHOICES = [
        ('MOTHER', 'Mother'),
        ('FATHER', 'Father'),
        ('GUARDIAN', 'Legal Guardian'),
        ('OTHER', 'Other'),
    ]

    parent = models.ForeignKey(ParentProfile, on_delete=models.CASCADE, related_name='guardian_links')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='guardian_links')
    relationship_type = models.CharField(max_length=20, choices=RELATION_CHOICES, default='GUARDIAN')
    is_primary = models.BooleanField(default=False)

    class Meta:
        unique_together = ('parent', 'student')

    def __str__(self):
        return f"{self.parent.user.get_full_name()} -> {self.student.student_id} ({self.relationship_type})"


class StaffProfile(models.Model):
    """Employment metadata used across academics and scheduling."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    department = models.CharField(max_length=100)
    subjects_taught = models.JSONField(default=list, blank=True)
    employment_date = models.DateField()

    def __str__(self):
        return f"Staff: {self.user.get_full_name()} ({self.department})"
