# accounts/views.py
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.contrib.auth import get_user_model

from .models import User, Role
from .serializers import (
    LoginSerializer, 
    PasswordResetSerializer, 
    UserSerializer, 
    ChangePasswordSerializer
)
from .signals import provision_student_account

User = get_user_model()


class LoginAPIView(APIView):
    """
    API equivalent of LoginView verifying TOTP and Forced Password Resets.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            # Check mandatory password reset
            if hasattr(user, 'must_reset_password') and user.must_reset_password:
                # Generate a secure temporary token for password reset workflow
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

            # Successful login (creates session or token)
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Login successful.',
                'token': token.key,
                'email': user.email,
                'user_id': user.id,
                'username': user.username if hasattr(user, 'username') else email,
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutAPIView(APIView):
    """
    API endpoint to log out and destroy token/session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete token if using DRF Token auth
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        
        logout(request)
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class ForcePasswordResetAPIView(APIView):
    """
    API equivalent for enforcing mandatory password reset on first login.
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
            return Response(
                {'error': 'Invalid or expired pre-auth session. Please login again.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
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
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update password: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ProvisionStudentAccountAPIView(APIView):
    """
    API endpoint for triggers from Module 5.2 (Enrollment)
    to provision portal accounts automatically.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if user has admin or academic coordinator role
        user_roles = request.user.roles.all() if hasattr(request.user, 'roles') else []
        allowed_roles = [Role.ADMIN, Role.ACADEMIC_COORDINATOR]
        
        if not any(role.name in allowed_roles for role in user_roles):
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
            student_profile, parent_profile = provision_student_account(
                student_data=student_data,
                parent_email=parent_email,
                parent_phone=parent_phone,
                campus_code=data.get('campus_code', 'MAIN')
            )

            return Response({
                'message': 'Account provisioned successfully.',
                'student_id': student_profile.student_id,
                'student_email': student_profile.user.email,
                'parent_email': parent_profile.user.email,
                'student_username': student_profile.user.username,
                'parent_username': parent_profile.user.username,
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


# Additional Views (if you want to include them)

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
    queryset = User.objects.all()
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
    queryset = User.objects.all()
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
        user.save()
        
        # Optionally delete all tokens except current one
        if hasattr(user, 'auth_token'):
            Token.objects.filter(user=user).exclude(key=user.auth_token.key).delete()
        
        return Response({
            "message": "Password updated successfully.",
            "user_id": user.id
        }, status=status.HTTP_200_OK)