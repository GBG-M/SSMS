from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FeeTypeViewSet, FeeStructureViewSet, StudentFeeViewSet, InvoiceViewSet, PaymentViewSet

app_name = 'finance'

router = DefaultRouter()
router.register(r'fee-types', FeeTypeViewSet, basename='fee-type')
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'student-fees', StudentFeeViewSet, basename='student-fee')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
