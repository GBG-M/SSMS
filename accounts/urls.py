# accounts/urls.py
from django.urls import path
from .views import (
    LoginAPIView,
    LogoutAPIView,
    ForcePasswordResetAPIView,
    ProvisionStudentAccountAPIView,
    UserProfileAPIView,
    UserListAPIView,
    UserDetailAPIView,
    ChangePasswordAPIView,
)

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('login/', LoginAPIView.as_view(), name='api_login'),
    path('logout/', LogoutAPIView.as_view(), name='api_logout'),
    # Password management
    path('force-password-reset/', ForcePasswordResetAPIView.as_view(), name='api_force_password_reset'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='api_change_password'),
    
    # Account management
    path('provision-student/', ProvisionStudentAccountAPIView.as_view(), name='api_provision_student'),
    
    # User management (Admin only)
    path('profile/', UserProfileAPIView.as_view(), name='api_user_profile'),
    path('users/', UserListAPIView.as_view(), name='api_user_list'),
    path('users/<uuid:pk>/', UserDetailAPIView.as_view(), name='api_user_detail'),
]
# If you want to include this under the main URL configuration:
# In your main project urls.py, you would have:
# path('api/accounts/', include('accounts.urls', namespace='accounts-api'))