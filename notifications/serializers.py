from rest_framework import serializers
from django.contrib.auth import get_user_model
from students.models import Student
from academics.models import ClassSection
from .models import Notification

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for reading and updating notifications."""

    recipient_name = serializers.SerializerMethodField(read_only=True)
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)
    sender_name = serializers.SerializerMethodField(read_only=True)
    related_student_name = serializers.SerializerMethodField(read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'recipient_name',
            'recipient_email',
            'sender',
            'sender_name',
            'notification_type',
            'notification_type_display',
            'priority',
            'priority_display',
            'title',
            'message',
            'recipient_role',
            'related_student',
            'related_student_name',
            'is_read',
            'read_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'recipient',
            'sender',
            'notification_type',
            'priority',
            'title',
            'message',
            'recipient_role',
            'related_student',
            'read_at',
            'created_at',
            'updated_at',
        ]

    def get_recipient_name(self, obj) -> str:
        if obj.recipient:
            return obj.recipient.full_name or obj.recipient.username
        return ""

    def get_sender_name(self, obj) -> str:
        if obj.sender:
            return obj.sender.full_name or obj.sender.username
        return "System"

    def get_related_student_name(self, obj) -> str:
        if obj.related_student:
            return obj.related_student.full_name
        return ""


class NotificationCreateSerializer(serializers.Serializer):
    """Serializer for manual notification creation by staff or teachers."""

    recipient_id = serializers.UUIDField(required=True)
    title = serializers.CharField(max_length=200, required=True)
    message = serializers.CharField(required=True)
    notification_type = serializers.ChoiceField(
        choices=Notification.NOTIFICATION_TYPE_CHOICES,
        default='TEACHER_MESSAGE'
    )
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_CHOICES,
        default='NORMAL'
    )
    related_student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        required=False,
        allow_null=True
    )

    def validate_recipient_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Recipient user not found.")
        return value


class BroadcastClassSerializer(serializers.Serializer):
    """Serializer for teachers/staff broadcasting to an entire class section."""

    class_section_id = serializers.PrimaryKeyRelatedField(
        queryset=ClassSection.objects.all(),
        required=True
    )
    title = serializers.CharField(max_length=200, required=True)
    message = serializers.CharField(required=True)
    priority = serializers.ChoiceField(
        choices=Notification.PRIORITY_CHOICES,
        default='NORMAL'
    )
    include_parents = serializers.BooleanField(default=True)
