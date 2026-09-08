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
        self.assertIn('student_temporary_password', response.data)
        self.assertIn('parent_temporary_password', response.data)
        self.assertFalse(response.data['parent_is_existing'])
        
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

    def test_provision_student_sibling_reuses_parent_account(self):
        self.client.force_authenticate(user=self.user)
        # Provision first child
        payload1 = {
            'student': {
                'student_id': '2026-MAIN-00201',
                'first_name': 'Alice',
                'last_name': 'Smith',
                'email': 'alice.smith@example.com',
                'current_grade': '9',
                'program': 'Science',
            },
            'parent_email': 'parent.smith@example.com',
            'parent_phone': '+1234567890',
            'parent_first_name': 'Robert',
            'parent_last_name': 'Smith',
            'relationship': 'Father',
            'campus_code': 'MAIN'
        }
        res1 = self.client.post(self.provision_url, payload1, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res1.data['parent_is_existing'])

        # Provision second child (sibling) with same parent email
        payload2 = {
            'student': {
                'student_id': '2026-MAIN-00202',
                'first_name': 'Bob',
                'last_name': 'Smith',
                'email': 'bob.smith@example.com',
                'current_grade': '11',
                'program': 'Arts',
            },
            'parent_email': 'parent.smith@example.com',
            'parent_phone': '+1234567890',
            'parent_first_name': 'Robert',
            'parent_last_name': 'Smith',
            'relationship': 'Father',
            'campus_code': 'MAIN'
        }
        res2 = self.client.post(self.provision_url, payload2, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res2.data['parent_is_existing'])
        self.assertIsNone(res2.data['parent_temporary_password'])

        # Verify parent profile now has BOTH children linked
        parent_user = User.objects.get(email='parent.smith@example.com')
        linked_ids = set(parent_user.parent_profile.students.values_list('student_id', flat=True))
        self.assertIn('2026-MAIN-00201', linked_ids)
        self.assertIn('2026-MAIN-00202', linked_ids)

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
        self.assertIn('role_names', reset_res.data)
        
        # Verify user password updated and flag cleared
        temp_user.refresh_from_db()
        self.assertFalse(temp_user.must_reset_password)
        self.assertTrue(temp_user.check_password('BrandNewPassword123!'))

        # Test direct email resolution flow when user navigates directly without pre_auth token
        temp_user2 = User.objects.create_user(
            email='directuser@example.com',
            username='directuser',
            password='InitialPassword123!',
            must_reset_password=True
        )
        email_reset_res = self.client.post(self.force_reset_url, {
            'pre_auth_user_id': 'directuser@example.com',
            'new_password': 'DirectNewPassword123!',
            'confirm_password': 'DirectNewPassword123!'
        }, format='json')
        self.assertEqual(email_reset_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', email_reset_res.data)
        temp_user2.refresh_from_db()
        self.assertFalse(temp_user2.must_reset_password)
        self.assertTrue(temp_user2.check_password('DirectNewPassword123!'))


class AdminUserRegistrationTests(APITestCase):

    def setUp(self):
        # Create an Admin user (is_staff=True)
        self.admin = User.objects.create_user(
            email='admin@ssms.edu',
            username='admin_test',
            password='AdminPassword123!',
            is_staff=True,
            is_superuser=True
        )
        self.role_admin, _ = Role.objects.get_or_create(name=Role.ADMIN)
        self.admin.roles.add(self.role_admin)

        # Create a non-admin user (Teacher)
        self.teacher = User.objects.create_user(
            email='teacher@ssms.edu',
            username='teacher_test',
            password='TeacherPassword123!',
            is_staff=False
        )
        self.role_teacher, _ = Role.objects.get_or_create(name=Role.TEACHER)
        self.teacher.roles.add(self.role_teacher)

        self.users_url = reverse('accounts-api:api_user_list')

    def test_admin_can_register_new_teacher(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'email': 'new.teacher@ssms.edu',
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'role_names': ['teacher'],
        }
        response = self.client.post(self.users_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('temporary_password', response.data)
        temp_pass = response.data['temporary_password']
        self.assertTrue(len(temp_pass) >= 12)
        self.assertTrue(response.data['must_reset_password'])

        # Verify created user in DB
        new_user = User.objects.filter(email='new.teacher@ssms.edu').first()
        self.assertIsNotNone(new_user)
        self.assertEqual(new_user.first_name, 'Sarah')
        self.assertEqual(new_user.last_name, 'Jenkins')
        self.assertTrue(new_user.is_staff)
        self.assertTrue(new_user.must_reset_password)
        self.assertTrue(new_user.roles.filter(name='teacher').exists())
        self.assertTrue(new_user.check_password(temp_pass))

    def test_admin_can_register_with_custom_password(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'email': 'coordinator2@ssms.edu',
            'first_name': 'David',
            'last_name': 'Miller',
            'password': 'CustomSecret999!',
            'role_names': ['academic_coordinator'],
            'must_reset_password': True
        }
        response = self.client.post(self.users_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['temporary_password'], 'CustomSecret999!')

        new_user = User.objects.filter(email='coordinator2@ssms.edu').first()
        self.assertIsNotNone(new_user)
        self.assertTrue(new_user.check_password('CustomSecret999!'))
        self.assertTrue(new_user.roles.filter(name='academic_coordinator').exists())

    def test_non_admin_cannot_register_user(self):
        self.client.force_authenticate(user=self.teacher)
        payload = {
            'email': 'hacker@ssms.edu',
            'first_name': 'Bad',
            'last_name': 'Actor',
            'role_names': ['admin']
        }
        response = self.client.post(self.users_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_email_registration_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'email': 'admin@ssms.edu',
            'first_name': 'Duplicate',
            'last_name': 'Admin',
            'role_names': ['admin']
        }
        response = self.client.post(self.users_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
