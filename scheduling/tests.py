from datetime import time

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from academics.models import AcademicYear, Subject, ClassSection, Enrollment
from accounts.models import Role
from students.models import Student
from .models import Room, ClassSchedule, ExamSchedule
from .permissions import SchedulingAccessPermission

User = get_user_model()


class SchedulingValidationTests(TestCase):
    def setUp(self):
        self.teacher_role = Role.objects.create(name=Role.TEACHER)
        self.teacher = User.objects.create_user(
            email='teacher@ssms.test',
            username='teacher',
            password='StrongPass123',
            first_name='Test',
            last_name='Teacher',
        )
        self.teacher.roles.add(self.teacher_role)

        self.academic_year = AcademicYear.objects.create(
            name='2025/2026',
            start_date='2025-09-01',
            end_date='2026-06-30',
            is_active=True,
        )
        self.subject = Subject.objects.create(
            code='MATH101',
            name='Mathematics',
            description='Core mathematics',
            credit_hours=3,
            department='Science',
        )
        self.room = Room.objects.create(
            name='Room A1',
            room_number='A1',
            building='Main Block',
            capacity=30,
        )

        self.class_section = ClassSection.objects.create(
            section_code='MATH-101-A',
            name='Mathematics 101 A',
            academic_year=self.academic_year,
            subject=self.subject,
            teacher=self.teacher,
            room_number='A1',
            capacity=30,
        )

    def test_room_conflict_is_rejected(self):
        ClassSchedule.objects.create(
            class_section=self.class_section,
            room=self.room,
            teacher=self.teacher,
            day_of_week='MONDAY',
            start_time=time(9, 0),
            end_time=time(10, 0),
            academic_year=self.academic_year,
            term='Term 1',
        )

        conflicting = ClassSchedule(
            class_section=self.class_section,
            room=self.room,
            teacher=self.teacher,
            day_of_week='MONDAY',
            start_time=time(9, 30),
            end_time=time(10, 30),
            academic_year=self.academic_year,
            term='Term 1',
        )

        with self.assertRaises(ValidationError):
            conflicting.full_clean()

    def test_teacher_conflict_is_rejected(self):
        section_two = ClassSection.objects.create(
            section_code='MATH-101-B',
            name='Mathematics 101 B',
            academic_year=self.academic_year,
            subject=self.subject,
            teacher=self.teacher,
            room_number='A2',
            capacity=30,
        )

        ClassSchedule.objects.create(
            class_section=self.class_section,
            room=self.room,
            teacher=self.teacher,
            day_of_week='TUESDAY',
            start_time=time(11, 0),
            end_time=time(12, 0),
            academic_year=self.academic_year,
            term='Term 1',
        )

        conflicting = ClassSchedule(
            class_section=section_two,
            room=Room.objects.create(name='Room A2', room_number='A2', building='Main Block', capacity=35),
            teacher=self.teacher,
            day_of_week='TUESDAY',
            start_time=time(11, 30),
            end_time=time(12, 30),
            academic_year=self.academic_year,
            term='Term 1',
        )

        with self.assertRaises(ValidationError):
            conflicting.full_clean()

    def test_valid_non_overlapping_schedules_are_accepted(self):
        schedule1 = ClassSchedule.objects.create(
            class_section=self.class_section,
            room=self.room,
            teacher=self.teacher,
            day_of_week='MONDAY',
            start_time=time(9, 0),
            end_time=time(10, 0),
            academic_year=self.academic_year,
            term='Term 1',
        )

        schedule2 = ClassSchedule(
            class_section=self.class_section,
            room=self.room,
            teacher=self.teacher,
            day_of_week='MONDAY',
            start_time=time(10, 0),
            end_time=time(11, 0),
            academic_year=self.academic_year,
            term='Term 1',
        )

        schedule2.full_clean()
        schedule2.save()
        self.assertIsNotNone(schedule2.id)

    def test_exam_schedule_conflict_validation(self):
        ExamSchedule.objects.create(
            class_section=self.class_section,
            room=self.room,
            exam_type='MIDTERM',
            exam_date='2025-10-15',
            start_time=time(9, 0),
            end_time=time(11, 0),
            academic_year=self.academic_year,
        )

        conflicting_exam = ExamSchedule(
            class_section=self.class_section,
            room=self.room,
            exam_type='FINAL',
            exam_date='2025-10-15',
            start_time=time(10, 0),
            end_time=time(12, 0),
            academic_year=self.academic_year,
        )

        with self.assertRaises(ValidationError):
            conflicting_exam.full_clean()


