from django.urls import path
from .views import (
    LoginView, 
    LogoutView, 
    ForcePasswordResetView, 
    ProvisionStudentAccountAPIView
)

app_name = 'accounts'

urlpatterns = [
    # Auth Views
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('force-password-reset/', ForcePasswordResetView.as_view(), name='force_password_reset'),
    
    # Provisioning Endpoint (called by Module 5.2)
    path('api/provision-student/', ProvisionStudentAccountAPIView.as_view(), name='api_provision_student'),
]