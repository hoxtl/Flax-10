from django.db import models
from django.contrib.auth.models import AbstractUser

ROLE_CHOICES = [
    ('student', 'Student'),
    ('teacher', 'Teacher'),
]

class User(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)

    home_address = models.CharField(max_length=255, blank=True, null=True)
    home_latitude = models.FloatField(blank=True, null=True)

    bio = models.TextField(blank=True, default="")
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)

    weekly_goal_hours = models.IntegerField(default=20)
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student'
    )

    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    def is_teacher(self):
        return self.role == 'teacher'

    def is_student(self):
        return self.role == 'student'
