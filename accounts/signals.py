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
    from students.models import Student
    User = get_user_model()
    
    # Generate random password for student
    student_password = generate_random_password()
    
    student_email = student_data.get('email')
    student_first_name = student_data.get('first_name', '')
    student_last_name = student_data.get('last_name', '')
    
    # Create student user account
    student_user = User.objects.create_user(
        username=student_data.get('username') or (student_email.split('@')[0] if student_email else f"student_{student_data.get('student_id', '')}"),
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
    student, created = Student.objects.get_or_create(
        student_id=student_data.get('student_id'),
        defaults={
            'user': student_user,
            'first_name': student_first_name,
            'last_name': student_last_name,
            'middle_name': student_data.get('middle_name', ''),
            'date_of_birth': student_data.get('date_of_birth') or timezone.now().date(),
            'gender': student_data.get('gender', 'MALE'),
            'email': student_email,
            'phone_number': student_data.get('phone_number', ''),
            'address': student_data.get('address', 'Not Specified'),
            'emergency_contact_name': student_data.get('emergency_contact_name', student_data.get('parent_first_name', 'Guardian')),
            'emergency_contact_phone': student_data.get('emergency_contact_phone', parent_phone),
            'current_grade': str(student_data.get('year', student_data.get('current_grade', '1'))),
            'current_class': student_data.get('program', student_data.get('current_class', 'General')),
            'academic_year': student_data.get('academic_year', str(timezone.now().year)),
            'guardian_name': f"{student_data.get('parent_first_name', '')} {student_data.get('parent_last_name', '')}".strip() or 'Parent',
            'guardian_relationship': student_data.get('relationship', 'Parent'),
            'guardian_phone': parent_phone,
            'guardian_email': parent_email,
            'status': 'ACTIVE',
        }
    )
    if not created and student.user is None:
        student.user = student_user
        student.save()
    
    # Generate random password for parent
    parent_password = generate_random_password()
    parent_username = f"parent_{student_data.get('student_id', '').lower()}"
    parent_user, created = User.objects.get_or_create(
        email=parent_email,
        defaults={
            'username': parent_username,
            'first_name': student_data.get('parent_first_name', 'Parent'),
            'last_name': student_data.get('parent_last_name', ''),
            'must_reset_password': True,
        }
    )
    if created:
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
    
    # Send email notifications (silently handles if smtp not configured)
    try:
        send_account_credentials_email(student_user, student_password, 'Student')
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