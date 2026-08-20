from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token # Or use SimpleJWT tokens
from .models import User, Role
from .serializers import LoginSerializer, PasswordResetSerializer
from .signals import provision_student_account
class LoginAPIView(APIView):
    """
    API equivalent of LoginView verifying TOTP and Forced Password Resets.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            # Check mandatory password reset
            if user.must_reset_password:
                # Generate a secure temporary token for password reset workflow
                token = Token.objects.create(user=user) if 'authtoken' in request.resolver_match.app_name else str(user.id)
                cache.set(f'pre_auth_user_{user.id}', str(user.id), timeout=300) # 5 minutes expiry
                return Response({
                    'status': 'password_reset_required',
                    'message': 'Mandatory password reset required before login.',
                    'pre_auth_user_id': str(user.id)
                }, status=status.HTTP_200_OK)
            
            # Check mandatory TOTP for sensitive roles
            if user.requires_totp:
                if not user.totp_enabled:
                    return Response({
                        'status': 'totp_setup_required',
                        'message': 'TOTP setup required.',
                        'pre_auth_user_id': str(user.id)
                    }, status=status.HTTP_200_OK)
                else:
                    return Response ({
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
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)


class ForcePasswordResetAPIView(APIView):
    """
    API equivalent for enforcing mandatory password reset on first login.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_id = serializer.validated_data.get('pre_auth_token')
        new_password = serializer.validated_data.get('new_password')
        
        cached_user_id = cache.get(f'pre_auth_user_{user_id}')
        if not cached_user_id:
            return Response({'error': 'Invalid or expired pre-auth session.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(id=user_id).first()
        if user:
            user.set_password(new_password)
            user.must_reset_password = False
            user.save()
            
            # Clear pre-auth cache
            cache.delete(f'pre_auth_user_{user_id}')
            
            # Authenticate and issue token
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'message': 'Password updated successfully.',
                'token': token.key
            }, status=status.HTTP_200_OK)

        return Response({'error': 'Failed to update password.'}, status=status.HTTP_400_BAD_REQUEST)


class ProvisionStudentAccountAPIView(APIView):
    """
    API endpoint for triggers from Module 5.2 (Enrollment)
    to provision portal accounts automatically.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
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


class LogoutAPIView(APIView):
    """
    API endpoint to log out and destroy token/session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Delete token if using DRF Token auth
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        
        logout(request)
        return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
