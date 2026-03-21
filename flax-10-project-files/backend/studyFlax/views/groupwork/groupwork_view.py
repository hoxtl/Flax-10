"""
Views for managing group projects and their memberships.
"""

<<<<<<< HEAD
=======
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

<<<<<<< HEAD
from studyFlax.views.groupwork.groupwork_view_service import (
    validate_member_ids,
    add_member_to_project_response,
    create_project_result,
    delete_project_response,
    get_project_for_user,
    list_project_members_response,
    project_list_response,
    remove_project_member,
    update_project_result,
)


def _validate_member_ids(member_ids):
    return validate_member_ids(member_ids)
=======
from studyFlax.models.groupwork.groupwork_model import (
    GroupProject,
    GroupMembership,
)
from studyFlax.serialisers.tasks.groupwork_serialisers import (
    GroupProjectSerialiser,
    GroupMembershipSerialiser,
)

def _with_member_count(project):
    """Return the project annotated with its current member count."""
    return GroupProject.objects.filter(id=project.id).annotate(member_count=Count("memberships")).first()

def _handle_project_delete(project, user):
    """Delete the project if the user is the owner, otherwise return 403."""
    if project.owner_id != user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    project.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_list(request):
<<<<<<< HEAD
    if request.method == "GET":
        return project_list_response(request)
    data, errors, status_code = create_project_result(request.data, request.user, {"request": request})
    if errors:
        return Response(errors, status=status_code)
    return Response(data, status=status_code)
=======
    """List all group projects for the user, or create a new one."""
    if request.method == "GET":
        qs = GroupProject.objects.filter(memberships__user=request.user).annotate(member_count=Count("memberships")).order_by("-created_at")
        return Response(GroupProjectSerialiser(qs, many=True).data)
    serialiser = GroupProjectSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    project = serialiser.save(owner=request.user)
    GroupMembership.objects.create(project=project, user=request.user, role="owner")
    return Response(GroupProjectSerialiser(_with_member_count(project)).data, status=status.HTTP_201_CREATED)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_members(request, project_id):
<<<<<<< HEAD
    project = get_project_for_user(request.user, project_id)
    if request.method == "GET":
        return list_project_members_response(project, request)
    return add_member_to_project_response(project, request)
=======
    """List members of a project, or add a new member."""
    project = get_object_or_404(GroupProject.objects.all(), id=project_id, memberships__user=request.user)
    if request.method == "GET":
        memberships = project.memberships.select_related("user").order_by("joined_at")
        return Response(GroupMembershipSerialiser(memberships, many=True).data)
    serialiser = GroupMembershipSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serialiser.validated_data["user"]
    membership, _ = GroupMembership.objects.get_or_create(
        project=project, user=user,
        defaults={"role": serialiser.validated_data.get("role", "member")},
    )
    return Response(GroupMembershipSerialiser(membership).data, status=status.HTTP_201_CREATED)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def group_project_detail(request, project_id):
<<<<<<< HEAD
    project = get_project_for_user(request.user, project_id)
    if request.method == "DELETE":
        return delete_project_response(project, request.user)
    data, errors, status_code = update_project_result(project, request)
    if errors:
        return Response(errors, status=status_code)
    return Response(data, status=status_code)
=======
    """Update or delete a group project."""
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    if request.method == "DELETE":
        return _handle_project_delete(project, request.user)
    serialiser = GroupProjectSerialiser(project, data=request.data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(GroupProjectSerialiser(_with_member_count(project)).data)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def group_project_member_detail(request, project_id, membership_id):
    """Remove a member from a group project (owner only)."""
<<<<<<< HEAD
    project = get_project_for_user(request.user, project_id)
    return Response(status=remove_project_member(project, request.user, membership_id))
=======
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    if project.owner_id != request.user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    membership = get_object_or_404(GroupMembership.objects.filter(project=project), id=membership_id)
    if membership.user_id == project.owner_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    membership.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
