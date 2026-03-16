from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from studyFlax.models import Module, CalendarEvent, Enrollment
from studyFlax.models.notifications.notificationModel import Notification
from studyFlax.serialisers import ModuleSerialiser

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def module_list(request):
    if request.method == 'GET':
        return get_modules(request)
    return create_module(request)

def get_modules(request):
    user = request.user
    if user.is_teacher():
        modules = Module.objects.filter(created_by=request.user)
    else:
        modules = Module.objects.all()
    serialiser = ModuleSerialiser(modules, many=True)
    return Response(serialiser.data)

def create_module(request):
    serialiser = ModuleSerialiser(data=request.data, context={'request':request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    module = serialiser.save()
    return Response(ModuleSerialiser(module).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def module_detail(request, module_id):
    module = get_object_or_404(Module, id=module_id)
    user = request.user
    if request.method == 'GET': 
        return Response(ModuleSerialiser(module).data)
    if request.method == 'PUT': 
        return update_module(request, module, user)
    if request.method == 'DELETE':
        return delete_module(request, module, user)

def update_module(request, module, user):
    if module.created_by != user:
        return Response({"error": "You can only modify your own modules!"}, status=status.HTTP_403_FORBIDDEN)
    serialiser = ModuleSerialiser(module, data=request.data, partial=True, context={'request':request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    updated_module = serialiser.save()
    CalendarEvent.objects.filter(module=updated_module).update(
        title=f"Lecture: {updated_module.module_name}",
        start_time=updated_module.start_time,
        end_time=updated_module.end_time,
        location=updated_module.location
    )
    return Response(serialiser.data)

def delete_module(request, module, user):
    if module.created_by != user:
        return Response({"error": "You can only delete your own modules."}, status=status.HTTP_403_FORBIDDEN)
    notify_enrolled_students(module)
    module.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


def notify_enrolled_students(module):
    enrollments = Enrollment.objects.filter(module=module).select_related('student')
    notifications = [build_module_deleted_notification(e.student, module) for e in enrollments]
    Notification.objects.bulk_create(notifications)


def build_module_deleted_notification(student, module):
    return Notification(
        user=student,
        title=f"Module removed: {module.module_code}",
        message=f"The module '{module.module_name}' has been deleted by the instructor.",
        notification_type='module_deleted',
    )

    