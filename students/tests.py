from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Role, ParentProfile
from students.models import Student, Attendance, AcademicRecord
from datetime import date


class StudentAPITests(APITestCase):

    def setUp(self):
        # 1. Admin user
        self.admin_role, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='Password123!',
            is_staff=True,
            must_reset_password=False
        )
        self.admin_user.roles.add(self.admin_role)

        # 2. Teacher user
        self.teacher_role, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.staff_user = User.objects.create_user(
            email='teacher@example.com',
            username='teacher',
            password='Password123!',
            first_name='John',
            last_name='Teacher',
            must_reset_password=False
        )
        self.staff_user.roles.add(self.teacher_role)

        # 3. Student user
        self.student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
        self.student_user = User.objects.create_user(
            email='student@example.com',
            username='student1',
            password='Password123!',
            must_reset_password=False
        )
        self.student_user.roles.add(self.student_role)

        # 4. Parent user
        self.parent_role, _ = Role.objects.get_or_create(name=Role.PARENT)
        self.parent_user = User.objects.create_user(
            email='parent@example.com',
            username='parent1',
            password='Password123!',
            must_reset_password=False
        )
        self.parent_user.roles.add(self.parent_role)

        # Create sample student bound to student_user
        self.student = Student.objects.create(
            user=self.student_user,
            student_id='STU000001',
            first_name='Alice',
            last_name='Smith',
            date_of_birth=date(2008, 5, 15),
            gender='FEMALE',
            email='alice@example.com',
            phone_number='1234567890',
            address='123 School Lane',
            emergency_contact_name='Bob Smith',
            emergency_contact_phone='0987654321',
            current_grade='10',
            current_class='Science A',
            academic_year='2026',
            guardian_name='Bob Smith',
            guardian_relationship='Father',
            guardian_phone='0987654321',
            status='ACTIVE'
        )

        # Link student to parent
        self.parent_profile, _ = ParentProfile.objects.get_or_create(user=self.parent_user)
        self.parent_profile.students.add(self.student)

        # Default auth as teacher
        self.client.force_authenticate(user=self.staff_user)

        self.students_url = reverse('students-api:student-list')
        self.student_detail_url = reverse('students-api:student-detail', kwargs={'pk': self.student.pk})
        self.statistics_url = reverse('students-api:student-statistics')

    def test_list_students_as_teacher(self):
        response = self.client.get(self.students_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_create_student_via_api_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'student_id': 'STU000002',
            'first_name': 'Michael',
            'last_name': 'Brown',
            'date_of_birth': '2009-02-20',
            'gender': 'MALE',
            'email': 'michael.brown@example.com',
            'phone_number': '5551234567',
            'address': '456 Elm St',
            'emergency_contact_name': 'Sarah Brown',
            'emergency_contact_phone': '5557654321',
            'current_grade': '9',
            'current_class': 'Class 9B',
            'academic_year': '2026',
            'guardian_name': 'Sarah Brown',
            'guardian_relationship': 'Mother',
            'guardian_phone': '5557654321',
            'status': 'ACTIVE'
        }
        response = self.client.post(self.students_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student_id'], 'STU000002')

    def test_student_and_parent_cannot_create_or_delete_student(self):
        # 1. Student cannot create new students
        self.client.force_authenticate(user=self.student_user)
        payload = {
            'student_id': 'STU000099',
            'first_name': 'Hacker',
            'last_name': 'Student',
            'date_of_birth': '2009-01-01',
            'gender': 'MALE',
            'email': 'hacker@example.com',
            'phone_number': '1112223333',
            'address': 'Nowhere',
            'emergency_contact_name': 'Parent',
            'emergency_contact_phone': '1112223333',
            'current_grade': '10',
            'current_class': 'Class 10',
            'academic_year': '2026',
            'guardian_name': 'Guardian',
            'guardian_relationship': 'Parent',
            'guardian_phone': '1112223333',
            'status': 'ACTIVE'
        }
        res = self.client.post(self.students_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Student cannot delete student records
        del_res = self.client.delete(self.student_detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Parent cannot delete student records
        self.client.force_authenticate(user=self.parent_user)
        parent_del_res = self.client.delete(self.student_detail_url)
        self.assertEqual(parent_del_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_mark_attendance_as_teacher_and_duplicate_prevention(self):
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('students-api:student-mark-attendance', kwargs={'pk': self.student.pk})
        
        # 1. Teacher marks attendance for today
        response = self.client.post(url, {
            'student': self.student.pk,
            'status': 'PRESENT',
            'recorded_by': self.staff_user.pk
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Duplicate attendance on same day is rejected
        duplicate_res = self.client.post(url, {'status': 'LATE'}, format='json')
        self.assertEqual(duplicate_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', duplicate_res.data)

        # 3. Student attempting to mark attendance is blocked (403)
        self.client.force_authenticate(user=self.student_user)
        student_mark_res = self.client.post(url, {'status': 'PRESENT'}, format='json')
        self.assertEqual(student_mark_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_academic_record_as_teacher(self):
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('students-api:student-add-academic-record', kwargs={'pk': self.student.pk})
        payload = {
            'student': self.student.pk,
            'term': 'Term 1',
            'academic_year': '2026',
            'subjects': {'Mathematics': 92, 'Physics': 88, 'English': 95},
            'gpa': 3.85,
            'percentage': 91.67,
            'remarks': 'Excellent progress'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['term'], 'Term 1')
        
        # Student viewing their own academic record -> Allowed
        self.client.force_authenticate(user=self.student_user)
        records_url = reverse('students-api:student-academic-records', kwargs={'pk': self.student.pk})
        get_res = self.client.get(records_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data), 1)

    def test_student_statistics(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.statistics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', response.data)
        self.assertIn('active_students', response.data)
        self.assertGreaterEqual(response.data['total_students'], 1)
