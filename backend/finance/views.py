from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Expense, ExpenseImage, Payment
from .serializers import ExpenseSerializer, PaymentSerializer
from core.permissions import IsAdminOrAccountant, IsAdmin


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('project', 'reviewed_by').prefetch_related('images').all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdminOrAccountant]
    filterset_fields = ['project', 'expense_type', 'date', 'status']
    search_fields = ['description', 'project__name']
    ordering_fields = ['date', 'amount', 'created_at']

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        expense = self.get_object()
        expense.status = 'approved'
        expense.reviewed_by = request.user
        expense.reviewed_at = timezone.now()
        expense.review_notes = request.data.get('notes', '')
        expense.save()
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        expense = self.get_object()
        expense.status = 'rejected'
        expense.reviewed_by = request.user
        expense.reviewed_at = timezone.now()
        expense.review_notes = request.data.get('notes', '')
        expense.save()
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def request_revision(self, request, pk=None):
        expense = self.get_object()
        expense.status = 'need_revision'
        expense.reviewed_by = request.user
        expense.reviewed_at = timezone.now()
        expense.review_notes = request.data.get('notes', '')
        expense.save()
        return Response(ExpenseSerializer(expense).data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('project').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrAccountant]
    filterset_fields = ['project', 'payment_type', 'method', 'date']
    search_fields = ['description', 'project__name']
    ordering_fields = ['date', 'amount', 'created_at']
