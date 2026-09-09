from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from academics.models import AcademicYear
from .models import Room, ClassSchedule, ExamSchedule


class RoomSerializer(serializers.ModelSerializer):
    total_schedules = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'name', 'room_number', 'building', 'capacity',
            'is_active', 'total_schedules', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_schedules(self, obj):
        return obj.class_schedules.count() + obj.exam_schedules.count()

    def validate_capacity(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Capacity must be greater than zero.")
        return value


class ClassScheduleSerializer(serializers.ModelSerializer):
    class_section_name = serializers.CharField(source='class_section.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True, allow_null=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    subject_code = serializers.CharField(source='class_section.subject.code', read_only=True)
    academic_year = serializers.PrimaryKeyRelatedField(queryset=AcademicYear.objects.all(), required=False)

    class Meta:
        model = ClassSchedule
        fields = [
            'id', 'class_section', 'class_section_name', 'subject_code',
            'room', 'room_name', 'room_number', 'teacher', 'teacher_name',
            'academic_year', 'academic_year_name',
            'day_of_week', 'start_time', 'end_time', 'term',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        class_section = attrs.get('class_section') or (instance.class_section if instance else None)
        room = attrs.get('room') or (instance.room if instance else None)
        teacher = attrs.get('teacher') or (instance.teacher if instance else None)
        academic_year = attrs.get('academic_year') or (instance.academic_year if instance else None)
        day_of_week = attrs.get('day_of_week') or (instance.day_of_week if instance else None)
        start_time = attrs.get('start_time') or (instance.start_time if instance else None)
        end_time = attrs.get('end_time') or (instance.end_time if instance else None)
        term = attrs.get('term') if 'term' in attrs else (instance.term if instance else '')

        if class_section:
            if not academic_year:
                academic_year = class_section.academic_year
                attrs['academic_year'] = academic_year
            if not teacher and class_section.teacher:
                teacher = class_section.teacher
                attrs['teacher'] = teacher

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({'end_time': 'End time must be after start time.'})

        # Validate schedule conflicts through model clean()
        temp_instance = ClassSchedule(
            id=instance.id if instance else None,
            class_section=class_section,
            room=room,
            teacher=teacher,
            academic_year=academic_year,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            term=term or ''
        )
        try:
            temp_instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)

        return attrs


class ExamScheduleSerializer(serializers.ModelSerializer):
    class_section_name = serializers.CharField(source='class_section.name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    subject_code = serializers.CharField(source='class_section.subject.code', read_only=True)
    teacher_name = serializers.CharField(source='class_section.teacher.full_name', read_only=True, allow_null=True)
    academic_year = serializers.PrimaryKeyRelatedField(queryset=AcademicYear.objects.all(), required=False)

    class Meta:
        model = ExamSchedule
        fields = [
            'id', 'class_section', 'class_section_name', 'subject_code',
            'room', 'room_name', 'room_number', 'exam_type', 'exam_date',
            'start_time', 'end_time', 'academic_year', 'academic_year_name',
            'teacher_name', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        class_section = attrs.get('class_section') or (instance.class_section if instance else None)
        room = attrs.get('room') or (instance.room if instance else None)
        academic_year = attrs.get('academic_year') or (instance.academic_year if instance else None)
        exam_type = attrs.get('exam_type') or (instance.exam_type if instance else None)
        exam_date = attrs.get('exam_date') or (instance.exam_date if instance else None)
        start_time = attrs.get('start_time') or (instance.start_time if instance else None)
        end_time = attrs.get('end_time') or (instance.end_time if instance else None)

        if class_section and not academic_year:
            academic_year = class_section.academic_year
            attrs['academic_year'] = academic_year

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({'end_time': 'End time must be after start time.'})

        temp_instance = ExamSchedule(
            id=instance.id if instance else None,
            class_section=class_section,
            room=room,
            exam_type=exam_type,
            exam_date=exam_date,
            start_time=start_time,
            end_time=end_time,
            academic_year=academic_year
        )
        try:
            temp_instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)

        return attrs