class SchedulingPermissionTests(TestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(name=Role.ADMIN)
        self.coordinator_role = Role.objects.create(name=Role.ACADEMIC_COORDINATOR)
        self.teacher_role = Role.objects.create(name=Role.TEACHER)
        self.student_role = Role.objects.create(name=Role.STUDENT)
        self.parent_role = Role.objects.create(name=Role.PARENT)

        self.admin = User.objects.create_user(
            email='admin@ssms.test', username='admin_user', password='StrongPass123'
        )
        self.admin.roles.add(self.admin_role)

        self.coordinator = User.objects.create_user(
            email='coord@ssms.test', username='coord_user', password='StrongPass123'
        )
        self.coordinator.roles.add(self.coordinator_role)

        self.student = User.objects.create_user(
            email='student@ssms.test', username='student_user', password='StrongPass123'
        )
        self.student.roles.add(self.student_role)

        self.parent = User.objects.create_user(
            email='parent@ssms.test', username='parent_user', password='StrongPass123'
        )
        self.parent.roles.add(self.parent_role)

        self.teacher = User.objects.create_user(
            email='teacher@ssms.test', username='teacher_user', password='StrongPass123'
        )
        self.teacher.roles.add(self.teacher_role)

        self.permission = SchedulingAccessPermission()

    def test_admin_can_create_schedule(self):
        request = type('Request', (), {'user': self.admin, 'method': 'POST'})()
        self.assertTrue(self.permission.has_permission(request, None))

    def test_coordinator_can_create_schedule(self):
        request = type('Request', (), {'user': self.coordinator, 'method': 'POST'})()
        self.assertTrue(self.permission.has_permission(request, None))

    def test_student_cannot_create_schedule(self):
        request = type('Request', (), {'user': self.student, 'method': 'POST'})()
        self.assertFalse(self.permission.has_permission(request, None))

    def test_parent_cannot_create_schedule(self):
        request = type('Request', (), {'user': self.parent, 'method': 'POST'})()
        self.assertFalse(self.permission.has_permission(request, None))

    def test_teacher_cannot_create_schedule(self):
        request = type('Request', (), {'user': self.teacher, 'method': 'POST'})()
        self.assertFalse(self.permission.has_permission(request, None))

    def test_student_can_read_schedule(self):
        request = type('Request', (), {'user': self.student, 'method': 'GET'})()
        self.assertTrue(self.permission.has_permission(request, None))

    def test_parent_can_read_schedule(self):
        request = type('Request', (), {'user': self.parent, 'method': 'GET'})()
        self.assertTrue(self.permission.has_permission(request, None))


class SchedulingAdvancedTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()

        self.admin_role = Role.objects.create(name=Role.ADMIN)
        self.teacher_role = Role.objects.create(name=Role.TEACHER)

        self.admin = User.objects.create_user(
            email='admin_adv@ssms.test', username='admin_adv', password='StrongPass123', is_staff=True
        )
        self.admin.roles.add(self.admin_role)

        self.teacher = User.objects.create_user(
            email='teacher_adv@ssms.test', username='teacher_adv', password='StrongPass123'
        )
        self.teacher.roles.add(self.teacher_role)

        self.staff_user = User.objects.create_user(
            email='staff_only@ssms.test', username='staff_only', password='StrongPass123', is_staff=True
        )

        self.academic_year1 = AcademicYear.objects.create(
            name='2025/2026', start_date='2025-09-01', end_date='2026-06-30', is_active=True
        )
        self.academic_year2 = AcademicYear.objects.create(
            name='2026/2027', start_date='2026-09-01', end_date='2027-06-30', is_active=False
        )

        self.subject = Subject.objects.create(
            code='PHY101', name='Physics', description='Physics 101', credit_hours=3, department='Science'
        )

        self.room1 = Room.objects.create(name='Lab 1', room_number='L1', building='Science Block', capacity=25)
        self.room2 = Room.objects.create(name='Lab 2', room_number='L2', building='Science Block', capacity=30)

        self.section1 = ClassSection.objects.create(
            section_code='PHY-A', name='Physics A', academic_year=self.academic_year1,
            subject=self.subject, teacher=self.teacher, room_number='L1', capacity=25
        )
        self.section2 = ClassSection.objects.create(
            section_code='PHY-B', name='Physics B', academic_year=self.academic_year1,
            subject=self.subject, teacher=self.teacher, room_number='L2', capacity=25
        )

    def test_conflict_scoped_by_term(self):
        # Schedule in Term 1
        ClassSchedule.objects.create(
            class_section=self.section1,
            room=self.room1,
            teacher=self.teacher,
            day_of_week='MONDAY',
            start_time=time(14, 0),
            end_time=time(15, 0),
            academic_year=self.academic_year1,
            term='Term 1',
        )

        # Same room and time, but in Term 2 - should be allowed!
        term2_schedule = ClassSchedule(
            class_section=self.section1,
            room=self.room1,
            teacher=self.teacher,
            day_of_week='MONDAY',
            start_time=time(14, 0),
            end_time=time(15, 0),
            academic_year=self.academic_year1,
            term='Term 2',
        )
        term2_schedule.full_clean()
        term2_schedule.save()
        self.assertIsNotNone(term2_schedule.id)

    def test_exam_section_overlap_in_different_rooms_rejected(self):
        ExamSchedule.objects.create(
            class_section=self.section1,
            room=self.room1,
            exam_type='MIDTERM',
            exam_date='2025-11-20',
            start_time=time(10, 0),
            end_time=time(12, 0),
            academic_year=self.academic_year1,
        )

        # Same section, same date/time, but room 2 - must be rejected because students can't be in 2 places
        double_booked_section = ExamSchedule(
            class_section=self.section1,
            room=self.room2,
            exam_type='FINAL',
            exam_date='2025-11-20',
            start_time=time(10, 30),
            end_time=time(12, 30),
            academic_year=self.academic_year1,
        )
        with self.assertRaises(ValidationError):
            double_booked_section.full_clean()

    def test_room_deletion_with_active_schedule_returns_400(self):
        ClassSchedule.objects.create(
            class_section=self.section1,
            room=self.room1,
            teacher=self.teacher,
            day_of_week='WEDNESDAY',
            start_time=time(9, 0),
            end_time=time(10, 0),
            academic_year=self.academic_year1,
            term='Term 1',
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/scheduling/rooms/{self.room1.id}/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('Cannot delete room', response.data.get('error', ''))

    def test_staff_user_can_access_full_schedule_list(self):
        ClassSchedule.objects.create(
            class_section=self.section1,
            room=self.room1,
            teacher=self.teacher,
            day_of_week='THURSDAY',
            start_time=time(8, 0),
            end_time=time(9, 0),
            academic_year=self.academic_year1,
            term='Term 1',
        )

        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get('/api/scheduling/class-schedules/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data.get('results', [])), 1)

    def test_room_capacity_positive_validation(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/scheduling/rooms/', {
            'name': 'Negative Room',
            'room_number': 'NEG-1',
            'building': 'Block C',
            'capacity': -5,
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('capacity', response.data)

