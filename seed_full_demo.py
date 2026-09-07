import os
import django
from datetime import date, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SSMS.settings')
django.setup()

from accounts.models import User, Role, ParentProfile
from students.models import Student, Attendance, AcademicRecord
from academics.models import AcademicYear, Subject, Course, ClassSection, Enrollment
from scheduling.models import Room, ClassSchedule, ExamSchedule

print("[INFO] Seeding comprehensive demo data...")

# 1. Ensure Roles
roles = {}
for role_name in [Role.ADMIN, Role.ACADEMIC_COORDINATOR, Role.TEACHER, Role.STUDENT, Role.PARENT]:
    r, _ = Role.objects.get_or_create(name=role_name)
    roles[role_name] = r

# 2. Admin User
admin, created = User.objects.get_or_create(
    email='admin@ssms.edu',
    defaults={
        'username': 'admin',
        'first_name': 'System',
        'last_name': 'Administrator',
        'is_staff': True,
        'is_superuser': True,
        'must_reset_password': False
    }
)
admin.set_password('AdminPass123!')
admin.roles.add(roles[Role.ADMIN])
admin.must_reset_password = False
admin.save()

# 3. Teacher User
teacher, created = User.objects.get_or_create(
    email='teacher@ssms.edu',
    defaults={
        'username': 'teacher',
        'first_name': 'Abebe',
        'last_name': 'Kebede',
        'must_reset_password': False
    }
)
teacher.set_password('TeacherPass123!')
teacher.roles.add(roles[Role.TEACHER])
teacher.must_reset_password = False
teacher.save()

# 4. Student User & Profile
student_user, created = User.objects.get_or_create(
    email='student@ssms.edu',
    defaults={
        'username': 'alice_student',
        'first_name': 'Alice',
        'last_name': 'Smith',
        'must_reset_password': False
    }
)
student_user.set_password('StudentPass123!')
student_user.roles.add(roles[Role.STUDENT])
student_user.must_reset_password = False
student_user.save()

student_profile, _ = Student.objects.get_or_create(
    student_id='STU2026-001',
    defaults={
        'user': student_user,
        'first_name': 'Alice',
        'last_name': 'Smith',
        'date_of_birth': date(2009, 5, 14),
        'gender': 'FEMALE',
        'email': 'student@ssms.edu',
        'phone_number': '+251911223344',
        'address': 'Bole Subcity, Addis Ababa',
        'emergency_contact_name': 'Bob Smith',
        'emergency_contact_phone': '+251922334455',
        'current_grade': '10',
        'current_class': '10-A',
        'academic_year': '2025/2026',
        'guardian_name': 'Bob Smith',
        'guardian_relationship': 'Father',
        'guardian_phone': '+251922334455',
        'status': 'ACTIVE'
    }
)
if not student_profile.user:
    student_profile.user = student_user
    student_profile.save()

# Attendance sample
Attendance.objects.get_or_create(
    student=student_profile,
    date=date.today(),
    defaults={
        'status': 'PRESENT',
        'recorded_by': teacher
    }
)

# Academic Record sample
AcademicRecord.objects.get_or_create(
    student=student_profile,
    term='Term 1',
    academic_year='2025/2026',
    defaults={
        'subjects': {'Mathematics': 94, 'Physics': 89, 'English': 92, 'Chemistry': 88},
        'gpa': 3.88,
        'percentage': 90.75,
        'remarks': 'Outstanding performance in sciences and language.'
    }
)

# 5. Parent User
parent_user, created = User.objects.get_or_create(
    email='parent@ssms.edu',
    defaults={
        'username': 'bob_parent',
        'first_name': 'Bob',
        'last_name': 'Smith',
        'must_reset_password': False
    }
)
parent_user.set_password('ParentPass123!')
parent_user.roles.add(roles[Role.PARENT])
parent_user.must_reset_password = False
parent_user.save()

parent_profile, _ = ParentProfile.objects.get_or_create(user=parent_user)
parent_profile.students.add(student_profile)

# 6. Academics Data
acad_year, _ = AcademicYear.objects.get_or_create(
    name='2025/2026 Academic Year',
    defaults={
        'start_date': date(2025, 9, 1),
        'end_date': date(2026, 6, 30),
        'is_active': True
    }
)

math_sub, _ = Subject.objects.get_or_create(
    code='MATH-10',
    defaults={
        'name': 'Mathematics 10',
        'credit_hours': 4,
        'department': 'Exact Sciences',
        'is_active': True
    }
)

phy_sub, _ = Subject.objects.get_or_create(
    code='PHY-10',
    defaults={
        'name': 'Physics 10',
        'credit_hours': 3,
        'department': 'Natural Sciences',
        'is_active': True
    }
)

