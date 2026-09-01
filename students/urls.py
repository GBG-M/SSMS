from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, AcademicRecordViewSet, 
    AttendanceViewSet, StudentDocumentViewSet
)
app_name = 'students'

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'academic-records', AcademicRecordViewSet, basename='academic-record')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'documents', StudentDocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]