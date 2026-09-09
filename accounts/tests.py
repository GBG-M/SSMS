from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, Role, ParentProfile
from students.models import Student
from academics.models import AcademicYear, Subject, ClassSection


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

    def test_parent_profile_contains_children(self):
        # Create parent with student
        parent_user = User.objects.create_user(
            email='mom@example.com',
            username='mom',
            password='Password123!'
        )
        parent_role, _ = Role.objects.get_or_create(name=Role.PARENT)
        parent_user.roles.add(parent_role)
        parent_prof = ParentProfile.objects.create(
            user=parent_user,
            phone_number='+15551234567',
            relationship='Mother'
        )
        child = Student.objects.create(
            student_id='2026-CH-01',
            first_name='Child',
            last_name='Smith',
            date_of_birth='2010-05-15',
            gender='MALE',
            email='child@example.com',
            phone_number='+15551234568',
            address='123 Elm St',
            emergency_contact_name='Mom',
            emergency_contact_phone='+15551234567',
            current_grade='Grade 9',
            current_class='9A',
            academic_year='2025/2026',
            guardian_name='Mom Smith',
            guardian_relationship='Mother',
            guardian_phone='+15551234567',
            status='ACTIVE'
        )
        parent_prof.students.add(child)

        self.client.force_authenticate(user=parent_user)
        profile_url = reverse('accounts-api:api_user_profile')
        res = self.client.get(profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('children', res.data)
        self.assertEqual(len(res.data['children']), 1)
        self.assertEqual(res.data['children'][0]['student_id'], '2026-CH-01')
        self.assertEqual(res.data['children'][0]['first_name'], 'Child')

    def test_teacher_profile_contains_taught_classes(self):
        ay = AcademicYear.objects.create(
            name='2025/2026',
            start_date='2025-09-01',
            end_date='2026-06-30',
            is_active=True
        )
        subj = Subject.objects.create(
            code='MATH101',
            name='Mathematics 101',
            department='Science'
        )
        section = ClassSection.objects.create(
            section_code='SEC-MATH-1',
            name='Math Grade 10A',
            academic_year=ay,
            subject=subj,
            teacher=self.teacher,
            capacity=35,
            is_active=True
        )

        self.client.force_authenticate(user=self.teacher)
        profile_url = reverse('accounts-api:api_user_profile')
        res = self.client.get(profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('taught_classes_summary', res.data)
        self.assertEqual(len(res.data['taught_classes_summary']), 1)
        self.assertEqual(res.data['taught_classes_summary'][0]['section_code'], 'SEC-MATH-1')
        self.assertEqual(res.data['taught_classes_summary'][0]['subject_name'], 'Mathematics 101')


class SecureRegistrationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('accounts-api:api_register')
        self.login_url = reverse('accounts-api:api_login')

    def test_self_register_student_success(self):
        payload = {
            'first_name': 'Alex',
            'last_name': 'Morgan',
            'email': 'alex.morgan@test.edu',
            'password': 'StrongPassword2026!',
            'confirm_password': 'StrongPassword2026!',
            'role': 'student',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'alex.morgan@test.edu')
        self.assertIn('student', response.data['user']['role_names'])

        # Verify created in DB
        user = User.objects.filter(email='alex.morgan@test.edu').first()
        self.assertIsNotNone(user)
        self.assertTrue(user.check_password('StrongPassword2026!'))
        self.assertFalse(user.is_staff)

    def test_self_register_parent_creates_profile(self):
        payload = {
            'first_name': 'Robert',
            'last_name': 'Taylor',
            'email': 'robert.taylor@test.edu',
            'password': 'ParentPass2026!',
            'confirm_password': 'ParentPass2026!',
            'role': 'parent',
            'phone_number': '+15551234567',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.filter(email='robert.taylor@test.edu').first()
        self.assertIsNotNone(user)
        self.assertTrue(user.roles.filter(name='parent').exists())
        self.assertTrue(ParentProfile.objects.filter(user=user).exists())

    def test_self_register_mismatched_passwords(self):
        payload = {
            'first_name': 'Fail',
            'last_name': 'Password',
            'email': 'mismatch@test.edu',
            'password': 'StrongPassword2026!',
            'confirm_password': 'DifferentPassword2026!',
            'role': 'student',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)

    def test_self_register_blocks_admin_privilege_escalation(self):
        payload = {
            'first_name': 'Attacker',
            'last_name': 'User',
            'email': 'fakeadmin@test.edu',
            'password': 'StrongPassword2026!',
            'confirm_password': 'StrongPassword2026!',
            'role': 'admin',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.data)
        self.assertFalse(User.objects.filter(email='fakeadmin@test.edu').exists())

    def test_self_register_blocks_coordinator_escalation(self):
        payload = {
            'first_name': 'Attacker',
            'last_name': 'User',
            'email': 'fakecoord@test.edu',
            'password': 'StrongPassword2026!',
            'confirm_password': 'StrongPassword2026!',
            'role': 'academic_coordinator',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.data)

    def test_self_register_duplicate_email_rejected(self):
        User.objects.create_user(email='existing@test.edu', password='ExistingPassword123!')
        payload = {
            'first_name': 'Another',
            'last_name': 'User',
            'email': 'existing@test.edu',
            'password': 'StrongPassword2026!',
            'confirm_password': 'StrongPassword2026!',
            'role': 'student',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_login_with_username(self):
        u = User.objects.create_user(
            email='uname_test@test.edu',
            username='my_custom_username',
            password='StrongPassword2026!'
        )
        response = self.client.post(self.login_url, {
            'email': 'my_custom_username',
            'password': 'StrongPassword2026!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['email'], 'uname_test@test.edu')

    def test_login_case_insensitive_email(self):
        User.objects.create_user(
            email='case_test@test.edu',
            password='StrongPassword2026!'
        )
        response = self.client.post(self.login_url, {
            'email': 'Case_Test@Test.EDU ',
            'password': 'StrongPassword2026!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_profile_update_blocks_privilege_escalation(self):
        # Create regular student user
        student_user = User.objects.create_user(
            email='student_attacker@test.edu',
            password='Password123!',
            first_name='Innocent',
            last_name='Student',
        )
        role_student, _ = Role.objects.get_or_create(name=Role.STUDENT)
        student_user.roles.add(role_student)
        self.client.force_authenticate(user=student_user)

        profile_url = reverse('accounts-api:api_user_profile')
        # Attempt to escalate role to admin and set is_staff
        response = self.client.patch(profile_url, {
            'role_names': ['admin'],
            'is_staff': True,
            'first_name': 'Hacked',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        student_user.refresh_from_db()
        self.assertFalse(student_user.is_staff)
        role_names = [r.name for r in student_user.roles.all()]
        self.assertNotIn('admin', role_names)
        self.assertIn('student', role_names)
        self.assertEqual(student_user.first_name, 'Hacked')

    def test_role_update_syncs_is_staff(self):
        admin_user = User.objects.create_superuser(
            email='super_admin@test.edu',
            password='SuperPassword123!'
        )
        target_user = User.objects.create_user(
            email='promotee@test.edu',
            password='Password123!'
        )
        self.assertFalse(target_user.is_staff)

        self.client.force_authenticate(user=admin_user)
        role_url = reverse('accounts-api:api_user_roles_update', kwargs={'pk': target_user.pk})

        # Promote to teacher
        resp = self.client.post(role_url, {'role_names': ['teacher']}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        target_user.refresh_from_db()
        self.assertTrue(target_user.is_staff)

        # Demote to student
        resp2 = self.client.post(role_url, {'role_names': ['student']}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        target_user.refresh_from_db()
        self.assertFalse(target_user.is_staff)

    def test_password_reset_request_and_completion(self):
        user = User.objects.create_user(
            email='forgot_test@test.edu',
            password='OldPassword123!'
        )
        forgot_url = reverse('accounts-api:api_forgot_password')
        resp = self.client.post(forgot_url, {'email': 'forgot_test@test.edu'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        from accounts.models import PasswordResetRequest
        reset_req = PasswordResetRequest.objects.filter(user=user, status='pending').first()
        self.assertIsNotNone(reset_req)

        # Complete reset with token
        reset_url = reverse('accounts-api:api_force_password_reset')
        resp_reset = self.client.post(reset_url, {
            'pre_auth_user_id': reset_req.token,
            'new_password': 'BrandNewPassword2026!',
            'confirm_password': 'BrandNewPassword2026!'
        }, format='json')
        self.assertEqual(resp_reset.status_code, status.HTTP_200_OK)

        reset_req.refresh_from_db()
        self.assertEqual(reset_req.status, 'completed')

        # Verify login with new password
        login_resp = self.client.post(self.login_url, {
            'email': 'forgot_test@test.edu',
            'password': 'BrandNewPassword2026!'
        }, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

    def test_user_list_search_and_status_filtering(self):
        admin_user = User.objects.create_superuser(
            email='admin_search@test.edu',
            password='AdminPassword123!'
        )
        User.objects.create_user(
            email='alice.wonderland@test.edu',
            first_name='Alice',
            last_name='Wonderland',
            is_active=True,
            password='Password123!'
        )
        User.objects.create_user(
            email='bob.builder@test.edu',
            first_name='Bob',
            last_name='Builder',
            is_active=False,
            password='Password123!'
        )

        self.client.force_authenticate(user=admin_user)
        list_url = reverse('accounts-api:api_user_list')

        # Search for Alice
        resp_search = self.client.get(f'{list_url}?search=Alice')
        self.assertEqual(resp_search.status_code, status.HTTP_200_OK)
        results = resp_search.data.get('results') or resp_search.data.get('users', [])
        emails = [u['email'] for u in results]
        self.assertIn('alice.wonderland@test.edu', emails)
        self.assertNotIn('bob.builder@test.edu', emails)

        # Filter by inactive status
        resp_status = self.client.get(f'{list_url}?status=inactive')
        self.assertEqual(resp_status.status_code, status.HTTP_200_OK)
        results_inact = resp_status.data.get('results') or resp_status.data.get('users', [])
        inact_emails = [u['email'] for u in results_inact]
        self.assertIn('bob.builder@test.edu', inact_emails)
        self.assertNotIn('alice.wonderland@test.edu', inact_emails)

    def test_delete_only_superuser_blocked(self):
        # Single active superuser in test database
        admin_user = User.objects.create_superuser(
            email='sole_superuser@test.edu',
            password='AdminPassword123!'
        )
        other_admin = User.objects.create_superuser(
            email='acting_admin@test.edu',
            password='AdminPassword123!'
        )
        self.client.force_authenticate(user=other_admin)

        detail_url = reverse('accounts-api:api_user_detail', kwargs={'pk': admin_user.pk})
        # Delete first superuser (now acting_admin is the last remaining)
        del_resp = self.client.delete(detail_url)
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)

        # Attempt to delete the acting_admin self is blocked by self-delete check:
        self_del_url = reverse('accounts-api:api_user_detail', kwargs={'pk': other_admin.pk})
        resp_self = self.client.delete(self_del_url)
        self.assertEqual(resp_self.status_code, status.HTTP_400_BAD_REQUEST)

