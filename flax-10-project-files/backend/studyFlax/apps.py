from django.apps import AppConfig


class StudyflaxConfig(AppConfig):
    name = 'studyFlax'

    def ready(self):
        import studyFlax.signals.society_notifications  # noqa
