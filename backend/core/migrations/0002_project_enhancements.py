from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='status',
            field=models.CharField(choices=[('planning', 'Planning'), ('in_progress', 'In Progress'), ('on_hold', 'On Hold'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='planning', max_length=20),
        ),
        migrations.AddField(
            model_name='project',
            name='budget',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name='project',
            name='start_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='project',
            name='end_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='project',
            name='progress',
            field=models.IntegerField(default=0, help_text='Progress percentage 0-100'),
        ),
        migrations.AddField(
            model_name='worker',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='workers', to='core.project'),
        ),
        migrations.AddField(
            model_name='worker',
            name='role',
            field=models.CharField(blank=True, help_text='e.g. Mason, Electrician', max_length=100),
        ),
    ]
