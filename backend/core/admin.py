from django.contrib import admin
from .models import User, Project, Worker, Category, ProjectPhase, PhaseTemplate


class ProjectPhaseInline(admin.TabularInline):
    model = ProjectPhase
    extra = 1
    ordering = ['order']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'first_name', 'last_name']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'is_active', 'created_at']
    list_filter = ['is_active']
    inlines = [ProjectPhaseInline]

@admin.register(ProjectPhase)
class ProjectPhaseAdmin(admin.ModelAdmin):
    list_display = ['project', 'name', 'progress', 'order', 'created_by']
    list_filter = ['project']
    ordering = ['project', 'order']

@admin.register(PhaseTemplate)
class PhaseTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'order']
    ordering = ['order']

@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ['name', 'daily_rate', 'is_active']
    list_filter = ['is_active']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
