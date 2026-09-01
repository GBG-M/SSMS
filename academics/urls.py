from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicYearViewSet,
    SubjectViewSet,
    CourseViewSet,
    ClassSectionViewSet,
    EnrollmentViewSet,
    AssessmentViewSet,
    GradeRecordViewSet,
    AcademicSummaryViewSet,
)

app_name = 'academics'

router = DefaultRouter()
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'class-sections', ClassSectionViewSet, basename='class-section')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'grade-records', GradeRecordViewSet, basename='grade-record')
router.register(r'academic-summaries', AcademicSummaryViewSet, basename='academic-summary')

urlpatterns = [
    path('', include(router.urls)),
]
