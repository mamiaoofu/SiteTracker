from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import (
    DailyLog, DailyLogImage, LaborLog,
    MaterialLog, MaterialLogImage,
    ProgressUpdate, ProgressUpdateImage,
)
from .serializers import (
    DailyLogSerializer, LaborLogSerializer,
    MaterialLogSerializer, ProgressUpdateSerializer,
)
from core.permissions import IsAdminOrForeman
from finance.models import Expense


class DailyLogViewSet(viewsets.ModelViewSet):
    queryset = DailyLog.objects.select_related('project', 'created_by').prefetch_related('images').all()
    serializer_class = DailyLogSerializer
    permission_classes = [IsAdminOrForeman]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['project']
    search_fields = ['notes', 'project__name']

    def perform_create(self, serializer):
        daily_log = serializer.save(created_by=self.request.user)
        images = self.request.FILES.getlist('images')
        for img in images:
            DailyLogImage.objects.create(daily_log=daily_log, image=img)

    def perform_update(self, serializer):
        daily_log = serializer.save()
        images = self.request.FILES.getlist('images')
        for img in images:
            DailyLogImage.objects.create(daily_log=daily_log, image=img)
        # Delete specific images if requested
        delete_ids = self.request.data.get('delete_image_ids', [])
        if delete_ids:
            DailyLogImage.objects.filter(id__in=delete_ids, daily_log=daily_log).delete()


class LaborLogViewSet(viewsets.ModelViewSet):
    queryset = LaborLog.objects.select_related('project', 'worker', 'created_by').all()
    serializer_class = LaborLogSerializer
    permission_classes = [IsAdminOrForeman]
    filterset_fields = ['project', 'worker', 'date', 'status']
    search_fields = ['worker__name', 'project__name', 'notes']

    def perform_create(self, serializer):
        labor_log = serializer.save(created_by=self.request.user)
        amount = labor_log.calculated_amount + labor_log.advance_amount
        if amount > 0:
            Expense.objects.create(
                project=labor_log.project,
                expense_type='labor',
                reference_id=labor_log.id,
                amount=amount,
                date=labor_log.date,
                description=f"Labor: {labor_log.worker.name}",
            )


class MaterialLogViewSet(viewsets.ModelViewSet):
    queryset = MaterialLog.objects.select_related('project', 'created_by').prefetch_related('images').all()
    serializer_class = MaterialLogSerializer
    permission_classes = [IsAdminOrForeman]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['project', 'payment_type']
    search_fields = ['description', 'project__name', 'supplier']

    def perform_create(self, serializer):
        material_log = serializer.save(created_by=self.request.user)
        # Handle multi-image upload for receipts
        images = self.request.FILES.getlist('images')
        for img in images:
            MaterialLogImage.objects.create(material_log=material_log, image=img)
        # Auto-create expense record
        cats = ', '.join(material_log.categories) if material_log.categories else 'Material'
        Expense.objects.create(
            project=material_log.project,
            expense_type='material',
            reference_id=material_log.id,
            amount=material_log.amount,
            date=material_log.created_at.date(),
            description=f"Material: {cats}",
        )


class ProgressUpdateViewSet(viewsets.ModelViewSet):
    """ViewSet for foreman progress updates."""
    queryset = ProgressUpdate.objects.select_related(
        'project', 'created_by', 'phase'
    ).prefetch_related('images').all()
    serializer_class = ProgressUpdateSerializer
    permission_classes = [IsAdminOrForeman]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['project', 'phase']
    search_fields = ['work_description', 'project__name']
    ordering_fields = ['created_at', 'progress_percentage']

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        new_progress = serializer.validated_data['progress_percentage']
        new_phase = serializer.validated_data.get('phase', None)

        # Prevent phase progress from decreasing
        if new_phase and new_progress < new_phase.progress:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'progress_percentage': f'ค่าความคืบหน้าเฟสไม่สามารถลดลงได้ (ปัจจุบัน: {new_phase.progress}%)'
            })

        progress_update = serializer.save(created_by=self.request.user)

        # Handle multi-image upload
        images = self.request.FILES.getlist('images')
        for img in images:
            ProgressUpdateImage.objects.create(progress_update=progress_update, image=img)

        # Update phase progress
        if new_phase:
            new_phase.progress = new_progress
            new_phase.save(update_fields=['progress'])
            project.current_phase = new_phase

        # Recalculate overall project progress from all phase averages
        from django.db.models import Avg
        avg = project.phases.aggregate(avg_progress=Avg('progress'))['avg_progress']
        project.progress = round(avg) if avg is not None else 0

        if project.progress == 100:
            project.status = 'completed'
        elif project.status == 'planning':
            project.status = 'in_progress'
        project.save(update_fields=['progress', 'current_phase', 'status', 'updated_at'])
