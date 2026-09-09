from decimal import Decimal
from rest_framework import serializers

from students.models import Student
from .models import FeeType, FeeStructure, StudentFee, Invoice, Payment


class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = '__all__'


class FeeStructureSerializer(serializers.ModelSerializer):
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = '__all__'


class StudentFeeSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.ReadOnlyField()
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    fee_name = serializers.CharField(source='fee_type.name', read_only=True)
    amount_due = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    academic_year = serializers.CharField(max_length=20, required=False)

    class Meta:
        model = StudentFee
        fields = '__all__'

    def validate(self, attrs):
        fee_type = attrs.get('fee_type')
        if fee_type:
            if 'amount_due' not in attrs or attrs.get('amount_due') is None:
                attrs['amount_due'] = fee_type.amount
            if 'academic_year' not in attrs or not attrs.get('academic_year'):
                attrs['academic_year'] = fee_type.academic_year
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), required=False)

    class Meta:
        model = Payment
        fields = '__all__'

    def validate(self, attrs):
        amount = attrs.get('amount')
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({'amount': 'Payment amount must be greater than zero.'})

        invoice = attrs.get('invoice')
        student = attrs.get('student')
        if invoice and not student:
            attrs['student'] = invoice.student
        elif invoice and student and invoice.student_id != student.id:
            raise serializers.ValidationError({'student': 'Student does not match the invoice recipient.'})

        return attrs


class InvoiceSerializer(serializers.ModelSerializer):
    balance = serializers.ReadOnlyField()
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_number = serializers.CharField(source='student.student_id', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.full_name', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'

    def validate(self, attrs):
        subtotal = attrs.get('subtotal', Decimal('0.00'))
        tax = attrs.get('tax', Decimal('0.00'))
        total_amount = attrs.get('total_amount', Decimal('0.00'))
        if total_amount == Decimal('0.00') and (subtotal > Decimal('0.00') or tax > Decimal('0.00')):
            attrs['total_amount'] = subtotal + tax
        return attrs
