from django.db import models
from django.conf import settings


class Invoice(models.Model):
    """Invoice for billing customers or recording vendor invoices."""
    TYPE_CHOICES = (
        ('receivable', 'Receivable'),
        ('payable', 'Payable'),
    )
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    )
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    client_name = models.CharField(max_length=255)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=7.00)
    vat_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    wht_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    wht_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-issue_date']

    def __str__(self):
        return f"{self.invoice_number} - {self.client_name} (฿{self.total})"

    def save(self, *args, **kwargs):
        self.vat_amount = self.subtotal * self.vat_rate / 100
        self.wht_amount = self.subtotal * self.wht_rate / 100
        self.total = self.subtotal + self.vat_amount - self.wht_amount
        super().save(*args, **kwargs)


class Receipt(models.Model):
    """Official receipt issued for payments."""
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipts')
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='receipts')
    receipt_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payer_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    payment_method = models.CharField(max_length=20, default='transfer')
    issue_date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='receipts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'receipts'
        ordering = ['-issue_date']

    def __str__(self):
        return f"RC-{self.receipt_number} ฿{self.amount}"


class TaxRecord(models.Model):
    """Tax record for VAT/WHT tracking."""
    TAX_TYPE_CHOICES = (
        ('vat', 'VAT'),
        ('wht', 'WHT'),
    )
    DIRECTION_CHOICES = (
        ('input', 'Input (ซื้อ)'),
        ('output', 'Output (ขาย)'),
    )
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='tax_records')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='tax_records')
    tax_type = models.CharField(max_length=10, choices=TAX_TYPE_CHOICES)
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='output')
    base_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=7.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tax_records'
        ordering = ['-date']

    def __str__(self):
        return f"{self.get_tax_type_display()} ฿{self.tax_amount} - {self.project.name}"


class IncomeRecord(models.Model):
    """Income tracking for projects."""
    SOURCE_CHOICES = (
        ('contract', 'Contract Payment'),
        ('milestone', 'Milestone Payment'),
        ('retention', 'Retention Release'),
        ('other', 'Other'),
    )
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='incomes')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='incomes')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='incomes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'income_records'
        ordering = ['-date']

    def __str__(self):
        return f"Income ฿{self.amount} - {self.project.name}"
