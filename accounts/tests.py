from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Role, ParentProfile
from students.models import Student


class AccountAPITests(APITestCase):

    def setUp(self):
        # Create a test user with an admin/coordinator role
        self.user = User.objects.create_user(
            email='coordinator@example.com',
            username='coordinator',
            password='Oldpassword123!',
            first_name='Academic',
            last_name='Coordinator',
        )
        self.role_admin, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.user.roles.add(self.role_admin)
        self.user.must_reset_password = False
        self.user.save()
        
        self.login_url = reverse('accounts-api:api_login')
        self.provision_url = reverse('accounts-api:api_provision_student')
        self.force_reset_url = reverse('accounts-api:api_force_password_reset')

    def test_login_success(self):
        response = self.client.post(self.login_url, {
            'email': 'coordinator@example.com',
            'password': 'Oldpassword123!'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['email'], 'coordinator@example.com')

    def test_provision_student_unauthorized(self):
        # Without logging in
        response = self.client.post(self.provision_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_provision_student_success(self):
        # Authenticate coordinator
        self.client.force_authenticate(user=self.user)
        
        payload = {
            'student': {
                'student_id': '2026-MAIN-00101',
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'john.doe@example.com',
                'grade_level': 'Grade 10',
                'current_grade': '10',
                'program': 'Science',
            },
            'parent_email': 'parent.doe@example.com',
            'parent_phone': '+1234567890',
            'parent_first_name': 'Jane',
            'parent_last_name': 'Doe',
            'relationship': 'Mother',
            'campus_code': 'MAIN'
        }
        
        response = self.client.post(self.provision_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student_id'], '2026-MAIN-00101')
        
        # Verify student user was created
        student_user = User.objects.filter(email='john.doe@example.com').first()
        self.assertIsNotNone(student_user)
        self.assertTrue(student_user.roles.filter(name=Role.STUDENT).exists())
        
        # Verify student record in students app was created
        student_record = Student.objects.filter(student_id='2026-MAIN-00101').first()
        self.assertIsNotNone(student_record)
        self.assertEqual(student_record.user, student_user)
        self.assertEqual(student_record.first_name, 'John')
        
        # Verify parent user and profile was created & linked
        parent_user = User.objects.filter(email='parent.doe@example.com').first()
        self.assertIsNotNone(parent_user)
        parent_profile = ParentProfile.objects.filter(user=parent_user).first()
        self.assertIsNotNone(parent_profile)
        self.assertTrue(parent_profile.students.filter(student_id='2026-MAIN-00101').exists())

    def test_force_password_reset_flow(self):
        # Create a user with must_reset_password=True
        temp_user = User.objects.create_user(
            email='newuser@example.com',
            username='newuser',
            password='InitialPassword123!',
            must_reset_password=True
        )
        
        # Attempt login -> Should receive password_reset_required
        login_res = self.client.post(self.login_url, {
            'email': 'newuser@example.com',
            'password': 'InitialPassword123!'
        }, format='json')
        
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data.get('status'), 'password_reset_required')
        pre_auth_id = login_res.data.get('pre_auth_user_id')
        self.assertIsNotNone(pre_auth_id)
        
        # Submit new password
        reset_res = self.client.post(self.force_reset_url, {
            'pre_auth_user_id': pre_auth_id,
            'new_password': 'BrandNewPassword123!',
            'confirm_password': 'BrandNewPassword123!'
        }, format='json')
        
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', reset_res.data)
        
        # Verify user password updated and flag cleared
        temp_user.refresh_from_db()
        self.assertFalse(temp_user.must_reset_password)
        self.assertTrue(temp_user.check_password('BrandNewPassword123!'))
