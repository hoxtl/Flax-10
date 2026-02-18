from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0011_studysession'),
    ]

    operations = [
        migrations.CreateModel(
            name='ThemeSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('theme', models.CharField(choices=[('light', 'Light'), ('dark', 'Dark')], max_length=10)),
                ('started_at', models.DateTimeField()),
                ('ended_at', models.DateTimeField()),
                ('duration_minutes', models.IntegerField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='theme_sessions', to='studyFlax.user')),
            ],
            options={'ordering': ['-started_at']},
        ),
    ]
