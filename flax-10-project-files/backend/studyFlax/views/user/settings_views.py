from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import timedelta
from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.fixtures.data_fixtures import course_to_module_prefixes


def get_or_create_settings(user):
    settings, _ = UserSettings.objects.get_or_create(
        user=user, defaults={'theme': 'light', 'timezone': 'Europe/London'}
    )
    return settings

def apply_settings_updates(settings, data):
    if 'theme' in data:
        settings.theme = data['theme']
    if 'timezone' in data:
        settings.timezone = data['timezone']
    settings.save()

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    settings = get_or_create_settings(request.user)
    if request.method == 'GET':
        return Response({'theme': settings.theme, 'timezone': settings.timezone})
    apply_settings_updates(settings, request.data)
    return Response({'theme': settings.theme, 'timezone': settings.timezone})

def get_lecture_tag():
    try:
        from studyFlax.models.calendar.tagModel import Tag
        return Tag.objects.filter(name='Lecture').first()
    except Exception:
        return None

def get_modules_for_major(major):
    prefixes = course_to_module_prefixes.get(major, [])
    if not prefixes:
        return []
    pattern = r'^(' + '|'.join(prefixes) + ')'
    return list(Module.objects.filter(module_code__regex=pattern))

def create_lecture_events(user, module, lecture_tag):
    for week in range(10):
        start = module.start_time + timedelta(weeks=week)
        end = module.end_time + timedelta(weeks=week)
        CalendarEvent.objects.get_or_create(
            user=user, title=f"Lecture: {module.module_name}", start_time=start,
            defaults={'end_time': end, 'location': module.location,
                      'description': module.module_name, 'tag': lecture_tag,
                      'priority': 'high', 'source': 'module_enrollment'}
        )


def enroll_user_in_module(user, module, lecture_tag):
    _, created = Enrollment.objects.get_or_create(student=user, module=module)
    if created:
        create_lecture_events(user, module, lecture_tag)
    return created


def enroll_user_in_modules(user, modules):
    lecture_tag = get_lecture_tag()
    return sum(1 for m in modules if enroll_user_in_module(user, m, lecture_tag))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_view(request):
    year, major = request.data.get('year'), request.data.get('major')
    if not year or not major:
        return Response({'error': 'year and major are required'}, status=status.HTTP_400_BAD_REQUEST)
    settings, _ = UserSettings.objects.get_or_create(user=request.user)
    settings.year, settings.major = year, major
    settings.save()
    enrolled_count = enroll_user_in_modules(request.user, get_modules_for_major(major))
    return Response({'enrolled_modules': enrolled_count, 'year': year, 'major': major})