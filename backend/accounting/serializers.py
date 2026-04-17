from rest_framework import serializers
from .models import Invoice, Receipt, TaxRecord, IncomeRecord


class InvoiceSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = Invoice
        fields = [
            'id', 'project', 'project_name', 'invoice_number', 'invoice_type',
            'status', 'client_name', 'subtotal', 'vat_rate', 'vat_amount',
            'wht_rate', 'wht_amount', 'total', 'description',
            'issue_date', 'due_date', 'paid_date',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'vat_amount', 'wht_amount', 'total', 'created_by', 'created_at', 'updated_at']


class ReceiptSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = Receipt
        fields = [
            'id', 'invoice', 'project', 'project_name', 'receipt_number',
            'amount', 'payer_name', 'description', 'payment_method',
            'issue_date', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class TaxRecordSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = TaxRecord
        fields = [
            'id', 'project', 'project_name', 'invoice', 'tax_type',
            'direction', 'base_amount', 'tax_rate', 'tax_amount',
            'description', 'date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class IncomeRecordSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = IncomeRecord
        fields = [
            'id', 'project', 'project_name', 'invoice', 'source',
            'amount', 'description', 'date',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
