from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    Custom User model which extends Django's AbstractUser.
    Included fields: username, email, password, first_name, last_name,
    is_active, is_staff, is_superuser, last_login, date_joined
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)
    
    bio = models.TextField(blank=True, default="")
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
