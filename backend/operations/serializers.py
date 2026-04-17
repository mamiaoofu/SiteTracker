from rest_framework import serializers
from .models import (
    DailyLog, DailyLogImage, LaborLog,
    MaterialLog, MaterialLogImage,
    ProgressUpdate, ProgressUpdateImage,
)


class DailyLogImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLogImage
        fields = ['id', 'image', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']


class DailyLogSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    images = DailyLogImageSerializer(many=True, read_only=True)

    class Meta:
        model = DailyLog
        fields = ['id', 'project', 'project_name', 'notes', 'weather', 'images',
                  'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']


class LaborLogSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    calculated_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = LaborLog
        fields = [
            'id', 'project', 'project_name', 'worker', 'worker_name',
            'date', 'status', 'advance_amount', 'notes',
            'calculated_amount', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class MaterialLogImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialLogImage
        fields = ['id', 'image', 'created_at']
        read_only_fields = ['id', 'created_at']


class MaterialLogSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    images = MaterialLogImageSerializer(many=True, read_only=True)

    class Meta:
        model = MaterialLog
        fields = [
            'id', 'project', 'project_name', 'categories', 'description',
            'amount', 'payment_type', 'supplier', 'images',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class ProgressUpdateImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressUpdateImage
        fields = ['id', 'image', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProgressUpdateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    phase_name = serializers.CharField(source='phase.name', read_only=True, default=None)
    images = ProgressUpdateImageSerializer(many=True, read_only=True)

    class Meta:
        model = ProgressUpdate
        fields = [
            'id', 'project', 'project_name',
            'progress_percentage', 'phase', 'phase_name',
            'work_description', 'worker_count', 'issues',
            'images', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def validate_progress_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('ค่าความคืบหน้าต้องอยู่ระหว่าง 0-100')
        return value
