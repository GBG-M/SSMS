from datetime import time

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from academics.models import AcademicYear, Subject, ClassSection, Enrollment
from accounts.models import Role
from students.models import Student
from .models import Room, ClassSchedule, ExamSchedule

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
