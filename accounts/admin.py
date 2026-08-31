# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, StudentProfile, ParentProfile, PasswordResetRequest, LoginHistory
# StudentProfile is deprecated - use students.Student instead

class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_active', 'is_staff', 'must_reset_password']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'must_reset_password', 'requires_totp']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['email']
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Security', {'fields': ('must_reset_password', 'requires_totp', 'totp_enabled')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'full_name', 'department', 'year', 'is_active']
    search_fields = ['student_id', 'user__email', 'user__first_name', 'user__last_name']
    list_filter = ['year', 'department', 'is_active', 'campus']


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'relationship', 'is_primary']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'phone_number']
    list_filter = ['relationship', 'is_primary']


@admin.register(PasswordResetRequest)
class PasswordResetRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'created_at', 'expires_at']
    list_filter = ['status']
    search_fields = ['user__email']


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'login_time', 'is_successful']
    list_filter = ['is_successful']
    search_fields = ['user__email']

admin.site.register(User, UserAdmin)