from rest_framework import serializers

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


class ClassScheduleSerializer(serializers.ModelSerializer):
    class_section_name = serializers.CharField(source='class_section.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True, allow_null=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    subject_code = serializers.CharField(source='class_section.subject.code', read_only=True)

    class Meta:
        model = ClassSchedule
        fields = [
            'id', 'class_section', 'class_section_name', 'subject_code',
            'room', 'room_name', 'teacher', 'teacher_name',
            'academic_year', 'academic_year_name',
            'day_of_week', 'start_time', 'end_time', 'term',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExamScheduleSerializer(serializers.ModelSerializer):
    class_section_name = serializers.CharField(source='class_section.name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    subject_code = serializers.CharField(source='class_section.subject.code', read_only=True)
    teacher_name = serializers.CharField(source='class_section.teacher.full_name', read_only=True, allow_null=True)

    class Meta:
        model = ExamSchedule
        fields = [
            'id', 'class_section', 'class_section_name', 'subject_code',
            'room', 'room_name', 'exam_type', 'exam_date',
            'start_time', 'end_time', 'academic_year', 'academic_year_name',
            'teacher_name', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
