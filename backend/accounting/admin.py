from django.contrib import admin
from .models import Invoice, Receipt, TaxRecord, IncomeRecord


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'project', 'invoice_type', 'status', 'total', 'issue_date']
    list_filter = ['invoice_type', 'status', 'issue_date']
    search_fields = ['invoice_number', 'client_name']


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'project', 'amount', 'payer_name', 'issue_date']
    list_filter = ['issue_date']
    search_fields = ['receipt_number', 'payer_name']


@admin.register(TaxRecord)
class TaxRecordAdmin(admin.ModelAdmin):
    list_display = ['project', 'tax_type', 'direction', 'tax_amount', 'date']
    list_filter = ['tax_type', 'direction', 'date']


@admin.register(IncomeRecord)
class IncomeRecordAdmin(admin.ModelAdmin):
    list_display = ['project', 'source', 'amount', 'date']
    list_filter = ['source', 'date']
