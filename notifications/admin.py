from django.contrib import admin
from django.utils import timezone
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'recipient',
        'notification_type',
        'priority',
        'is_read',
        'related_student',
        'created_at',
    )
    list_filter = (
        'notification_type',
        'priority',
        'is_read',
        'recipient_role',
        'created_at',
    )
    search_fields = (
        'title',
        'message',
        'recipient__email',
        'recipient__first_name',
        'recipient__last_name',
        'sender__email',
        'sender__first_name',
        'sender__last_name',
        'related_student__student_id',
        'related_student__first_name',
        'related_student__last_name',
    )
    readonly_fields = ('id', 'read_at', 'created_at', 'updated_at')
    fieldsets = (
        ('Notification Routing', {
            'fields': ('recipient', 'recipient_role', 'sender', 'related_student')
        }),
        ('Message Content', {
            'fields': ('notification_type', 'priority', 'title', 'message')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Metadata & Timestamps', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['mark_as_read', 'mark_as_unread']

    @admin.action(description='Mark selected notifications as read')
    def mark_as_read(self, request, queryset):
        count = queryset.filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
            updated_at=timezone.now()
        )
        self.message_user(request, f'{count} notification(s) marked as read.')

    @admin.action(description='Mark selected notifications as unread')
    def mark_as_unread(self, request, queryset):
        count = queryset.filter(is_read=True).update(
            is_read=False,
            read_at=None,
            updated_at=timezone.now()
        )
        self.message_user(request, f'{count} notification(s) marked as unread.')
