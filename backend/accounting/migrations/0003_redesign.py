from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0002_project_enhancements'),
        ('accounting', '0002_initial'),
    ]

    operations = [
        # Drop the old TaxRecord table and recreate
        migrations.DeleteModel(
            name='TaxRecord',
        ),
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invoice_number', models.CharField(max_length=50, unique=True)),
                ('invoice_type', models.CharField(choices=[('receivable', 'Receivable'), ('payable', 'Payable')], max_length=20)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('sent', 'Sent'), ('paid', 'Paid'), ('overdue', 'Overdue'), ('cancelled', 'Cancelled')], default='draft', max_length=20)),
                ('client_name', models.CharField(max_length=255)),
                ('subtotal', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('vat_rate', models.DecimalField(decimal_places=2, default=7.00, max_digits=5)),
                ('vat_amount', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('wht_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('wht_amount', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('total', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('description', models.TextField(blank=True)),
                ('issue_date', models.DateField()),
                ('due_date', models.DateField()),
                ('paid_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='core.project')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'invoices',
                'ordering': ['-issue_date'],
            },
        ),
        migrations.CreateModel(
            name='Receipt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('receipt_number', models.CharField(max_length=50, unique=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=14)),
                ('payer_name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('payment_method', models.CharField(default='transfer', max_length=20)),
                ('issue_date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='receipts', to='core.project')),
                ('invoice', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receipts', to='accounting.invoice')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='receipts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'receipts',
                'ordering': ['-issue_date'],
            },
        ),
        migrations.CreateModel(
            name='TaxRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tax_type', models.CharField(choices=[('vat', 'VAT'), ('wht', 'WHT')], max_length=10)),
                ('direction', models.CharField(choices=[('input', 'Input (ซื้อ)'), ('output', 'Output (ขาย)')], default='output', max_length=10)),
                ('base_amount', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('tax_rate', models.DecimalField(decimal_places=2, default=7.00, max_digits=5)),
                ('tax_amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('description', models.TextField(blank=True)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tax_records', to='core.project')),
                ('invoice', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tax_records', to='accounting.invoice')),
            ],
            options={
                'db_table': 'tax_records',
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='IncomeRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source', models.CharField(choices=[('contract', 'Contract Payment'), ('milestone', 'Milestone Payment'), ('retention', 'Retention Release'), ('other', 'Other')], max_length=20)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=14)),
                ('description', models.TextField(blank=True)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incomes', to='core.project')),
                ('invoice', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incomes', to='accounting.invoice')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incomes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'income_records',
                'ordering': ['-date'],
            },
        ),
    ]
