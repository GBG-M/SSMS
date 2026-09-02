from django.contrib import admin
from .models import FeeType, FeeStructure, StudentFee, Invoice, Payment


@admin.register(FeeType)
class FeeTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'amount', 'academic_year', 'is_required', 'is_active')
    list_filter = ('category', 'academic_year', 'is_required', 'is_active')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('fee_type', 'grade_level', 'class_name', 'program', 'amount', 'recurrence', 'academic_year')
    list_filter = ('recurrence', 'academic_year', 'is_active')
    search_fields = ('fee_type__name', 'grade_level', 'class_name', 'program')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StudentFee)
class StudentFeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'fee_type', 'amount_due', 'amount_paid', 'outstanding_balance', 'due_date', 'status')
    list_filter = ('status', 'academic_year', 'due_date')
    search_fields = ('student__first_name', 'student__last_name', 'student__student_id', 'fee_type__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'student', 'total_amount', 'paid_amount', 'balance', 'due_date', 'status')
    list_filter = ('status', 'due_date', 'issue_date')
    search_fields = ('invoice_number', 'student__first_name', 'student__last_name', 'student__student_id')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'student', 'amount', 'payment_method', 'transaction_reference', 'payment_date', 'status')
    list_filter = ('payment_method', 'status', 'payment_date')
    search_fields = ('transaction_reference', 'student__first_name', 'student__last_name', 'invoice__invoice_number')
    readonly_fields = ('created_at', 'updated_at')
