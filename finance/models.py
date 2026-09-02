import uuid
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Sum
from django.utils import timezone

from students.models import Student

User = get_user_model()


def normalize_date(value):
    if value is None:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
    return value


def normalize_decimal(value, default=Decimal('0.00')):
    if value is None:
        return default
    if isinstance(value, Decimal):
        return value
    if isinstance(value, str):
        try:
            return Decimal(value)
        except Exception:
            return default
    return Decimal(str(value))


class FeeType(models.Model):
    CATEGORY_CHOICES = [
        ('tuition', 'Tuition'),
        ('exam', 'Exam'),
        ('library', 'Library'),
        ('sports', 'Sports'),
        ('boarding', 'Boarding'),
        ('miscellaneous', 'Miscellaneous'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='miscellaneous')
    description = models.TextField(blank=True, default='')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    is_required = models.BooleanField(default=True)
    academic_year = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.academic_year})"


class FeeStructure(models.Model):
    RECURRENCE_CHOICES = [
        ('one_time', 'One Time'),
        ('term', 'Per Term'),
        ('semester', 'Per Semester'),
        ('yearly', 'Yearly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fee_type = models.ForeignKey(FeeType, on_delete=models.CASCADE, related_name='structures')
    grade_level = models.CharField(max_length=50, blank=True, default='')
    class_name = models.CharField(max_length=50, blank=True, default='')
    program = models.CharField(max_length=100, blank=True, default='')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    due_date = models.DateField(null=True, blank=True)
    recurrence = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, default='one_time')
    academic_year = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['academic_year', 'fee_type__name']

    def __str__(self):
        return f"{self.fee_type.name} - {self.academic_year}"


class StudentFee(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('waived', 'Waived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='finance_fees')
    fee_type = models.ForeignKey(FeeType, on_delete=models.CASCADE, related_name='student_fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_fees')
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    due_date = models.DateField()
    academic_year = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def outstanding_balance(self):
        return max(self.amount_due - self.amount_paid, Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.amount_due = normalize_decimal(self.amount_due)
        self.amount_paid = normalize_decimal(self.amount_paid)
        due_date = normalize_date(self.due_date)
        if self.amount_paid >= self.amount_due:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        elif due_date and due_date < timezone.localdate():
            self.status = 'overdue'
        else:
            self.status = 'pending'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.full_name} - {self.fee_type.name}"


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='invoices')
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_invoices')
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issue_date']

    @property
    def balance(self):
        return max(self.total_amount - self.paid_amount, Decimal('0.00'))

    def update_payment_status(self):
        self.subtotal = normalize_decimal(self.subtotal)
        self.tax = normalize_decimal(self.tax)
        self.total_amount = normalize_decimal(self.total_amount)
        self.paid_amount = normalize_decimal(self.paid_amount)
        due_date = normalize_date(self.due_date)
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        elif due_date and due_date < timezone.localdate():
            self.status = 'overdue'
        else:
            self.status = 'pending'

    def save(self, *args, **kwargs):
        self.subtotal = normalize_decimal(self.subtotal)
        self.tax = normalize_decimal(self.tax)
        self.total_amount = normalize_decimal(self.total_amount)
        self.paid_amount = normalize_decimal(self.paid_amount)
        if not self.invoice_number:
            self.invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        self.update_payment_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.student.full_name}"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('card', 'Card'),
        ('cheque', 'Cheque'),
    ]
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES)
    transaction_reference = models.CharField(max_length=100, blank=True, default='')
    payment_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    notes = models.TextField(blank=True, default='')
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']

    def save(self, *args, **kwargs):
        self.amount = normalize_decimal(self.amount)
        if self.status == 'completed' and self.amount > 0:
            paid_total = self.invoice.payments.exclude(pk=self.pk).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
            self.invoice.paid_amount = normalize_decimal(paid_total) + self.amount
            self.invoice.update_payment_status()
            self.invoice.save(update_fields=['paid_amount', 'status', 'updated_at'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.full_name} - {self.amount}"
