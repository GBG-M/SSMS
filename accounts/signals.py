import secrets
import string
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import User, Role, StudentProfile, ParentProfile, ParentGuardianLink

def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_student_id(campus_code="MAIN"):
    year = timezone.now().year
    last_student = StudentProfile.objects.filter(
        student_id__startswith=f"{year}-{campus_code}-"
    ).order_by('student_id').last()

    if last_student:
        last_seq = int(last_student.student_id.split('-')[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1

    return f"{year}-{campus_code}-{new_seq:05d}"


def provision_student_account(student_data, parent_email, parent_phone, campus_code="MAIN"):
    """
    Core Workflow implementation triggered when a student is enrolled.
    """
    # 1. Create Student User & Profile
    temp_password = generate_temp_password()
    student_id = generate_student_id(campus=campus_code)
    
    # Student email generated or provided
    student_email = f"{student_id.lower()}@student.portal.local"
    
    student_user = User.objects.create_user(
        email=student_email,
        password=temp_password,
        first_name=student_data.get('first_name'),
        last_name=student_data.get('last_name'),
        must_reset_password=True
    )
    
    student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
    student_user.roles.add(student_role)
    
    student_profile = StudentProfile.objects.create(
        user=student_user,
        student_id=student_id,
        date_of_birth=student_data.get('date_of_birth'),
        grade_level=student_data.get('grade_level', '')
    )

    # 2. Check or Create Parent Account
    parent_user, created = User.objects.get_or_create(
        email=parent_email,
        defaults={
            'first_name': student_data.get('parent_first_name', 'Parent/Guardian'),
            'last_name': student_data.get('parent_last_name', student_user.last_name),
            'phone_number': parent_phone,
            'must_reset_password': True
        }
    )
    
    parent_temp_password = None
    if created:
        parent_temp_password = generate_temp_password()
        parent_user.set_password(parent_temp_password)
        parent_user.save()
        parent_role, _ = Role.objects.get_or_create(name=Role.PARENT)
        parent_user.roles.add(parent_role)

    parent_profile, _ = ParentProfile.objects.get_or_create(user=parent_user)

    # 3. Link Parent and Student
    ParentGuardianLink.objects.get_or_create(
        parent=parent_profile,
        student=student_profile,
        defaults={'relationship_type': student_data.get('relationship', 'GUARDIAN'), 'is_primary': True}
    )

    # 4. Dispatch Credentials (Integration Point for Notifications App)
    # send_notification_email(parent_email, student_id, temp_password, parent_temp_password)

    return student_profile, parent_profile