from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="pinned_badge_id",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
    ]
