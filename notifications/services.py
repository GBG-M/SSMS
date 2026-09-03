import logging
from typing import List, Optional

from django.contrib.auth import get_user_model
from django.db import transaction

from accounts.models import ParentProfile
from students.models import Student

from .models import Notification


User = get_user_model()
logger = logging.getLogger(__name__)


def create_notification(
    recipient,
    title: str,
    message: str,
    notification_type: str = "SYSTEM_ALERT",
    sender=None,
    related_student: Optional[Student] = None,
    priority: str = "NORMAL",
) -> Notification:
    """
    Create a single notification record for a specific user recipient.
    """

    roles = [role.name for role in recipient.roles.all()] if recipient else []
    recipient_role = roles[0] if roles else ""

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
    notification_type: str = "SYSTEM_ALERT",
    sender=None,
    priority: str = "NORMAL",
    include_student: bool = True,
    include_parents: bool = True,
) -> List[Notification]:
    """
    Send notifications to a student user and all linked parent users.
    """

    created_notifications = []

    with transaction.atomic():

        # 1. Notify the student
        if include_student and student.user:
            notification = create_notification(
                recipient=student.user,
                title=title,
                message=message,
                notification_type=notification_type,
                sender=sender,
                related_student=student,
                priority=priority,
            )

            created_notifications.append(notification)

        # 2. Notify linked parents
        if include_parents:
            parent_profiles = (
                ParentProfile.objects
                .filter(students=student)
                .select_related("user")
            )

            for parent_profile in parent_profiles:
                if parent_profile.user:
                    notification = create_notification(
                        recipient=parent_profile.user,
                        title=f"[{student.full_name}] {title}",
                        message=message,
                        notification_type=notification_type,
                        sender=sender,
                        related_student=student,
                        priority=priority,
                    )

                    created_notifications.append(notification)

    return created_notifications


def notify_class_section(
    class_section,
    title: str,
    message: str,
    notification_type: str = "TEACHER_MESSAGE",
    sender=None,
    priority: str = "NORMAL",
    include_parents: bool = True,
) -> List[Notification]:
    """
    Broadcast notification to all active enrolled students
    and their parents in a class section.
    """

    created_notifications = []

    enrollments = (
        class_section.enrollments
        .filter(status="ACTIVE")
        .select_related("student", "student__user")
    )

    with transaction.atomic():

        for enrollment in enrollments:
            student = enrollment.student

            notifications = notify_student_and_parents(
                student=student,
                title=title,
                message=message,
                notification_type=notification_type,
                sender=sender,
                priority=priority,
                include_student=True,
                include_parents=include_parents,
            )

            created_notifications.extend(notifications)

    return created_notifications

