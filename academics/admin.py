from django.contrib import admin
from .models import (
    AcademicYear,
    Subject,
    Course,
    ClassSection,
    Enrollment,
    Assessment,
    GradeRecord,
    AcademicSummary,
)


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'credit_hours', 'department', 'is_active')
    list_filter = ('is_active', 'department')
    search_fields = ('code', 'name', 'department')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('course_code', 'title', 'subject', 'academic_year', 'level', 'credit_hours', 'is_active')
    list_filter = ('level', 'academic_year', 'is_active')
    search_fields = ('course_code', 'title')


@admin.register(ClassSection)
class ClassSectionAdmin(admin.ModelAdmin):
    list_display = ('section_code', 'name', 'subject', 'teacher', 'academic_year', 'capacity', 'is_active')
    list_filter = ('academic_year', 'is_active')
    search_fields = ('section_code', 'name', 'subject__name')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_section', 'status', 'enrolled_on')
    list_filter = ('status', 'class_section__academic_year')
    search_fields = ('student__first_name', 'student__last_name', 'student__student_id')


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_section', 'assessment_type', 'due_date', 'max_marks', 'weight')
    list_filter = ('assessment_type', 'class_section')
    search_fields = ('name', 'class_section__name')


@admin.register(GradeRecord)
class GradeRecordAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'assessment', 'score', 'grade')
    list_filter = ('assessment__assessment_type',)
    search_fields = ('enrollment__student__first_name', 'enrollment__student__last_name')


@admin.register(AcademicSummary)
class AcademicSummaryAdmin(admin.ModelAdmin):
    list_display = ('student', 'academic_year', 'gpa', 'total_credits', 'credits_earned')
    list_filter = ('academic_year',)
    search_fields = ('student__first_name', 'student__last_name', 'student__student_id')
