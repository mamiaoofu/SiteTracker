from rest_framework import serializers
from .models import Expense, ExpenseImage, Payment


class ExpenseImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseImage
        fields = ['id', 'image', 'created_at']
        read_only_fields = ['id', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, default=None)
    images = ExpenseImageSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'project', 'project_name', 'expense_type', 'reference_id',
                  'amount', 'description', 'date', 'status', 'status_display',
                  'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'review_notes',
                  'images', 'created_at']
        read_only_fields = ['id', 'created_at', 'reviewed_by', 'reviewed_at']


class PaymentSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'project', 'project_name', 'amount', 'payment_type',
                  'method', 'description', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']
