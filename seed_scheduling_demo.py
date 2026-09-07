import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SSMS.settings')
django.setup()

from accounts.models import User, Role
from academics.models import AcademicYear, Subject, ClassSection
from scheduling.models import Room, ClassSchedule, ExamSchedule

def seed():
    print("🌱 Seeding demo data for SSMS Scheduling...")

    # 1. Roles
    admin_role, _ = Role.objects.get_or_create(name='admin', defaults={'description': 'System Administrator'})
    teacher_role, _ = Role.objects.get_or_create(name='teacher', defaults={'description': 'Faculty Teacher'})
    student_role, _ = Role.objects.get_or_create(name='student', defaults={'description': 'Student'})
    parent_role, _ = Role.objects.get_or_create(name='parent', defaults={'description': 'Parent'})

    # 2. Admin User
    admin, created = User.objects.get_or_create(
        email='admin@ssms.edu',
        defaults={
            'username': 'admin',
            'first_name': 'Sarah',
            'last_name': 'Connor',
            'is_staff': True,
            'is_superuser': True,
            'must_reset_password': False,
        }
    )
    admin.set_password('AdminPass123!')
    admin.save()
    admin.roles.add(admin_role)
    print(f"✅ Admin user ready: admin@ssms.edu / AdminPass123!")

    # 3. Teacher User
    teacher, _ = User.objects.get_or_create(
        email='teacher@ssms.edu',
        defaults={
            'username': 'alanturing',
            'first_name': 'Alan',
            'last_name': 'Turing',
            'is_staff': False,
            'must_reset_password': False,
        }
    )
    teacher.set_password('TeacherPass123!')
    teacher.save()
    teacher.roles.add(teacher_role)
    print(f"✅ Teacher user ready: teacher@ssms.edu / TeacherPass123!")

    # 4. Academic Year
    ay, _ = AcademicYear.objects.get_or_create(
        name='2025-2026 Academic Year',
        defaults={
            'start_date': date(2025, 9, 1),
            'end_date': date(2026, 6, 30),
            'is_active': True,
        }
    )

    # 5. Subjects
    math, _ = Subject.objects.get_or_create(
        code='MATH101',
        defaults={'name': 'Advanced Mathematics', 'department': 'Science & Mathematics'}
    )
    phys, _ = Subject.objects.get_or_create(
        code='PHYS101',
        defaults={'name': 'General Physics', 'department': 'Physical Sciences'}
    )

    # 6. Class Sections
    sec_math, _ = ClassSection.objects.get_or_create(
        section_code='SEC-MATH-10A',
        defaults={
            'name': 'Grade 10 - Section A (Math)',
            'academic_year': ay,
            'subject': math,
            'teacher': teacher,
            'capacity': 30,
        }
    )
    sec_phys, _ = ClassSection.objects.get_or_create(
        section_code='SEC-PHYS-11B',
        defaults={
            'name': 'Grade 11 - Section B (Physics)',
            'academic_year': ay,
            'subject': phys,
            'teacher': teacher,
            'capacity': 35,
        }
    )

    # 7. Rooms
    r1, _ = Room.objects.get_or_create(
        name='Lecture Hall Alpha',
        room_number='LH-101',
        defaults={'building': 'Main Academic Block', 'capacity': 80, 'is_active': True}
    )
    r2, _ = Room.objects.get_or_create(
        name='Physics & Optics Lab',
        room_number='LAB-202',
        defaults={'building': 'Science Wing', 'capacity': 35, 'is_active': True}
    )
    r3, _ = Room.objects.get_or_create(
        name='Mathematics Seminar Room',
        room_number='R-305',
        defaults={'building': 'Main Academic Block', 'capacity': 25, 'is_active': True}
    )
    print(f"✅ Campus Rooms created: {r1.name}, {r2.name}, {r3.name}")

    # 8. Class Schedules
    ClassSchedule.objects.all().delete()
    schedules = [
        ClassSchedule(
            class_section=sec_math,
            room=r3,
            teacher=teacher,
            academic_year=ay,
            day_of_week='MONDAY',
            start_time='09:00',
            end_time='10:30',
            term='Term 1',
            notes='Bring graphing calculator'
        ),
        ClassSchedule(
            class_section=sec_phys,
            room=r2,
            teacher=teacher,
            academic_year=ay,
            day_of_week='MONDAY',
            start_time='11:00',
            end_time='12:30',
            term='Term 1',
            notes='Lab coats required'
        ),
        ClassSchedule(
            class_section=sec_math,
            room=r3,
            teacher=teacher,
            academic_year=ay,
            day_of_week='TUESDAY',
            start_time='10:00',
            end_time='11:30',
            term='Term 1',
        ),
        ClassSchedule(
            class_section=sec_phys,
            room=r1,
            teacher=teacher,
            academic_year=ay,
            day_of_week='WEDNESDAY',
            start_time='09:00',
            end_time='10:30',
            term='Term 1',
        ),
        ClassSchedule(
            class_section=sec_math,
            room=r1,
            teacher=teacher,
            academic_year=ay,
            day_of_week='THURSDAY',
            start_time='13:00',
            end_time='14:30',
            term='Term 1',
        ),
        ClassSchedule(
            class_section=sec_phys,
            room=r2,
            teacher=teacher,
            academic_year=ay,
            day_of_week='FRIDAY',
            start_time='10:00',
            end_time='11:30',
            term='Term 1',
            notes='Review problem set 4'
        ),
    ]
    for s in schedules:
        s.full_clean()
        s.save()
    print(f"✅ Created {len(schedules)} weekly class schedules across Monday-Friday!")

    # 9. Exam Schedules
    ExamSchedule.objects.all().delete()
    exams = [
        ExamSchedule(
            class_section=sec_math,
            room=r1,
            academic_year=ay,
            exam_type='MIDTERM',
            exam_date=date.today() + timedelta(days=3),
            start_time='09:00',
            end_time='11:00',
            notes='Midterm exam covering chapters 1 to 5. ID mandatory.'
        ),
        ExamSchedule(
            class_section=sec_phys,
            room=r2,
            academic_year=ay,
            exam_type='PRACTICAL',
            exam_date=date.today() + timedelta(days=7),
            start_time='14:00',
            end_time='16:00',
            notes='Optics lab experiments assessment.'
        ),
    ]
    for e in exams:
        e.full_clean()
        e.save()
    print(f"✅ Created {len(exams)} upcoming exam schedules!")
    print("🎉 All demo data successfully seeded!")

if __name__ == '__main__':
    seed()
