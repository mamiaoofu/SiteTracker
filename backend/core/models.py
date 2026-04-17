from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access."""
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('foreman', 'Foreman'),
        ('accountant', 'Accountant'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='foreman')
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class Project(models.Model):
    """Construction project."""
    STATUS_CHOICES = (
        ('planning', 'Planning'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    progress = models.IntegerField(default=0, help_text='Progress percentage 0-100')
    current_phase = models.ForeignKey(
        'ProjectPhase', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='current_for_projects'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class PhaseTemplate(models.Model):
    """Organisation-wide phase templates managed by Admin."""
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0, help_text='ลำดับเริ่มต้น')

    class Meta:
        db_table = 'phase_templates'
        ordering = ['order', 'id']

    def __str__(self):
        return self.name


class ProjectPhase(models.Model):
    """Flexible phase definition per project."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='phases')
    name = models.CharField(max_length=100)
    progress = models.IntegerField(default=0, help_text='Phase progress 0-100')
    order = models.PositiveIntegerField(default=0, help_text='ลำดับเฟส (น้อย→มาก)')
    created_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_phases'
    )

    class Meta:
        db_table = 'project_phases'
        ordering = ['order', 'id']
        unique_together = ['project', 'name']

    def __str__(self):
        return f"{self.name} ({self.project.name})"


class Worker(models.Model):
    """Construction worker."""
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='workers'
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=100, blank=True, help_text='e.g. Mason, Electrician')
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'workers'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} (฿{self.daily_rate}/day)"


class Category(models.Model):
    """Material/expense category."""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name
