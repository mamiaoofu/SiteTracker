from django.db import models
from django.conf import settings


class DailyLog(models.Model):
    """Daily site activity log."""
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='daily_logs')
    notes = models.TextField(blank=True)
    weather = models.CharField(max_length=50, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_logs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"DailyLog #{self.id} - {self.project.name} ({self.created_at:%Y-%m-%d})"


class DailyLogImage(models.Model):
    """Multiple images per daily log."""
    daily_log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='daily_logs/%Y/%m/%d/')
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_log_images'
        ordering = ['created_at']


class LaborLog(models.Model):
    """Labor attendance and payment log."""
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
    )
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='labor_logs')
    worker = models.ForeignKey('core.Worker', on_delete=models.CASCADE, related_name='labor_logs')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='labor_logs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'labor_logs'
        ordering = ['-date']
        unique_together = ['project', 'worker', 'date']

    def __str__(self):
        return f"{self.worker.name} - {self.project.name} ({self.date})"

    @property
    def calculated_amount(self):
        """Calculate labor cost based on status."""
        if self.status == 'present':
            return self.worker.daily_rate
        elif self.status == 'half_day':
            return self.worker.daily_rate / 2
        return 0


class MaterialLog(models.Model):
    """Material purchase log."""
    PAYMENT_TYPE_CHOICES = (
        ('cash', 'Cash'),
        ('credit', 'Credit'),
        ('transfer', 'Transfer'),
    )
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='material_logs')
    categories = models.JSONField(default=list, help_text='List of material categories')
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='cash')
    supplier = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='material_logs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'material_logs'
        ordering = ['-created_at']

    def __str__(self):
        cats = ', '.join(self.categories) if self.categories else 'N/A'
        return f"{cats} - ฿{self.amount} ({self.project.name})"


class MaterialLogImage(models.Model):
    """Multiple receipt images per material log."""
    material_log = models.ForeignKey(MaterialLog, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='material_logs/%Y/%m/%d/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'material_log_images'
        ordering = ['created_at']


class ProgressUpdate(models.Model):
    """Progress update submitted by foreman."""
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, related_name='progress_updates')
    progress_percentage = models.PositiveIntegerField(help_text='Progress percentage 0-100')
    phase = models.ForeignKey(
        'core.ProjectPhase', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='progress_updates'
    )
    work_description = models.TextField(help_text='รายละเอียดงานวันนี้')
    worker_count = models.PositiveIntegerField(default=0, help_text='จำนวนคนงานที่ใช้วันนี้')
    issues = models.TextField(blank=True, help_text='ปัญหาที่พบ (ถ้ามี)')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress_updates')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'progress_updates'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project.name} - {self.progress_percentage}% ({self.created_at:%Y-%m-%d})"


class ProgressUpdateImage(models.Model):
    """Multiple images per progress update."""
    progress_update = models.ForeignKey(ProgressUpdate, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='progress_updates/%Y/%m/%d/')
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'progress_update_images'
        ordering = ['created_at']
