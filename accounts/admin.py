from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import (
    Role,
    StudentProfile,
    ParentProfile,
    ParentGuardianLink,
    StaffProfile,
)

User = get_user_model()

# Safely unregister default User model if previously registered by Django
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass


# --- Inlines ---

class ParentGuardianLinkInline(admin.TabularInline):
    model = ParentGuardianLink
    fk_name = 'parent'
    extra = 1
    autocomplete_fields = ['student']


class StudentGuardianLinkInline(admin.TabularInline):
    model = ParentGuardianLink
    fk_name = 'student'
    extra = 1
    autocomplete_fields = ['parent']


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = 'Student Profile'
    fk_name = 'user'


class ParentProfileInline(admin.StackedInline):
    model = ParentProfile
    can_delete = False
    verbose_name_plural = 'Parent Profile'
    fk_name = 'user'


class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    can_delete = False
    verbose_name_plural = 'Staff Profile'
    fk_name = 'user'


# --- ModelAdmins ---

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Admin config for custom User model using email as unique ID."""
    
    list_display = (
        'email', 
        'first_name', 
        'last_name', 
        'is_staff', 
        'is_active', 
        'totp_enabled', 
        'must_reset_password',
    )
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'totp_enabled', 'roles')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('email',)
    filter_horizontal = ('roles', 'groups', 'user_permissions')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'phone_number')}),
        (
            _('Permissions & Roles'),
            {
                'fields': (
                    'roles',
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                ),
            },
        ),
        (
            _('Security & Authentication'),
            {
                'fields': (
                    'must_reset_password',
                    'totp_enabled',
                    'totp_secret',
                )
            },
        ),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'email',
                    'first_name',
                    'last_name',
                    'password1',
                    'password2',
                    'is_staff',
                    'is_active',
                ),
            },
        ),
    )

    actions = ['disable_totp', 'clear_must_reset_password']

    @admin.action(description="Disable TOTP 2FA for selected users")
    def disable_totp(self, request, queryset):
        queryset.update(totp_enabled=False, totp_secret=None)

    @admin.action(description="Mark selected users as password reset completed")
    def clear_must_reset_password(self, request, queryset):
        queryset.update(must_reset_password=False)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_name_display', 'group', 'description')
    search_fields = ('name', 'description')


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'user', 'grade_level', 'date_of_birth')
    search_fields = ('student_id', 'user__email', 'user__first_name', 'user__last_name')
    list_filter = ('grade_level',)
    raw_id_fields = ('user',)
    inlines = [StudentGuardianLinkInline]


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'emergency_contact')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'emergency_contact')
    raw_id_fields = ('user',)
    inlines = [ParentGuardianLinkInline]


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'employment_date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'department')
    list_filter = ('department', 'employment_date')
    raw_id_fields = ('user',)


@admin.register(ParentGuardianLink)
class ParentGuardianLinkAdmin(admin.ModelAdmin):
    list_display = ('parent', 'student', 'relationship_type', 'is_primary')
    list_filter = ('relationship_type', 'is_primary')
    search_fields = (
        'parent__user__first_name',
        'parent__user__last_name',
        'student__student_id',
        'student__user__first_name',
        'student__user__last_name',
    )
    autocomplete_fields = ['parent', 'student']
    