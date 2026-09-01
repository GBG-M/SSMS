from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Role
from students.models import Student, Attendance, AcademicRecord
from datetime import date


class StudentAPITests(APITestCase):

    def setUp(self):
        # Create an authorized staff user
        self.staff_user = User.objects.create_user(
            email='teacher@example.com',
            username='teacher',
            password='Password123!',
            first_name='John',
            last_name='Teacher'
        )
        self.teacher_role, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.staff_user.roles.add(self.teacher_role)
        self.staff_user.must_reset_password = False
        self.staff_user.save()
        
        self.client.force_authenticate(user=self.staff_user)
        
        # Create a sample student
        self.student = Student.objects.create(
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
        
        self.students_url = reverse('students-api:student-list')
        self.student_detail_url = reverse('students-api:student-detail', kwargs={'pk': self.student.pk})
        self.statistics_url = reverse('students-api:student-statistics')

    def test_list_students(self):
        response = self.client.get(self.students_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain pagination or results
        results = response.data.get('results') if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)

    def test_create_student_via_api(self):
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

    def test_mark_attendance_and_duplicate_prevention(self):
        url = reverse('students-api:student-mark-attendance', kwargs={'pk': self.student.pk})
        
        # 1. Mark attendance for today
        response = self.client.post(url, {
            'student': self.student.pk,
            'status': 'PRESENT',
            'recorded_by': self.staff_user.pk
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Attempt to mark attendance again on same day -> Should fail
        duplicate_res = self.client.post(url, {'status': 'LATE'}, format='json')
        self.assertEqual(duplicate_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', duplicate_res.data)

    def test_add_academic_record(self):
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
        
        # Retrieve academic records
        records_url = reverse('students-api:student-academic-records', kwargs={'pk': self.student.pk})
        get_res = self.client.get(records_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data), 1)

    def test_student_statistics(self):
        response = self.client.get(self.statistics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', response.data)
        self.assertIn('active_students', response.data)
        self.assertGreaterEqual(response.data['total_students'], 1)
