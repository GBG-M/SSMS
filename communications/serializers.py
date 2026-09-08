from rest_framework import serializers
from django.contrib.auth import get_user_model
from accounts.models import Role
from students.models import Student
from academics.models import ClassSection
from .models import ConversationThread, ThreadMessage, SchoolAnnouncement
from .services import create_conversation_thread

User = get_user_model()


class ParticipantSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    roles = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'roles']


class ThreadMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = ThreadMessage
        fields = [
            'id',
            'thread',
            'sender',
            'sender_name',
            'sender_role',
            'content',
            'is_mine',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'thread', 'sender', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.full_name or obj.sender.email

    def get_sender_role(self, obj):
        roles = [r.name for r in obj.sender.roles.all()]
        return roles[0] if roles else ''

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.id == obj.sender_id)

    def get_is_read(self, obj):
        request = self.context.get('request')
        if not request:
            return True
        return obj.read_by.filter(id=request.user.id).exists()


class ConversationThreadListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    student_grade = serializers.CharField(source='student.current_grade', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    participants = ParticipantSummarySerializer(many=True, read_only=True)

    class Meta:
        model = ConversationThread
        fields = [
            'id',
            'subject',
            'category',
            'category_display',
            'status',
            'status_display',
            'student',
            'student_name',
            'student_code',
            'student_grade',
            'created_by',
            'created_by_name',
            'participants',
            'unread_count',
            'last_message',
            'created_at',
            'updated_at',
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.email
        return 'Unknown'

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.exclude(read_by=request.user).count()

    def get_last_message(self, obj):
        latest = obj.messages.order_by('-created_at').first()
        if latest:
            return {
                'id': latest.id,
                'content': latest.content[:140],
                'sender_name': latest.sender.full_name or latest.sender.email,
                'created_at': latest.created_at,
            }
        return None


class ConversationThreadDetailSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    student_grade = serializers.CharField(source='student.current_grade', read_only=True)
    student_class = serializers.CharField(source='student.current_class', read_only=True)
    participants = ParticipantSummarySerializer(many=True, read_only=True)
    messages = ThreadMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ConversationThread
        fields = [
            'id',
            'subject',
            'category',
            'category_display',
            'status',
            'status_display',
            'student',
            'student_name',
            'student_code',
            'student_grade',
            'student_class',
            'created_by',
            'participants',
            'messages',
            'created_at',
            'updated_at',
        ]


class ConversationThreadCreateSerializer(serializers.Serializer):
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source='student')
    recipient_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='recipient')
    subject = serializers.CharField(max_length=200)
    category = serializers.ChoiceField(choices=ConversationThread.CATEGORY_CHOICES, default='GENERAL')
    initial_message = serializers.CharField()

    def validate(self, attrs):
        user = self.context['request'].user
        student = attrs['student']
        recipient = attrs['recipient']
        role_names = {r.name for r in user.roles.all()}

        if user.id == recipient.id:
            raise serializers.ValidationError({"recipient_id": "You cannot message yourself."})

        # Relationship rules
        if Role.PARENT in role_names and Role.ADMIN not in role_names and Role.ACADEMIC_COORDINATOR not in role_names:
            # Must be a parent of this student
            if not hasattr(user, 'parent_profile') or not user.parent_profile.students.filter(id=student.id).exists():
                raise serializers.ValidationError({"student_id": "You can only create inquiries for your own linked children."})

            # Recipient must be an active teacher of this student or an institutional staff
            recipient_roles = {r.name for r in recipient.roles.all()}
            is_staff = bool(recipient_roles.intersection({Role.ADMIN, Role.ACADEMIC_COORDINATOR}))
            is_teacher = Role.TEACHER in recipient_roles

            if not is_staff and is_teacher:
                teaches_student = ClassSection.objects.filter(
                    teacher=recipient,
                    enrollments__student=student,
                    enrollments__status='ACTIVE',
                    is_active=True
                ).exists()
                if not teaches_student:
                    raise serializers.ValidationError({
                        "recipient_id": "This teacher does not currently teach any active classes for your child."
                    })
            elif not is_staff:
                raise serializers.ValidationError({
                    "recipient_id": "Recipients must be verified teachers of your child or school administrators."
                })

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        thread = create_conversation_thread(
            student=validated_data['student'],
            created_by=user,
            recipient=validated_data['recipient'],
            subject=validated_data['subject'],
            category=validated_data.get('category', 'GENERAL'),
            initial_message=validated_data['initial_message']
        )
        return thread


class ThreadMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField()


class SchoolAnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    target_audience_display = serializers.CharField(source='get_target_audience_display', read_only=True)

    class Meta:
        model = SchoolAnnouncement
        fields = [
            'id',
            'title',
            'content',
            'target_audience',
            'target_audience_display',
            'priority',
            'priority_display',
            'author',
            'author_name',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.full_name or obj.author.email
        return 'Administration'
