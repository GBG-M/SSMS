from rest_framework import serializers

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


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class ClassSectionSerializer(serializers.ModelSerializer):
    enrolled_students_count = serializers.ReadOnlyField()

    class Meta:
        model = ClassSection
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    class_name = serializers.CharField(source='class_section.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'


class GradeRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='enrollment.student.full_name', read_only=True)
    class_name = serializers.CharField(source='assessment.class_section.name', read_only=True)

    class Meta:
        model = GradeRecord
        fields = '__all__'


class AcademicSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSummary
        fields = '__all__'
