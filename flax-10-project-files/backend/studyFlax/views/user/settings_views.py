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


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    user = request.user
    settings, created = UserSettings.objects.get_or_create(
        user=user,
        defaults={'theme': 'light', 'timezone': 'Europe/London'}
    )

    if request.method == 'GET':
        return Response({'theme': settings.theme, 'timezone': settings.timezone})

    elif request.method == 'PUT':
        if 'theme' in request.data:
            settings.theme = request.data['theme']
        if 'timezone' in request.data:
            settings.timezone = request.data['timezone']
        settings.save()
        return Response({'theme': settings.theme, 'timezone': settings.timezone})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_view(request):
    """Sets year + course for new users and auto-enrolls them in relevant modules."""
    user = request.user
    year = request.data.get('year')
    major = request.data.get('major')

    if not year or not major:
        return Response({'error': 'year and major are required'}, status=status.HTTP_400_BAD_REQUEST)

    settings, _ = UserSettings.objects.get_or_create(user=user)
    settings.year = year
    settings.major = major
    settings.save()

    prefixes = course_to_module_prefixes.get(major, [])
    if prefixes:
        pattern = r'^(' + '|'.join(prefixes) + ')'
        modules = list(Module.objects.filter(module_code__regex=pattern))
    else:
        modules = []

    lecture_tag = None
    try:
        from studyFlax.models.calendar.tagModel import Tag
        lecture_tag = Tag.objects.filter(name='Lecture').first()
    except Exception:
        pass

    enrolled_count = 0
    for module in modules:
        _, created = Enrollment.objects.get_or_create(student=user, module=module)
        if created:
            enrolled_count += 1
            for week in range(10):
                lecture_start = module.start_time + timedelta(weeks=week)
                lecture_end = module.end_time + timedelta(weeks=week)
                CalendarEvent.objects.get_or_create(
                    user=user,
                    title=f"Lecture: {module.module_name}",
                    start_time=lecture_start,
                    defaults={
                        'end_time': lecture_end,
                        'location': module.location,
                        'description': module.module_name,
                        'tag': lecture_tag,
                        'priority': 'high',
                        'source': 'module_enrollment',
                    }
                )

    return Response({'enrolled_modules': enrolled_count, 'year': year, 'major': major})