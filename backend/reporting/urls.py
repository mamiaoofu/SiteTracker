from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/summary/', views.dashboard_summary, name='dashboard-summary'),
    path('dashboard/project/<int:project_id>/', views.project_dashboard, name='project-dashboard'),
    path('reports/project/', views.report_project, name='report-project'),
    path('reports/finance/', views.report_finance, name='report-finance'),
    path('reports/worker/', views.report_worker, name='report-worker'),
    path('reports/export/', views.export_excel, name='report-export'),
]
