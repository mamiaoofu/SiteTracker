from rest_framework import serializers
from .models import User, Project, Worker, Category, ProjectPhase, PhaseTemplate


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'is_active']
        read_only_fields = ['id']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserMeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class WorkerSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True, default=None)

    class Meta:
        model = Worker
        fields = ['id', 'name', 'phone', 'role', 'daily_rate', 'is_active', 'project', 'project_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProjectPhaseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = ProjectPhase
        fields = ['id', 'project', 'name', 'progress', 'order', 'created_by', 'created_by_name']
        read_only_fields = ['id', 'created_by']


class PhaseTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhaseTemplate
        fields = ['id', 'name', 'order']
        read_only_fields = ['id']


class ProjectListSerializer(serializers.ModelSerializer):
    worker_count = serializers.IntegerField(read_only=True, default=0)
    labor_log_count = serializers.IntegerField(read_only=True, default=0)
    total_expenses = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, default=0)
    current_phase = ProjectPhaseSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'location', 'status', 'budget',
            'start_date', 'end_date', 'progress', 'current_phase', 'is_active',
            'worker_count', 'labor_log_count', 'total_expenses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectDetailSerializer(serializers.ModelSerializer):
    workers = WorkerSerializer(many=True, read_only=True)
    phases = ProjectPhaseSerializer(many=True, read_only=True)
    worker_count = serializers.IntegerField(read_only=True, default=0)
    labor_log_count = serializers.IntegerField(read_only=True, default=0)
    total_expenses = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, default=0)
    current_phase = ProjectPhaseSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'location', 'status', 'budget',
            'start_date', 'end_date', 'progress', 'current_phase', 'is_active',
            'workers', 'phases', 'worker_count', 'labor_log_count', 'total_expenses',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']
