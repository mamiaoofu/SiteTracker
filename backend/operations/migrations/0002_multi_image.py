from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('operations', '0001_initial'),
    ]

    operations = [
        # Remove old single image field from DailyLog
        migrations.RemoveField(
            model_name='dailylog',
            name='image',
        ),
        # Add weather field to DailyLog
        migrations.AddField(
            model_name='dailylog',
            name='weather',
            field=models.CharField(blank=True, max_length=50),
        ),
        # Create DailyLogImage model for multi-image
        migrations.CreateModel(
            name='DailyLogImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='daily_logs/%Y/%m/%d/')),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('daily_log', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='operations.dailylog')),
            ],
            options={
                'db_table': 'daily_log_images',
                'ordering': ['created_at'],
            },
        ),
        # Remove old single image field from MaterialLog
        migrations.RemoveField(
            model_name='materiallog',
            name='image',
        ),
        # Remove old category (single) field
        migrations.RemoveField(
            model_name='materiallog',
            name='category',
        ),
        # Add categories JSON field for multi-select
        migrations.AddField(
            model_name='materiallog',
            name='categories',
            field=models.JSONField(default=list, help_text='List of material categories'),
        ),
        # Add supplier field
        migrations.AddField(
            model_name='materiallog',
            name='supplier',
            field=models.CharField(blank=True, max_length=255),
        ),
        # Create MaterialLogImage model for multi-receipt
        migrations.CreateModel(
            name='MaterialLogImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='material_logs/%Y/%m/%d/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('material_log', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='operations.materiallog')),
            ],
            options={
                'db_table': 'material_log_images',
                'ordering': ['created_at'],
            },
        ),
    ]
