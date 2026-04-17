import io
from datetime import datetime
from django.db.models import Sum, Count, Q, F
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.models import Project, Worker
from finance.models import Expense, Payment
from operations.models import DailyLog, LaborLog, MaterialLog

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Dashboard summary with overall statistics."""
    today = timezone.now().date()

    total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
    total_payments = Payment.objects.aggregate(total=Sum('amount'))['total'] or 0
    today_expenses = Expense.objects.filter(date=today).aggregate(total=Sum('amount'))['total'] or 0

    active_projects = Project.objects.filter(is_active=True).count()
    total_workers = Worker.objects.filter(is_active=True).count()
    total_daily_logs = DailyLog.objects.filter(created_at__date=today).count()
    total_labor_logs = LaborLog.objects.filter(date=today).count()
    total_material_logs = MaterialLog.objects.filter(created_at__date=today).count()

    labor_expenses = Expense.objects.filter(expense_type='labor').aggregate(total=Sum('amount'))['total'] or 0
    material_expenses = Expense.objects.filter(expense_type='material').aggregate(total=Sum('amount'))['total'] or 0

    pending_expenses = Expense.objects.filter(status='pending').count()

    return Response({
        'total_expenses': float(total_expenses),
        'total_payments': float(total_payments),
        'today_expenses': float(today_expenses),
        'outstanding': float(total_expenses - total_payments),
        'active_projects': active_projects,
        'total_workers': total_workers,
        'pending_expenses': pending_expenses,
        'today': {
            'daily_logs': total_daily_logs,
            'labor_logs': total_labor_logs,
            'material_logs': total_material_logs,
        },
        'expenses_by_type': {
            'labor': float(labor_expenses),
            'material': float(material_expenses),
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def project_dashboard(request, project_id):
    """Project-specific dashboard."""
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    today = timezone.now().date()

    project_expenses = Expense.objects.filter(project=project).aggregate(total=Sum('amount'))['total'] or 0
    project_payments = Payment.objects.filter(project=project).aggregate(total=Sum('amount'))['total'] or 0
    today_expenses = Expense.objects.filter(project=project, date=today).aggregate(total=Sum('amount'))['total'] or 0

    labor_expenses = Expense.objects.filter(project=project, expense_type='labor').aggregate(total=Sum('amount'))['total'] or 0
    material_expenses = Expense.objects.filter(project=project, expense_type='material').aggregate(total=Sum('amount'))['total'] or 0

    daily_log_count = DailyLog.objects.filter(project=project).count()
    labor_log_count = LaborLog.objects.filter(project=project).count()
    material_log_count = MaterialLog.objects.filter(project=project).count()
    worker_count = Worker.objects.filter(project=project, is_active=True).count()

    return Response({
        'project': {
            'id': project.id,
            'name': project.name,
            'location': project.location,
            'status': project.status,
            'budget': float(project.budget),
            'progress': project.progress,
            'start_date': project.start_date,
            'end_date': project.end_date,
        },
        'total_expenses': float(project_expenses),
        'total_payments': float(project_payments),
        'today_expenses': float(today_expenses),
        'outstanding': float(project_expenses - project_payments),
        'budget_remaining': float(project.budget - project_expenses) if project.budget else 0,
        'expenses_by_type': {
            'labor': float(labor_expenses),
            'material': float(material_expenses),
        },
        'counts': {
            'daily_logs': daily_log_count,
            'labor_logs': labor_log_count,
            'material_logs': material_log_count,
            'workers': worker_count,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_project(request):
    """Generate project report with filters."""
    project_id = request.query_params.get('project')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    projects = Project.objects.annotate(
        total_expenses=Sum('expenses__amount'),
        total_payments=Sum('payments__amount'),
        worker_count=Count('workers', filter=Q(workers__is_active=True), distinct=True),
    )
    if project_id:
        projects = projects.filter(id=project_id)

    data = []
    for p in projects:
        expenses_qs = Expense.objects.filter(project=p)
        if date_from:
            expenses_qs = expenses_qs.filter(date__gte=date_from)
        if date_to:
            expenses_qs = expenses_qs.filter(date__lte=date_to)

        total = expenses_qs.aggregate(total=Sum('amount'))['total'] or 0
        labor = expenses_qs.filter(expense_type='labor').aggregate(total=Sum('amount'))['total'] or 0
        material = expenses_qs.filter(expense_type='material').aggregate(total=Sum('amount'))['total'] or 0

        data.append({
            'id': p.id,
            'name': p.name,
            'location': p.location,
            'status': p.status,
            'budget': float(p.budget),
            'progress': p.progress,
            'total_expenses': float(total),
            'labor_expenses': float(labor),
            'material_expenses': float(material),
            'worker_count': p.worker_count or 0,
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_finance(request):
    """Generate finance report with filters."""
    project_id = request.query_params.get('project')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    expense_type = request.query_params.get('expense_type')

    expenses = Expense.objects.select_related('project').all()
    if project_id:
        expenses = expenses.filter(project_id=project_id)
    if date_from:
        expenses = expenses.filter(date__gte=date_from)
    if date_to:
        expenses = expenses.filter(date__lte=date_to)
    if expense_type:
        expenses = expenses.filter(expense_type=expense_type)

    data = [{
        'id': e.id,
        'project_name': e.project.name,
        'expense_type': e.expense_type,
        'amount': float(e.amount),
        'description': e.description,
        'status': e.status,
        'date': str(e.date),
    } for e in expenses[:500]]

    summary = expenses.aggregate(
        total=Sum('amount'),
        labor_total=Sum('amount', filter=Q(expense_type='labor')),
        material_total=Sum('amount', filter=Q(expense_type='material')),
    )

    return Response({
        'items': data,
        'summary': {
            'total': float(summary['total'] or 0),
            'labor': float(summary['labor_total'] or 0),
            'material': float(summary['material_total'] or 0),
            'count': expenses.count(),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_worker(request):
    """Generate worker report with filters."""
    project_id = request.query_params.get('project')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    workers = Worker.objects.filter(is_active=True)
    if project_id:
        workers = workers.filter(project_id=project_id)

    data = []
    for w in workers:
        logs = LaborLog.objects.filter(worker=w)
        if project_id:
            logs = logs.filter(project_id=project_id)
        if date_from:
            logs = logs.filter(date__gte=date_from)
        if date_to:
            logs = logs.filter(date__lte=date_to)

        present = logs.filter(status='present').count()
        half_day = logs.filter(status='half_day').count()
        absent = logs.filter(status='absent').count()
        total_advance = logs.aggregate(total=Sum('advance_amount'))['total'] or 0
        total_earned = (present * w.daily_rate) + (half_day * w.daily_rate / 2)

        data.append({
            'id': w.id,
            'name': w.name,
            'role': w.role,
            'project_name': w.project.name if w.project else '-',
            'daily_rate': float(w.daily_rate),
            'days_present': present,
            'days_half': half_day,
            'days_absent': absent,
            'total_days': present + half_day + absent,
            'total_earned': float(total_earned),
            'total_advance': float(total_advance),
            'net_pay': float(total_earned - total_advance),
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_excel(request):
    """Export report data to Excel."""
    if not HAS_OPENPYXL:
        return Response({'error': 'openpyxl not installed'}, status=500)

    report_type = request.query_params.get('type', 'finance')
    project_id = request.query_params.get('project')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')

    wb = openpyxl.Workbook()
    ws = wb.active

    if report_type == 'finance':
        ws.title = 'Finance Report'
        headers = ['Date', 'Project', 'Type', 'Amount', 'Status', 'Description']
        ws.append(headers)

        expenses = Expense.objects.select_related('project').all()
        if project_id:
            expenses = expenses.filter(project_id=project_id)
        if date_from:
            expenses = expenses.filter(date__gte=date_from)
        if date_to:
            expenses = expenses.filter(date__lte=date_to)

        for e in expenses:
            ws.append([str(e.date), e.project.name, e.expense_type, float(e.amount), e.status, e.description])

    elif report_type == 'worker':
        ws.title = 'Worker Report'
        headers = ['Name', 'Role', 'Project', 'Daily Rate', 'Days Present', 'Half Days', 'Absent', 'Total Earned', 'Advance', 'Net Pay']
        ws.append(headers)

        workers = Worker.objects.filter(is_active=True).select_related('project')
        if project_id:
            workers = workers.filter(project_id=project_id)

        for w in workers:
            logs = LaborLog.objects.filter(worker=w)
            if date_from:
                logs = logs.filter(date__gte=date_from)
            if date_to:
                logs = logs.filter(date__lte=date_to)

            present = logs.filter(status='present').count()
            half_day = logs.filter(status='half_day').count()
            absent = logs.filter(status='absent').count()
            total_advance = logs.aggregate(total=Sum('advance_amount'))['total'] or 0
            total_earned = (present * w.daily_rate) + (half_day * w.daily_rate / 2)

            ws.append([
                w.name, w.role, w.project.name if w.project else '-',
                float(w.daily_rate), present, half_day, absent,
                float(total_earned), float(total_advance), float(total_earned - total_advance)
            ])

    elif report_type == 'project':
        ws.title = 'Project Report'
        headers = ['Project', 'Location', 'Status', 'Budget', 'Progress', 'Total Expenses', 'Workers']
        ws.append(headers)

        projects = Project.objects.all()
        if project_id:
            projects = projects.filter(id=project_id)

        for p in projects:
            total_exp = Expense.objects.filter(project=p).aggregate(t=Sum('amount'))['t'] or 0
            wc = Worker.objects.filter(project=p, is_active=True).count()
            ws.append([p.name, p.location, p.status, float(p.budget), p.progress, float(total_exp), wc])

    # Style header row
    for cell in ws[1]:
        cell.font = openpyxl.styles.Font(bold=True)

    # Auto-fit column widths
    for column_cells in ws.columns:
        length = max(len(str(cell.value or '')) for cell in column_cells)
        ws.column_dimensions[column_cells[0].column_letter].width = min(length + 2, 40)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=report_{report_type}_{timezone.now().strftime("%Y%m%d")}.xlsx'
    return response
