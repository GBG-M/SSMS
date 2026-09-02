from rest_framework import serializers

from .models import FeeType, FeeStructure, StudentFee, Invoice, Payment


class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = '__all__'


class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = '__all__'


class StudentFeeSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.ReadOnlyField()
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    fee_name = serializers.CharField(source='fee_type.name', read_only=True)

    class Meta:
        model = StudentFee
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    balance = serializers.ReadOnlyField()
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
