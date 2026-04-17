from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import base64
import random

from core.models import Project, Worker, Category
from django.contrib.auth import get_user_model
from operations.models import LaborLog, MaterialLog, DailyLog
from finance.models import Expense, Payment
from accounting.models import TaxRecord


# 1x1 PNG (transparent) — used for DailyLog images
PNG_BASE64 = (
    b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/1w7SAAAAABJRU5ErkJggg=='
)


class Command(BaseCommand):
    help = 'Create mock/demo data for development'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Create even if projects exist')

    def handle(self, *args, **options):
        force = options.get('force', False)

        if Project.objects.exists() and not force:
            self.stdout.write(self.style.WARNING('Projects already exist — aborting. Use --force to run anyway.'))
            return

        User = get_user_model()
        admin = User.objects.filter(role='admin').first() or User.objects.filter(is_superuser=True).first()
        foreman = User.objects.filter(role='foreman').first() or admin
        accountant = User.objects.filter(role='accountant').first() or admin

        if not admin:
            self.stdout.write(self.style.ERROR('No admin user found. Please create one first.'))
            return

        with transaction.atomic():
            # Projects
            project_names = ['Central Plaza', 'Riverside Villas', 'Green Apartments']
            projects = []
            for i, name in enumerate(project_names, start=1):
                p, _ = Project.objects.get_or_create(
                    name=name,
                    defaults={
                        'description': f'Sample project {name}',
                        'location': f'Location {i}',
                        'is_active': True,
                    },
                )
                projects.append(p)
            self.stdout.write(self.style.SUCCESS(f'Created/Found {len(projects)} projects'))

            # Workers
            workers_data = [
                ('Somchai', '0812345670', 800),
                ('Somsri', '0812345671', 900),
                ('Wichean', '0812345672', 750),
                ('Narong', '0812345673', 850),
                ('Busaba', '0812345674', 700),
            ]
            workers = []
            for name, phone, rate in workers_data:
                w, _ = Worker.objects.get_or_create(name=name, defaults={'phone': phone, 'daily_rate': rate})
                workers.append(w)
            self.stdout.write(self.style.SUCCESS(f'Created/Found {len(workers)} workers'))

            # Categories
            categories = ['Cement', 'Sand', 'Steel', 'Equipment', 'Transport']
            for cat in categories:
                Category.objects.get_or_create(name=cat, defaults={'description': f'Demo category {cat}'})
            self.stdout.write(self.style.SUCCESS(f'Created/Found {len(categories)} categories'))

            # Material logs
            material_logs = []
            for proj in projects:
                for i in range(3):
                    cat = random.choice(categories)
                    amount = random.randint(2000, 20000)
                    ml = MaterialLog.objects.create(
                        project=proj,
                        category=cat,
                        description=f'Purchase of {cat} (batch {i+1})',
                        amount=amount,
                        payment_type=random.choice(['cash', 'transfer', 'credit']),
                        created_by=accountant or admin,
                    )
                    material_logs.append(ml)
            self.stdout.write(self.style.SUCCESS(f'Created {len(material_logs)} material logs'))

            # Labor logs
            labor_logs = []
            today = timezone.now().date()
            for proj in projects:
                for day_offset in range(1, 6):
                    date = today - timedelta(days=day_offset)
                    worker = random.choice(workers)
                    status = random.choice(['present', 'half_day', 'absent'])
                    advance = random.choice([0, 100, 200])
                    ll, _ = LaborLog.objects.get_or_create(
                        project=proj,
                        worker=worker,
                        date=date,
                        defaults={
                            'status': status,
                            'advance_amount': advance,
                            'notes': 'Auto-generated labor log',
                            'created_by': foreman or admin,
                        },
                    )
                    labor_logs.append(ll)
            self.stdout.write(self.style.SUCCESS(f'Created/Found {len(labor_logs)} labor logs'))

            # Daily logs (images)
            img_bytes = base64.b64decode(PNG_BASE64)
            daily_logs = []
            for proj in projects:
                for i in range(2):
                    dl = DailyLog(project=proj, notes='Demo photo', created_by=foreman or admin)
                    filename = f'demo_{proj.id}_{i+1}.png'
                    dl.image.save(filename, ContentFile(img_bytes), save=False)
                    dl.save()
                    daily_logs.append(dl)
            self.stdout.write(self.style.SUCCESS(f'Created {len(daily_logs)} daily logs (with images)'))

            # Expenses (link to labor/material logs)
            expenses = []
            for ll in labor_logs:
                amt = ll.calculated_amount
                if amt:
                    e = Expense.objects.create(
                        project=ll.project,
                        expense_type='labor',
                        reference_id=ll.id,
                        amount=amt,
                        description=f'Labor expense for {ll.worker.name}',
                        date=ll.date,
                    )
                    expenses.append(e)

            for ml in material_logs:
                e = Expense.objects.create(
                    project=ml.project,
                    expense_type='material',
                    reference_id=ml.id,
                    amount=ml.amount,
                    description=ml.description,
                    date=ml.created_at.date(),
                )
                expenses.append(e)

            self.stdout.write(self.style.SUCCESS(f'Created {len(expenses)} expenses'))

            # Payments
            payments = []
            for proj in projects:
                for i in range(2):
                    amt = random.randint(1000, 15000)
                    p = Payment.objects.create(
                        project=proj,
                        amount=amt,
                        payment_type=random.choice(['labor', 'material', 'other']),
                        method=random.choice(['cash', 'transfer', 'cheque']),
                        description='Demo payment',
                        date=today - timedelta(days=random.randint(0, 10)),
                    )
                    payments.append(p)
            self.stdout.write(self.style.SUCCESS(f'Created {len(payments)} payments'))

            # Tax records
            tax_records = []
            for proj in projects:
                tr = TaxRecord.objects.create(
                    project=proj,
                    tax_type=random.choice(['vat', 'wht']),
                    amount=random.randint(100, 2000),
                    description='Demo tax record',
                    date=today - timedelta(days=3),
                )
                tax_records.append(tr)
            self.stdout.write(self.style.SUCCESS(f'Created {len(tax_records)} tax records'))

        self.stdout.write(self.style.SUCCESS('Mock data creation complete.'))
