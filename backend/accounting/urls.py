from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'receipts', views.ReceiptViewSet)
router.register(r'tax-records', views.TaxRecordViewSet)
router.register(r'incomes', views.IncomeRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
