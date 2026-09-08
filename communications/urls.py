from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConversationThreadViewSet,
    SchoolAnnouncementViewSet,
    ContactsDirectoryAPIView,
)

app_name = 'communications'

router = DefaultRouter()
router.register(r'threads', ConversationThreadViewSet, basename='thread')
router.register(r'announcements', SchoolAnnouncementViewSet, basename='announcement')

urlpatterns = [
    path('contacts/', ContactsDirectoryAPIView.as_view(), name='contacts_directory'),
    path('', include(router.urls)),
]
