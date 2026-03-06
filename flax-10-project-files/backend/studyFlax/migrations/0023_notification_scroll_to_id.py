from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0022_merge_20260306_0357'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='scroll_to_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
