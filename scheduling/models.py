import uuid
from datetime import time

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models

from academics.models import AcademicYear, ClassSection

User = get_user_model()


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120, unique=True)
    room_number = models.CharField(max_length=50, unique=True)
    building = models.CharField(max_length=100, blank=True, default='')
    capacity = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['building', 'room_number']

    def __str__(self):
        return f"{self.name} ({self.room_number})"


class ClassSchedule(models.Model):
    DAY_CHOICES = [
        ('MONDAY', 'Monday'),
        ('TUESDAY', 'Tuesday'),
        ('WEDNESDAY', 'Wednesday'),
        ('THURSDAY', 'Thursday'),
        ('FRIDAY', 'Friday'),
        ('SATURDAY', 'Saturday'),
        ('SUNDAY', 'Sunday'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_section = models.ForeignKey(ClassSection, on_delete=models.CASCADE, related_name='schedules')
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='class_schedules')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_schedules')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name='class_schedules')
    day_of_week = models.CharField(max_length=20, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    term = models.CharField(max_length=30, default='Term 1')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']

    def clean(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'End time must be after start time.'})

        if self.teacher:
            conflicts = ClassSchedule.objects.filter(
                teacher=self.teacher,
                day_of_week=self.day_of_week,
            ).exclude(pk=self.pk)
            for obj in conflicts:
                if self._times_overlap(self.start_time, self.end_time, obj.start_time, obj.end_time):
                    raise ValidationError('This teacher already has a schedule at this time.')

        if self.room:
            room_conflicts = ClassSchedule.objects.filter(
                room=self.room,
                day_of_week=self.day_of_week,
            ).exclude(pk=self.pk)
            for obj in room_conflicts:
                if self._times_overlap(self.start_time, self.end_time, obj.start_time, obj.end_time):
                    raise ValidationError('This room is already booked for the selected time.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @staticmethod
    def _times_overlap(start1, end1, start2, end2):
        return start1 < end2 and end1 > start2

    def __str__(self):
        teacher_name = self.teacher.full_name if self.teacher else 'Unassigned'
        return f"{self.class_section.name} - {self.day_of_week} {self.start_time} to {self.end_time} - {teacher_name}"


class ExamSchedule(models.Model):
    EXAM_TYPE_CHOICES = [
        ('MIDTERM', 'Midterm'),
        ('FINAL', 'Final'),
        ('QUIZ', 'Quiz'),
        ('PRACTICAL', 'Practical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_section = models.ForeignKey(ClassSection, on_delete=models.CASCADE, related_name='exam_schedules')
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='exam_schedules')
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES, default='MIDTERM')
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name='exam_schedules')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['exam_date', 'start_time']

    def clean(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({'end_time': 'End time must be after start time.'})
        room_conflicts = ExamSchedule.objects.filter(room=self.room, exam_date=self.exam_date).exclude(pk=self.pk)
        for obj in room_conflicts:
            if ClassSchedule._times_overlap(self.start_time, self.end_time, obj.start_time, obj.end_time):
                raise ValidationError('This room is already reserved for another exam at this time.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.class_section.name} - {self.exam_type} - {self.exam_date}"
