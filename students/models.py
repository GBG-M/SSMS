from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import date
from decimal import Decimal

User = get_user_model()


class Student(models.Model):
    """Main Student Model"""
    
    # Personal Information
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='student_profile',
        null=True,
        blank=True
    )
    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
    ]) 
    
    # Contact Information
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15)
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=15)
    
    # Academic Information
    enrollment_date = models.DateField(auto_now_add=True)
    current_grade = models.CharField(max_length=10)
    current_class = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)
    
    # Guardian Information
    guardian_name = models.CharField(max_length=100)
    guardian_relationship = models.CharField(max_length=50)
    guardian_phone = models.CharField(max_length=15)
    guardian_email = models.EmailField(blank=True, null=True)
    
    # Status
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('GRADUATED', 'Graduated'),
        ('TRANSFERRED', 'Transferred'),
        ('SUSPENDED', 'Suspended'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Additional Information
    nationality = models.CharField(max_length=50, blank=True, null=True)
    religion = models.CharField(max_length=50, blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    
    # Profile Picture
    profile_picture = models.ImageField(upload_to='student_profiles/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student_id']),
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['current_grade', 'current_class']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def is_active(self):
        return self.status == 'ACTIVE'


class AcademicRecord(models.Model):
    """Student Academic Records"""
    
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        related_name='academic_records'
    )
    term = models.CharField(max_length=50)  # e.g., "Term 1", "Term 2"
    academic_year = models.CharField(max_length=20)
    
    # Subjects and Grades
    subjects = models.JSONField(default=dict)  # {"subject_name": grade}
    
    # Overall Performance
    gpa = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.0')), MaxValueValidator(Decimal('4.0'))],
        null=True, 
        blank=True
    )
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Class Rank
    class_rank = models.IntegerField(null=True, blank=True)
    
    # Remarks
    remarks = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-academic_year', '-term']
        unique_together = [['student', 'term', 'academic_year']]
    
    def __str__(self):
        return f"{self.student.full_name} - {self.term} {self.academic_year}"


class Attendance(models.Model):
    """Student Attendance Records"""
    
    ATTENDANCE_STATUS = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    ]
    
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        related_name='attendances'
    )
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS, default='PRESENT')
    
    # Optional fields
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    class_period = models.CharField(max_length=50, blank=True, null=True)  # e.g., "Morning", "Afternoon"
    
    # Reason for absence (if applicable)
    reason = models.TextField(blank=True, null=True)
    
    # Recorded by
    recorded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='recorded_attendances'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = [['student', 'date']]  # One attendance per student per day
    
    def __str__(self):
        return f"{self.student.full_name} - {self.date} - {self.status}"


class StudentDocument(models.Model):
    """Student Documents (Birth Certificate, Report Cards, etc.)"""
    
    DOCUMENT_TYPES = [
        ('BIRTH_CERT', 'Birth Certificate'),
        ('REPORT_CARD', 'Report Card'),
        ('TRANSFER_CERT', 'Transfer Certificate'),
        ('MEDICAL', 'Medical Record'),
        ('ID_CARD', 'ID Card Photo'),
        ('OTHER', 'Other'),
    ]
    
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='student_documents/')
    description = models.TextField(blank=True, null=True)
    
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.student.full_name} - {self.title}"