eng_sub, _ = Subject.objects.get_or_create(
    code='ENG-10',
    defaults={
        'name': 'English Literature 10',
        'credit_hours': 3,
        'department': 'Languages',
        'is_active': True
    }
)

course, _ = Course.objects.get_or_create(
    course_code='CRS-MATH-10',
    defaults={
        'title': 'High School Algebra & Trigonometry',
        'subject': math_sub,
        'academic_year': acad_year,
        'level': 'Grade 10',
        'credit_hours': 4,
        'is_active': True
    }
)

section_a, _ = ClassSection.objects.get_or_create(
    section_code='SEC-10A-MATH',
    defaults={
        'name': 'Grade 10-A Math',
        'subject': math_sub,
        'teacher': teacher,
        'academic_year': acad_year,
        'capacity': 40,
        'is_active': True
    }
)

Enrollment.objects.get_or_create(
    student=student_profile,
    class_section=section_a,
    defaults={'status': 'ENROLLED'}
)

# 7. Rooms & Scheduling Data
room1, _ = Room.objects.get_or_create(
    room_number='LAB-101',
    defaults={
        'name': 'Science Lab 101',
        'building': 'Science Complex',
        'capacity': 35,
        'is_active': True
    }
)

room2, _ = Room.objects.get_or_create(
    room_number='AUD-1',
    defaults={
        'name': 'Main Auditorium',
        'building': 'Administrative Hall',
        'capacity': 150,
        'is_active': True
    }
)

room3, _ = Room.objects.get_or_create(
    room_number='CLS-204',
    defaults={
        'name': 'Classroom 204',
        'building': 'Academic Block B',
        'capacity': 45,
        'is_active': True
    }
)

# Class Schedules
try:
    ClassSchedule.objects.get_or_create(
        class_section=section_a,
        day_of_week='SATURDAY',
        start_time=time(9, 0),
        defaults={
            'end_time': time(10, 30),
            'room': room3,
            'teacher': teacher,
            'academic_year': acad_year,
            'term': 'Term 1'
        }
    )
except Exception:
    pass

# Exam Schedules
try:
    ExamSchedule.objects.get_or_create(
        class_section=section_a,
        exam_type='MIDTERM',
        exam_date=date(2026, 9, 15),
        defaults={
            'start_time': time(9, 0),
            'end_time': time(11, 0),
            'room': room2,
            'academic_year': acad_year,
            'notes': 'Calculators permitted. Bring Student ID.'
        }
    )
except Exception:
    pass

# 8. Finance Demo Data
from decimal import Decimal
from finance.models import FeeType, FeeStructure, StudentFee, Invoice

tuition_fee, _ = FeeType.objects.get_or_create(
    name='Grade 10 Tuition Fee',
    academic_year='2025/2026',
    defaults={
        'category': 'tuition',
        'description': 'Full term standard tuition fee for Grade 10 students.',
        'amount': Decimal('1500.00'),
        'is_required': True,
        'is_active': True,
    }
)

lab_fee, _ = FeeType.objects.get_or_create(
    name='Science Laboratory Fee',
    academic_year='2025/2026',
    defaults={
        'category': 'exam',
        'description': 'Annual chemistry & physics laboratory maintenance fee.',
        'amount': Decimal('350.00'),
        'is_required': True,
        'is_active': True,
    }
)

fee_struct, _ = FeeStructure.objects.get_or_create(
    fee_type=tuition_fee,
    grade_level='Grade 10',
    academic_year='2025/2026',
    defaults={
        'amount': Decimal('1500.00'),
        'recurrence': 'term',
        'due_date': date(2026, 10, 1),
    }
)

student_fee, _ = StudentFee.objects.get_or_create(
    student=student_profile,
    fee_type=tuition_fee,
    academic_year='2025/2026',
    defaults={
        'fee_structure': fee_struct,
        'amount_due': Decimal('1500.00'),
        'amount_paid': Decimal('500.00'),
        'status': 'partial',
        'due_date': date(2026, 10, 1),
    }
)

Invoice.objects.get_or_create(
    student=student_profile,
    invoice_number='INV-2026-001',
    defaults={
        'issued_by': admin,
        'subtotal': Decimal('1500.00'),
        'total_amount': Decimal('1500.00'),
        'paid_amount': Decimal('500.00'),
        'status': 'partial',
        'due_date': date(2026, 10, 1),
        'notes': 'Term 1 Tuition and Laboratory Invoice.',
    }
)

print("[SUCCESS] Demo seeding successfully complete!")
