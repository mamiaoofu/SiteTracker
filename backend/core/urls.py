from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'projects', views.ProjectViewSet)
router.register(r'project-phases', views.ProjectPhaseViewSet)
router.register(r'phase-templates', views.PhaseTemplateViewSet)
router.register(r'workers', views.WorkerViewSet)
router.register(r'categories', views.CategoryViewSet)

urlpatterns = [
    path('me/', views.me, name='me'),
    path('', include(router.urls)),
]
