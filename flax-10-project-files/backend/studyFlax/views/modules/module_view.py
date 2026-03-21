"""
<<<<<<< HEAD
Views for managing academic modules.
"""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models import Module
from studyFlax.serialisers import ModuleSerialiser
from studyFlax.views.modules.module_event_sync import sync_module_calendar_events
from studyFlax.views.modules import module_notifications


build_module_deleted_notification = module_notifications.build_module_deleted_notification
get_changed_module_fields = module_notifications.get_changed_module_fields
notify_module_updated = module_notifications.notify_module_updated
notify_enrolled_students = module_notifications.notify_enrolled_students


def module_context(request):
    """Return the serialiser context for module views."""
    return {'request': request}

def module_owner_error(module, user, action):
    """Return an error when a non-owner edits a module."""
    if module.created_by == user:
        return None
    return Response({"error": f"You can only {action} your own modules."}, status=status.HTTP_403_FORBIDDEN)

def module_update_serialiser(module, request):
    return ModuleSerialiser(module, data=request.data, partial=True, context=module_context(request))

def invalid_module_response(serialiser):
    """Return serialiser errors for invalid module data."""
    return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

def save_updated_module(module, serialiser):
    """Persist module changes and synchronise related side effects."""
    changed_fields = get_changed_module_fields(module, serialiser.validated_data)
    with transaction.atomic():
        updated_module = serialiser.save()
        sync_module_calendar_events(updated_module)
        notify_module_updated(updated_module, changed_fields)
    return updated_module
=======
Views for listing, creating, updating, and deleting modules.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from studyFlax.models import Module, CalendarEvent, Enrollment
from studyFlax.models.notifications.notification_model import Notification
from studyFlax.serialisers import ModuleSerialiser
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def module_list(request):
    if request.method == 'GET':
        return get_modules(request)
    return create_module(request)

def get_modules(request):
<<<<<<< HEAD
    """Return modules visible to the current user."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    user = request.user
    if user.is_teacher():
        modules = Module.objects.filter(created_by=request.user)
    else:
        modules = Module.objects.all()
<<<<<<< HEAD
    serialiser = ModuleSerialiser(modules, many=True, context=module_context(request))
    return Response(serialiser.data)

def create_module(request):
    serialiser = ModuleSerialiser(data=request.data, context=module_context(request))
    if not serialiser.is_valid():
        return invalid_module_response(serialiser)
    module = serialiser.save()
    created_module_serialiser = ModuleSerialiser(module, context=module_context(request))
    return Response(created_module_serialiser.data, status=status.HTTP_201_CREATED)

def module_get_response(module, request):
    """Return the module detail payload."""
    return Response(ModuleSerialiser(module, context=module_context(request)).data)

def module_detail_response(request, module):
    """Route module detail requests to the correct handler."""
    if request.method == 'GET':
        return module_get_response(module, request)
    if request.method == 'PUT':
        return update_module(request, module, request.user)
    return delete_module(module, request.user)
=======
    serialiser = ModuleSerialiser(modules, many=True, context={'request': request})
    return Response(serialiser.data)

def create_module(request):
    serialiser = ModuleSerialiser(data=request.data, context={'request':request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    module = serialiser.save()
    created_module_serialisers = ModuleSerialiser(module, context={'request': request})
    return Response(created_module_serialisers.data, status=status.HTTP_201_CREATED)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def module_detail(request, module_id):
<<<<<<< HEAD
    """Retrieve, update, or delete a module."""
    module = get_object_or_404(Module, id=module_id)
    return module_detail_response(request, module)

def update_module(request, module, user):
    """Update a module owned by the current user."""
    owner_error = module_owner_error(module, user, 'modify')
    if owner_error:
        return owner_error
    serialiser = module_update_serialiser(module, request)
    if not serialiser.is_valid():
        return invalid_module_response(serialiser)
    save_updated_module(module, serialiser)
    return Response(serialiser.data)

def delete_module(module, user):
    """Delete a module owned by the current user."""
    owner_error = module_owner_error(module, user, 'delete')
    if owner_error:
        return owner_error
    return _delete_module_response(module)

def _delete_module_and_notify(module):
    """Delete a module and notify enrolled students."""
    with transaction.atomic():
        notify_enrolled_students(module)
        module.delete()

def _delete_module_response(module):
    _delete_module_and_notify(module)
    return Response(status=status.HTTP_204_NO_CONTENT)
=======
    module = get_object_or_404(Module, id=module_id)
    user = request.user
    if request.method == 'GET': 
        return Response(ModuleSerialiser(module, context={'request': request}).data)
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

    
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
