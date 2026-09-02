from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()


class AcademicYear(models.Model):
    """Academic calendar year."""

    name = models.CharField(max_length=20, unique=True, help_text="Example: 2025/2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'

    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError('Start date cannot be after end date.')
        if self.is_active:
            AcademicYear.objects.exclude(pk=self.pk).filter(is_active=True).update(is_active=False)

    def __str__(self):
        return self.name


class Subject(models.Model):
    """Academic subject or course discipline."""

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    credit_hours = models.PositiveSmallIntegerField(default=1)
    department = models.CharField(max_length=80, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Course(models.Model):
    """Course definition that belongs to a subject and academic year."""

    LEVEL_CHOICES = [
        ('PRIMARY', 'Primary'),
        ('SECONDARY', 'Secondary'),
        ('COLLEGE', 'College'),
        ('UNIVERSITY', 'University'),
    ]

    course_code = models.CharField(max_length=30, unique=True)
    title = models.CharField(max_length=200)
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name='courses')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name='courses')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='SECONDARY')
    credit_hours = models.PositiveSmallIntegerField(default=1)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course_code']
        verbose_name_plural = 'Courses'

    def __str__(self):
        return f"{self.course_code} - {self.title}"


class ClassSection(models.Model):
    """A section or class group for a subject taught by a teacher."""

    section_code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=120)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name='class_sections')
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name='class_sections')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_classes')
    room_number = models.CharField(max_length=50, blank=True)
    capacity = models.PositiveIntegerField(default=30)
    schedule = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        teacher_name = self.teacher.full_name if self.teacher else 'Unassigned'
        return f"{self.name} ({self.section_code}) - {teacher_name}"

    @property
    def enrolled_students_count(self):
        return self.enrollments.filter(status='ACTIVE').count()


class Enrollment(models.Model):
    """Student enrollment in a class section."""

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('PENDING', 'Pending'),
        ('DROPPED', 'Dropped'),
        ('COMPLETED', 'Completed'),
    ]

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='class_enrollments')
    class_section = models.ForeignKey(ClassSection, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    enrolled_on = models.DateField(default=timezone.now)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-enrolled_on']
        unique_together = [('student', 'class_section')]

    def __str__(self):
        return f"{self.student.full_name} -> {self.class_section.name}"


class Assessment(models.Model):
    """Assessment or exam for a class section."""

    TYPE_CHOICES = [
        ('QUIZ', 'Quiz'),
        ('ASSIGNMENT', 'Assignment'),
        ('MIDTERM', 'Midterm'),
        ('FINAL', 'Final Exam'),
        ('PRACTICAL', 'Practical'),
    ]

    class_section = models.ForeignKey(ClassSection, on_delete=models.CASCADE, related_name='assessments')
    name = models.CharField(max_length=120)
    assessment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='QUIZ')
    due_date = models.DateField(null=True, blank=True)
    max_marks = models.PositiveIntegerField(default=100)
    weight = models.PositiveSmallIntegerField(default=10, help_text='Weighted percentage of total course grade')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', 'name']

    def __str__(self):
        return f"{self.class_section.name} - {self.name}"


class GradeRecord(models.Model):
    """Student score for an assessment."""

    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='grade_records')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='grade_records')
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grade = models.CharField(max_length=5, blank=True)
    feedback = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-recorded_at']
        unique_together = [('enrollment', 'assessment')]

    def __str__(self):
        return f"{self.enrollment.student.full_name} - {self.assessment.name}: {self.score:.2f}"

    def clean(self):
        if self.assessment and self.score is not None:
            if self.score < 0 or self.score > self.assessment.max_marks:
                raise ValidationError(
                    {'score': f'Score must be between 0 and {self.assessment.max_marks}.'}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.grade:
            self.grade = self._calculate_grade()
        super().save(*args, **kwargs)

    def _calculate_grade(self):
        if self.score is None:
            return ''
        if self.score >= 90:
            return 'A'
        if self.score >= 80:
            return 'B'
        if self.score >= 70:
            return 'C'
        if self.score >= 60:
            return 'D'
        return 'F'


class AcademicSummary(models.Model):
    """Optional summary per student per academic year for dashboards and reporting."""

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='academic_summaries')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='student_summaries')
    gpa = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    total_credits = models.PositiveIntegerField(default=0)
    credits_earned = models.PositiveIntegerField(default=0)
    remarks = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-academic_year__start_date']
        unique_together = [('student', 'academic_year')]

    def __str__(self):
        return f"{self.student.full_name} - {self.academic_year.name}"
