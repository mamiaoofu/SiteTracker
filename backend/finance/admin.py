from django.contrib import admin
from .models import Expense, ExpenseImage, Payment


class ExpenseImageInline(admin.TabularInline):
    model = ExpenseImage
    extra = 1


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['project', 'expense_type', 'amount', 'status', 'date']
    list_filter = ['expense_type', 'status', 'date', 'project']
    inlines = [ExpenseImageInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['project', 'amount', 'payment_type', 'method', 'date']
    list_filter = ['payment_type', 'method', 'date', 'project']
