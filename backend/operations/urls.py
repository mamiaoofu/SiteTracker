from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'daily-logs', views.DailyLogViewSet)
router.register(r'labor-logs', views.LaborLogViewSet)
router.register(r'material-logs', views.MaterialLogViewSet)
router.register(r'progress-updates', views.ProgressUpdateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
