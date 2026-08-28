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
    """Generate a random password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*()"
    return ''.join(random.choice(characters) for _ in range(length))


def provision_student_account(student_data, parent_email, parent_phone, campus_code='MAIN'):
    """
    Function to provision a new student account with parent account
    Called from ProvisionStudentAccountAPIView
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Generate random password for student
    student_password = generate_random_password()
    
    # Create student user account
    student_user = User.objects.create_user(
        username=student_data.get('username') or student_data.get('email').split('@')[0],
        email=student_data.get('email'),
        password=student_password,  # Will be reset on first login
        first_name=student_data.get('first_name', ''),
        last_name=student_data.get('last_name', ''),
        must_reset_password=True,  # Force password reset on first login
    )
    
    # Assign student role
    student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
    student_user.roles.add(student_role)
    student_user.save()
    
    # Create student profile
    student_profile = StudentProfile.objects.create(
        user=student_user,
        student_id=student_data.get('student_id'),
        department=student_data.get('department'),
        year=student_data.get('year'),
        program=student_data.get('program'),
        campus=campus_code,
        enrollment_date=student_data.get('enrollment_date', timezone.now().date()),
    )
    
    # Generate random password for parent
    parent_password = generate_random_password()
    
    # Create parent user account
    parent_username = f"parent_{student_data.get('student_id', '').lower()}"
    parent_user = User.objects.create_user(
        username=parent_username,
        email=parent_email,
        password=parent_password,
        first_name=student_data.get('parent_first_name', 'Parent'),
        last_name=student_data.get('parent_last_name', ''),
        must_reset_password=True,  # Force password reset on first login
    )
    
    # Assign parent role
    parent_role, _ = Role.objects.get_or_create(name=Role.PARENT)
    parent_user.roles.add(parent_role)
    parent_user.save()
    
    # Create parent profile
    parent_profile = ParentProfile.objects.create(
        user=parent_user,
        phone_number=parent_phone,
        relationship=student_data.get('relationship', 'Parent'),
        is_primary=True,
    )
    
    # Link parent to student
    parent_profile.students.add(student_profile)
    
    # Send email notifications
    send_account_credentials_email(student_user, student_password, 'Student')
    send_account_credentials_email(parent_user, parent_password, 'Parent')
    
    return student_profile, parent_profile


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