"""
Module views for listing, creating, updating, and deleting modules.
"""

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
notify_enrolled_students = module_notifications.notify_enrolled_students


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
    serialiser = ModuleSerialiser(modules, many=True, context={'request': request})
    return Response(serialiser.data)


def create_module(request):
    serialiser = ModuleSerialiser(data=request.data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    module = serialiser.save()
    created_module_serializer = ModuleSerialiser(module, context={'request': request})
    return Response(created_module_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def module_detail(request, module_id):
    module = get_object_or_404(Module, id=module_id)
    user = request.user
    if request.method == 'GET':
        return Response(ModuleSerialiser(module, context={'request': request}).data)
    if request.method == 'PUT':
        return update_module(request, module, user)
    return delete_module(module, user)


def update_module(request, module, user):
    if module.created_by != user:
        return Response({"error": "You can only modify your own modules!"}, status=status.HTTP_403_FORBIDDEN)
    serialiser = ModuleSerialiser(module, data=request.data, partial=True, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    updated_module = serialiser.save()
    sync_module_calendar_events(updated_module)
    return Response(serialiser.data)


def delete_module(module, user):
    if module.created_by != user:
        return Response({"error": "You can only delete your own modules."}, status=status.HTTP_403_FORBIDDEN)
    notify_enrolled_students(module)
    module.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
