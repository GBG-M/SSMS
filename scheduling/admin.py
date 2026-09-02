from django.contrib import admin
from .models import Room, ClassSchedule, ExamSchedule


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_number', 'building', 'capacity', 'is_active')
    list_filter = ('building', 'is_active')
    search_fields = ('name', 'room_number', 'building')
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'room_number', 'building')}),
        ('Capacity & Status', {'fields': ('capacity', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = ('class_section', 'room', 'teacher', 'day_of_week', 'start_time', 'end_time', 'term')
    list_filter = ('day_of_week', 'term', 'academic_year', 'created_at')
    search_fields = ('class_section__name', 'teacher__first_name', 'teacher__last_name', 'room__name')
    fieldsets = (
        ('Schedule Details', {'fields': ('class_section', 'room', 'teacher', 'academic_year')}),
        ('Timing', {'fields': ('day_of_week', 'start_time', 'end_time', 'term')}),
        ('Additional Info', {'fields': ('notes',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ExamSchedule)
class ExamScheduleAdmin(admin.ModelAdmin):
    list_display = ('class_section', 'exam_type', 'exam_date', 'start_time', 'end_time', 'room')
    list_filter = ('exam_type', 'exam_date', 'academic_year')
    search_fields = ('class_section__name', 'room__name')
    fieldsets = (
        ('Exam Details', {'fields': ('class_section', 'exam_type', 'academic_year')}),
        ('Timing & Location', {'fields': ('exam_date', 'start_time', 'end_time', 'room')}),
        ('Additional Info', {'fields': ('notes',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at')
