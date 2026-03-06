from django.apps import AppConfig


class StudyflaxConfig(AppConfig):
    name = 'studyFlax'

    def ready(self):
        import studyFlax.signals.society_notifications  # noqa
        import studyFlax.signals.ratification_notifications  # noqa
        import studyFlax.signals.user_signals  # noqa
