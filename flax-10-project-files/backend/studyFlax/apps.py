"""
Django app configuration for the studyFlax application.
"""
from django.apps import AppConfig

class StudyflaxConfig(AppConfig):
    name = 'studyFlax'

    def ready(self):
        from studyFlax.signals import society_notifications, ratification_notifications, user_signals
        _ = (society_notifications, ratification_notifications, user_signals)
