from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Role, ParentProfile
from datetime import date
from django.core.files.uploadedfile import SimpleUploadedFile
from students.models import Student, Attendance, AcademicRecord, StudentDocument


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
        self.assertIsNotNone(response.data.get('temporary_password'))
        
        # Verify student user was auto-provisioned
        created_student = Student.objects.get(student_id='STU000002')
        self.assertIsNotNone(created_student.user)
        self.assertEqual(created_student.user.email, 'michael.brown@example.com')
        self.assertTrue(created_student.user.must_reset_password)
        self.assertTrue(created_student.user.roles.filter(name=Role.STUDENT).exists())

    def test_create_student_with_guardian_auto_provisions_both(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'student_id': 'STU000003',
            'first_name': 'David',
            'last_name': 'Lee',
            'date_of_birth': '2008-11-10',
            'gender': 'MALE',
            'email': 'david.lee@example.com',
            'phone_number': '5559998888',
            'address': '789 Oak St',
            'emergency_contact_name': 'Grace Lee',
            'emergency_contact_phone': '5551112222',
            'current_grade': '11',
            'current_class': 'Class 11A',
            'academic_year': '2026',
            'guardian_name': 'Grace Lee',
            'guardian_relationship': 'Mother',
            'guardian_phone': '5551112222',
            'guardian_email': 'grace.lee@example.com',
            'status': 'ACTIVE'
        }
        res = self.client.post(self.students_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(res.data.get('temporary_password'))
        self.assertIsNotNone(res.data.get('parent_temporary_password'))

        student = Student.objects.get(student_id='STU000003')
        self.assertIsNotNone(student.user)
        self.assertEqual(student.user.email, 'david.lee@example.com')

        parent_user = User.objects.filter(email='grace.lee@example.com').first()
        self.assertIsNotNone(parent_user)
        self.assertTrue(parent_user.roles.filter(name=Role.PARENT).exists())
        self.assertTrue(parent_user.parent_profile.students.filter(student_id='STU000003').exists())

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

    def test_student_can_upload_and_delete_own_document(self):
        self.client.force_authenticate(user=self.student_user)
        documents_url = reverse('students-api:document-list')
        dummy_file = SimpleUploadedFile("cert.pdf", b"PDF file content", content_type="application/pdf")
        
        # 1. Upload document for self
        res = self.client.post(documents_url, {
            'student': self.student.pk,
            'title': 'Birth Certificate',
            'document_type': 'BIRTH_CERT',
            'description': 'Official copy',
            'file': dummy_file
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        doc_id = res.data['id']
        self.assertEqual(res.data['title'], 'Birth Certificate')

        # 2. Delete own document
        detail_url = reverse('students-api:document-detail', kwargs={'pk': doc_id})
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StudentDocument.objects.filter(id=doc_id).exists())

    def test_student_cannot_upload_document_for_other_student(self):
        # Create another student
        other_user = User.objects.create_user(
            email='other@example.com',
            username='otherstudent',
            password='Password123!'
        )
        other_student = Student.objects.create(
            user=other_user,
            student_id='STU000099',
            first_name='Other',
            last_name='Student',
            date_of_birth=date(2008, 1, 1),
            gender='MALE',
            email='other@example.com',
            phone_number='1234567899',
            address='123 Road',
            emergency_contact_name='Parent',
            emergency_contact_phone='1234567899',
            current_grade='10',
            current_class='Class 10A',
            academic_year='2026',
            guardian_name='Parent',
            guardian_relationship='Parent',
            guardian_phone='1234567899',
            status='ACTIVE'
        )

        self.client.force_authenticate(user=self.student_user)
        documents_url = reverse('students-api:document-list')
        dummy_file = SimpleUploadedFile("cert2.pdf", b"PDF file content", content_type="application/pdf")

        # Student user attempts to upload document scoped to other_student
        res = self.client.post(documents_url, {
            'student': other_student.pk,
            'title': 'Malicious Doc',
            'document_type': 'OTHER',
            'file': dummy_file
        }, format='multipart')

        # Our backend perform_create automatically scopes student to self.student (request.user.student_profile)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_doc = StudentDocument.objects.get(id=res.data['id'])
        self.assertEqual(created_doc.student.pk, self.student.pk)
        self.assertNotEqual(created_doc.student.pk, other_student.pk)

    def test_attendance_with_custom_date_and_upsert(self):
        self.client.force_authenticate(user=self.staff_user)
        attendance_url = reverse('students-api:attendance-list')
        test_date = '2026-09-01'

        # 1. Mark attendance for past date
        res1 = self.client.post(attendance_url, {
            'student': self.student.pk,
            'date': test_date,
            'status': 'ABSENT',
            'reason': 'Medical checkup'
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['date'], test_date)
        self.assertEqual(res1.data['status'], 'ABSENT')

        # 2. Update attendance on same date (upsert)
        res2 = self.client.post(attendance_url, {
            'student': self.student.pk,
            'date': test_date,
            'status': 'EXCUSED',
            'reason': 'Doctor note provided'
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['date'], test_date)
        self.assertEqual(res2.data['status'], 'EXCUSED')
        self.assertEqual(Attendance.objects.filter(student=self.student, date=test_date).count(), 1)

