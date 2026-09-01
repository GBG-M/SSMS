from django.contrib import admin
from .models import Student, AcademicRecord, Attendance, StudentDocument

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'full_name', 'email', 'current_grade', 'current_class', 'status']
    list_filter = ['status', 'gender', 'current_grade', 'current_class']
    search_fields = ['student_id', 'first_name', 'last_name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(AcademicRecord)
class AcademicRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'term', 'academic_year', 'gpa', 'percentage']
    list_filter = ['term', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'status', 'check_in_time']
    list_filter = ['status', 'date']
    search_fields = ['student__first_name', 'student__last_name']

@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ['student', 'document_type', 'title', 'uploaded_at']
    list_filter = ['document_type']
    search_fields = ['student__first_name', 'student__last_name', 'title']
