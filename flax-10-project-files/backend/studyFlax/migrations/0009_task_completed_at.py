# Add completed_at to Task so Seeds Grown Today persists correctly

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0008_tasklist_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='completed_at',
            field=models.DateTimeField(blank=True, help_text='When the task was marked complete; used for Seeds Grown Today.', null=True),
        ),
    ]
