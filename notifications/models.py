import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from students.models import Student

User = get_user_model()


class Notification(models.Model):
    """Notification model for system alerts and teacher/parent communication."""

    NOTIFICATION_TYPE_CHOICES = [
        ('FEE_DUE', 'Fee Due Notice'),
        ('FEE_PAID', 'Fee Paid Confirmation'),
        ('CLASS_SCHEDULE_CHANGED', 'Class Schedule Changed'),
        ('EXAM_ANNOUNCED', 'Exam Announced'),
        ('GRADE_POSTED', 'Grade Posted'),
        ('ATTENDANCE_ALERT', 'Attendance Alert'),
        ('TEACHER_MESSAGE', 'Teacher Message'),
        ('SCHOOL_ANNOUNCEMENT', 'School Announcement'),
        ('SYSTEM_ALERT', 'System Alert'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='The user receiving this notification'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications',
        help_text='The staff/teacher author of this notification (null for automated system notices)'
    )
    notification_type = models.CharField(
        max_length=40,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='SYSTEM_ALERT'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='NORMAL'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    recipient_role = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Cached role for fast role-based query filtering'
    )
    related_student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text='Student associated with this alert (crucial for parent view filtering)'
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['recipient_role', '-created_at']),
            models.Index(fields=['related_student']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.title} -> {self.recipient.email}"

    def mark_as_read(self):
        """Mark this notification as read with a timestamp."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at', 'updated_at'])

    def mark_as_unread(self):
        """Mark this notification as unread."""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at', 'updated_at'])

    def save(self, *args, **kwargs):
        # Auto-populate recipient_role if not provided
        if not self.recipient_role and self.recipient_id:
            roles = [r.name for r in self.recipient.roles.all()]
            self.recipient_role = roles[0] if roles else ''
        if self.is_read and not self.read_at:
            self.read_at = timezone.now()
        elif not self.is_read:
            self.read_at = None
        super().save(*args, **kwargs)
