# accounts/views.py
import uuid
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User, Role, PasswordResetRequest, LoginHistory
from .serializers import (
    LoginSerializer, 
    PasswordResetSerializer, 
    UserSerializer, 
    ChangePasswordSerializer,
    RoleSerializer,
    UserRoleUpdateSerializer
)
from .signals import provision_student_account

User = get_user_model()


def get_client_ip(request):
    """Utility to extract client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip or '127.0.0.1'


@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    """
    API equivalent of LoginView verifying TOTP and Forced Password Resets.
    Logs attempts in LoginHistory.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        client_ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            # Record successful login history
            LoginHistory.objects.create(
                user=user,
                ip_address=client_ip,
                user_agent=user_agent,
                is_successful=True
            )

            # Check mandatory password reset
            if hasattr(user, 'must_reset_password') and user.must_reset_password:
                cache.set(f'pre_auth_user_{user.id}', str(user.id), timeout=300)  # 5 minutes expiry
                return Response({
                    'status': 'password_reset_required',
                    'message': 'Mandatory password reset required before login.',
                    'pre_auth_user_id': str(user.id)
                }, status=status.HTTP_200_OK)
            
            # Check mandatory TOTP for sensitive roles
            if hasattr(user, 'requires_totp') and user.requires_totp:
                if not user.totp_enabled:
                    return Response({
                        'status': 'totp_setup_required',
                        'message': 'TOTP setup required.',
                        'pre_auth_user_id': str(user.id)
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'status': 'totp_verification_required',
                        'message': 'TOTP verification required.',
                        'pre_auth_user_id': str(user.id)
                    }, status=status.HTTP_200_OK)

            # Issue auth token
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Login successful.',
                'token': token.key,
                'email': user.email,
                'user_id': user.id,
                'username': user.username if hasattr(user, 'username') else email,
            }, status=status.HTTP_200_OK)
        
        # Record failed login if user exists
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            LoginHistory.objects.create(
                user=existing_user,
                ip_address=client_ip,
                user_agent=user_agent,
                is_successful=False
            )
        
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutAPIView(APIView):
    """
    API endpoint to log out and destroy token/session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Update logout timestamp on latest history record
        latest_history = LoginHistory.objects.filter(
            user=request.user, 
            logout_time__isnull=True
        ).order_by('-login_time').first()
        if latest_history:
            latest_history.logout_time = timezone.now()
            latest_history.save(update_fields=['logout_time'])

        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        
        logout(request)
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class ForcePasswordResetAPIView(APIView):
    """
    API for enforcing mandatory password reset on first login or admin reset.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_id = serializer.validated_data.get('pre_auth_user_id')
        new_password = serializer.validated_data.get('new_password')
        
        # Check cache for valid pre-auth session
        cached_user_id = cache.get(f'pre_auth_user_{user_id}')
        if not cached_user_id:
            # Fallback: check if valid user UUID directly
            try:
                user = User.objects.get(id=user_id)
                if not user.must_reset_password:
                    return Response(
                        {'error': 'Invalid or expired pre-auth session. Please login again.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception:
                return Response(
                    {'error': 'Invalid or expired pre-auth session. Please login again.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user.set_password(new_password)
            user.must_reset_password = False
            user.save()
            
            # Clear pre-auth cache
            cache.delete(f'pre_auth_user_{user_id}')
            
            # Authenticate and issue token
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'message': 'Password updated successfully.',
                'token': token.key,
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update password: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ForgotPasswordAPIView(APIView):
    """
    Public self-service password reset request endpoint.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user:
            # Create a tracked password reset request record
            token = uuid.uuid4().hex
            expires_at = timezone.now() + timezone.timedelta(hours=24)
            PasswordResetRequest.objects.create(
                user=user,
                token=token,
                expires_at=expires_at,
                status='pending'
            )
            # Store pre-auth user ID in cache for quick reset
            cache.set(f'pre_auth_user_{user.id}', str(user.id), timeout=86400)

            try:
                send_mail(
                    subject="SSMS - Password Reset Instructions",
                    message=f"Hello {user.full_name or user.username},\n\nA password reset request was initiated for your SSMS account.\n\nReset Token: {token}\n\nIf you did not request this, please contact your administrator.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True
                )
            except Exception:
                pass

        # Return generic secure response
        return Response({
            'message': 'If an account exists with this email, password reset instructions have been dispatched.'
        }, status=status.HTTP_200_OK)


class ProvisionStudentAccountAPIView(APIView):
    """
    API endpoint for triggers from Module 5.2 (Enrollment)
    to provision portal accounts automatically.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_roles = request.user.roles.all() if hasattr(request.user, 'roles') else []
        allowed_roles = [Role.ADMIN, Role.ACADEMIC_COORDINATOR]
        
        if not (request.user.is_staff or request.user.is_superuser or any(role.name in allowed_roles for role in user_roles)):
            return Response(
                {'error': 'Unauthorized. Admin or Academic Coordinator role required.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        student_data = data.get('student', {})
        parent_email = data.get('parent_email')
        parent_phone = data.get('parent_phone')

        if not parent_email:
            return Response(
                {'error': 'Parent email is required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student, parent_profile = provision_student_account(
                student_data=student_data,
                parent_email=parent_email,
                parent_phone=parent_phone,
                campus_code=data.get('campus_code', 'MAIN')
            )

            return Response({
                'message': 'Account provisioned successfully.',
                'student_id': student.student_id,
                'student_email': student.email,
                'parent_email': parent_profile.user.email,
            }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to provision account: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    Get or update own profile
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Profile updated successfully.',
            'user': serializer.data
        })


class UserListAPIView(generics.ListCreateAPIView):
    """
    List all users or create a new user (Admin only)
    """
    queryset = User.objects.all().prefetch_related('roles')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'users': serializer.data
        })
        

class UserDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a user (Admin only)
    """
    queryset = User.objects.all().prefetch_related('roles')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(
            {'message': f'User {instance.email} deleted successfully.'},
            status=status.HTTP_200_OK
        )


class RoleListAPIView(generics.ListAPIView):
    """
    List all available system roles
    """
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


class UserRoleUpdateAPIView(APIView):
    """
    Assign/update roles for a specific user (Admin only)
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserRoleUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        role_names = serializer.validated_data['role_names']
        
        user.roles.clear()
        for r_name in role_names:
            role_obj, _ = Role.objects.get_or_create(name=r_name.lower())
            user.roles.add(role_obj)
        user.save()

        return Response({
            'message': f'Roles updated successfully for {user.email}.',
            'role_names': [r.name for r in user.roles.all()]
        }, status=status.HTTP_200_OK)


class AdminForcePasswordResetAPIView(APIView):
    """
    Admin triggers mandatory password reset for a target user
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.must_reset_password = True
        user.save(update_fields=['must_reset_password'])

        return Response({
            'message': f'Mandatory password reset enabled for {user.email}. User must set a new password on next login.'
        }, status=status.HTTP_200_OK)


class LoginHistoryAPIView(generics.ListAPIView):
    """
    List login history for audit trail (Admin only or own history)
    """
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        user = request.user
        pk = kwargs.get('pk')
        
        if pk and (user.is_staff or user.is_superuser):
            history_qs = LoginHistory.objects.filter(user_id=pk).select_related('user').order_by('-login_time')[:50]
        elif user.is_staff or user.is_superuser:
            history_qs = LoginHistory.objects.all().select_related('user').order_by('-login_time')[:100]
        else:
            history_qs = LoginHistory.objects.filter(user=user).select_related('user').order_by('-login_time')[:20]

        data = [{
            'id': str(h.id),
            'user_email': h.user.email if h.user else 'Unknown',
            'ip_address': h.ip_address,
            'user_agent': h.user_agent,
            'login_time': h.login_time,
            'logout_time': h.logout_time,
            'is_successful': h.is_successful,
        } for h in history_qs]

        return Response(data)


class ChangePasswordAPIView(generics.GenericAPIView):
    """
    Change own password
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        old_password = serializer.validated_data.get('old_password')
        new_password = serializer.validated_data.get('new_password')
        
        if not user.check_password(old_password):
            return Response(
                {"old_password": ["Wrong password provided."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.must_reset_password = False
        user.save()
        
        if hasattr(user, 'auth_token'):
            Token.objects.filter(user=user).exclude(key=user.auth_token.key).delete()
        
        return Response({
            "message": "Password updated successfully.",
            "user_id": user.id
        }, status=status.HTTP_200_OK)