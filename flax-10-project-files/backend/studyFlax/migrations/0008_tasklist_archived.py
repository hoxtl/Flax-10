# Generated manually for TaskList.archived

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0007_task_completed_blocks_task_estimated_blocks'),
    ]

    operations = [
        migrations.AddField(
            model_name='tasklist',
            name='archived',
            field=models.BooleanField(default=False),
        ),
    ]
