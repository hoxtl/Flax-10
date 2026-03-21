"""
Views for managing group projects and their memberships.
"""

from django.db.models import Count, OuterRef, Q, Subquery, Value
from django.db.models.functions import Concat
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models.groupwork.groupwork_model import (
    GroupProject,
    GroupMembership,
)
from studyFlax.models.modules.module_model import Module
from studyFlax.serialisers.tasks.groupwork_serialisers import (
    GroupProjectSerialiser,
    GroupMembershipSerialiser,
)

def _serialiser_context(request):
    return {"request": request}

def _project_metrics_queryset():
    module_base = Module.objects.filter(module_code=OuterRef("course_code"))
    module_name = module_base.values("module_name")[:1]
    module_tutor_id = module_base.values("created_by_id")[:1]
    module_tutor_name = (
        module_base
        .annotate(full_name=Concat("created_by__first_name", Value(" "), "created_by__last_name"))
        .values("full_name")[:1]
    )
    module_tutor_username = module_base.values("created_by__username")[:1]
    module_tutor_email = module_base.values("created_by__email")[:1]
    module_tutor_profile_photo = module_base.values("created_by__profile_photo")[:1]
    return GroupProject.objects.annotate(
        member_count=Count("memberships", distinct=True),
        task_count=Count("tasks", distinct=True),
        completed_task_count=Count("tasks", filter=Q(tasks__completed=True), distinct=True),
        module_name=Subquery(module_name),
        module_tutor_id=Subquery(module_tutor_id),
        module_tutor_name=Subquery(module_tutor_name),
        module_tutor_username=Subquery(module_tutor_username),
        module_tutor_email=Subquery(module_tutor_email),
        module_tutor_profile_photo=Subquery(module_tutor_profile_photo),
    )

def _with_project_metrics(project):
    """Return the project annotated with member, task, and module context."""
    return _project_metrics_queryset().filter(id=project.id).first()

def _handle_project_delete(project, user):
    """Delete the project if the user is the owner, otherwise return 403."""
    if project.owner_id != user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    project.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_list(request):
    """List all group projects for the user, or create a new one."""
    if request.method == "GET":
        qs = _project_metrics_queryset().filter(memberships__user=request.user).order_by("-created_at")
        return Response(GroupProjectSerialiser(qs, many=True, context=_serialiser_context(request)).data)
    serialiser = GroupProjectSerialiser(data=request.data, context=_serialiser_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    project = serialiser.save(owner=request.user)
    GroupMembership.objects.create(project=project, user=request.user, role="owner")
    return Response(
        GroupProjectSerialiser(_with_project_metrics(project), context=_serialiser_context(request)).data,
        status=status.HTTP_201_CREATED,
    )

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_members(request, project_id):
    """List members of a project, or add a new member."""
    project = get_object_or_404(GroupProject.objects.all(), id=project_id, memberships__user=request.user)
    if request.method == "GET":
        memberships = project.memberships.select_related("user").order_by("joined_at")
        return Response(GroupMembershipSerialiser(memberships, many=True, context=_serialiser_context(request)).data)
    serialiser = GroupMembershipSerialiser(data=request.data, context=_serialiser_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serialiser.validated_data["user"]
    membership, _ = GroupMembership.objects.get_or_create(
        project=project, user=user,
        defaults={"role": serialiser.validated_data.get("role", "member")},
    )
    return Response(
        GroupMembershipSerialiser(membership, context=_serialiser_context(request)).data,
        status=status.HTTP_201_CREATED,
    )

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def group_project_detail(request, project_id):
    """Update or delete a group project."""
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    if request.method == "DELETE":
        return _handle_project_delete(project, request.user)
    serialiser = GroupProjectSerialiser(project, data=request.data, partial=True, context=_serialiser_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(GroupProjectSerialiser(_with_project_metrics(project), context=_serialiser_context(request)).data)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def group_project_member_detail(request, project_id, membership_id):
    """Remove a member from a group project (owner only)."""
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    if project.owner_id != request.user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    membership = get_object_or_404(GroupMembership.objects.filter(project=project), id=membership_id)
    if membership.user_id == project.owner_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    membership.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
