"""
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
    """Build the module update serialiser."""

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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def module_list(request):
    """List modules or create a new one."""

    if request.method == 'GET':
        return get_modules(request)
    return create_module(request)


def get_modules(request):
    """Return modules visible to the current user."""

    user = request.user
    if user.is_teacher():
        modules = Module.objects.filter(created_by=request.user)
    else:
        modules = Module.objects.all()
    serialiser = ModuleSerialiser(modules, many=True, context=module_context(request))
    return Response(serialiser.data)


def create_module(request):
    """Create a module."""

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


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def module_detail(request, module_id):
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
    """Return the delete response for a module."""

    _delete_module_and_notify(module)
    return Response(status=status.HTTP_204_NO_CONTENT)
