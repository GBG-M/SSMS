from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.views import View
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import User, Role
from .signals import provision_student_account


class LoginView(View):
    """Custom Login View verifying TOTP and Forced Password Resets."""
    template_name = 'accounts/login.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            # Check mandatory password reset
            if user.must_reset_password:
                request.session['pre_auth_user_id'] = str(user.id)
                return redirect('accounts:force_password_reset')
            
            # Check mandatory TOTP for sensitive roles
            if user.requires_totp:
                if not user.totp_enabled:
                    request.session['pre_auth_user_id'] = str(user.id)
                    return redirect('accounts:setup_totp')
                else:
                    request.session['pre_auth_user_id'] = str(user.id)
                    return redirect('accounts:verify_totp')

            login(request, user)
            return redirect('dashboard')
        
        return render(request, self.template_name, {'error': 'Invalid email or password.'})


class ForcePasswordResetView(View):
    """Enforces mandatory password reset on first login."""
    template_name = 'accounts/password_reset.html'

    def get(self, request):
        if 'pre_auth_user_id' not in request.session:
            return redirect('accounts:login')
        return render(request, self.template_name)

    def post(self, request):
        user_id = request.session.get('pre_auth_user_id')
        user = User.objects.filter(id=user_id).first()
        new_password = request.POST.get('new_password')

        if user and new_password:
            user.set_password(new_password)
            user.must_reset_password = False
            user.save()
            
            # Log in the user after password update
            login(request, user)
            del request.session['pre_auth_user_id']
            return redirect('dashboard')

        return render(request, self.template_name, {'error': 'Failed to update password.'})


class ProvisionStudentAccountAPIView(APIView):
    """
    API endpoint for triggers from Module 5.2 (Enrollment)
    to provision portal accounts automatically.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Enforce Coordinator or Admin role permission
        if not request.user.roles.filter(name__in=[Role.ADMIN, Role.ACADEMIC_COORDINATOR]).exists():
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        parent_email = data.get('parent_email')
        parent_phone = data.get('parent_phone')

        if not parent_email:
            return Response({'error': 'Parent email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_profile, parent_profile = provision_student_account(
                student_data=data.get('student', {}),
                parent_email=parent_email,
                parent_phone=parent_phone,
                campus_code=data.get('campus_code', 'MAIN')
            )

            return Response({
                'message': 'Account provisioned successfully.',
                'student_id': student_profile.student_id,
                'student_email': student_profile.user.email,
                'parent_email': parent_profile.user.email,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect('accounts:login')
