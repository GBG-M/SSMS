from django.contrib import admin
from .models import ConversationThread, ThreadMessage, SchoolAnnouncement


class ThreadMessageInline(admin.TabularInline):
    model = ThreadMessage
    extra = 0
    readonly_fields = ('sender', 'content', 'created_at')
    can_delete = False


@admin.register(ConversationThread)
class ConversationThreadAdmin(admin.ModelAdmin):
    list_display = ('subject', 'category', 'status', 'student', 'created_by', 'updated_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('subject', 'student__first_name', 'student__last_name', 'student__student_id')
    inlines = [ThreadMessageInline]
    filter_horizontal = ('participants',)


@admin.register(ThreadMessage)
class ThreadMessageAdmin(admin.ModelAdmin):
    list_display = ('thread', 'sender', 'created_at')
    search_fields = ('content', 'sender__email', 'thread__subject')
    list_filter = ('created_at',)


@admin.register(SchoolAnnouncement)
class SchoolAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'target_audience', 'priority', 'author', 'is_published', 'created_at')
    list_filter = ('target_audience', 'priority', 'is_published', 'created_at')
    search_fields = ('title', 'content', 'author__email')
