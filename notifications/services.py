import logging
from typing import List, Optional
from django.contrib.auth import get_user_model
from django.db import transaction
from students.models import Student
from accounts.models import ParentProfile
from .models import Notification

User = get_user_model()
logger = logging.getLogger(__name__)


def create_notification(
    recipient: User,
    title: str,
    message: str,
    notification_type: str = 'SYSTEM_ALERT',
    sender: Optional[User] = None,
    related_student: Optional[Student] = None,
    priority: str = 'NORMAL',
) -> Notification:
    """
    Create a single notification record for a specific user recipient.
    """
    roles = [r.name for r in recipient.roles.all()] if recipient else []
    recipient_role = roles[0] if roles else ''

    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        priority=priority,
        title=title,
        message=message,
        recipient_role=recipient_role,
        related_student=related_student,
    )
    return notification


def notify_student_and_parents(
    student: Student,
    title: str,
    message: str,
    notification_type: str = 'SYSTEM_ALERT',
    sender: Optional[User] = None,
    priority: str = 'NORMAL',
    include_student: bool = True,
    include_parents: bool = True,
) -> List[Notification]:
    """
    Send notifications to a student user and all linked parent users.
    """
    created_notifications = []

    with transaction.atomic():
        # 1. Notify Student user (if linked)
        if include_student and student.user:
            notif = create_notification(
                recipient=student.user,
                title=title,
                message=message,
                notification_type=notification_type,
                sender=sender,
                related_student=student,
                priority=priority,
            )
            created_notifications.append(notif)

        # 2. Notify linked Parent users
        if include_parents:
            # Look up parent profiles linked to this student
            parent_profiles = ParentProfile.objects.filter(students=student).select_related('user')
            for parent_prof in parent_profiles:
                if parent_prof.user:
                    notif = create_notification(
                        recipient=parent_prof.user,
                        title=f"[{student.full_name}] {title}",
                        message=message,
                        notification_type=notification_type,
                        sender=sender,
                        related_student=student,
                        priority=priority,
                    )
                    created_notifications.append(notif)

    return created_notifications


def notify_class_section(
    class_section,
    title: str,
    message: str,
    notification_type: str = 'TEACHER_MESSAGE',
    sender: Optional[User] = None,
    priority: str = 'NORMAL',
    include_parents: bool = True,
) -> List[Notification]:
    """
    Broadcast notification to all active enrolled students (and parents) in a class section.
    """
    created_notifications = []
    enrollments = class_section.enrollments.filter(status='ACTIVE').select_related('student', 'student__user')

    with transaction.atomic():
        for enrollment in enrollments:
            student = enrollment.student
            notifs = notify_student_and_parents(
                student=student,
                title=title,
                message=message,
                notification_type=notification_type,
                sender=sender,
                priority=priority,
                include_student=True,
                include_parents=include_parents,
            )
            created_notifications.extend(notifs)

    return created_notifications
