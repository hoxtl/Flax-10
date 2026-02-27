# Generated migration for Task.energy_level (cognitive load balancing)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0009_task_completed_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='energy_level',
            field=models.CharField(
                blank=True,
                choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
                default='medium',
                help_text='Cognitive load: Low/Medium/High for burnout prevention',
                max_length=10,
            ),
        ),
    ]
