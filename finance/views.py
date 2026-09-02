from django.db.models import Q, Sum
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category', 'academic_year']
    ordering_fields = ['name', 'amount', 'academic_year']


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('fee_type').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['fee_type__name', 'grade_level', 'class_name', 'program', 'academic_year']
    ordering_fields = ['academic_year', 'amount', 'due_date']


class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = StudentFee.objects.select_related('student', 'fee_type', 'fee_structure').all()
    serializer_class = StudentFeeSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'fee_type', 'status', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id', 'fee_type__name']
    ordering_fields = ['amount_due', 'amount_paid', 'due_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if Role.ADMIN in role_names:
            return queryset
        if Role.STUDENT in role_names and hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        if Role.PARENT in role_names and hasattr(user, 'parent_profile'):
            return queryset.filter(student__in=user.parent_profile.students.all())

        return queryset.none()


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('student', 'issued_by').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'status', 'due_date']
    search_fields = ['invoice_number', 'student__first_name', 'student__last_name', 'student__student_id']
    ordering_fields = ['issue_date', 'due_date', 'total_amount']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if Role.ADMIN in role_names:
            return queryset
        if Role.STUDENT in role_names and hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        if Role.PARENT in role_names and hasattr(user, 'parent_profile'):
            return queryset.filter(student__in=user.parent_profile.students.all())

        return queryset.none()


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'student', 'received_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, FinanceAccessPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'invoice', 'payment_method', 'status']
    search_fields = ['transaction_reference', 'student__first_name', 'student__last_name']
    ordering_fields = ['payment_date', 'amount']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        role_names = {role.name for role in user.roles.all()}
        if Role.ADMIN in role_names:
            return queryset
        if Role.STUDENT in role_names and hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        if Role.PARENT in role_names and hasattr(user, 'parent_profile'):
            return queryset.filter(student__in=user.parent_profile.students.all())

        return queryset.none()
