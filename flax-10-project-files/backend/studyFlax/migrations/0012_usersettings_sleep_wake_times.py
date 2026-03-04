from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0011_merge_20260302_0036'),
    ]

    operations = [
        migrations.AddField(
            model_name='usersettings',
            name='sleep_time',
            field=models.TimeField(default='23:00'),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='wake_time',
            field=models.TimeField(default='07:00'),
        ),
    ]
