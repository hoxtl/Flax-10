from django.db import models

ROLE_CHOICES = [
    ('student', 'Student'),
    ('teacher', 'Teacher'),
]

class User(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student'
    )

    def is_teacher(self):
        return self.role == 'teacher'
    def is_student(self):
        return self.role == 'student'
