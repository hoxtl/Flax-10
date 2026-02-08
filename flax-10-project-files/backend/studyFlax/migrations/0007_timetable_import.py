from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("studyFlax", "0006_recurrencerule_exception_dates_alter_category_id_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="TimetableSource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_url", models.URLField(unique=True)),
                ("last_synced", models.DateTimeField(blank=True, null=True)),
                ("last_error", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AddField(
            model_name="calendarevent",
            name="source",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="calendarevent",
            name="external_id",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
