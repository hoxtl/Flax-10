from django.db import models
from django.contrib.auth.models import AbstractUser

ROLE_CHOICES = [ 
    ('student', 'Student'),
    ('teacher', 'Teacher'),
]

class User(AbstractUser):
    """
    Custom User model which extends Django's AbstractUser.
    Included fields: username, email, password, first_name, last_name,
    is_active, is_staff, is_superuser, last_login, date_joined
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)

    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student'
    )

    def is_teacher(self):
        return self.role == 'teacher'
    
    def is_student(self):
        return self.role == 'student'