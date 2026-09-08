import logging
from typing import List, Optional, Dict, Any
from django.contrib.auth import get_user_model
from django.db import transaction
from django.core.exceptions import ValidationError

from accounts.models import Role, ParentProfile
from students.models import Student
from academics.models import ClassSection
from .models import ConversationThread, ThreadMessage

User = get_user_model()
logger = logging.getLogger(__name__)


def create_conversation_thread(
    student: Student,
    created_by: User,
    recipient: User,
    subject: str,
    category: str,
    initial_message: str
) -> ConversationThread:
    """
    Creates a new conversation thread anchored to a student and an initial message,
    and pushes an alert to the recipient.
    """
    if not subject or not initial_message:
        raise ValidationError("Subject and initial message are required.")

    if created_by.id == recipient.id:
        raise ValidationError("You cannot start a conversation with yourself.")

    with transaction.atomic():
        thread = ConversationThread.objects.create(
            student=student,
            subject=subject,
            category=category,
            status='OPEN',
            created_by=created_by,
        )
        thread.participants.add(created_by, recipient)

        message = ThreadMessage.objects.create(
            thread=thread,
            sender=created_by,
            content=initial_message
        )
        message.read_by.add(created_by)

    # Decoupled notification alert
    _notify_recipient(
        recipient=recipient,
        sender=created_by,
        title=f"New inquiry from {created_by.full_name or created_by.email}: {subject}",
        content=initial_message,
        student=student
    )

    return thread


def send_thread_message(
    thread: ConversationThread,
    sender: User,
    content: str
) -> ThreadMessage:
    """
    Appends a new message to an existing thread, updates thread timestamp,
    and alerts all other participants.
    """
    if not content or not content.strip():
        raise ValidationError("Message content cannot be empty.")

    with transaction.atomic():
        message = ThreadMessage.objects.create(
            thread=thread,
            sender=sender,
            content=content.strip()
        )
        message.read_by.add(sender)

        # Auto-reopen if thread was resolved/closed
        if thread.status in ['RESOLVED', 'CLOSED']:
            thread.status = 'IN_PROGRESS'
        thread.save(update_fields=['status', 'updated_at'])

    # Alert all other participants
    other_participants = thread.participants.exclude(id=sender.id)
    for participant in other_participants:
        _notify_recipient(
            recipient=participant,
            sender=sender,
            title=f"New message on '{thread.subject}'",
            content=content,
            student=thread.student
        )

    return message


def mark_thread_messages_as_read(thread: ConversationThread, user: User) -> int:
    """
    Marks all unread messages in the thread as read by this user.
    """
    unread_messages = thread.messages.exclude(read_by=user)
    count = unread_messages.count()
    for msg in unread_messages:
        msg.read_by.add(user)
    return count


def resolve_thread(thread: ConversationThread, user: User) -> ConversationThread:
    """
    Marks an inquiry thread as resolved.
    """
    thread.mark_resolved()
    # Alert other participants that thread is resolved
    other_participants = thread.participants.exclude(id=user.id)
    for participant in other_participants:
        _notify_recipient(
            recipient=participant,
            sender=user,
            title=f"Inquiry resolved: {thread.subject}",
            content=f"This conversation has been marked as resolved by {user.full_name or user.email}.",
            student=thread.student
        )
    return thread


def get_eligible_contacts_for_user(user: User) -> Dict[str, Any]:
    """
    Calculates institutional contacts for the given user:
    - For Parents: Returns list of their enrolled children, and for each child, their teachers and subjects.
    - For Teachers: Returns list of their active class sections, students, and linked parent accounts.
    - For Admins/Coordinators: Can contact anyone.
    """
    role_names = {role.name for role in user.roles.all()}

    # 1. Parent context
    if Role.PARENT in role_names:
        children_data = []
        if hasattr(user, 'parent_profile'):
            students = user.parent_profile.students.all()
            for student in students:
                # Find all active sections for this student
                sections = ClassSection.objects.filter(
                    enrollments__student=student,
                    enrollments__status='ACTIVE',
                    is_active=True
                ).select_related('teacher', 'subject')

                teachers_list = []
                seen_teachers = set()
                for sec in sections:
                    if sec.teacher and sec.teacher.id not in seen_teachers:
                        seen_teachers.add(sec.teacher.id)
                        teachers_list.append({
                            'id': sec.teacher.id,
                            'name': sec.teacher.full_name or sec.teacher.email,
                            'email': sec.teacher.email,
                            'role': 'TEACHER',
                            'subject': sec.subject.name,
                            'section': sec.name
                        })

                # Also add School Administration
                admin_users = User.objects.filter(roles__name__in=[Role.ADMIN, Role.ACADEMIC_COORDINATOR]).distinct()
                staff_list = [
                    {
                        'id': admin.id,
                        'name': f"{admin.full_name or admin.email} (School Office)",
                        'email': admin.email,
                        'role': 'STAFF',
                        'subject': 'Administration',
                        'section': 'General'
                    }
                    for admin in admin_users
                ]

                children_data.append({
                    'student_id': student.id,
                    'student_code': student.student_id,
                    'name': student.full_name,
                    'grade': student.current_grade,
                    'class_name': student.current_class,
                    'eligible_recipients': teachers_list + staff_list
                })

        return {'role': Role.PARENT, 'children': children_data}

    # 2. Teacher context
    if Role.TEACHER in role_names:
        taught_sections = ClassSection.objects.filter(
            teacher=user,
            is_active=True
        ).select_related('subject')

        sections_data = []
        for sec in taught_sections:
            students = Student.objects.filter(
                class_enrollments__class_section=sec,
                class_enrollments__status='ACTIVE'
            ).distinct()

            students_list = []
            for stu in students:
                parents = ParentProfile.objects.filter(students=stu).select_related('user')
                parents_list = [
                    {
                        'id': p.user.id,
                        'name': p.user.full_name or p.user.email,
                        'email': p.user.email,
                        'relationship': p.relationship,
                        'phone': p.phone_number
                    }
                    for p in parents if p.user
                ]
                students_list.append({
                    'student_id': stu.id,
                    'student_code': stu.student_id,
                    'name': stu.full_name,
                    'parents': parents_list
                })

            sections_data.append({
                'section_id': sec.id,
                'section_name': sec.name,
                'subject': sec.subject.name,
                'students': students_list
            })

        return {'role': Role.TEACHER, 'sections': sections_data}

    # 3. Admin / Staff context
    return {
        'role': 'STAFF',
        'is_admin': True,
        'message': 'Administrators have full institutional messaging directory access.'
    }


def _notify_recipient(recipient: User, sender: User, title: str, content: str, student: Optional[Student] = None):
    """
    Decoupled trigger that uses the notifications service if available.
    """
    try:
        from notifications.services import create_notification
        create_notification(
            recipient=recipient,
            sender=sender,
            title=title,
            message=content[:200],
            notification_type='TEACHER_MESSAGE',
            related_student=student,
            priority='NORMAL'
        )
    except Exception as e:
        logger.warning("Could not dispatch push notification alert: %s", e)
