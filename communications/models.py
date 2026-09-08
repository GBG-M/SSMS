import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from students.models import Student

User = get_user_model()


class ConversationThread(models.Model):
    """
    Represents an institutional conversation or inquiry thread between
    a student's parent/guardian and teacher(s) or school administrators.
    """
    CATEGORY_CHOICES = [
        ('ACADEMIC', 'Academic Performance / Grades'),
        ('ATTENDANCE', 'Attendance / Leave Notice'),
        ('BEHAVIOR', 'Conduct & Well-being'),
        ('FINANCE', 'Fees & Tuition Inquiry'),
        ('GENERAL', 'General Inquiry'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='GENERAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='conversation_threads',
        help_text='Student associated with this inquiry'
    )
    participants = models.ManyToManyField(
        User,
        related_name='conversation_threads',
        help_text='Users participating in this conversation'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='started_threads'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status', '-updated_at']),
            models.Index(fields=['student']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"[{self.get_category_display()}] {self.subject} ({self.student.full_name})"

    def mark_resolved(self):
        self.status = 'RESOLVED'
        self.save(update_fields=['status', 'updated_at'])

    def reopen(self):
        self.status = 'OPEN'
        self.save(update_fields=['status', 'updated_at'])


class ThreadMessage(models.Model):
    """
    Individual message in a conversation thread.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(
        ConversationThread,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_thread_messages'
    )
    content = models.TextField()
    read_by = models.ManyToManyField(
        User,
        related_name='read_thread_messages',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['thread', 'created_at']),
        ]

    def __str__(self):
        return f"Message by {self.sender.email} on {self.created_at:%Y-%m-%d %H:%M}"


class SchoolAnnouncement(models.Model):
    """
    Official institutional notices, circulars, and bulletins.
    """
    AUDIENCE_CHOICES = [
        ('ALL', 'Everyone (All Roles)'),
        ('PARENTS', 'Parents & Guardians Only'),
        ('TEACHERS', 'Faculty & Teachers Only'),
        ('STUDENTS', 'Students Only'),
    ]

    PRIORITY_CHOICES = [
        ('NORMAL', 'Normal'),
        ('IMPORTANT', 'Important'),
        ('URGENT', 'Urgent Notice'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    target_audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='ALL')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMAL')
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='authored_announcements'
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_audience', 'is_published', '-created_at']),
            models.Index(fields=['priority']),
        ]

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title}"
