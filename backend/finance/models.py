from django.db import models
from django.conf import settings


class Expense(models.Model):
    """Centralized expense record — created from labor_logs and material_logs."""
    EXPENSE_TYPE_CHOICES = (
        ('labor', 'Labor'),
        ('material', 'Material'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('need_revision', 'Need Revision'),
    )
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='expenses')
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPE_CHOICES)
    reference_id = models.IntegerField(null=True, blank=True, help_text='ID of the source record (labor_log or material_log)')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_expenses'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date']

    def __str__(self):
        return f"{self.get_expense_type_display()} - ฿{self.amount} ({self.project.name})"


class ExpenseImage(models.Model):
    """Receipt images for expenses."""
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='expenses/%Y/%m/%d/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expense_images'


class Payment(models.Model):
    """Payment record — separate from expenses."""
    PAYMENT_TYPE_CHOICES = (
        ('labor', 'Labor Payment'),
        ('material', 'Material Payment'),
        ('other', 'Other Payment'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    )
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    description = models.TextField(blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-date']

    def __str__(self):
        return f"Payment ฿{self.amount} - {self.project.name} ({self.date})"
