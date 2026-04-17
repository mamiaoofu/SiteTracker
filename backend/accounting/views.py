from rest_framework import viewsets
from .models import Invoice, Receipt, TaxRecord, IncomeRecord
from .serializers import InvoiceSerializer, ReceiptSerializer, TaxRecordSerializer, IncomeRecordSerializer
from core.permissions import IsAdminOrAccountant


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('project', 'created_by').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrAccountant]
    filterset_fields = ['project', 'invoice_type', 'status']
    search_fields = ['invoice_number', 'client_name', 'description']
    ordering_fields = ['issue_date', 'total', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.select_related('project', 'invoice', 'created_by').all()
    serializer_class = ReceiptSerializer
    permission_classes = [IsAdminOrAccountant]
    filterset_fields = ['project', 'invoice']
    search_fields = ['receipt_number', 'payer_name', 'description']
    ordering_fields = ['issue_date', 'amount']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaxRecordViewSet(viewsets.ModelViewSet):
    queryset = TaxRecord.objects.select_related('project', 'invoice').all()
    serializer_class = TaxRecordSerializer
    permission_classes = [IsAdminOrAccountant]
    filterset_fields = ['project', 'tax_type', 'direction']
    search_fields = ['description']
    ordering_fields = ['date', 'tax_amount']


class IncomeRecordViewSet(viewsets.ModelViewSet):
    queryset = IncomeRecord.objects.select_related('project', 'invoice', 'created_by').all()
    serializer_class = IncomeRecordSerializer
    permission_classes = [IsAdminOrAccountant]
    filterset_fields = ['project', 'source']
    search_fields = ['description']
    ordering_fields = ['date', 'amount']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
