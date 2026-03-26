"""
Signal handlers for user-related behaviour.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from studyFlax.models import Tag


User = get_user_model()

@receiver(post_save, sender=User)
def create_default_tags(sender, instance, created, **kwargs):
    if created:
        Tag.objects.create(
            user=instance,
            name='Other',
            color='#808080',
            icon='🏷️',
            default_duration=60,
            is_default=False  # It's a user-specific tag, but treated as "system default" for them
        )
