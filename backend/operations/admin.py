from django.contrib import admin
from .models import (
    DailyLog, DailyLogImage, LaborLog,
    MaterialLog, MaterialLogImage,
    ProgressUpdate, ProgressUpdateImage,
)


class DailyLogImageInline(admin.TabularInline):
    model = DailyLogImage
    extra = 1


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ['project', 'created_by', 'created_at']
    list_filter = ['project', 'created_at']
    inlines = [DailyLogImageInline]


@admin.register(LaborLog)
class LaborLogAdmin(admin.ModelAdmin):
    list_display = ['project', 'worker', 'date', 'status', 'advance_amount']
    list_filter = ['project', 'status', 'date']


class MaterialLogImageInline(admin.TabularInline):
    model = MaterialLogImage
    extra = 1


@admin.register(MaterialLog)
class MaterialLogAdmin(admin.ModelAdmin):
    list_display = ['project', 'categories', 'amount', 'payment_type', 'created_at']
    list_filter = ['project', 'payment_type', 'created_at']
    inlines = [MaterialLogImageInline]


class ProgressUpdateImageInline(admin.TabularInline):
    model = ProgressUpdateImage
    extra = 1


@admin.register(ProgressUpdate)
class ProgressUpdateAdmin(admin.ModelAdmin):
    list_display = ['project', 'progress_percentage', 'phase', 'worker_count', 'created_by', 'created_at']
    list_filter = ['project', 'phase', 'created_at']
    inlines = [ProgressUpdateImageInline]
