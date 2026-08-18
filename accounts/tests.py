from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User, Role

class AccountAPITests(APITestCase):

    def setUp(self):
        # Create a test user with an admin/coordinator role
        self.user = User.objects.create_user(
            email='coordinator@example.com',
            password='oldpassword123'
        )
        self.role_admin = Role.objects.create(name=Role.ADMIN)
        self.user.roles.add(self.role_admin)
        
        self.login_url = reverse('accounts-api:api_login')
        self.provision_url = reverse('accounts-api:api_provision_student')

    def test_login_success(self):
        response = self.client.post(self.login_url, {
            'email': 'coordinator@example.com',
            'password': 'oldpassword123'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_provision_student_unauthorized(self):
        # Without logging in
        response = self.client.post(self.provision_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
