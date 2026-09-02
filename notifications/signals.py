import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


def connect_notification_signals():
    """
    Connect notification signal listeners to core application models.
    Called from NotificationsConfig.ready().
    """
    try:
        from academics.models import GradeRecord
        from students.models import Attendance
        from scheduling.models import ClassSchedule, ExamSchedule
        from finance.models import StudentFee, Payment

        post_save.connect(on_grade_posted, sender=GradeRecord, dispatch_uid='notif_grade_posted')
        post_save.connect(on_attendance_marked, sender=Attendance, dispatch_uid='notif_attendance_marked')
        post_save.connect(on_class_schedule_saved, sender=ClassSchedule, dispatch_uid='notif_class_schedule_saved')
        post_save.connect(on_exam_schedule_saved, sender=ExamSchedule, dispatch_uid='notif_exam_schedule_saved')
        post_save.connect(on_fee_saved, sender=StudentFee, dispatch_uid='notif_fee_saved')
        post_save.connect(on_payment_completed, sender=Payment, dispatch_uid='notif_payment_completed')
    except Exception as e:
        logger.warning(f"Failed to connect notification signals: {e}")


def on_grade_posted(sender, instance, created, **kwargs):
    """Trigger notification when a grade is posted or updated."""
    from .services import notify_student_and_parents
    try:
        student = instance.enrollment.student
        assessment = instance.assessment
        score_display = f"{instance.score}/{assessment.max_marks}" if assessment.max_marks else str(instance.score)
        grade_letter = f" ({instance.grade})" if instance.grade else ""

        title = f"Grade Posted: {assessment.name}"
        message = (
            f"New grade posted for {assessment.name} in {assessment.class_section.name}. "
            f"Score: {score_display}{grade_letter}."
        )
        if instance.feedback:
            message += f" Feedback: {instance.feedback}"

        notify_student_and_parents(
            student=student,
            title=title,
            message=message,
            notification_type='GRADE_POSTED',
            priority='NORMAL',
        )
    except Exception as e:
        logger.error(f"Error sending grade notification: {e}")


def on_attendance_marked(sender, instance, created, **kwargs):
    """Trigger alert notification when student is absent or late."""
    from .services import notify_student_and_parents
    try:
        if instance.status in ['ABSENT', 'LATE']:
            student = instance.student
            title = f"Attendance Alert: {instance.get_status_display()}"
            message = (
                f"{student.full_name} was marked {instance.get_status_display()} "
                f"on {instance.date}."
            )
            if instance.reason:
                message += f" Note: {instance.reason}"

            notify_student_and_parents(
                student=student,
                title=title,
                message=message,
                notification_type='ATTENDANCE_ALERT',
                priority='HIGH' if instance.status == 'ABSENT' else 'NORMAL',
                include_student=True,
                include_parents=True,
            )
    except Exception as e:
        logger.error(f"Error sending attendance notification: {e}")


def on_class_schedule_saved(sender, instance, created, **kwargs):
    """Trigger notification when a class schedule is created or changed."""
    from .services import notify_class_section
    try:
        class_section = instance.class_section
        action_verb = "scheduled" if created else "rescheduled"
        title = f"Class Schedule Update: {class_section.name}"
        message = (
            f"{class_section.name} has been {action_verb} for {instance.day_of_week} "
            f"from {instance.start_time.strftime('%H:%M')} to {instance.end_time.strftime('%H:%M')} "
            f"in {instance.room.name}."
        )

        notify_class_section(
            class_section=class_section,
            title=title,
            message=message,
            notification_type='CLASS_SCHEDULE_CHANGED',
            sender=instance.teacher,
            priority='NORMAL',
        )
    except Exception as e:
        logger.error(f"Error sending class schedule notification: {e}")


def on_exam_schedule_saved(sender, instance, created, **kwargs):
    """Trigger notification when an exam is announced or rescheduled."""
    from .services import notify_class_section
    try:
        class_section = instance.class_section
        title = f"Exam Announced: {class_section.name} ({instance.get_exam_type_display()})"
        message = (
            f"{instance.get_exam_type_display()} exam for {class_section.name} is scheduled on "
            f"{instance.exam_date} from {instance.start_time.strftime('%H:%M')} to "
            f"{instance.end_time.strftime('%H:%M')} in {instance.room.name}."
        )

        notify_class_section(
            class_section=class_section,
            title=title,
            message=message,
            notification_type='EXAM_ANNOUNCED',
            priority='HIGH',
        )
    except Exception as e:
        logger.error(f"Error sending exam schedule notification: {e}")


def on_fee_saved(sender, instance, created, **kwargs):
    """Trigger notification when a fee is created or becomes overdue."""
    from .services import notify_student_and_parents
    try:
        if created or instance.status == 'overdue':
            student = instance.student
            title = f"Fee Notice: {instance.fee_type.name}"
            status_text = "is overdue" if instance.status == 'overdue' else "is due"
            message = (
                f"Fee of ${instance.amount_due:.2f} for '{instance.fee_type.name}' "
                f"{status_text} on {instance.due_date}. "
                f"Outstanding balance: ${instance.outstanding_balance:.2f}."
            )
            notify_student_and_parents(
                student=student,
                title=title,
                message=message,
                notification_type='FEE_DUE',
                priority='HIGH' if instance.status == 'overdue' else 'NORMAL',
            )
    except Exception as e:
        logger.error(f"Error sending fee notification: {e}")


def on_payment_completed(sender, instance, created, **kwargs):
    """Trigger notification when a payment is received."""
    from .services import notify_student_and_parents
    try:
        if instance.status == 'completed':
            student = instance.student
            title = f"Payment Received: ${instance.amount:.2f}"
            message = (
                f"A payment of ${instance.amount:.2f} via {instance.get_payment_method_display()} "
                f"has been confirmed for {student.full_name} on {instance.payment_date}. "
                f"Remaining invoice balance: ${instance.invoice.balance:.2f}."
            )
            notify_student_and_parents(
                student=student,
                title=title,
                message=message,
                notification_type='FEE_PAID',
                priority='NORMAL',
            )
    except Exception as e:
        logger.error(f"Error sending payment notification: {e}")
