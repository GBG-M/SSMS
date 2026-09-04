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
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'


class ClassSectionSerializer(serializers.ModelSerializer):
    enrolled_students_count = serializers.ReadOnlyField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True, default='Unassigned')

    class Meta:
        model = ClassSection
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.CharField(source='class_section.name', read_only=True)
    subject_name = serializers.CharField(source='class_section.subject.name', read_only=True)
    academic_year_name = serializers.CharField(source='class_section.academic_year.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'


class AssessmentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_section.name', read_only=True)
    section_code = serializers.CharField(source='class_section.section_code', read_only=True)
    subject_name = serializers.CharField(source='class_section.subject.name', read_only=True)

    class Meta:
        model = Assessment
        fields = '__all__'


class GradeRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='enrollment.student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='enrollment.student.student_id', read_only=True)
    class_name = serializers.CharField(source='assessment.class_section.name', read_only=True)
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    assessment_type = serializers.CharField(source='assessment.assessment_type', read_only=True)
    max_marks = serializers.IntegerField(source='assessment.max_marks', read_only=True)
    weight = serializers.IntegerField(source='assessment.weight', read_only=True)

    class Meta:
        model = GradeRecord
        fields = '__all__'


class AcademicSummarySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = AcademicSummary
        fields = '__all__'
