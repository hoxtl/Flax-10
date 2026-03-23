"""
Views for managing group projects and their memberships.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.views.groupwork.groupwork_view_service import (
    add_member_to_project_response,
    create_project_result,
    delete_project_response,
    get_project_for_user,
    list_project_members_response,
    project_list_response,
    remove_project_member,
    update_project_result,
)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_list(request):
    """List all group projects for the user, or create a new one."""

    if request.method == "GET":
        return project_list_response(request)
    data, errors, status_code = create_project_result(request.data, request.user, {"request": request})
    if errors:
        return Response(errors, status=status_code)
    return Response(data, status=status_code)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_project_members(request, project_id):
    """List members of a project, or add a new member."""

    project = get_project_for_user(request.user, project_id)
    if request.method == "GET":
        return list_project_members_response(project, request)
    return add_member_to_project_response(project, request)

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def group_project_detail(request, project_id):
    """Update or delete a group project."""

    project = get_project_for_user(request.user, project_id)
    if request.method == "DELETE":
        return delete_project_response(project, request.user)
    data, errors, status_code = update_project_result(project, request)
    if errors:
        return Response(errors, status=status_code)
    return Response(data, status=status_code)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def group_project_member_detail(request, project_id, membership_id):
    """Remove a member from a group project (owner only)."""

    project = get_project_for_user(request.user, project_id)
    return Response(status=remove_project_member(project, request.user, membership_id))
