# accounts/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
import random
import string
from .models import User, StudentProfile, ParentProfile, Role

def generate_random_password(length=12):
    """Generate a secure temporary password using secrets"""
    from accounts.serializers import generate_secure_temporary_password
    return generate_secure_temporary_password(length)


def provision_student_account(student_data, parent_email, parent_phone, campus_code='MAIN'):
    """
    Function to provision a new student account with parent account
    Called from ProvisionStudentAccountAPIView
    """
    from django.contrib.auth import get_user_model
    from students.models import Student
    from accounts.serializers import generate_secure_temporary_password
    User = get_user_model()
    
    student_email = student_data.get('email')
    student_id = student_data.get('student_id')
    if not student_id:
        raise ValueError("Student ID is required.")
    if not student_email:
        raise ValueError("Student email is required.")

    if Student.objects.filter(student_id=student_id).exists():
        raise ValueError(f"Student with ID '{student_id}' already exists.")

    if User.objects.filter(email__iexact=student_email).exists():
        raise ValueError(f"A user with email '{student_email}' already exists.")

    student_first_name = student_data.get('first_name', '')
    student_last_name = student_data.get('last_name', '')
    
    # Generate secure temporary password for student
    student_password = generate_secure_temporary_password(12)
    
    # Create student user account
    student_username = student_data.get('username') or (student_email.split('@')[0] if student_email else f"student_{student_id.lower()}")
    base_u = student_username
    counter = 1
    while User.objects.filter(username=student_username).exists():
        student_username = f"{base_u}_{counter}"
        counter += 1

    student_user = User.objects.create_user(
        username=student_username,
        email=student_email,
        password=student_password,  # Will be reset on first login
        first_name=student_first_name,
        last_name=student_last_name,
        must_reset_password=True,  # Force password reset on first login
    )
    
    # Assign student role
    student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
    student_user.roles.add(student_role)
    student_user.save()
    
    # Create student record in students app
    student = Student.objects.create(
        student_id=student_id,
        user=student_user,
        first_name=student_first_name,
        last_name=student_last_name,
        middle_name=student_data.get('middle_name', ''),
        date_of_birth=student_data.get('date_of_birth') or timezone.now().date(),
        gender=student_data.get('gender', 'MALE'),
        email=student_email,
        phone_number=student_data.get('phone_number', ''),
        address=student_data.get('address', 'Not Specified'),
        emergency_contact_name=student_data.get('emergency_contact_name', student_data.get('parent_first_name', 'Guardian')),
        emergency_contact_phone=student_data.get('emergency_contact_phone', parent_phone),
        current_grade=str(student_data.get('year', student_data.get('current_grade', '1'))),
        current_class=student_data.get('program', student_data.get('current_class', 'General')),
        academic_year=student_data.get('academic_year', str(timezone.now().year)),
        guardian_name=f"{student_data.get('parent_first_name', '')} {student_data.get('parent_last_name', '')}".strip() or 'Parent',
        guardian_relationship=student_data.get('relationship', 'Parent'),
        guardian_phone=parent_phone,
        guardian_email=parent_email,
        status='ACTIVE',
    )
    
    # Generate secure temporary password for parent
    parent_password = generate_secure_temporary_password(12)
    parent_username = f"parent_{student_id.lower()}"
    parent_user, parent_created = User.objects.get_or_create(
        email=parent_email,
        defaults={
            'username': parent_username,
            'first_name': student_data.get('parent_first_name', 'Parent'),
            'last_name': student_data.get('parent_last_name', ''),
            'must_reset_password': True,
        }
    )
    if parent_created:
        parent_user.set_password(parent_password)
        parent_user.save()
        parent_role, _ = Role.objects.get_or_create(name=Role.PARENT)
        parent_user.roles.add(parent_role)
        parent_user.save()
    
    # Create parent profile
    parent_profile, _ = ParentProfile.objects.get_or_create(
        user=parent_user,
        defaults={
            'phone_number': parent_phone,
            'relationship': student_data.get('relationship', 'Parent'),
            'is_primary': True,
        }
    )
    
    # Link parent to student
    parent_profile.students.add(student)
    
    # Attach transient credentials for one-time institutional handover
    student._temporary_password = student_password
    student._user_username = student_user.username
    if parent_created:
        parent_profile._temporary_password = parent_password
        parent_profile._user_username = parent_user.username
    else:
        parent_profile._temporary_password = None
        parent_profile._user_username = parent_user.username

    # Send email notifications (silently handles if smtp not configured)
    try:
        send_account_credentials_email(student_user, student_password, 'Student')
        if parent_created:
            send_account_credentials_email(parent_user, parent_password, 'Parent')
    except Exception:
        pass
    
    return student, parent_profile


def send_account_credentials_email(user, password, user_type):
    """Send email with account credentials"""
    subject = f"Welcome to SSMS - Your {user_type} Account"
    context = {
        'user': user,
        'password': password,
        'user_type': user_type,
        'login_url': 'http://localhost:8000/login/',
        'must_reset_password': True,
    }
    
    html_message = render_to_string('accounts/email/welcome.html', context)
    plain_message = f"""
    Welcome to SSMS!
    
    Your account has been created.
    Email: {user.email}
    Password: {password}
    
    Please login and change your password.
    Login URL: http://localhost:8000/login/
    """
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create profile when user is created (if needed)"""
    if created:
        # You can add logic here to create specific profiles based on roles
        pass


@receiver(pre_save, sender=User)
def hash_user_password_if_needed(sender, instance, **kwargs):
    """Hash password if it's not already hashed"""
    if instance.pk:
        try:
            old_instance = User.objects.get(pk=instance.pk)
            if instance.password != old_instance.password:
                # Password has been changed, ensure it's hashed
                if not instance.password.startswith('pbkdf2_'):
                    instance.set_password(instance.password)
        except User.DoesNotExist:
            pass