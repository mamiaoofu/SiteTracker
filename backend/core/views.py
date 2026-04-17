from django.db.models import Count, Sum, Q
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import User, Project, Worker, Category, ProjectPhase, PhaseTemplate
from .serializers import (
    UserSerializer, UserCreateSerializer, UserMeSerializer,
    ProjectListSerializer, ProjectDetailSerializer,
    WorkerSerializer, CategorySerializer, ProjectPhaseSerializer,
    PhaseTemplateSerializer
)
from .permissions import IsAdmin, IsAdminOrReadOnly, IsAdminOrForeman


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user profile."""
    serializer = UserMeSerializer(request.user)
    return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAdmin]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['is_active', 'status']
    search_fields = ['name', 'location', 'description']
    ordering_fields = ['name', 'created_at', 'budget', 'progress']

    def get_queryset(self):
        return Project.objects.annotate(
            worker_count=Count(
                'labor_logs__worker',
                filter=Q(labor_logs__status='present'),
                distinct=True,
            ),
            labor_log_count=Count('labor_logs', distinct=True),
            total_expenses=Sum('expenses__amount'),
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectListSerializer

    @action(detail=True, methods=['get'])
    def gallery(self, request, pk=None):
        """Get all daily log images for a project."""
        from operations.models import DailyLogImage
        images = DailyLogImage.objects.filter(
            daily_log__project_id=pk
        ).select_related('daily_log').order_by('-created_at')
        data = [{
            'id': img.id,
            'image': request.build_absolute_uri(img.image.url),
            'caption': img.caption,
            'date': img.daily_log.created_at,
        } for img in images[:50]]
        return Response(data)


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.select_related('project').all()
    serializer_class = WorkerSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['is_active', 'project']
    search_fields = ['name', 'phone', 'role']
    ordering_fields = ['name', 'daily_rate', 'created_at']


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name']


class ProjectPhaseViewSet(viewsets.ModelViewSet):
    """Manage phases per project. Filter by ?project=<id>."""
    queryset = ProjectPhase.objects.select_related('project', 'created_by').all()
    serializer_class = ProjectPhaseSerializer
    permission_classes = [IsAdminOrForeman]
    filterset_fields = ['project']
    ordering_fields = ['order']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def apply_template(self, request):
        """Copy all PhaseTemplates into a specific project.

        POST /api/project-phases/apply_template/
        body: { "project": <project_id> }
        Skips templates whose name already exists in that project.
        """
        project_id = request.data.get('project')
        if not project_id:
            return Response({'detail': 'project is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        templates = PhaseTemplate.objects.all()
        existing_names = set(project.phases.values_list('name', flat=True))
        created = []
        for tmpl in templates:
            if tmpl.name not in existing_names:
                phase = ProjectPhase.objects.create(
                    project=project, name=tmpl.name,
                    order=tmpl.order, created_by=request.user,
                )
                created.append(phase)
        serializer = ProjectPhaseSerializer(created, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PhaseTemplateViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for organisation-wide phase templates."""
    queryset = PhaseTemplate.objects.all()
    serializer_class = PhaseTemplateSerializer
    permission_classes = [IsAdmin]
    ordering_fields = ['order']
