from django.contrib import admin
from .models import User, Role, StudentProfile, ParentProfile, ParentGuardianLink, StaffProfile

admin.site.register(User)
admin.site.register(Role)
admin.site.register(StudentProfile)
admin.site.register(ParentProfile)
admin.site.register(ParentGuardianLink)
admin.site.register(StaffProfile)
