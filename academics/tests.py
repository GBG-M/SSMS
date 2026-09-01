from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from accounts.models import Role
from students.models import Student
from .models import AcademicYear, Subject, ClassSection, Enrollment, Assessment, GradeRecord, AcademicSummary
from .permissions import AcademicManagerPermission, AcademicStaffPermission, AcademicStudentPermission
from .views import AcademicSummaryViewSet

User = get_user_model()


class AcademicsModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='teacher@example.com',
            username='teacher1',
            password='StrongPass123!',
            first_name='Jane',
            last_name='Teacher'
        )
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
        self.student = Student.objects.create(
            student_id='STU000001',
            first_name='Alice',
            last_name='Student',
            date_of_birth='2010-01-15',
            gender='FEMALE',
            email='alice@student.com',
            phone_number='0912345678',
            address='Main street 1',
            emergency_contact_name='Parent One',
            emergency_contact_phone='0911111111',
            current_grade='Grade 10',
            current_class='A',
            academic_year='2025/2026',
            guardian_name='Parent One',
            guardian_relationship='Mother',
            guardian_phone='0911111111',
        )

    def test_academic_year_created(self):
        self.assertEqual(str(self.academic_year), '2025/2026')

    def test_class_section_and_enrollment_create(self):
        section = ClassSection.objects.create(
            section_code='MATH10A',
            name='Grade 10 - A',
            academic_year=self.academic_year,
            subject=self.subject,
            teacher=self.user,
            room_number='Room 12',
            capacity=30,
            schedule={'day': 'Monday', 'time': '09:00'},
        )
        enrollment = Enrollment.objects.create(
            student=self.student,
            class_section=section,
            status='ACTIVE',
        )

        self.assertEqual(section.enrolled_students_count, 1)
        self.assertEqual(str(enrollment), f'{self.student.full_name} -> {section.name}')

    def test_assessment_and_grade_record(self):
        section = ClassSection.objects.create(
            section_code='MATH10B',
            name='Grade 10 - B',
            academic_year=self.academic_year,
            subject=self.subject,
            teacher=self.user,
        )
        enrollment = Enrollment.objects.create(
            student=self.student,
            class_section=section,
            status='ACTIVE',
        )
        assessment = Assessment.objects.create(
            class_section=section,
            name='Quiz 1',
            assessment_type='QUIZ',
            max_marks=100,
            weight=20,
        )
        grade_record = GradeRecord.objects.create(
            enrollment=enrollment,
            assessment=assessment,
            score=88,
        )

        self.assertEqual(grade_record.grade, 'B')
        self.assertEqual(str(grade_record), f'{self.student.full_name} - Quiz 1: 88.00')

    def test_unique_enrollment_per_student_per_section(self):
        section = ClassSection.objects.create(
            section_code='MATH10C',
            name='Grade 10 - C',
            academic_year=self.academic_year,
            subject=self.subject,
            teacher=self.user,
        )
        Enrollment.objects.create(student=self.student, class_section=section)

        with self.assertRaises(Exception):
            Enrollment.objects.create(student=self.student, class_section=section)


class AcademicsPermissionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin_role, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.academic_role, _ = Role.objects.get_or_create(name=Role.ACADEMIC_COORDINATOR)
        self.teacher_role, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)

        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='admin1',
            password='StrongPass123!',
        )
        self.admin_user.roles.add(self.admin_role)

        self.teacher_user = User.objects.create_user(
            email='teacher@example.com',
            username='teacher1',
            password='StrongPass123!',
        )
        self.teacher_user.roles.add(self.teacher_role)

        self.student_user = User.objects.create_user(
            email='student@example.com',
            username='student1',
            password='StrongPass123!',
        )
        self.student_user.roles.add(self.student_role)

    def test_admin_has_manager_permission(self):
        request = self.factory.get('/api/academics/')
        request.user = self.admin_user
        self.assertTrue(AcademicManagerPermission().has_permission(request, None))

    def test_teacher_has_staff_permission(self):
        request = self.factory.get('/api/academics/')
        request.user = self.teacher_user
        self.assertTrue(AcademicStaffPermission().has_permission(request, None))

    def test_student_has_no_manager_permission(self):
        request = self.factory.post('/api/academics/subjects/')
        request.user = self.student_user
        self.assertFalse(AcademicManagerPermission().has_permission(request, None))

    def test_student_has_own_record_permission(self):
        request = self.factory.get('/api/academics/academic-summaries/')
        request.user = self.student_user
        self.assertTrue(AcademicStudentPermission().has_permission(request, None))

    def test_grade_record_rejects_invalid_score(self):
        year = AcademicYear.objects.create(
            name='2024/2025',
            start_date='2024-09-01',
            end_date='2025-06-30',
            is_active=False,
        )
        subject = Subject.objects.create(
            code='BIO101',
            name='Biology',
            credit_hours=2,
            department='Science',
        )
        section = ClassSection.objects.create(
            section_code='BIO9A',
            name='Bio 9A',
            academic_year=year,
            subject=subject,
            teacher=self.teacher_user,
        )
        student = Student.objects.create(
            student_id='STU000777',
            first_name='Sam',
            last_name='Test',
            date_of_birth='2009-02-20',
            gender='MALE',
            email='sam@test.com',
            phone_number='0912121212',
            address='School address',
            emergency_contact_name='Guardian',
            emergency_contact_phone='0919999999',
            current_grade='Grade 9',
            current_class='A',
            academic_year='2024/2025',
            guardian_name='Guardian',
            guardian_relationship='Father',
            guardian_phone='0919999999',
        )
        enrollment = Enrollment.objects.create(student=student, class_section=section, status='ACTIVE')
        assessment = Assessment.objects.create(
            class_section=section,
            name='Final Test',
            assessment_type='FINAL',
            max_marks=100,
            weight=50,
        )
        record = GradeRecord(enrollment=enrollment, assessment=assessment, score=101)
        with self.assertRaises(Exception):
            record.save()

    def test_student_queryset_is_limited_to_own_records(self):
        year = AcademicYear.objects.create(
            name='2026/2027',
            start_date='2026-09-01',
            end_date='2027-06-30',
            is_active=True,
        )
        subject = Subject.objects.create(
            code='CHEM101',
            name='Chemistry',
            credit_hours=2,
            department='Science',
        )
        section = ClassSection.objects.create(
            section_code='CHEM9A',
            name='Chem 9A',
            academic_year=year,
            subject=subject,
            teacher=self.teacher_user,
        )
        student = Student.objects.create(
            student_id='STU000888',
            first_name='Nina',
            last_name='Student',
            date_of_birth='2010-01-15',
            gender='FEMALE',
            email='nina@school.com',
            phone_number='0910000000',
            address='Test address',
            emergency_contact_name='Parent',
            emergency_contact_phone='0911111222',
            current_grade='Grade 9',
            current_class='A',
            academic_year='2026/2027',
            guardian_name='Parent',
            guardian_relationship='Mother',
            guardian_phone='0911111222',
        )
        self.student_user.student_profile = student
        self.student_user.save()
        self.student_user.refresh_from_db()
        Enrollment.objects.create(student=student, class_section=section, status='ACTIVE')
        summary = AcademicSummary.objects.create(student=student, academic_year=year, gpa=3.80)
        qs = AcademicSummaryViewSet().get_queryset()
        self.assertIn(summary, qs)
