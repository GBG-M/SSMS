from django.urls import path
from .views import (
    ForcePasswordResetAPIView,
    LoginAPIView,
    LogoutAPIView,
    ProvisionStudentAccountAPIView,
)

app_name = 'accounts-api'

urlpatterns = [
    path('login/', LoginAPIView.as_view(), name='api_login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('force-password-reset/', ForcePasswordResetAPIView.as_view(), name='force_password_reset'),
    path('provision-student/', ProvisionStudentAccountAPIView.as_view(), name='api_provision_student'),
]