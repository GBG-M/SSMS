from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RoomViewSet, ClassScheduleViewSet, ExamScheduleViewSet

app_name = 'scheduling'

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'class-schedules', ClassScheduleViewSet, basename='class-schedule')
router.register(r'exam-schedules', ExamScheduleViewSet, basename='exam-schedule')

urlpatterns = [
    path('', include(router.urls)),
]
