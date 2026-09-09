from decimal import Decimal

from django.db.models import Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from .models import FeeType, FeeStructure, StudentFee, Invoice, Payment
from .permissions import FinanceAccessPermission
from .serializers import (
    FeeTypeSerializer,
    FeeStructureSerializer,
    StudentFeeSerializer,
    InvoiceSerializer,
    PaymentSerializer,
)


class FeeTypeViewSet(viewsets.ModelViewSet):
    queryset = FeeType.objects.all()
    serializer_class = FeeTypeSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category', 'academic_year']
    ordering_fields = ['name', 'amount', 'academic_year']


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('fee_type').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['fee_type__name', 'grade_level', 'class_name', 'program', 'academic_year']
    ordering_fields = ['academic_year', 'amount', 'due_date']


class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = StudentFee.objects.select_related('student', 'fee_type', 'fee_structure').all()
    serializer_class = StudentFeeSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'fee_type', 'status', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id', 'fee_type__name']
    ordering_fields = ['amount_due', 'amount_paid', 'due_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset
        if Role.STUDENT in role_names and hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        if Role.PARENT in role_names and hasattr(user, 'parent_profile'):
            return queryset.filter(student__in=user.parent_profile.students.all())

        return queryset.none()


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('student', 'issued_by').prefetch_related('payments').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'status', 'due_date']
    search_fields = ['invoice_number', 'student__first_name', 'student__last_name', 'student__student_id']
    ordering_fields = ['issue_date', 'due_date', 'total_amount']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset
        if Role.STUDENT in role_names and hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        if Role.PARENT in role_names and hasattr(user, 'parent_profile'):
            return queryset.filter(student__in=user.parent_profile.students.all())

        return queryset.none()

    def perform_create(self, serializer):
        if not serializer.validated_data.get('issued_by'):
            serializer.save(issued_by=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = self.get_queryset()
        total_invoiced = qs.aggregate(val=Sum('total_amount'))['val'] or Decimal('0.00')
        total_paid = qs.aggregate(val=Sum('paid_amount'))['val'] or Decimal('0.00')
        outstanding = max(total_invoiced - total_paid, Decimal('0.00'))
        overdue_count = qs.filter(status='overdue').count()
        total_count = qs.count()

        return Response({
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'outstanding_balance': outstanding,
            'overdue_invoices_count': overdue_count,
            'total_invoices_count': total_count,
        })


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'student', 'received_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'invoice', 'payment_method', 'status']
    search_fields = ['transaction_reference', 'student__first_name', 'student__last_name']
    ordering_fields = ['payment_date', 'amount']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if user.is_staff or user.is_superuser or Role.ADMIN in role_names or Role.ACADEMIC_COORDINATOR in role_names:
            return queryset
        if Role.STUDENT in role_names and hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        if Role.PARENT in role_names and hasattr(user, 'parent_profile'):
            return queryset.filter(student__in=user.parent_profile.students.all())

        return queryset.none()

    def perform_create(self, serializer):
        if not serializer.validated_data.get('received_by'):
            serializer.save(received_by=self.request.user)
        else:
            serializer.save()
