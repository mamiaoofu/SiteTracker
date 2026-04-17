from django.core.management.base import BaseCommand
from core.models import User


class Command(BaseCommand):
    help = 'Create default admin user if none exists'

    def handle(self, *args, **options):
        if not User.objects.filter(role='admin').exists():
            User.objects.create_superuser(
                username='admin',
                password='admin123',
                email='admin@sitetracker.com',
                first_name='Admin',
                last_name='User',
                role='admin',
            )
            self.stdout.write(self.style.SUCCESS('Default admin user created (admin/admin123)'))

            # Create demo foreman
            User.objects.create_user(
                username='foreman',
                password='foreman123',
                first_name='สมชาย',
                last_name='หัวหน้างาน',
                role='foreman',
            )
            self.stdout.write(self.style.SUCCESS('Demo foreman user created (foreman/foreman123)'))

            # Create demo accountant
            User.objects.create_user(
                username='accountant',
                password='accountant123',
                first_name='สมหญิง',
                last_name='บัญชี',
                role='accountant',
            )
            self.stdout.write(self.style.SUCCESS('Demo accountant user created (accountant/accountant123)'))
        else:
            self.stdout.write(self.style.WARNING('Admin user already exists, skipping.'))
