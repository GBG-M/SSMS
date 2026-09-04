# accounts/urls.py
from django.urls import path
from .views import (
    LoginAPIView,
    LogoutAPIView,
    ForcePasswordResetAPIView,
    ForgotPasswordAPIView,
    ProvisionStudentAccountAPIView,
    UserProfileAPIView,
    UserListAPIView,
    UserDetailAPIView,
    ChangePasswordAPIView,
    RoleListAPIView,
    UserRoleUpdateAPIView,
    AdminForcePasswordResetAPIView,
    LoginHistoryAPIView,
)

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('login/', LoginAPIView.as_view(), name='api_login'),
    path('logout/', LogoutAPIView.as_view(), name='api_logout'),
    
    # Password management
    path('force-password-reset/', ForcePasswordResetAPIView.as_view(), name='api_force_password_reset'),
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='api_forgot_password'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='api_change_password'),
    
    # Roles
    path('roles/', RoleListAPIView.as_view(), name='api_roles_list'),
    
    # Account provisioning
    path('provision-student/', ProvisionStudentAccountAPIView.as_view(), name='api_provision_student'),
    
    # Audit trail
    path('login-history/', LoginHistoryAPIView.as_view(), name='api_login_history'),
    path('users/<uuid:pk>/login-history/', LoginHistoryAPIView.as_view(), name='api_user_login_history'),
    
    # User management (Admin only)
    path('profile/', UserProfileAPIView.as_view(), name='api_user_profile'),
    path('users/', UserListAPIView.as_view(), name='api_user_list'),
    path('users/<uuid:pk>/', UserDetailAPIView.as_view(), name='api_user_detail'),
    path('users/<uuid:pk>/roles/', UserRoleUpdateAPIView.as_view(), name='api_user_roles_update'),
    path('users/<uuid:pk>/force-reset/', AdminForcePasswordResetAPIView.as_view(), name='api_user_force_reset'),
]